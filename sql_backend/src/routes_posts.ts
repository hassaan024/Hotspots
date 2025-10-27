import { Router } from "express";
import { postsDb } from "./db_posts";
import { createPostSchema, updatePostSchema } from "./validators";
import multer from "multer";
import path from "node:path";
import fs from "fs";



const router = Router();
const ACCEPT = new Set([
  // images
  "image/jpeg","image/png","image/webp","image/gif",
  // videos
  "video/mp4","video/quicktime","video/webm","video/ogg","video/3gpp"
]);
router.get("/", async (req, res, next) => {
  try {
    const { postedby } = req.query as { postedby?: string };
    const where = postedby ? { postedby } : undefined;

    const posts = await postsDb.posts.findMany({
      where,
      orderBy: { postid: "desc" },
    });
    res.json(posts);
  } catch (e) { next(e); }
});


router.get("/locations", async (req, res) => {
  try {
    // 1) SELECT all needed fields
    const rows = await postsDb.posts.findMany({
      select: {
        postid: true,
        postedby: true,
        location: true,   // "lat,lng" string
        datapath: true,
        thumbpath: true,  // <-- must exist in your model
        posttype: true,   // <-- must exist in your model
      },
    });

    // 2) Map to points; validate coords
    const points = rows
      .map((r) => {
        const [a, b] = String(r.location ?? "").split(",").map((s) => s.trim());
        const lat = Number(a), lng = Number(b);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

        return {
          id: r.postid,
          postedby: r.postedby,
          lat,
          lng,
          datapath: r.datapath ?? null,
          thumbpath: r.thumbpath ?? null,
          posttype: typeof r.posttype === "number" ? r.posttype : Number(r.posttype ?? 0),
        };
      })
      .filter(Boolean);

    res.json(points);
  } catch (e: any) {
    console.error("GET /api/posts/locations error:", e);
    res.status(500).json({ error: String(e?.message || e) });
  }
});

router.get("/:postid(\\d+)", async (req, res, next) => {
  try {
    const postid = Number.parseInt(req.params.postid, 10);
    if (!Number.isFinite(postid)) {
      return res.status(400).json({ error: "postid must be an integer" });
    }
    const post = await postsDb.posts.findUnique({ where: { postid } });

    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (e) { next(e); }
});

router.post("/", async (req, res, next) => {
  try {
    const data = createPostSchema.parse(req.body);

    const insert: any = {
      postedby: data.postedby,
      posttype: data.posttype,   // 0 or 1
      datapath: data.datapath,
      location: data.location,
    };
    if (data.thumbpath) insert.thumbpath = data.thumbpath;

    const post = await postsDb.posts.create({ data: insert });
    res.status(201).json(post);
  } catch (e) {
    console.error("Create post error:", e);
    // surface message so you can see the real reason in the client
    res.status(400).json({ error: String(e?.message || e) });
  }
});

router.patch("/:postid", async (req, res, next) => {
  try {
    const postid = Number(req.params.postid);
    const data = updatePostSchema.parse(req.body);
    const updated = await postsDb.posts.update({ where: { postid }, data });
    res.json(updated);
  } catch (e) { next(e); }
});

router.delete("/:postid", async (req, res, next) => {
  try {
    const postid = Number(req.params.postid);
    await postsDb.posts.delete({ where: { postid } });
    res.status(204).end();
  } catch (e) { next(e); }
});


router.get("/:postid/with-user", async (req, res, next) => {
  try {
    const postid = Number(req.params.postid);
    const post = await postsDb.posts.findUnique({ where: { postid } });
    if (!post) return res.status(404).json({ error: "Not found" });


    res.json({ post /*, user*/ });
  } catch (e) { next(e); }
});

const UPLOAD_DIR = path.resolve(process.cwd(), "src/uploads"); // NOT src/uploads
fs.mkdirSync(UPLOAD_DIR, { recursive: true });


const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) =>
    cb(null, `${crypto.randomUUID()}_${Date.now()}${path.extname(file.originalname || "")}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB example
  fileFilter: (_req, file, cb) => {
    if (ACCEPT.has(file.mimetype)) return cb(null, true);
    cb(new Error(`Unsupported file type: ${file.mimetype}`));
  },
});
// THIS PATH MUST BE '/upload' because we will mount the router at '/api/posts'
router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  res.json({ filename: req.file.filename }); // same shape as images
});
// GET latest N comments (top-level or replies) with keyset pagination
// /api/posts/:postid/comments?parentid=&after_ts=&after_id=&limit=20
router.get("/posts/:postid/with-comments", async (req, res) => {
  const postId = Number(req.params.postid);
  if (!Number.isFinite(postId)) return res.status(400).json({ error: "bad_postid" });

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      // include author/profile if you store it via relation; otherwise, join from users table in a separate call
      comments: {
        where: { parentId: null, status: "visible" },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 30,
        select: {
          id: true,
          postId: true,
          parentId: true,
          authorUsername: true,
          body: true,
          createdAt: true,
        },
      },
    },
  });

  if (!post) return res.status(404).json({ error: "not_found" });

  // If you also need profile pics, fetch them with a separate query/join (depends on your schema).
  res.json({
    postid: post.id,
    postedby: /* map from your post fields */ (post as any).postedby,
    description: (post as any).description,
    datapath: (post as any).datapath,
    thumbpath: (post as any).thumbpath,
    profilepic: (post as any).profilepic ?? null,
    comments: post.comments.map(c => ({
      commentid: c.id,
      postid: c.postId,
      parentid: c.parentId,
      username: c.authorUsername,
      text: c.body,
      created_at: c.createdAt,
    })),
  });
});

// 2) List comments with keyset pagination (top-level or replies)
router.get("/posts/:postid/comments", async (req, res) => {
  const postId = Number(req.params.postid);
  const parentid = req.query.parentid ? Number(req.query.parentid) : null;
  const after_ts = req.query.after_ts ? new Date(String(req.query.after_ts)) : null;
  const after_id = req.query.after_id ? Number(req.query.after_id) : null;
  const take = Math.min(50, Number(req.query.limit) || 20);

  if (!Number.isFinite(postId)) return res.status(400).json({ error: "bad_postid" });
  if (after_id && !Number.isFinite(after_id)) return res.status(400).json({ error: "bad_cursor" });

  // WHERE conditions
  const whereBase: any = {
    postId,
    status: "visible",
    ...(parentid == null ? { parentId: null } : { parentId: parentid }),
  };

  // Keyset: (createdAt < ts) OR (createdAt = ts AND id < after_id)
  const where = after_ts
    ? {
        AND: [
          whereBase,
          {
            OR: [
              { createdAt: { lt: after_ts } },
              { AND: [{ createdAt: after_ts }, { id: { lt: after_id ?? 0 } }] },
            ],
          },
        ],
      }
    : whereBase;

  const rows = await prisma.comment.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
    select: {
      id: true,
      postId: true,
      parentId: true,
      authorUsername: true,
      body: true,
      createdAt: true,
    },
  });

  const last = rows[rows.length - 1];
  const next_cursor = last
    ? { after_ts: last.createdAt, after_id: last.id }
    : null;

  res.json({
    items: rows.map(c => ({
      commentid: c.id,
      postid: c.postId,
      parentid: c.parentId,
      username: c.authorUsername,
      text: c.body,
      created_at: c.createdAt,
    })),
    next_cursor,
  });
});

// 3) Create a comment
router.post("/posts/:postid/comments", async (req, res) => {
  const postId = Number(req.params.postid);
  const { body, parentid } = req.body || {};
  const authorUsername = req.user!.username;

  if (!Number.isFinite(postId)) return res.status(400).json({ error: "bad_postid" });
  if (!body || !String(body).trim()) return res.status(400).json({ error: "empty_comment" });

  const created = await prisma.$transaction(async (tx) => {
    const c = await tx.comment.create({
      data: {
        postId,
        parentId: parentid ?? null,
        authorUsername,
        body: String(body).trim(),
      },
      select: { id: true, postId: true, parentId: true, authorUsername: true, body: true, createdAt: true },
    });

    await tx.post.update({
      where: { id: postId },
      data: { commentsCount: { increment: 1 } },
    });

    return c;
  });

  res.status(201).json({
    commentid: created.id,
    postid: created.postId,
    parentid: created.parentId,
    username: created.authorUsername,
    text: created.body,
    created_at: created.createdAt,
  });
});

export default router;
