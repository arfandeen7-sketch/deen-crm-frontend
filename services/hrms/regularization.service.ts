import { api, getData, postData, putData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type {
  AttendanceRegularization,
  RegularizationApplyPayload,
  RegularizationReviewPayload,
  Paginated,
} from "@/types";
import type { RegularizationApplyFormData } from "@/hooks/useHrms";

export interface RegularizationQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const regularizationService = {
  async list(params: RegularizationQuery = {}): Promise<Paginated<AttendanceRegularization>> {
    const res = await api.get<Paginated<AttendanceRegularization>>(
      `/attendance-regularization${buildQuery(params)}`,
    );
    return res.data;
  },
  get(id: string): Promise<AttendanceRegularization> {
    return getData<AttendanceRegularization>(`/attendance-regularization/${id}`);
  },
  apply(body: RegularizationApplyPayload): Promise<AttendanceRegularization> {
    return postData<AttendanceRegularization>("/attendance-regularization", body);
  },
  async applyWithAttachment(body: RegularizationApplyFormData): Promise<AttendanceRegularization> {
    const formData = new FormData();
    formData.append("date", body.date);
    formData.append("requestType", body.requestType);
    if (body.attendanceId) formData.append("attendanceId", body.attendanceId);
    if (body.currentStatus) formData.append("currentStatus", body.currentStatus);
    if (body.requestedCheckIn) formData.append("requestedCheckIn", body.requestedCheckIn);
    if (body.requestedCheckOut) formData.append("requestedCheckOut", body.requestedCheckOut);
    formData.append("reason", body.reason);
    if (body.attachment) formData.append("attachment", body.attachment);
    const res = await api.post<{ data: AttendanceRegularization }>("/attendance-regularization", formData);
    return res.data.data;
  },
  review(id: string, body: RegularizationReviewPayload): Promise<AttendanceRegularization> {
    return putData<AttendanceRegularization>(`/attendance-regularization/${id}/review`, body);
  },
};
