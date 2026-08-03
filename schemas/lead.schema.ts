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
