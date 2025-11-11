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
      select: {
        postid: true,
        postedby: true,
        datapath: true,
        thumbpath: true,
        description: true,
        posttype: true,
        location: true,
        visibility: true,

      },
    });

    if (posts.length === 0) return res.json([]);

    const postIds = posts.map(p => p.postid);


    let countMap = new Map<number, number>();
    try {
      const countsRows = await postsDb.posts.findMany({
        where: { postid: { in: postIds } },
        select: {
          postid: true,
          _count: { select: { postlikes: true } }, // requires posts { postLikes PostLike[] }
        },
      });
      countMap = new Map<number, number>(
        countsRows.map(r => [r.postid, r._count.postlikes])
      );
    } catch {

    }

    const me = (req as any).user?.username || null;
    let likedSet = new Set<number>();
    if (me) {
      try {
        const mine = await postsDb.postlikes.findMany({
          where: { username: me, postid: { in: postIds } },
          select: { postid: true },
        });
        likedSet = new Set(mine.map(m => m.postid));
      } catch {
      }
    }

    const payload = posts.map(p => ({
      ...p,
      likeCount: countMap.get(p.postid) ?? 0,
      isLiked: likedSet.has(p.postid),
    }));

    res.json(payload);
  } catch (e: any) {
    console.error("GET /api/posts failed:", {
      message: e?.message,
      code: e?.code,
      meta: e?.meta,
      stack: e?.stack,
    });
    next(e);
  }
});


const JWT_SECRET = process.env.JWT_SECRET;

router.get("/locations", async (req, res) => {
  try {
    const rows = await postsDb.posts.findMany({
      select: {
        postid: true,
        postedby: true,
        location: true,   // "lat,lng" string
        datapath: true,
        thumbpath: true,
        posttype: true,
      },
    });

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
function authRequired(req, res, next) {
  if ((req as any).user?.username) return next();
  return res.status(401).json({ error: "auth required" });
}



// Shape the comment to what the UI renders: { commentid, postid, parentid, username, text, created_at }
const toWireComment = (c: any) => ({
  commentid: c.commentid ?? c.id ?? c.commentId,
  postid: c.postid ?? c.postId,
  parentid: c.parentid ?? c.parentId ?? null,
  username: c.author ?? c.username,           // UI expects "username"
  text: c.body ?? c.text,                     // UI expects "text"
  created_at: c.created_at ?? c.createdAt,
});


router.get("/:postid/with-comments", async (req, res) => {
  const postid = Number(req.params.postid);
  if (!Number.isFinite(postid)) return res.status(400).json({ error: "bad postid" });

  // Fetch the post
  const post = await postsDb.posts.findUnique({
    where: { postid },
    select: {
      postid: true,
      postedby: true,
      datapath: true,
      thumbpath: true,
      description: true,
      posttype: true,
      // could pull profilepic here.
    },
  });
  if (!post) return res.sendStatus(404);


  const comments = await postsDb.comment.findMany({
    where: { postid },
    orderBy: [{ createdAt: "asc" }, { commentid: "asc" }],
    select: {
      commentid: true,
      postid: true,
      parentid: true,
      author: true,
      body: true,
      createdAt: true, // or created_at
    },
  });

  res.json({
    ...post,
    comments: comments.map((c) => toWireComment({
      ...c,
      created_at: c.createdAt, // normalize
      username: c.author,
      text: c.body,
    })),
  });
});


router.get("/:postid/comments", async (req, res) => {
  const postid = Number(req.params.postid);
  if (!Number.isFinite(postid)) return res.status(400).json({ error: "bad postid" });

  const parentid = req.query.parentid != null ? Number(req.query.parentid) : undefined;
  const limit = req.query.limit != null ? Math.min(100, Number(req.query.limit)) : 20;

  // simple: ignore cursor params for now; add later if you want keyset pagination
  const where: any = { postid };
  if (parentid !== undefined && !Number.isNaN(parentid)) where.parentid = parentid;

  const rows = await postsDb.comment.findMany({
    where,
    orderBy: [{ createdAt: "asc" }, { commentid: "asc" }],
    take: limit,
    select: {
      commentid: true,
      postid: true,
      parentid: true,
      author: true,
      body: true,
      createdAt: true,
    },
  });

  res.json({
    items: rows.map((c) => toWireComment({
      ...c,
      created_at: c.createdAt,
      username: c.author,
      text: c.body,
    })),
    next_cursor: null,
  });
});

router.post("/:postid/comments", authRequired, async (req, res) => {
  const postid = Number(req.params.postid);
  if (!Number.isFinite(postid)) return res.status(400).json({ error: "bad postid" });

  const { body, parentid = null } = req.body || {};
  if (!body || typeof body !== "string") return res.status(400).json({ error: "body is required" });

  // create
  const created = await postsDb.comment.create({
    data: {
      postid,
      parentid,
      author: req.user.username,
      body: body.trim(),
      status: "visible",
    },
    select: {
      commentid: true,
      postid: true,
      parentid: true,
      author: true,
      body: true,
      createdAt: true,
    },
  });

  res.status(201).json(
    toWireComment({
      ...created,
      created_at: created.createdAt,
      username: created.author,
      text: created.body,
    })
  );
});

router.post("/:postid/likes", authRequired, async (req, res) => {
  const postid = Number(req.params.postid);
  if (!Number.isFinite(postid)) return res.status(400).json({ error: "bad postid" });

  const me = (req as any).user.username as string;
  const { like } = (req.body ?? {}) as { like?: boolean };
  if (typeof like !== "boolean") return res.status(400).json({ error: "like must be boolean" });

  if (like) {
    await postsDb.postlikes.upsert({
      where: { postid_username: { postid, username: me } },
      update: {},
      create: { postid, username: me },
    });
  } else {
    // remove if present
    await postsDb.postlikes.deleteMany({ where: { postid, username: me } });
  }

  const [count, mine] = await Promise.all([
    postsDb.postlikes.count({ where: { postid } }),
    postsDb.postlikes.findUnique({ where: { postid_username: { postid, username: me } } }),
  ]);

  res.json({ postid, liked: !!mine, likeCount: count });
});
// routes_posts.ts
router.post("/:postid/likes", authRequired, async (req, res) => {
  const postid = Number(req.params.postid);
  if (!Number.isFinite(postid)) return res.status(400).json({ error: "bad postid" });

  const me = (req as any).user.username as string;
  const { like } = (req.body ?? {}) as { like?: boolean };
  if (typeof like !== "boolean") return res.status(400).json({ error: "like must be boolean" });

  if (like) {
    // create if missing
    await postsDb.postLike.upsert({
      where: { postid_username: { postid, username: me } },
      update: {},
      create: { postid, username: me },
    });
  } else {
    await postsDb.postLike.deleteMany({ where: { postid, username: me } });
  }

  const [count, mine] = await Promise.all([
    postsDb.postLike.count({ where: { postid } }),
    postsDb.postLike.findUnique({ where: { postid_username: { postid, username: me } } }),
  ]);

  res.json({ postid, liked: !!mine, likeCount: count });
});

router.post("/:postid/comments/:commentid/likes", authRequired, async (req, res) => {
  const commentid = Number(req.params.commentid);
  if (!Number.isFinite(commentid)) return res.status(400).json({ error: "bad commentid" });

  const me = (req as any).user.username as string;
  const { like } = (req.body ?? {}) as { like?: boolean };
  if (typeof like !== "boolean") return res.status(400).json({ error: "like must be boolean" });

  if (like) {
    await postsDb.commentLike.upsert({
      where: { commentid_username: { commentid, username: me } },
      update: {},
      create: { commentid, username: me },
    });
  } else {
    await postsDb.commentLike.deleteMany({ where: { commentid, username: me } });
  }

  const [count, mine] = await Promise.all([
    postsDb.commentLike.count({ where: { commentid } }),
    postsDb.commentLike.findUnique({ where: { commentid_username: { commentid, username: me } } }),
  ]);

  res.json({ commentid, liked: !!mine, likeCount: count });
});


export default router;
