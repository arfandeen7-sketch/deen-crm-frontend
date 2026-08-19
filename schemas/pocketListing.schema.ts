import { z } from "zod";

// ── Re-export shared property constants ──────────────────────────────────────
export {
  PROPERTY_TYPES_BY_CATEGORY,
  BEDROOM_OPTIONS,
  BATHROOM_OPTIONS,
  RESIDENTIAL_AMENITIES,
  COMMERCIAL_AMENITIES,
} from "@/schemas/propertySubmission.schema";

// ── Helpers ──────────────────────────────────────────────────────────────────

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

const optionalNumber = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => {
    if (v === "" || v == null) return undefined;
    const n = Number(v);
    return isNaN(n) ? undefined : n;
  });

// ── Reference constants ───────────────────────────────────────────────────────

export const UAE_EMIRATES = [
  { value: "Dubai", label: "Dubai" },
  { value: "Abu Dhabi", label: "Abu Dhabi" },
  { value: "Sharjah", label: "Sharjah" },
  { value: "Ajman", label: "Ajman" },
  { value: "Ras Al Khaimah", label: "Ras Al Khaimah" },
  { value: "Fujairah", label: "Fujairah" },
  { value: "Umm Al Quwain", label: "Umm Al Quwain" },
] as const;

export const POCKET_LISTING_STATUS_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "sold", label: "Sold" },
  { value: "rented", label: "Rented" },
  { value: "off_market", label: "Off Market" },
] as const;

export const OFFERING_TYPE_OPTIONS = [
  { value: "sale", label: "Sale" },
  { value: "rent", label: "Rent" },
] as const;

export const FURNISHING_TYPE_OPTIONS = [
  { value: "unfurnished", label: "Unfurnished" },
  { value: "semi-furnished", label: "Semi-Furnished" },
  { value: "furnished", label: "Furnished" },
] as const;

export const COMPLETION_STATUS_OPTIONS = [
  { value: "completed", label: "Ready / Completed" },
  { value: "off_plan", label: "Off Plan" },
] as const;

export const PRICE_TYPE_OPTIONS = [
  { value: "sale", label: "Sale Price (one-time)" },
  { value: "yearly", label: "Per Year" },
  { value: "monthly", label: "Per Month" },
  { value: "weekly", label: "Per Week" },
  { value: "daily", label: "Per Day" },
] as const;

export const CURRENCY_OPTIONS = [
  { value: "AED", label: "AED" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
] as const;

// ── Zod Schema ────────────────────────────────────────────────────────────────

export const pocketListingSchema = z.object({
  // ── Basic Info ──────────────────────────────────────────────────────────────
  title: z.string().min(1, "Title is required"),
  description: optionalString,
  reference: optionalString,

  // ── Classification ─────────────────────────────────────────────────────────
  category: z.enum(["residential", "commercial"], {
    message: "Select a category",
  }),
  type: z.string().min(1, "Property type is required"),
  offeringType: z.enum(["sale", "rent"], {
    message: "Select an offering type",
  }),
  furnishingType: z
    .enum(["unfurnished", "semi-furnished", "furnished"])
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  completionStatus: z
    .enum(["completed", "off_plan"])
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  developer: optionalString,

  // ── Location ───────────────────────────────────────────────────────────────
  emirate: z.string().min(1, "Emirate is required"),
  city: optionalString,
  community: optionalString,
  building: optionalString,
  unitNumber: optionalString,
  floorNumber: optionalString,

  // ── Specifications ─────────────────────────────────────────────────────────
  bedrooms: optionalString,
  bathrooms: optionalString,
  size: optionalNumber,
  builtUpArea: optionalNumber,
  parkingSlots: optionalNumber,

  // ── Pricing ────────────────────────────────────────────────────────────────
  price: optionalNumber,
  currency: z.string().default("AED"),
  priceType: z
    .enum(["sale", "yearly", "monthly", "weekly", "daily"])
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  priceOnRequest: z.boolean().optional().default(false),
  numberOfCheques: optionalNumber,

  // ── Amenities ──────────────────────────────────────────────────────────────
  amenities: z.array(z.string()).optional().default([]),

  // ── Status & Availability ──────────────────────────────────────────────────
  listingStatus: z
    .enum(["available", "sold", "rented", "off_market"])
    .default("available"),
  availableFrom: optionalString,
  rentalStartDate: optionalString,
  rentalEndDate: optionalString,

  // ── Media (URL fields only — image files handled via FormData) ─────────────
  videoUrl: optionalString,
  virtualTourUrl: optionalString,
  floorPlanUrl: optionalString,

  // ── Notes ──────────────────────────────────────────────────────────────────
  notes: optionalString,
});

export type PocketListingFormValues = z.input<typeof pocketListingSchema>;
export type PocketListingFormOutput = z.output<typeof pocketListingSchema>;
