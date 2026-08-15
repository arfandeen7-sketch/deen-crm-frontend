import { getData, api } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";

export interface PropertySummary {
  id: string;
  reference: string;
  title: string;
  description: string;
  type: string;
  category: string;
  offeringType: string;
  emirate: string;
  city: string;
  community: string | null;
  building: string | null;
  bedrooms: string;
  bathrooms: string;
  size: number;
  price: number | null;
  currency: string;
  furnishingType: string;
  completionStatus: string;
  unitNumber: string;
  floorNumber: string;
  parkingSlots: number;
  amenities: string[];
  mainImage: string | null;
  imageCount: number;
  hasVideo: boolean;
  hasFloorPlan: boolean;
  hasVirtualTour: boolean;
  state: string;
  listingStatus: string;
  verificationStatus: string;
  qualityScore: number | null;
  agentName: string | null;
  agentEmail: string | null;
  agentMobile: string | null;
  agencyName: string | null;
  agencyLicense: string | null;
  permitNumber: string | null;
  publishedAt: string | null;
  availableFrom: string | null;
  createdAt: string;
  updatedAt: string;
  /** "sold" | "rented" | null — set when a linked lead is Deal Closed. */
  dealStatus: "sold" | "rented" | null;
  /** Rental agreement details — only present when dealStatus is "rented" and tenant has agreement dates. */
  rentalAgreement?: {
    agreementStartDate: string | null;
    agreementEndDate: string | null;
    /** Days remaining until agreement end date (negative if expired). */
    daysRemaining: number | null;
  } | null;
}

export interface PropertyDetail extends PropertySummary {
  images: Array<{ original: string; watermarked: string; width: number; height: number }>;
  video: { url: string; thumbnailUrl: string } | null;
  floorPlan: { url: string; watermarkedUrl: string } | null;
  virtualTour: { url: string } | null;
  locationHierarchy: string | null;
  coordinates: { lat: number; lng: number } | null;
  priceType: string | null;
  numberOfCheques: number | null;
  createdBy: { name: string; thumbnail: string | null } | null;
  updatedBy: { name: string; thumbnail: string | null } | null;
  products: any;
  portals: any;
  compliance: any;
}

export interface PropertyListMeta {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface PropertyQueryParams {
  page?: number;
  perPage?: number;
  state?: string;
  offeringType?: string;
  category?: string;
  type?: string;
  furnishingType?: string;
  completionStatus?: string;
  bedrooms?: string;
  bathrooms?: string;
  search?: string;
  orderBy?: string;
  priceFrom?: number;
  priceTo?: number;
  sizeFrom?: number;
  sizeTo?: number;
}

export const propertiesService = {
  async list(params: PropertyQueryParams = {}): Promise<{ data: PropertySummary[]; meta: PropertyListMeta }> {
    const res = await api.get<{ data: PropertySummary[]; meta: PropertyListMeta }>(
      `/properties${buildQuery(params)}`,
    );
    return res.data;
  },

  get(id: string): Promise<PropertyDetail> {
    return getData<PropertyDetail>(`/properties/${id}`);
  },
};
