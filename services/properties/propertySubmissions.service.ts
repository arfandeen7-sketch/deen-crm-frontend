import { getData, putData, deleteData, api } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";

export type PropertySubmissionStatus = "pending" | "approved" | "rejected";

export interface PropertySubmissionUser {
  id: string;
  fullName: string;
  email?: string;
  role: string;
}

export interface PropertySubmissionImage {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  sortOrder: number;
}

export interface PropertySubmission {
  id: string;
  payload: Record<string, unknown>;
  status: PropertySubmissionStatus;
  pfListingId: string | null;
  submittedById: string;
  submittedBy: PropertySubmissionUser;
  reviewedById: string | null;
  reviewedBy: PropertySubmissionUser | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
  images?: PropertySubmissionImage[];
}

export interface PropertySubmissionListParams {
  page?: number;
  pageSize?: number;
  status?: PropertySubmissionStatus;
  search?: string;
}

export const propertySubmissionsService = {
  async list(
    params: PropertySubmissionListParams = {},
  ): Promise<{ data: PropertySubmission[]; meta: { total: number; page: number; pageSize: number; totalPages: number } }> {
    const res = await api.get<{
      data: PropertySubmission[];
      meta: { total: number; page: number; pageSize: number; totalPages: number };
    }>(`/property-submissions${buildQuery(params)}`);
    return res.data;
  },

  get(id: string): Promise<PropertySubmission> {
    return getData<PropertySubmission>(`/property-submissions/${id}`);
  },

  create(payload: Record<string, unknown>, images: File[]): Promise<PropertySubmission> {
    const form = new FormData();
    form.append("payload", JSON.stringify(payload));
    for (const file of images) {
      form.append("images", file);
    }
    return api
      .post<{ data: PropertySubmission }>(`/property-submissions`, form, { timeout: 180_000 })
      .then((res) => res.data.data);
  },

  review(id: string, status: "approved" | "rejected", reviewNote?: string): Promise<PropertySubmission> {
    return putData<PropertySubmission>(`/property-submissions/${id}/review`, { status, reviewNote });
  },

  withdraw(id: string): Promise<{ id: string; deleted: boolean }> {
    return deleteData<{ id: string; deleted: boolean }>(`/property-submissions/${id}`);
  },

  lookupPermit(params: {
    permitNumber: string;
    licenseNumber: string;
    permitType: "rera" | "adrec";
  }): Promise<DldPermitLookup> {
    return getData<DldPermitLookup>(`/property-submissions/dld-permit${buildQuery(params)}`);
  },

  searchLocations(search: string): Promise<PfLocationMatch[]> {
    return getData<PfLocationMatch[]>(`/property-submissions/locations${buildQuery({ search })}`);
  },
};

export interface PfLocationMatch {
  id: number;
  name: string;
  type?: string;
}

export interface DldPermitLookup {
  permit: {
    permitNumber: string;
    expiresAt: string | null;
    validationURL: string | null;
    listingType: string | null;
    saleType: string | null;
    locationName: string | null;
    sizeSqm: number | null;
  };
  locationMatches: PfLocationMatch[];
  allowedTypes: string[] | null;
  form: Partial<{
    uaeEmirate: "dubai" | "abu_dhabi" | "northern_emirates";
    complianceType: "rera" | "adrec";
    complianceListingAdvertisementNumber: string;
    complianceIssuingClientLicenseNumber: string;
    unitNumber: string;
    size: number;
    builtUpArea: number;
    bedrooms: string;
    priceAmount: number;
    priceType: "sale" | "yearly" | "monthly" | "weekly" | "daily";
    type: string;
    projectStatus: "completed" | "off_plan" | "completed_primary" | "off_plan_primary";
    developer: string;
    descriptionEn: string;
    titleEn: string;
    locationId: number;
    category: "residential" | "commercial";
    reference: string;
  }>;
}
