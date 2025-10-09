import { z } from "zod";

export const createUserSchema = z.object({
  username: z.string().min(1).max(25),
  email: z.string().email(),
  password: z.string().min(8)
});
export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional()
});

export const createPostSchema = z.object({
  postedby: z.string().min(1).max(25),
  posttype: z.number().int().nonnegative(),
  datapath: z.string().nullable(),
  location: z.string().nullable().optional(),
  visibility: z.number().int().nullable().optional(),
});

export const updatePostSchema = z.object({
  posttype: z.number().int().nonnegative().optional(),
  datapath: z.string().nullable(),
  location: z.string().nullable().optional(),
  visibility: z.number().int().nullable().optional(),
});