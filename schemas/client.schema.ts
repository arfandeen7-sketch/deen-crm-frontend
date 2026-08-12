import { z } from "zod";

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

export const clientSchema = z.object({
  fullName:         optionalString,
  mobileNumber:     optionalString,
  email: z
    .string()
    .email("Enter a valid email")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  dateOfBirth:      optionalString,
  passportNumber:   optionalString,
  emiratesIdNumber: optionalString,
});

export type ClientFormValues = z.input<typeof clientSchema>;
export type ClientFormOutput  = z.output<typeof clientSchema>;
