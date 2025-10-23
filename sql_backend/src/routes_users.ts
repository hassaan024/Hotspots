import { Router } from "express";
import bcrypt from "bcryptjs";
import { z, ZodError } from "zod";
import { usersDb } from "./db_users";
import { createUserSchema, updateUserSchema , loginSchema} from "./validators";




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
      select: safeUserSelect
    });
    if (!u) return res.status(404).json({ error: "User not found" });
    res.json(u);
  } catch (e) { next(e); }
});

router.post("/", async (req, res, next) => {
  try {
    const { username, email, password } = createUserSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(password, 12);
    const created = await usersDb.users.create({
    data: { username, email, passwordHash },
    select: { username: true, email: true},
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
    const parsed = loginSchema.parse(req.body);
    const username = parsed.username?.trim();
    const password = parsed.password;

    if (!username) return res.status(400).json({ error: "username is required" });

    const user = await usersDb.users.findUnique({
      where: { username },
      select: { username: true, email: true, passwordHash: true },
    });

    if (!user?.passwordHash) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid username or password" });

    const { passwordHash: _ph, ...safe } = user;
    return res.json(safe);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: "Validation error", issues: err.issues });
    }
    next(err);
  }
});

export default router;

