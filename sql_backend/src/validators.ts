import { z } from "zod";

//These all essentailly checks. Wheny you add or update something in the database, it must follow
//these guidelines. If you look at them, they are pretty self explanatory.
export const createUserSchema = z.object({
  username: z.string().min(1).max(25),
  email: z.string().email(),
  password: z.string().min(6)
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional()
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const createPostSchema = z.object({
  postedby: z.string().min(1).max(25),
  posttype: z.number().int().nonnegative(),
  datapath: z.string().nullable(),
  location: z.string().nullable().optional(),
  visibility: z.number().int().nullable().optional(),
  thumbpath: z.string().optional(),
});

export const updatePostSchema = z.object({
  posttype: z.number().int().nonnegative().optional(),
  datapath: z.string().nullable(),
  location: z.string().nullable().optional(),
  visibility: z.number().int().nullable().optional(),
  thumbpath: z.string().optional(),
});