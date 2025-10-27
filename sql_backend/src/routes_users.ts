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
    if(user == null){
        return res.status(400).json({error: "not a registerd user"});}

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
const usernameParam = z.object({ username: z.string().min(1).max(25) });

router.post("/:username/follow", async (req: Request, res: Response) => {
  try {
    const { username: followee } = usernameParam.parse(req.params);
    const follower = (req as any).user?.username as string; // adjust based on your auth
    if (!follower) return res.status(401).json({ error: "Unauthenticated" });
    if (follower === followee) return res.status(400).json({ error: "Cannot follow yourself" });

    // verify followee exists (optional but nice)
    const exists = await prisma.user.findUnique({ where: { username: followee }, select: { username: true } });
    if (!exists) return res.status(404).json({ error: "User not found" });

    // create the follow (idempotent handling)
    try {
      const created = await prisma.followers.create({
        data: { follower, followee },
        select: { follower: true, followee: true, followedAt: true }
      });
      return res.status(201).json(created);
    } catch (e: any) {
      // P2002 = unique constraint violation (already following)
      if (e.code === "P2002") {
        return res.status(200).json({ follower, followee, alreadyFollowing: true });
      }
      throw e;
    }
  } catch (err: any) {
    return res.status(400).json({ error: err?.message ?? "Bad request" });
  }
});

router.delete("/:username/follow", async (req: Request, res: Response) => {
  try {
    const { username: followee } = usernameParam.parse(req.params);
    const follower = (req as any).user?.username as string;
    if (!follower) return res.status(401).json({ error: "Unauthenticated" });
    if (follower === followee) return res.status(400).json({ error: "Cannot unfollow yourself" });

    // composite key delete (use deleteMany for easy idempotency)
    const result = await prisma.followers.deleteMany({
      where: { follower, followee }
    });

    // 204 for idempotent behavior, or 200 with info if you prefer
    if (result.count === 0) return res.status(204).send();
    return res.status(200).json({ follower, followee, unfollowed: true });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message ?? "Bad request" });
  }
  });

  // GET /:username/followers
  router.get("/:username/followers", async (req, res) => {
    const { username } = usernameParam.parse(req.params);
    const rows = await usersDb.followers.findMany({
      where: { followee: username },
      select: { follower: true, followed_at: true },
      orderBy: { followed_at: "desc" }
    });
    res.json(rows);
  });

  // GET /:username/following
  router.get("/:username/following", async (req, res) => {
    const { username } = usernameParam.parse(req.params);
    const rows = await usersDb.followers.findMany({
      where: { follower: username },
      select: { followee: true, followed_at: true },
      orderBy: { followed_at: "desc" }
    });
    res.json(rows);
  });

export default router;

