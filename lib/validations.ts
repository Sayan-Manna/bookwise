import { z } from "zod";

export const signUpSchema = z.object({
  fullName: z.string().min(3, "Name is too short").max(50, "Name is too long").nonempty("Name is required"),
  email: z.string().email("Invalid email").nonempty("Email is required"),
  universityId: z.coerce.number(),
  universityCard: z.string().nonempty("University card is required"),
  password: z.string().min(6, "Password is too short").nonempty("Password is required"),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email").nonempty("Email is required"),
  password: z.string().nonempty("Password is required"),
});
