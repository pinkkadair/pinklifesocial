import { z } from "zod";

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be less than 30 characters")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Username can only contain letters, numbers, underscores, and hyphens"
  );

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
  bio: z.string().max(160, "Bio must be less than 160 characters").optional(),
  location: z.string().max(50, "Location must be less than 50 characters").optional(),
  website: z.string().url("Must be a valid URL").max(100, "Website must be less than 100 characters").optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>; 