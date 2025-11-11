import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { z, ZodError } from "zod";
import { usersDb } from "./db_users";
import { createUserSchema, updateUserSchema, loginSchema } from "./validators";
 import jwt from "jsonwebtoken"; // unused right now
const JWT_SECRET = process.env.JWT_SECRET;

const router = Router();
const safeUserSelect = { username: true, email: true } as const;

router.get("/", async (_req, res, next) => {
  try {
    const users = await usersDb.users.findMany({
      orderBy: { username: "asc" },
      select: safeUserSelect,
    });
    res.json(users);
  } catch (e) { next(e); }
});

router.get("/:username", async (req, res, next) => {
  try {
    const user = await usersDb.users.findUnique({
      where: { username: req.params.username },
      select: safeUserSelect,
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (e) { next(e); }
});

router.post("/", async (req, res, next) => {
  try {
    const { username, email, password } = createUserSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(password, 12);
    const created = await usersDb.users.create({
      data: { username, email, passwordHash },
      select: { username: true, email: true },
    });
    return res.status(201).json(created);
  } catch (err: any) {
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "Username or email already exists" });
    }
    if (err instanceof ZodError) {
      return res.status(400).json({ error: "Validation error", issues: err.issues });
    }
    next(err);
  }
});

router.patch("/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    const data = updateUserSchema.parse(req.body);
    if ("passwordHash" in data) delete (data as any).passwordHash;
    const updated = await usersDb.users.update({
      where: { username },
      data,
      select: safeUserSelect,
    });
    res.json(updated);
  } catch (e) { next(e); }
});

router.delete("/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    await usersDb.users.delete({ where: { username } });
    res.status(204).end();
  } catch (e) { next(e); }
});

router.post("/login", async (req, res, next) => {
  try {
    // 1) validate input
    const { username: rawUser, password } = loginSchema.parse(req.body);
    const username = rawUser?.trim();
    if (!username) return res.status(400).json({ error: "username is required" });
    if (!password) return res.status(400).json({ error: "password is required" });

    // 2) fetch user (include hash field; support snake or camel)
    // select everything to avoid mismatched field names
    const userRow = await usersDb.users.findUnique({ where: { username } });
    if (!userRow) return res.status(401).json({ error: "Invalid username or password" });

    const passwordHash =
      (userRow as any).passwordHash ??
      (userRow as any).password_hash ??
      null;
    if (!passwordHash) {
      return res.status(500).json({ error: "password hash not configured for user model" });
    }

    // 3) verify password
    const ok = await bcrypt.compare(password, passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid username or password" });

    // 4) build safe user + token
    const token = jwt.sign({ sub: userRow.username }, JWT_SECRET, { expiresIn: "7d" });
    const user = { username: userRow.username, email: (userRow as any).email ?? null };

    // 5) return payload (no cookies required)
    return res.json({ user, token });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: "Validation error", issues: err.issues });
    }
    next(err);
  }
});
const usernameParam = z.object({ username: z.string().min(1).max(25) });

router.post("/:username/follow", async (req: Request, res: Response) => {
  const { username: followee } = usernameParam.parse(req.params);
  const follower = (req as any).user?.username as string;
  if (!follower) return res.status(401).json({ error: "Unauthenticated" });
  if (follower === followee) return res.status(400).json({ error: "Cannot follow yourself" });

  const exists = await usersDb.users.findUnique({ where: { username: followee }, select: { username: true } });
  if (!exists) return res.status(404).json({ error: "User not found" });

  try {
    const created = await usersDb.followers.create({
      data: { follower, followee },
      select: { follower: true, followee: true, followed_at: true },
    });
    return res.status(201).json(created);
  } catch (e: any) {
    if (e.code === "P2002") {
      return res.status(200).json({ follower, followee, alreadyFollowing: true });
    }
    throw e;
  }
});

router.delete("/:username/follow", async (req: Request, res: Response) => {
  const { username: followee } = usernameParam.parse(req.params);
  const follower = (req as any).user?.username as string;
  if (!follower) return res.status(401).json({ error: "Unauthenticated" });
  if (follower === followee) return res.status(400).json({ error: "Cannot unfollow yourself" });

  const result = await usersDb.followers.deleteMany({ where: { follower, followee } });
  if (result.count === 0) return res.status(204).send();
  return res.status(200).json({ follower, followee, unfollowed: true });
});

router.get("/:username/followers", async (req, res) => {
  const { username } = usernameParam.parse(req.params);
  const rows = await usersDb.followers.findMany({
    where: { followee: username },
    select: { follower: true, followed_at: true },
    orderBy: { followed_at: "desc" },
  });
  res.json(rows);
});

router.get("/:username/following", async (req, res) => {
  const { username } = usernameParam.parse(req.params);
  const rows = await usersDb.followers.findMany({
    where: { follower: username },
    select: { followee: true, followed_at: true },
    orderBy: { followed_at: "desc" },
  });
  res.json(rows);
});

export default router;
