import { api, getData, postData, putData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type { LeaveRequest, LeaveApplyPayload, LeaveBalance, Paginated } from "@/types";

export interface LeaveQuery {
  page?: number;
  pageSize?: number;
  userId?: string;
  leaveType?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const leaveService = {
  async list(params: LeaveQuery = {}): Promise<Paginated<LeaveRequest>> {
    const res = await api.get<Paginated<LeaveRequest>>(
      `/hrms/leave${buildQuery(params)}`,
    );
    return res.data;
  },
  async myList(params: Omit<LeaveQuery, "userId"> = {}): Promise<Paginated<LeaveRequest>> {
    const res = await api.get<Paginated<LeaveRequest>>(
      `/hrms/my/leave${buildQuery(params)}`,
    );
    return res.data;
  },
  apply(body: LeaveApplyPayload): Promise<LeaveRequest> {
    return postData<LeaveRequest>("/hrms/my/leave/apply", body);
  },
  approve(id: string): Promise<LeaveRequest> {
    return putData<LeaveRequest>(`/hrms/leave/${id}/approve`, {});
  },
  reject(id: string, reason: string): Promise<LeaveRequest> {
    return putData<LeaveRequest>(`/hrms/leave/${id}/reject`, { rejectionReason: reason });
  },
  balance(userId?: string): Promise<LeaveBalance> {
    const q = userId ? `?userId=${userId}` : "";
    return getData<LeaveBalance>(`/hrms/leave/balance${q}`);
  },
  updateBalance(userId: string, balance: LeaveBalance): Promise<LeaveBalance> {
    return putData<LeaveBalance>(`/hrms/leave/balance/${userId}`, balance);
  },
  async export(params: LeaveQuery = {}): Promise<Blob> {
    const res = await api.get(`/hrms/leave/export${buildQuery(params)}`, {
      responseType: "blob",
    });
    return res.data as Blob;
  },
};
