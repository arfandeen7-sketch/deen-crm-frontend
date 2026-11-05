import { z } from "zod";

const PHONE = /^\+?[0-9\s\-()]{7,20}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_HM = /^([01]\d|2[0-3]):[0-5]\d$/;

const text = (max: number) => z.string().trim().max(max, `Must be at most ${max} characters`);
const required = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} must be at most ${max} characters`);
const optionalMatch = (re: RegExp, message: string) =>
  z.string().trim().refine((v) => v === "" || re.test(v), message);

export const openHouseEventSchema = z
  .object({
    eventName: required("Event name", 200),
    eventDate: z.string().min(1, "Event date is required"),
    startTime: optionalMatch(TIME_HM, "Use HH:mm format"),
    endTime: optionalMatch(TIME_HM, "Use HH:mm format"),
    developerName: required("Developer name", 200),
    location: required("Location", 300),
    venueName: text(200),
    projectName: text(200),
    projectDetails: text(5000),
    status: z.enum(["upcoming", "ongoing", "completed", "cancelled"]),
    expectedAttendees: z
      .string()
      .trim()
      .refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) <= 1_000_000), "Enter a whole number"),
    organizerName: text(200),
    organizerContact: optionalMatch(PHONE, "Enter a valid contact number"),
    notes: text(5000),
  })
  .refine((v) => !v.startTime || !v.endTime || v.endTime > v.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export type OpenHouseEventFormValue = z.input<typeof openHouseEventSchema>;

export const openHouseEventLeadSchema = z.object({
  eventId: z.string().min(1, "Select an event"),
  clientName: required("Client name", 200),
  mobileNumber: z.string().trim().min(1, "Mobile number is required").regex(PHONE, "Enter a valid mobile number"),
  alternativeMobile: optionalMatch(PHONE, "Enter a valid mobile number"),
  email: optionalMatch(EMAIL, "Enter a valid email address"),
  nationality: text(100),
  budget: z
    .string()
    .trim()
    .refine((v) => {
      if (v === "") return true;
      const n = Number(v.replace(/,/g, ""));
      return Number.isFinite(n) && n >= 0;
    }, "Enter a valid amount"),
  interestedProject: text(200),
  propertyType: text(100),
  bedrooms: text(50),
  purpose: z.string(),
  interestLevel: z.string(),
  requirements: text(5000),
  notes: text(5000),
});

export type OpenHouseEventLeadFormValue = z.input<typeof openHouseEventLeadSchema>;

/** First error message per top-level field. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
