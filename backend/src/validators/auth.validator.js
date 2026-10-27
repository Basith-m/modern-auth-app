
import { z } from "zod";

export const registerSchema = z.object({
    name: z.string()
        .trim()
        .min(2, "Name must contain at least 2 characters.")
        .max(80, "Name cannot exceed 80 characters."),

    email: z.email({ error: "Please enter a valid email address." })
        .trim()
        .max(254, "Email is too long.")
        .transform((value) => value.toLowerCase()),

    password: z.string()
        .min(8, "Password must contain at least 8 characters.")
        .max(72, "Password cannot exceed 72 characters."),
});

export const loginSchema = z.object({
    email: z.email({ error: "Please enter a valid email address." })
        .trim()
        .max(254, "Email is too long.")
        .transform((value) => value.toLowerCase()),

    password: z.string()
        .min(1, "Password is required.")
        .max(72, "Password is too long."),
});