import { z } from "zod";

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

export const PROPERTY_TYPES_BY_CATEGORY: Record<"residential" | "commercial", string[]> = {
  residential: [
    "apartment", "bulk-rent-unit", "bulk-sale-unit", "bungalow", "compound", "duplex",
    "full-floor", "half-floor", "hotel-apartment", "land", "penthouse", "townhouse",
    "villa", "whole-building",
  ],
  commercial: [
    "bulk-rent-unit", "bulk-sale-unit", "business-center", "co-working-space", "factory",
    "farm", "full-floor", "half-floor", "labor-camp", "land", "office-space", "retail",
    "shop", "show-room", "staff-accommodation", "villa", "warehouse", "whole-building",
  ],
};

export const PROPERTY_TYPES = Array.from(
  new Set([...PROPERTY_TYPES_BY_CATEGORY.residential, ...PROPERTY_TYPES_BY_CATEGORY.commercial])
);

/**
 * UAE amenity allowlists from Property Finder Enterprise API.
 * Accepted amenities depend on category + property type. Land/farm listings
 * cannot send amenities at all. Values like electricity/waters/conference-room
 * are valid only for some commercial or non-UAE listings.
 */
export const RESIDENTIAL_AMENITIES = [
  "balcony",
  "barbecue-area",
  "built-in-wardrobes",
  "central-ac",
  "childrens-play-area",
  "childrens-pool",
  "concierge",
  "covered-parking",
  "kitchen-appliances",
  "lobby-in-building",
  "maid-service",
  "maids-room",
  "pets-allowed",
  "private-garden",
  "private-gym",
  "private-jacuzzi",
  "private-pool",
  "security",
  "shared-gym",
  "shared-pool",
  "shared-spa",
  "study",
  "vastu-compliant",
  "view-of-landmark",
  "view-of-water",
  "walk-in-closet",
] as const;

export const COMMERCIAL_AMENITIES = [
  "conference-room",
  "covered-parking",
  "dining-in-building",
  "lobby-in-building",
  "networked",
  "shared-gym",
  "shared-pool",
  "vastu-compliant",
] as const;

const TYPES_WITHOUT_AMENITIES = new Set(["land", "farm"]);

export function getAllowedAmenities(category?: string, type?: string): string[] {
  if (!category || !type || TYPES_WITHOUT_AMENITIES.has(type)) return [];
  if (category === "commercial") return [...COMMERCIAL_AMENITIES];
  if (category === "residential") return [...RESIDENTIAL_AMENITIES];
  return [];
}

/** Keep only amenities PF will accept for this listing, in a stable order. */
export function filterAmenitiesForListing(
  amenities: unknown,
  category?: string,
  type?: string
): string[] {
  const allowed = getAllowedAmenities(category, type);
  if (allowed.length === 0 || !Array.isArray(amenities)) return [];
  const selected = new Set(
    amenities.filter((value): value is string => typeof value === "string").map((value) => value.trim())
  );
  return allowed.filter((amenity) => selected.has(amenity));
}

export const AMENITIES = Array.from(new Set([...RESIDENTIAL_AMENITIES, ...COMMERCIAL_AMENITIES]));

/**
 * Schema for the "Add Property to Property Finder" form.
 * Maps to the PF Enterprise API POST /v1/listings request body.
 */
export const propertySubmissionSchema = z.object({
  // ── Required: Core listing fields ──────────────────────────────
  titleEn: z.string().min(1, "English title is required"),
  descriptionEn: z.string().min(1, "English description is required"),
  reference: optionalString,
  category: z.enum(["residential", "commercial"], {
    message: "Select a category",
  }),
  type: z.string().min(1, "Property type is required"),
  furnishingType: z.enum(["unfurnished", "semi-furnished", "furnished"], {
    message: "Select furnishing type",
  }),
  uaeEmirate: z.enum(["dubai", "abu_dhabi", "northern_emirates"], {
    message: "Select an emirate",
  }),
  size: z.union([z.string(), z.number()]).transform((v) => Number(v)),
  priceType: z.enum(["sale", "yearly", "monthly", "weekly", "daily"], {
    message: "Select a price type",
  }),
  priceAmount: z.union([z.string(), z.number()]).transform((v) => Number(v)),
  locationId: z
    .union([z.string(), z.number(), z.undefined(), z.null()])
    .transform((v) => {
      if (v === "" || v == null) return undefined;
      const n = Number(v);
      return Number.isInteger(n) && n >= 1 ? n : undefined;
    })
    .refine((v): v is number => typeof v === "number", {
      message: "Search and select a Property Finder location",
    }),

  // ── Required: Media (at least 1 uploaded image) ────────────────
  images: z
    .array(
      z.object({
        id: z.string(),
        file: z.custom<File>((value) => typeof File !== "undefined" && value instanceof File, {
          message: "Upload a valid image file",
        }),
        preview: z.string().optional(),
      })
    )
    .min(1, "Upload at least one image"),

  // ── Optional: Property details ─────────────────────────────────
  bedrooms: optionalString,
  bathrooms: optionalString,
  unitNumber: optionalString,
  floorNumber: optionalString,
  parkingSlots: optionalNumber,
  availableFrom: optionalString,
  finishingType: z
    .enum(["fully-finished", "semi-finished", "unfinished"])
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  projectStatus: z
    .enum(["completed", "off_plan", "completed_primary", "off_plan_primary"])
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  developer: optionalString,
  age: optionalNumber,
  builtUpArea: optionalNumber,
  numberOfFloors: optionalNumber,
  hasParkingOnSite: z.boolean().optional().default(false),
  hasGarden: z.boolean().optional().default(false),
  hasKitchen: z.boolean().optional().default(false),

  // ── Optional: Amenities (multi-select) ─────────────────────────
  amenities: z.array(z.string()).optional().default([]),

  // ── Optional: Compliance (required for Dubai/Abu Dhabi) ────────
  complianceListingAdvertisementNumber: optionalString,
  complianceType: z
    .enum(["rera", "adrec"])
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  complianceIssuingClientLicenseNumber: optionalString,

  // ── Optional: Additional media (URLs only) ─────────────────────
  videoUrl: optionalString,
  virtualTourUrl: optionalString,
  floorPlanUrl: optionalString,

  // ── Optional: Price details ────────────────────────────────────
  downPayment: optionalNumber,
  numberOfCheques: optionalNumber,
  minimalRentalPeriod: optionalNumber,
  priceOnRequest: z.boolean().optional().default(false),
}).superRefine((values, ctx) => {
  const allowedForCategory = PROPERTY_TYPES_BY_CATEGORY[values.category] ?? [];
  if (values.type && allowedForCategory.length > 0 && !allowedForCategory.includes(values.type)) {
    ctx.addIssue({
      code: "custom",
      path: ["type"],
      message:
        values.category === "commercial"
          ? "This property type is not allowed for commercial listings. Switch category to Residential, or pick a commercial type."
          : "This property type is not allowed for residential listings. Switch category to Commercial, or pick a residential type.",
    });
  }

  const allowedAmenities = getAllowedAmenities(values.category, values.type);
  const invalidAmenities = (values.amenities ?? []).filter((amenity) => !allowedAmenities.includes(amenity));
  if (invalidAmenities.length > 0) {
    ctx.addIssue({
      code: "custom",
      path: ["amenities"],
      message:
        allowedAmenities.length === 0
          ? "Property Finder does not allow amenities for this property type."
          : `These amenities are not allowed for this ${values.category} ${values.type || "listing"}: ${invalidAmenities.join(", ")}`,
    });
  }

  if (values.uaeEmirate !== "dubai" && values.uaeEmirate !== "abu_dhabi") return;

  if (!values.complianceListingAdvertisementNumber) {
    ctx.addIssue({
      code: "custom",
      path: ["complianceListingAdvertisementNumber"],
      message: "RERA / ADREC permit number is required",
    });
  }
  if (!values.complianceType) {
    ctx.addIssue({
      code: "custom",
      path: ["complianceType"],
      message: "Compliance type is required",
    });
  }
  if (!values.complianceIssuingClientLicenseNumber) {
    ctx.addIssue({
      code: "custom",
      path: ["complianceIssuingClientLicenseNumber"],
      message: "Company license number is required",
    });
  }
  if (
    values.complianceListingAdvertisementNumber &&
    values.reference &&
    values.complianceListingAdvertisementNumber.trim() === values.reference.trim()
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["complianceListingAdvertisementNumber"],
      message: "This must be the RERA / ADREC permit, not the listing reference",
    });
  }
});

export type PropertySubmissionFormValues = z.input<typeof propertySubmissionSchema>;
export type PropertySubmissionFormOutput = z.output<typeof propertySubmissionSchema>;

export function generateListingReference(): string {
  const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % 32]).join("");
}

/**
 * Transforms form values into the PF API POST /v1/listings payload.
 */
export function buildPFPayload(values: PropertySubmissionFormOutput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    title: { en: values.titleEn },
    description: { en: values.descriptionEn },
    reference: values.reference?.trim() || generateListingReference(),
    category: values.category,
    type: values.type,
    furnishingType: values.furnishingType,
    uaeEmirate: values.uaeEmirate,
    size: values.size,
    location: { id: values.locationId },
    media: {
      ...(values.videoUrl || values.virtualTourUrl
        ? {
            videos: {
              ...(values.videoUrl && { default: values.videoUrl }),
              ...(values.virtualTourUrl && { view360: values.virtualTourUrl }),
            },
          }
        : {}),
      ...(values.virtualTourUrl && {
        virtualTours: [{ url: values.virtualTourUrl }],
      }),
      ...(values.floorPlanUrl && {
        floorPlan: { url: values.floorPlanUrl },
      }),
    },
    price: {
      type: values.priceType,
      amounts: {
        [values.priceType]: values.priceAmount,
      },
      onRequest: values.priceOnRequest,
      ...(values.downPayment != null && { downpayment: values.downPayment }),
      ...(values.numberOfCheques != null && { numberOfCheques: values.numberOfCheques }),
      ...(values.minimalRentalPeriod != null && { minimalRentalPeriod: values.minimalRentalPeriod }),
    },
  };

  // Optional fields
  if (values.bedrooms) payload.bedrooms = values.bedrooms;
  if (values.bathrooms) payload.bathrooms = values.bathrooms;
  if (values.unitNumber) payload.unitNumber = values.unitNumber;
  if (values.floorNumber) payload.floorNumber = values.floorNumber;
  if (values.parkingSlots != null) payload.parkingSlots = values.parkingSlots;
  if (values.availableFrom) payload.availableFrom = values.availableFrom;
  if (values.finishingType) payload.finishingType = values.finishingType;
  if (values.projectStatus) payload.projectStatus = values.projectStatus;
  if (values.developer) payload.developer = values.developer;
  if (values.age != null) payload.age = values.age;
  if (values.builtUpArea != null) payload.builtUpArea = values.builtUpArea;
  if (values.numberOfFloors != null) payload.numberOfFloors = values.numberOfFloors;
  if (values.hasParkingOnSite) payload.hasParkingOnSite = true;
  if (values.hasGarden) payload.hasGarden = true;
  if (values.hasKitchen) payload.hasKitchen = true;
  const amenities = filterAmenitiesForListing(values.amenities, values.category, values.type);
  if (amenities.length > 0) payload.amenities = amenities;

  // Compliance (required for Dubai/Abu Dhabi)
  if (values.complianceListingAdvertisementNumber || values.complianceType || values.complianceIssuingClientLicenseNumber) {
    payload.compliance = {
      ...(values.complianceListingAdvertisementNumber && {
        listingAdvertisementNumber: values.complianceListingAdvertisementNumber,
      }),
      ...(values.complianceType && { type: values.complianceType }),
      ...(values.complianceIssuingClientLicenseNumber && {
        issuingClientLicenseNumber: values.complianceIssuingClientLicenseNumber,
      }),
    };
  }

  return payload;
}

export const BEDROOM_OPTIONS = [
  "studio", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
];

export const BATHROOM_OPTIONS = [
  "none", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
];
