import { z } from "zod";

export const smtpConfigSchema = z.object({
  host: z.string().min(1, "Host is required"),
  port: z.coerce.number().min(1).max(65535),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  encryption: z.enum(["tls", "ssl", "none"]),
  fromName: z.string().min(1, "From name is required"),
  fromEmail: z.string().email("Valid email required"),
  isActive: z.boolean().optional(),
});

export type SmtpConfigFormValues = z.infer<typeof smtpConfigSchema>;

export const emailTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  type: z.enum(["payslip", "leave_approved", "leave_rejected", "welcome", "custom"]),
});

export type EmailTemplateFormValues = z.infer<typeof emailTemplateSchema>;
