import { z } from "zod";

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

const optionalNumber = z
  .union([z.number(), z.string()])
  .optional()
  .transform((v) => {
    if (v == null || v === "") return undefined;
    const n = typeof v === "string" ? Number(v.replace(/[^0-9.-]/g, "")) : v;
    if (!Number.isFinite(n) || n < 0) return undefined;
    return n;
  });

export const rentalAgreementSchema = z.object({
  agreementStartDate: optionalString,
  agreementEndDate:   optionalString,
  rentAmount:         optionalNumber,
  currency:           z.string().optional().default("AED"),
  numberOfCheques:    optionalNumber,
  securityDeposit:    optionalNumber,
  notes:              optionalString,
}).refine(
  (data) => {
    if (data.agreementStartDate && data.agreementEndDate) {
      return new Date(data.agreementEndDate) >= new Date(data.agreementStartDate);
    }
    return true;
  },
  { message: "End date must be after the start date", path: ["agreementEndDate"] }
);

export type RentalAgreementFormValues = z.input<typeof rentalAgreementSchema>;
export type RentalAgreementFormOutput  = z.output<typeof rentalAgreementSchema>;
