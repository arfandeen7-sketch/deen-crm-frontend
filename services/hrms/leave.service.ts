import { api, deleteData, getData, postData, putData, patchData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type {
  LeaveRequest,
  LeaveApplyPayload,
  LeaveBalanceEntry,
  LeaveBalanceAllRow,
  LeaveStatus,
  LeaveTypeConfig,
  LeavePolicy,
  LeaveAudit,
  LeaveCalendarDay,
  EmployeeLeaveDashboard,
  HrLeaveDashboard,
  LeaveReportRow,
  AdjustBalancePayload,
  Paginated,
} from "@/types";

export interface LeaveQuery {
  page?: number;
  pageSize?: number;
  userId?: string;
  leaveTypeCode?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const leaveService = {
  // ── Leave Requests ──────────────────────────────────────────────────────────

  async list(params: LeaveQuery = {}): Promise<Paginated<LeaveRequest>> {
    const res = await api.get<Paginated<LeaveRequest>>(`/leave${buildQuery(params)}`);
    return res.data;
  },

  async myList(params: Omit<LeaveQuery, "userId"> = {}): Promise<Paginated<LeaveRequest>> {
    const res = await api.get<Paginated<LeaveRequest>>(`/me/leaves${buildQuery(params)}`);
    return res.data;
  },

  get(id: string): Promise<LeaveRequest> {
    return getData<LeaveRequest>(`/leave/${id}`);
  },

  apply(body: LeaveApplyPayload): Promise<LeaveRequest> {
    return postData<LeaveRequest>("/leave", body);
  },

  applyWithAttachment(formData: FormData): Promise<LeaveRequest> {
    return api
      .post<{ data: LeaveRequest }>("/leave", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.data);
  },

  review(
    id: string,
    status: Extract<LeaveStatus, "approved" | "rejected">,
    reviewNote?: string,
  ): Promise<LeaveRequest> {
    return putData<LeaveRequest>(`/leave/${id}/review`, { status, reviewNote });
  },

  cancel(id: string, cancellationReason?: string): Promise<LeaveRequest> {
    return deleteData<LeaveRequest>(`/leave/${id}`, {
      data: { cancellationReason },
    });
  },

  // ── Leave Balance ───────────────────────────────────────────────────────────

  getBalance(userId?: string, year?: number): Promise<LeaveBalanceEntry[]> {
    return getData<LeaveBalanceEntry[]>(
      `/leave/balance${buildQuery({ userId, year })}`,
    );
  },

  getBalanceAll(year: number): Promise<LeaveBalanceAllRow[]> {
    return getData<LeaveBalanceAllRow[]>(`/leave/balance/all${buildQuery({ year })}`);
  },

  adjustBalance(params: AdjustBalancePayload): Promise<unknown> {
    return postData("/leave/balance/adjust", params);
  },

  // ── Leave Calendar ──────────────────────────────────────────────────────────

  getCalendar(month: number, year: number, userId?: string): Promise<LeaveCalendarDay[]> {
    return getData<LeaveCalendarDay[]>(
      `/leave/calendar${buildQuery({ month, year, userId })}`,
    );
  },

  // ── Leave Reports ───────────────────────────────────────────────────────────

  getReports(month: number, year: number): Promise<LeaveReportRow[]> {
    return getData<LeaveReportRow[]>(
      `/leave/reports${buildQuery({ month, year })}`,
    );
  },

  async exportReports(month: number, year: number): Promise<Blob> {
    const res = await api.get(`/leave/reports/export`, {
      params: { month, year },
      responseType: "blob",
    });
    return res.data as Blob;
  },

  // ── Dashboards ──────────────────────────────────────────────────────────────

  getEmployeeDashboard(): Promise<EmployeeLeaveDashboard> {
    return getData<EmployeeLeaveDashboard>("/leave/dashboard");
  },

  getHrDashboard(): Promise<HrLeaveDashboard> {
    return getData<HrLeaveDashboard>("/leave/hr-dashboard");
  },

  // ── Audits ──────────────────────────────────────────────────────────────────

  getAudits(requestId: string): Promise<LeaveAudit[]> {
    return getData<LeaveAudit[]>(`/leave/${requestId}/audits`);
  },

  // ── Leave Types (Settings) ──────────────────────────────────────────────────

  getLeaveTypes(activeOnly = true): Promise<LeaveTypeConfig[]> {
    return getData<LeaveTypeConfig[]>(
      `/leave-settings${buildQuery({ activeOnly })}`,
    );
  },

  getLeaveType(code: string): Promise<LeaveTypeConfig> {
    return getData<LeaveTypeConfig>(`/leave-settings/${code}`);
  },

  createLeaveType(data: Partial<LeaveTypeConfig>): Promise<LeaveTypeConfig> {
    return postData<LeaveTypeConfig>("/leave-settings", data);
  },

  updateLeaveType(code: string, data: Partial<LeaveTypeConfig>): Promise<LeaveTypeConfig> {
    return putData<LeaveTypeConfig>(`/leave-settings/${code}`, data);
  },

  deleteLeaveType(code: string): Promise<unknown> {
    return deleteData(`/leave-settings/${code}`);
  },

  toggleLeaveType(code: string): Promise<LeaveTypeConfig> {
    return patchData<LeaveTypeConfig>(`/leave-settings/${code}/toggle`);
  },

  // ── Leave Policy ────────────────────────────────────────────────────────────

  getLeavePolicy(): Promise<LeavePolicy> {
    return getData<LeavePolicy>("/leave-policy");
  },

  updateLeavePolicy(data: Partial<LeavePolicy>): Promise<LeavePolicy> {
    return putData<LeavePolicy>("/leave-policy", data);
  },
};
