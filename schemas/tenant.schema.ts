import { z } from "zod";

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

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
});

export type TenantFormValues = z.input<typeof tenantSchema>;
export type TenantFormOutput  = z.output<typeof tenantSchema>;
