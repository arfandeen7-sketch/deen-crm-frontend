import { z } from "zod";

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

// "Unassigned" (the empty dropdown option) must serialize to `null`, NOT
// `undefined`. `undefined` keys are dropped by JSON.stringify, so the backend
// cannot distinguish "unassign" from "field not sent" — the lead would stay
// assigned. `null` is an explicit, serializable "clear this field" signal.
//
// Uses `.nullable()` (not `.optional()`) so the input and output types are
// both `string | null` — this keeps react-hook-form's zodResolver happy
// (input type must match output type when re-parsing in onSubmit).
const assignedToSchema = z
  .string()
  .uuid()
  .nullable()
  .or(z.literal(""))
  .transform((v) => (v === "" ? null : v));

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
  assignedTo: assignedToSchema,
  brokerId: optionalString,
  followUpDate: optionalString,
  // Empty string clears the note on save (full form submit always includes this field).
  // Uses `.nullable()` (not `.optional()`) so input and output are both
  // `string | null` — same reason as assignedTo above.
  followUpNote: z
    .string()
    .nullable()
    .transform((v) => (v === "" || v == null ? null : v)),
  city: optionalString,
  locality: optionalString,
  unitNumber: optionalString,
  price: optionalString,
  propertySize: optionalString,
  configuration: optionalString,
  comments: optionalString,
});

export type LeadFormValues = z.input<typeof leadSchema>;
export type LeadFormOutput = z.output<typeof leadSchema>;

// ── Extended schema that includes optional Client Details fields ──────────────
// These are saved via a separate /api/clients/:leadId call — they are NOT
// forwarded to the lead API. The create/edit pages split the values.

export const leadWithClientSchema = leadSchema.extend({
  // ── Buyer (Client) Details — shown when serviceType is NOT "Rent" ───────
  clientFullName:         optionalString,
  clientMobileNumber:     optionalString,
  clientEmail: z
    .string()
    .email("Enter a valid client email")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  clientDateOfBirth:      optionalString,
  clientPassportNumber:   optionalString,
  clientEmiratesIdNumber: optionalString,

  // ── Tenant Details — shown when serviceType IS "Rent" ──────────────────
  tenantFullName:           optionalString,
  tenantMobileNumber:       optionalString,
  tenantEmail: z
    .string()
    .email("Enter a valid tenant email")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  tenantDateOfBirth:        optionalString,
  tenantPassportNumber:     optionalString,
  tenantEmiratesIdNumber:   optionalString,
  tenantAgreementStartDate: optionalString,
  tenantAgreementEndDate:   optionalString,
});

export type LeadWithClientFormValues = z.input<typeof leadWithClientSchema>;
export type LeadWithClientFormOutput  = z.output<typeof leadWithClientSchema>;

/**
 * Splits a combined LeadWithClient form output into separate lead and client
 * payloads ready to send to their respective API endpoints.
 */
export function splitLeadClientValues(values: LeadWithClientFormOutput): {
  leadValues: LeadFormOutput;
  clientValues: {
    fullName?: string;
    mobileNumber?: string;
    email?: string;
    dateOfBirth?: string;
    passportNumber?: string;
    emiratesIdNumber?: string;
  };
  tenantValues: {
    fullName?: string;
    mobileNumber?: string;
    email?: string;
    dateOfBirth?: string;
    passportNumber?: string;
    emiratesIdNumber?: string;
    agreementStartDate?: string;
    agreementEndDate?: string;
  };
} {
  const {
    // Buyer (client) fields
    clientFullName,
    clientMobileNumber,
    clientEmail,
    clientDateOfBirth,
    clientPassportNumber,
    clientEmiratesIdNumber,
    // Tenant fields
    tenantFullName,
    tenantMobileNumber,
    tenantEmail,
    tenantDateOfBirth,
    tenantPassportNumber,
    tenantEmiratesIdNumber,
    tenantAgreementStartDate,
    tenantAgreementEndDate,
    ...leadValues
  } = values;

  return {
    leadValues,
    clientValues: {
      fullName:         clientFullName,
      mobileNumber:     clientMobileNumber,
      email:            clientEmail,
      dateOfBirth:      clientDateOfBirth,
      passportNumber:   clientPassportNumber,
      emiratesIdNumber: clientEmiratesIdNumber,
    },
    tenantValues: {
      fullName:             tenantFullName,
      mobileNumber:         tenantMobileNumber,
      email:                tenantEmail,
      dateOfBirth:          tenantDateOfBirth,
      passportNumber:       tenantPassportNumber,
      emiratesIdNumber:     tenantEmiratesIdNumber,
      agreementStartDate:   tenantAgreementStartDate,
      agreementEndDate:     tenantAgreementEndDate,
    },
  };
}
