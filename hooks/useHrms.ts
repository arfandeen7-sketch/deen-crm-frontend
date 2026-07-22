"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { employeeService, type EmployeeInput, type EmployeeQuery } from "@/services/hr/hr.service";
import { attendanceService, type AttendanceQuery, type ReportQuery } from "@/services/attendance/attendance.service";
import { regularizationService, type RegularizationQuery } from "@/services/hrms/regularization.service";
import { leaveService, type LeaveQuery } from "@/services/hrms/leave.service";
import type { LeaveTypeConfig, LeavePolicy, LeaveAudit, LeaveCalendarDay, EmployeeLeaveDashboard, HrLeaveDashboard, LeaveReportRow, LeaveBalanceEntry, LeaveBalanceAllRow, AdjustBalancePayload } from "@/types";
import { payrollService, type PayrollPreviewParams } from "@/services/hrms/payroll.service";
import { payslipService, type PayslipQuery } from "@/services/hrms/payslip.service";
import { emailService, type SmtpConfigInput, type EmailTemplateInput } from "@/services/hrms/email.service";
import { loginActivityService, type LoginActivityQuery } from "@/services/hrms/login-activity.service";
import { hrReportsService, type HrReportQuery, type HrReportType } from "@/services/hrms/hr-reports.service";
import type {
  AttendanceCheckPayload,
  EmploymentStatus,
  LeaveApplyPayload,
  LeaveStatus,
  RegularizationApplyPayload,
  RegularizationReviewPayload,
} from "@/types";
import type { ManualAttendanceInput } from "@/services/attendance/attendance.service";
import { POLL_FAST, POLL_SLOW } from "@/constants";

// ── Employee Hooks ───────────────────────────────────────────────────────────

export function useEmployeeList(params: EmployeeQuery) {
  return useQuery({
    queryKey: ["employees", "list", params],
    queryFn: () => employeeService.list(params),
    refetchInterval: POLL_SLOW,
  });
}

export function useEmployee(id: string | undefined) {
  return useQuery({
    queryKey: ["employees", "detail", id],
    queryFn: () => employeeService.get(id as string),
    enabled: !!id,
    refetchInterval: POLL_SLOW,
  });
}

export function useEmployeeMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["employees"] });

  const create = useMutation({
    mutationFn: (body: EmployeeInput) => employeeService.create(body),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<EmployeeInput> }) =>
      employeeService.update(id, body),
    onSuccess: invalidate,
  });
  const patchStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: EmploymentStatus }) =>
      employeeService.patchStatus(id, status),
    onSuccess: invalidate,
  });

  return { create, update, patchStatus };
}

// ── Attendance Hooks ─────────────────────────────────────────────────────────

export function useAttendanceList(params: AttendanceQuery) {
  return useQuery({
    queryKey: ["attendance", "list", params],
    queryFn: () => attendanceService.list(params),
    refetchInterval: POLL_FAST,
  });
}

export function useMyAttendance(params: Omit<AttendanceQuery, "userId"> = {}) {
  return useQuery({
    queryKey: ["attendance", "my-list", params],
    queryFn: () => attendanceService.myList(params),
    refetchInterval: POLL_FAST,
  });
}

export function useTodayAttendance() {
  return useQuery({
    queryKey: ["attendance", "today"],
    queryFn: () => attendanceService.today(),
    refetchInterval: POLL_FAST,
  });
}

export function useAttendanceGet(id: string | null | undefined) {
  return useQuery({
    queryKey: ["attendance", "detail", id],
    queryFn: () => attendanceService.get(id as string),
    enabled: !!id,
  });
}

export function useAttendanceUserSummary(userId: string, params: { month: number; year: number }) {
  return useQuery({
    queryKey: ["attendance", "user-summary", userId, params],
    queryFn: () => attendanceService.userSummary(userId, params),
    enabled: !!userId,
    refetchInterval: POLL_SLOW,
  });
}

export function useAttendanceCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AttendanceCheckPayload) => attendanceService.checkIn(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"] }),
  });
}

export function useAttendanceCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AttendanceCheckPayload) => attendanceService.checkOut(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"] }),
  });
}

export function useAttendanceConfig() {
  return useQuery({
    queryKey: ["attendance", "config"],
    queryFn: () => attendanceService.getConfig(),
    refetchInterval: POLL_SLOW,
  });
}

export function useUpdateAttendanceConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<import("@/types").AttendanceConfig>) => attendanceService.updateConfig(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance", "config"] }),
  });
}

// ── Leave Hooks ──────────────────────────────────────────────────────────────

export function useLeaveList(params: LeaveQuery) {
  return useQuery({
    queryKey: ["leave", "list", params],
    queryFn: () => leaveService.list(params),
    refetchInterval: POLL_SLOW,
  });
}

export function useMyLeaves(params: Omit<LeaveQuery, "userId"> = {}) {
  return useQuery({
    queryKey: ["leave", "my-list", params],
    queryFn: () => leaveService.myList(params),
    refetchInterval: POLL_SLOW,
  });
}

export function useLeaveRequest(id: string | undefined) {
  return useQuery({
    queryKey: ["leave", "detail", id],
    queryFn: () => leaveService.get(id as string),
    enabled: !!id,
    refetchInterval: POLL_SLOW,
  });
}

export function useLeaveBalance(userId?: string, year?: number) {
  return useQuery({
    queryKey: ["leave", "balance", userId, year],
    queryFn: () => leaveService.getBalance(userId, year),
    refetchInterval: POLL_SLOW,
  });
}

export function useLeaveBalanceAll(year: number) {
  return useQuery({
    queryKey: ["leave", "balance-all", year],
    queryFn: () => leaveService.getBalanceAll(year),
    refetchInterval: POLL_SLOW,
  });
}

export function useLeaveCalendar(month: number, year: number, userId?: string) {
  return useQuery({
    queryKey: ["leave", "calendar", month, year, userId],
    queryFn: () => leaveService.getCalendar(month, year, userId),
    staleTime: 60_000,
  });
}

export function useLeaveReports(month: number, year: number) {
  return useQuery({
    queryKey: ["leave", "reports", month, year],
    queryFn: () => leaveService.getReports(month, year),
    staleTime: 5 * 60_000,
  });
}

export function useLeaveDashboard() {
  return useQuery({
    queryKey: ["leave", "employee-dashboard"],
    queryFn: () => leaveService.getEmployeeDashboard(),
    refetchInterval: POLL_SLOW,
  });
}

export function useLeaveHrDashboard() {
  return useQuery({
    queryKey: ["leave", "hr-dashboard"],
    queryFn: () => leaveService.getHrDashboard(),
    refetchInterval: POLL_SLOW,
  });
}

export function useLeaveAudits(requestId: string | undefined) {
  return useQuery({
    queryKey: ["leave", "audits", requestId],
    queryFn: () => leaveService.getAudits(requestId as string),
    enabled: !!requestId,
    staleTime: 60_000,
  });
}

export function useLeaveTypes(activeOnly = true) {
  return useQuery({
    queryKey: ["leave", "types", { activeOnly }],
    queryFn: () => leaveService.getLeaveTypes(activeOnly),
    staleTime: 2 * 60_000,
  });
}

export function useLeavePolicy() {
  return useQuery({
    queryKey: ["leave", "policy"],
    queryFn: () => leaveService.getLeavePolicy(),
    staleTime: 2 * 60_000,
  });
}

export function useApplyLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LeaveApplyPayload) => leaveService.apply(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leave"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useApplyLeaveWithAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => leaveService.applyWithAttachment(formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leave"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useReviewLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reviewNote }: { id: string; status: Extract<LeaveStatus, "approved" | "rejected">; reviewNote?: string }) =>
      leaveService.review(id, status, reviewNote),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leave"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useCancelLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, cancellationReason }: { id: string; cancellationReason?: string }) =>
      leaveService.cancel(id, cancellationReason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leave"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useAdjustBalance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: AdjustBalancePayload) => leaveService.adjustBalance(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leave", "balance"] });
      qc.invalidateQueries({ queryKey: ["leave", "balance-all"] });
    },
  });
}

export function useCreateLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LeaveTypeConfig>) => leaveService.createLeaveType(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave", "types"] }),
  });
}

export function useUpdateLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ code, data }: { code: string; data: Partial<LeaveTypeConfig> }) =>
      leaveService.updateLeaveType(code, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave", "types"] }),
  });
}

export function useDeleteLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => leaveService.deleteLeaveType(code),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave", "types"] }),
  });
}

export function useToggleLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => leaveService.toggleLeaveType(code),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave", "types"] }),
  });
}

export function useUpdateLeavePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LeavePolicy>) => leaveService.updateLeavePolicy(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave", "policy"] }),
  });
}

// ── Payroll Hooks ────────────────────────────────────────────────────────────

export function usePayrollPreview(params: PayrollPreviewParams, enabled = true) {
  return useQuery({
    queryKey: ["payroll", "preview", params],
    queryFn: () => payrollService.preview(params),
    enabled,
  });
}

export function useCalculatePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PayrollPreviewParams) => payrollService.calculate(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payslips"] }),
  });
}

// ── Payslip Hooks ────────────────────────────────────────────────────────────

export function usePayslipList(params: PayslipQuery) {
  return useQuery({
    queryKey: ["payslips", "list", params],
    queryFn: () => payslipService.list(params),
    refetchInterval: POLL_SLOW,
  });
}

export function useMyPayslips(params: Omit<PayslipQuery, "userId"> = {}) {
  return useQuery({
    queryKey: ["payslips", "my-list", params],
    queryFn: () => payslipService.myList(params),
    refetchInterval: POLL_SLOW,
  });
}

export function usePayslip(id: string | undefined) {
  return useQuery({
    queryKey: ["payslips", "detail", id],
    queryFn: () => payslipService.get(id as string),
    enabled: !!id,
    refetchInterval: POLL_SLOW,
  });
}

export function useGeneratePayslipPdf() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => payslipService.generatePdf(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payslips"] }),
  });
}

export function useSendPayslip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => payslipService.send(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payslips"] }),
  });
}

export function useSendBulkPayslips() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ month, year }: { month: number; year: number }) =>
      payslipService.sendBulk(month, year),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payslips"] }),
  });
}

// ── Email Configuration Hooks ────────────────────────────────────────────────

export function useSmtpConfig() {
  return useQuery({
    queryKey: ["email", "smtp"],
    queryFn: () => emailService.getSmtpConfig(),
  });
}

export function useSaveSmtpConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SmtpConfigInput) => emailService.saveSmtpConfig(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email", "smtp"] }),
  });
}

export function useTestSmtp() {
  return useMutation({
    mutationFn: (email: string) => emailService.testSmtp(email),
  });
}

export function useEmailTemplates() {
  return useQuery({
    queryKey: ["email", "templates"],
    queryFn: () => emailService.listTemplates(),
  });
}

export function useEmailTemplateMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["email", "templates"] });

  const create = useMutation({
    mutationFn: (body: EmailTemplateInput) => emailService.createTemplate(body),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<EmailTemplateInput> }) =>
      emailService.updateTemplate(id, body),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => emailService.deleteTemplate(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

// ── Login Activity Hooks ─────────────────────────────────────────────────────

export function useLoginActivityList(params: LoginActivityQuery) {
  return useQuery({
    queryKey: ["login-activity", "list", params],
    queryFn: () => loginActivityService.list(params),
    refetchInterval: POLL_SLOW,
  });
}

// ── HR Reports Hooks ─────────────────────────────────────────────────────────

export function useHrReport(type: HrReportType, params: HrReportQuery = {}) {
  return useQuery({
    queryKey: ["hr-reports", type, params],
    queryFn: () => hrReportsService.getReport(type, params),
    enabled: !!type,
    refetchInterval: POLL_SLOW,
  });
}

// ── Attendance Calendar ───────────────────────────────────────────────────────

export function useAttendanceCalendar(params: { month: number; year: number; userId?: string }) {
  return useQuery({
    queryKey: ["attendance", "calendar", params],
    queryFn: () => attendanceService.calendar(params),
    staleTime: 5 * 60 * 1000,
  });
}

// ── Attendance Dashboard ──────────────────────────────────────────────────────

export function useAttendanceDashboard() {
  return useQuery({
    queryKey: ["attendance", "dashboard"],
    queryFn: () => attendanceService.dashboard(),
    refetchInterval: 2 * 60 * 1000,
    staleTime: 30_000,
  });
}

// ── Attendance Reports ────────────────────────────────────────────────────────

export function useDailyReport(params: ReportQuery, enabled = true) {
  return useQuery({
    queryKey: ["attendance", "reports", "daily", params],
    queryFn: () => attendanceService.dailyReport(params),
    enabled,
    staleTime: 60_000,
  });
}

export function useDepartmentReport(params: ReportQuery, enabled = true) {
  return useQuery({
    queryKey: ["attendance", "reports", "department", params],
    queryFn: () => attendanceService.departmentReport(params),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLateReport(params: ReportQuery) {
  return useQuery({
    queryKey: ["attendance", "reports", "late", params],
    queryFn: () => attendanceService.lateReport(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAbsentReport(params: ReportQuery) {
  return useQuery({
    queryKey: ["attendance", "reports", "absent", params],
    queryFn: () => attendanceService.absentReport(params),
    staleTime: 5 * 60 * 1000,
  });
}

// ── Manual Attendance ─────────────────────────────────────────────────────────

export function useManualAttendance() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["attendance"] });
  const create = useMutation({
    mutationFn: (body: ManualAttendanceInput) => attendanceService.manualCreate(body),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<ManualAttendanceInput> & { overrideReason: string } }) =>
      attendanceService.override(id, body),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => attendanceService.remove(id),
    onSuccess: invalidate,
  });
  return { create, update, remove };
}

// ── Audit Log ─────────────────────────────────────────────────────────────────

export function useAttendanceAuditLog(id: string | undefined) {
  return useQuery({
    queryKey: ["attendance", "audit", id],
    queryFn: () => attendanceService.auditLog(id as string),
    enabled: !!id,
    staleTime: 60_000,
  });
}

// ── Regularization ────────────────────────────────────────────────────────────

export interface RegularizationApplyFormData {
  date: string;
  requestType: import("@/types").RequestType;
  attendanceId?: string;
  currentStatus?: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  reason: string;
  attachment?: File;
}

export function useRegularizationList(params: RegularizationQuery) {
  return useQuery({
    queryKey: ["regularization", "list", params],
    queryFn: () => regularizationService.list(params),
    staleTime: 30_000,
    refetchInterval: POLL_SLOW,
  });
}

export function useRegularizationGet(id: string | null | undefined) {
  return useQuery({
    queryKey: ["regularization", "detail", id],
    queryFn: () => regularizationService.get(id as string),
    enabled: !!id,
  });
}

export function useApplyRegularization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RegularizationApplyPayload) => regularizationService.apply(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["regularization"] });
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useApplyRegularizationWithAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RegularizationApplyFormData) => regularizationService.applyWithAttachment(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["regularization"] });
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useReviewRegularization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: RegularizationReviewPayload }) =>
      regularizationService.review(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["regularization"] });
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
