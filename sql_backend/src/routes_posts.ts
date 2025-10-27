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


router.get("/locations", async (_req, res, next) => {
  try {
    const rows = await postsDb.posts.findMany({
      where: { location: { not: null } },
      select: { postid: true, postedby: true, location: true, datapath: true },
    });

    const points = rows.map(r => {
      const [a, b] = String(r.location ?? "").split(",").map(s => s.trim());
      const lat = Number(a), lng = Number(b);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
      return { id: r.postid, postedby: r.postedby, lat, lng, datapath: r.datapath ?? null };
    }).filter(Boolean);

    res.json(points);
  } catch (e) { next(e); }
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
        const created = await postsDb.posts.create({ data });
        res.status(201).json(created);
      } catch (e) { next(e); }
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

export router;
