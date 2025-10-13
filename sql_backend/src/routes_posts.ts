import { Router } from "express";
import { postsDb } from "./db_posts";
import { createPostSchema, updatePostSchema } from "./validators";
import multer from "multer";
import path from "node:path";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const posts = await postsDb.posts.findMany({ orderBy: { postid: "desc" } });
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

//this handles uploads to the database
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.join(process.cwd(), "uploads")),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext);
      cb(null, `${base}_${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

//format: file + postedby + posttype)
router.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    const { postedby, posttype = 0 } = req.body;
    if (!req.file) return res.status(400).json({ error: "No file" });

    const datapath = `uploads/${req.file.filename}`;
    const created = await postsDb.posts.create({
      data: { postedby, posttype: Number(posttype), datapath, location: null, visibility: null },
    });
    res.status(201).json(created);
  } catch (e) { next(e); }
});




export default router;
