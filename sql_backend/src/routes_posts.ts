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
router.get('/posts/:postid/comments', async (req, res) => {
  const { postid } = req.params;
  const { parentid = null, after_ts = null, after_id = null, limit = 20 } = req.query;

  const [rows] = await db.query(
    `SELECT commentid, postid, parentid, author AS username, body AS text, created_at
       FROM comments
      WHERE postid = ?
        AND ( (? IS NULL AND parentid IS NULL) OR parentid = ? )
        AND ( (? IS NULL AND ? IS NULL) OR (created_at, commentid) < (?, ?) )
      ORDER BY created_at DESC, commentid DESC
      LIMIT ?`,
    [postid, parentid, parentid, after_ts, after_id, after_ts, after_id, Number(limit)]
  );
  const next = rows.length
    ? { after_ts: rows[rows.length - 1].created_at, after_id: rows[rows.length - 1].commentid }
    : null;
  res.json({ items: rows, next_cursor: next });
});

// POST a new comment (top-level or reply)
router.post('/posts/:postid/comments', authRequired, async (req, res) => {
  const { postid } = req.params;
  const { body, parentid = null } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: 'Empty comment' });

  await db.query(
    `INSERT INTO comments (postid, parentid, author, body) VALUES (?,?,?,?)`,
    [postid, parentid, req.user.username, body.trim()]
  );
  await db.query(`UPDATE posts SET comments_count = comments_count + 1 WHERE postid = ?`, [postid]);

  const [rows] = await db.query(`SELECT commentid, postid, parentid, author AS username, body AS text, created_at
                                   FROM comments
                                  WHERE commentid = LAST_INSERT_ID()`);
  res.status(201).json(rows[0]);
});

// (Optional) bundle one post + its latest comments
router.get('/posts/:postid/with-comments', async (req, res) => {
  const { postid } = req.params;
  const [[post]] = await db.query(
    `SELECT p.*, u.profilepic
       FROM posts p LEFT JOIN users u ON u.username = p.postedby
      WHERE p.postid = ?`, [postid]
  );
  const [comments] = await db.query(
    `SELECT commentid, postid, parentid, author AS username, body AS text, created_at
       FROM comments
      WHERE postid = ? AND parentid IS NULL
      ORDER BY created_at DESC, commentid DESC
      LIMIT 30`, [postid]
  );
  res.json({ ...post, comments });
});

export default router;
