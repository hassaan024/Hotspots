import { Router } from "express";
import { usersDb } from "./db_users";
import { createUserSchema, updateUserSchema } from "./validators";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const users = await usersDb.users.findMany({ orderBy: { username: "asc" } });
    res.json(users);
  } catch (e) { next(e); }
});

router.get("/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await usersDb.users.findUnique({ where: { username } });
    if (!user) return res.status(404).json({ error: "Not found" });
    res.json(user);
  } catch (e) { next(e); }
});

router.post("/", async (req, res, next) => {
  try {
    const data = createUserSchema.parse(req.body);
    const created = await usersDb.users.create({ data });
    res.status(201).json(created);
  } catch (e) { next(e); }
});

router.patch("/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    const data = updateUserSchema.parse(req.body);
    const updated = await usersDb.users.update({ where: { username }, data });
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

export default router;
