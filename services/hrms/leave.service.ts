import { api, deleteData, getData, postData, putData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type { LeaveRequest, LeaveApplyPayload, LeaveBalance, LeaveStatus, Paginated } from "@/types";

export interface LeaveQuery {
  page?: number;
  pageSize?: number;
  userId?: string;
  leaveType?: string;
  status?: string;
}

export const leaveService = {
  async list(params: LeaveQuery = {}): Promise<Paginated<LeaveRequest>> {
    const res = await api.get<Paginated<LeaveRequest>>(
      `/leave${buildQuery(params)}`,
    );
    return res.data;
  },
  async myList(params: Omit<LeaveQuery, "userId"> = {}): Promise<Paginated<LeaveRequest>> {
    const res = await api.get<Paginated<LeaveRequest>>(
      `/me/leaves${buildQuery(params)}`,
    );
    return res.data;
  },
  apply(body: LeaveApplyPayload): Promise<LeaveRequest> {
    return postData<LeaveRequest>("/leave", body);
  },
  review(id: string, status: Extract<LeaveStatus, "approved" | "rejected">, reviewNote?: string): Promise<LeaveRequest> {
    return putData<LeaveRequest>(`/leave/${id}/review`, { status, reviewNote });
  },
  cancel(id: string): Promise<{ success: true }> {
    return deleteData<{ success: true }>(`/leave/${id}`);
  },
  balance(userId?: string): Promise<{ userId: string; fullName: string; leaveBalance: LeaveBalance }> {
    const q = userId ? `?userId=${userId}` : "";
    return getData<{ userId: string; fullName: string; leaveBalance: LeaveBalance }>(`/leave/balance${q}`);
  },
};
