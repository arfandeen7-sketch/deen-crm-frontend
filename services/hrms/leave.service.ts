import { api, deleteData, getData, postData, putData, patchData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type {
  LeaveRequest,
  LeaveApplyPayload,
  LeaveBalancesResponse,
  LeaveStatus,
  LeaveAllocatePayload,
  Paginated,
} from "@/types";

export interface LeaveQuery {
  page?: number;
  pageSize?: number;
  userId?: string;
  leaveTypeCode?: string;
  status?: string;
  isHalfDay?: boolean;
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
  apply(body: LeaveApplyPayload, file?: File): Promise<LeaveRequest> {
    if (file) {
      const formData = new FormData();
      formData.append("leaveTypeCode", body.leaveTypeCode);
      formData.append("dateFrom", body.dateFrom);
      formData.append("dateTo", body.dateTo);
      if (body.reason) formData.append("reason", body.reason);
      if (body.isHalfDay) {
        formData.append("isHalfDay", "true");
        if (body.halfDayPeriod) formData.append("halfDayPeriod", body.halfDayPeriod);
      }
      formData.append("attachment", file);
      return api.post<{ data: LeaveRequest }>("/me/leaves/apply", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then((res) => res.data.data);
    }
    return postData<LeaveRequest>("/me/leaves/apply", body);
  },
  review(id: string, status: Extract<LeaveStatus, "approved" | "rejected">, reviewNote?: string): Promise<LeaveRequest> {
    return putData<LeaveRequest>(`/leave/${id}/review`, { status, reviewNote });
  },
  cancel(id: string, cancellationReason?: string): Promise<{ success: true }> {
    if (cancellationReason) {
      return deleteData<{ success: true }>(`/me/leaves/${id}`, { data: { cancellationReason } });
    }
    return deleteData<{ success: true }>(`/me/leaves/${id}`);
  },
  balance(userId?: string): Promise<LeaveBalancesResponse> {
    if (userId) {
      return getData<LeaveBalancesResponse>(`/leave/balance?userId=${userId}`);
    }
    return getData<LeaveBalancesResponse>("/me/leaves/balance");
  },
  getById(id: string): Promise<LeaveRequest> {
    return getData<LeaveRequest>(`/leave/${id}`);
  },
  getAttachmentUrl(id: string): Promise<{ signedUrl: string }> {
    return getData<{ signedUrl: string }>(`/leave/${id}/attachment`);
  },
  getAllBalances(year?: number): Promise<LeaveBalancesResponse[]> {
    const query = year ? `?year=${year}` : "";
    return getData<LeaveBalancesResponse[]>(`/leave/balances${query}`);
  },
  getUserBalances(userId: string, year?: number): Promise<LeaveBalancesResponse> {
    const query = year ? `?year=${year}` : "";
    return getData<LeaveBalancesResponse>(`/leave/balances/${userId}${query}`);
  },
  allocate(body: LeaveAllocatePayload): Promise<{ success: true; userId: string; balances: LeaveBalancesResponse["balances"] }> {
    return postData(`/leave/balances/allocate`, body);
  },
};
