import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet, { crossOriginResourcePolicy } from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from "multer";
import fs from "node:fs";
import path from "node:path";


import usersRouter from './routes_users';
import postsRouter from './routes_posts';
import cors from 'cors';

const WEB_ORIGIN = 'http://localhost:8081';
const app = express();

app.use(cors({
  origin: WEB_ORIGIN,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 600,
}));

app.options('*', cors());

const srcdir = path.join(process.cwd(), "src");

app.use((req, res, next) => {
  const end = res.end;
  res.end = function (...args) {
    const ms = Date.now() - (req.start || Date.now());
    console.log(`[API] ${req.method} ${req.originalUrl} -> ${res.statusCode} in ${ms}ms`);
    // @ts-ignore
    end.apply(this, args);
  };
  next();
});

app.use(helmet());


app.use(express.json());

const apiLimiter = rateLimit({ windowMs: 60_000, max: 120 });

app.use("/api", apiLimiter);


app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));
//These expose folders to the API


const UPLOAD_DIR = path.resolve(srcdir, "uploads");
app.use("/uploads",crossOriginResourcePolicy({ policy: "cross-origin" }), express.static(UPLOAD_DIR));

console.log(UPLOAD_DIR)
app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);


if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext);
      cb(null, `${base}_${Date.now()}${ext}`);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, //10MB
});

app.get('/api/overview', async (_req, res, next) => {
  try {
    const { usersDb } = await import('./db_users');
    const { postsDb } = await import('./db_posts');

    const [users, posts] = await Promise.all([
      usersDb.user.findMany(),
      postsDb.post.findMany()
    ]);

    const byUser: Record<number, any[]> = {};
    for (const p of posts) {
      byUser[p.authorId] ??= [];
      byUser[p.authorId].push(p);
    }
    const result = users.map(u => ({ ...u, posts: byUser[u.id] ?? [] }));
    res.json(result);
  } catch (e) {
    next(e);
  }
});

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err: any, _req: Request, res: Response, _next: NextFunction) =>
  res.status(typeof err?.status === 'number' ? err.status : 500).json({ error: err?.message ?? 'Server error' })
);

const port = Number(process.env.PORT) || 3131;
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
