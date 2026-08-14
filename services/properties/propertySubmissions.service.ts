import { getData, postData, putData, deleteData, api } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";

export type PropertySubmissionStatus = "pending" | "approved" | "rejected";

export interface PropertySubmissionUser {
  id: string;
  fullName: string;
  email?: string;
  role: string;
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

  create(payload: Record<string, unknown>): Promise<PropertySubmission> {
    return postData<PropertySubmission>(`/property-submissions`, { payload });
  },

  review(id: string, status: "approved" | "rejected", reviewNote?: string): Promise<PropertySubmission> {
    return putData<PropertySubmission>(`/property-submissions/${id}/review`, { status, reviewNote });
  },

  withdraw(id: string): Promise<{ id: string; deleted: boolean }> {
    return deleteData<{ id: string; deleted: boolean }>(`/property-submissions/${id}`);
  },
};
