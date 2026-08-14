import { z } from "zod";

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

export const tenantSchema = z.object({
  fullName:             optionalString,
  mobileNumber:         optionalString,
  email: z
    .string()
    .email("Enter a valid email")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  dateOfBirth:          optionalString,
  passportNumber:       optionalString,
  emiratesIdNumber:     optionalString,
  agreementStartDate:   optionalString,
  agreementEndDate:     optionalString,
});

export type TenantFormValues = z.input<typeof tenantSchema>;
export type TenantFormOutput  = z.output<typeof tenantSchema>;
