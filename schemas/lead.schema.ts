import { z } from "zod";

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

export const leadSchema = z.object({
  leadName: z.string().min(1, "Lead name is required"),
  mobileNumber: z
    .string()
    .min(5, "Enter a valid mobile number")
    .max(20, "Mobile number is too long"),
  alternateMobile: optionalString,
  email: z
    .string()
    .email("Enter a valid email")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  source: z.string().min(1, "Source is required"),
  projectName: optionalString,
  serviceType: z.string().min(1, "Service type is required"),
  leadStatus: z.string().min(1, "Status is required"),
  leadPriority: optionalString,
  assignedTo: optionalString,
  brokerId: optionalString,
  followUpDate: optionalString,
  city: optionalString,
  locality: optionalString,
  comments: optionalString,
});

export type LeadFormValues = z.input<typeof leadSchema>;
export type LeadFormOutput = z.output<typeof leadSchema>;
