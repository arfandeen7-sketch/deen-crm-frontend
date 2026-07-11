import { z } from "zod";

const optional = z
  .string()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

const role = z.enum(["master", "hr_manager", "sales_manager", "sales_executive"]);

export const createUserSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters"),
  phone: optional,
  role,
  managerId: optional,
});

export const updateUserSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phone: optional,
  role,
  managerId: optional,
});

export type CreateUserValues = z.input<typeof createUserSchema>;
export type UpdateUserValues = z.input<typeof updateUserSchema>;
