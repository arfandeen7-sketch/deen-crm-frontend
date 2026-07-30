import { api, deleteData, getData, postData, putData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type {
  AttendanceRegularization,
  RegularizationApplyPayload,
  RegularizationStatus,
  Paginated,
} from "@/types";

export interface RegularizationQuery {
  page?: number;
  pageSize?: number;
  userId?: string;
  status?: string;
  requestType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const attendanceRegularizationService = {
  /** HR/Master — all correction requests (scoped by permissions server-side). */
  async list(params: RegularizationQuery = {}): Promise<Paginated<AttendanceRegularization>> {
    const res = await api.get<Paginated<AttendanceRegularization>>(
      `/attendance-regularization${buildQuery(params)}`,
    );
    return res.data;
  },

  /** Employee — own correction requests. */
  async myList(params: Omit<RegularizationQuery, "userId"> = {}): Promise<Paginated<AttendanceRegularization>> {
    const res = await api.get<Paginated<AttendanceRegularization>>(
      `/me/attendance-regularization${buildQuery(params)}`,
    );
    return res.data;
  },

  get(id: string): Promise<AttendanceRegularization> {
    return getData<AttendanceRegularization>(`/attendance-regularization/${id}`);
  },

  /** Employee — raise a new correction request. */
  apply(body: RegularizationApplyPayload): Promise<AttendanceRegularization> {
    return postData<AttendanceRegularization>("/me/attendance-regularization", body);
  },

  /** HR/Master — approve or reject a correction request. */
  review(
    id: string,
    status: Extract<RegularizationStatus, "approved" | "rejected">,
    reviewNote?: string
  ): Promise<AttendanceRegularization> {
    return putData<AttendanceRegularization>(`/attendance-regularization/${id}/review`, {
      status,
      reviewNote,
    });
  },

  /** Employee — cancel their own pending request. */
  cancel(id: string): Promise<{ success: true }> {
    return deleteData<{ success: true }>(`/me/attendance-regularization/${id}`);
  },
};
