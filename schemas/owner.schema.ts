import { z } from "zod";

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

export const ownerSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
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
  whatsapp: optionalString,
  emirate: optionalString,
  city: optionalString,
  locality: optionalString,
  notes: optionalString,
});

export type OwnerFormValues = z.input<typeof ownerSchema>;
export type OwnerFormOutput = z.output<typeof ownerSchema>;

export const ownerPropertySchema = z.object({
  // pfListingId is required — a property must be selected from the
  // Properties module before it can be linked to an owner.
  pfListingId: z.string().min(1, "A property must be selected from the Properties module"),
  projectName: z.string().min(1, "Project name is required"),
  projectType: optionalString,
  reference: optionalString,
  category: optionalString,
  type: optionalString,
  configuration: optionalString,
  bedrooms: optionalString,
  bathrooms: optionalString,
  size: optionalString,
  price: optionalString,
  emirate: optionalString,
  community: optionalString,
  building: optionalString,
  unitNumber: optionalString,
  floorNumber: optionalString,
  parkingSlots: optionalString,
  listingStatus: z
    .enum(["available", "listed", "sold", "rented", "off_market"])
    .optional(),
  notes: optionalString,
});

export type OwnerPropertyFormValues = z.input<typeof ownerPropertySchema>;
export type OwnerPropertyFormOutput = z.output<typeof ownerPropertySchema>;

export const LISTING_STATUS_LABELS: Record<string, string> = {
  available: "Available",
  listed: "Listed",
  sold: "Sold",
  rented: "Rented",
  off_market: "Off Market",
};

export const LISTING_STATUS_COLORS: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-700",
  listed: "bg-blue-100 text-blue-700",
  sold: "bg-rose-100 text-rose-700",
  rented: "bg-amber-100 text-amber-700",
  off_market: "bg-slate-100 text-slate-600",
};
