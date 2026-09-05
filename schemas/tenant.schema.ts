import { z } from "zod";

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

// A single cheque entry in the editable cheque schedule.
// Dates / amounts are sent as strings; the backend coerces them.
export const chequeSchema = z.object({
  chequeNumber: z.number(),
  chequeDate:   z.string().optional(),
  amount:       z.string().optional(),
  status:       z.string().optional(),
});

export const tenantSchema = z.object({
  // Personal info
  fullName:             optionalString,
  mobileNumber:         optionalString,
  email: z
    .string()
    .email("Enter a valid email")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  dateOfBirth:          optionalString,
  tenantNationality:    optionalString,
  passportNumber:       optionalString,
  emiratesIdNumber:     optionalString,
  // Passport validity period
  passportStartDate:    optionalString,
  passportEndDate:      optionalString,
  // Tenancy agreement
  agreementStartDate:   optionalString,
  agreementEndDate:     optionalString,
  dateOfNotice:         optionalString,
  // Owner & property links
  ownerId:              optionalString,
  ownerPropertyId:      optionalString,
  ownerManualPropertyId: optionalString,
  // Rental financials (sent as strings — backend coerces to numbers)
  annualRent:           optionalString,
  securityDeposit:      optionalString,
  adminFee:             optionalString,
  commission:           optionalString,
  currency:             optionalString,
  modeOfPayment:        optionalString,
  numberOfCheques:      optionalString,
  // Cheque schedule — full array; replaces existing cheques on save
  cheques: z.array(chequeSchema).optional(),
});

export type ChequeFormValues = z.input<typeof chequeSchema>;
export type TenantFormValues = z.input<typeof tenantSchema>;
export type TenantFormOutput  = z.output<typeof tenantSchema>;
