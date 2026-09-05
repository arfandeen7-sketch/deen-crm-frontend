import { z } from "zod";

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

const optionalDate = z
  .string()
  .optional()
  .transform((v) => (v === "" || v == null ? undefined : v));

export const bellaviuClientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phoneNumber: optionalString,
  alternativeNumber: optionalString,
  email: z
    .string()
    .email("Enter a valid email")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  checkInDate: optionalDate,
  checkOutDate: optionalDate,
  bookingChannel: optionalString,
  emiratesId: optionalString,
  passportNumber: optionalString,
  propertyName: optionalString,
  propertySize: optionalString,
  unitNo: optionalString,
  countryOfClient: optionalString,
  locationOfProperty: optionalString,
});

export type BellaviuClientFormValues = z.input<typeof bellaviuClientSchema>;
export type BellaviuClientFormOutput = z.output<typeof bellaviuClientSchema>;
