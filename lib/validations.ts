import { z } from "zod"

export const AuthRegisterSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password too long"),
  dateOfBirth: z.string().refine((val) => {
    const date = new Date(val);
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    const m = today.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
      return age - 1 >= 18;
    }
    return age >= 18;
  }, { message: "You must be at least 18 years old" }),
  phoneNumber: z.string().regex(/^\+[1-9]\d{9,14}$/, "Invalid contact number format. Must include country code (e.g., +92...)"),
  gender: z.enum(["male", "female", "lesbian", "gay"]),
})

export const AuthLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
})

export const UserUpdateSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["user", "moderator", "admin"]).optional(),
  status: z.enum(["active", "banned"]).optional(),
})
