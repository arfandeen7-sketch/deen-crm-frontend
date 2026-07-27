"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { employeeService, type EmployeeInput, type EmployeeQuery } from "@/services/hr/hr.service";
import { attendanceService, type AttendanceQuery } from "@/services/attendance/attendance.service";
import { leaveService, type LeaveQuery } from "@/services/hrms/leave.service";
import { leaveTypeService } from "@/services/hrms/leaveType.service";
import { holidayService } from "@/services/hrms/holiday.service";
import { payrollService, type PayrollPreviewParams } from "@/services/hrms/payroll.service";
import { payslipService, type PayslipQuery } from "@/services/hrms/payslip.service";
import { emailService, type SmtpConfigInput, type EmailTemplateInput } from "@/services/hrms/email.service";
import { loginActivityService, type LoginActivityQuery } from "@/services/hrms/login-activity.service";
import { hrReportsService, type HrReportQuery, type HrReportType } from "@/services/hrms/hr-reports.service";
import type { AttendanceCheckPayload, EmploymentStatus, LeaveApplyPayload, LeaveStatus } from "@/types";
import { POLL_FAST, POLL_SLOW } from "@/constants";
import { useQueryEnabled, retrySkipAuth } from "@/lib/query-gate";
import { QUERY_REQUIREMENTS } from "@/lib/auth-manifest";

// ── Employee Hooks ───────────────────────────────────────────────────────────

export function useEmployeeList(params: EmployeeQuery) {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["hrms:employees"]);
  return useQuery({
    queryKey: ["employees", "list", params],
    queryFn: () => employeeService.list(params),
    enabled,
    refetchInterval: enabled ? POLL_SLOW : false,
    retry: retrySkipAuth,
  });
}

export function useEmployee(id: string | undefined) {
  const hasPermission = useQueryEnabled(QUERY_REQUIREMENTS["hrms:employees"]);
  const enabled = !!id && hasPermission;
  return useQuery({
    queryKey: ["employees", "detail", id],
    queryFn: () => employeeService.get(id as string),
    enabled,
    refetchInterval: enabled ? POLL_SLOW : false,
    retry: retrySkipAuth,
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
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["hrms:attendance"]);
  return useQuery({
    queryKey: ["attendance", "list", params],
    queryFn: () => attendanceService.list(params),
    enabled,
    refetchInterval: enabled ? POLL_FAST : false,
    retry: retrySkipAuth,
  });
}

export function useMyAttendance(params: Omit<AttendanceQuery, "userId"> = {}) {
  const enabled = useQueryEnabled("hrms:my-attendance");
  return useQuery({
    queryKey: ["attendance", "my-list", params],
    queryFn: () => attendanceService.myList(params),
    enabled,
    refetchInterval: enabled ? POLL_FAST : false,
    retry: retrySkipAuth,
  });
}

export function useTodayAttendance() {
  const enabled = useQueryEnabled("hrms:my-attendance");
  return useQuery({
    queryKey: ["attendance", "today"],
    queryFn: () => attendanceService.today(),
    enabled,
    refetchInterval: enabled ? POLL_FAST : false,
    retry: retrySkipAuth,
  });
}

export function useAttendanceUserSummary(userId: string, params: { month: number; year: number }, enabled = true) {
  const hasPermission = useQueryEnabled(QUERY_REQUIREMENTS["hrms:attendance"]);
  return useQuery({
    queryKey: ["attendance", "user-summary", userId, params],
    queryFn: () => attendanceService.userSummary(userId, params),
    enabled: !!userId && enabled && hasPermission,
    refetchInterval: hasPermission ? POLL_SLOW : false,
    retry: retrySkipAuth,
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
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["hrms:attendance"]);
  return useQuery({
    queryKey: ["attendance", "config"],
    queryFn: () => attendanceService.getConfig(),
    enabled,
    refetchInterval: enabled ? POLL_SLOW : false,
    retry: retrySkipAuth,
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
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["hrms:leave"]);
  return useQuery({
    queryKey: ["leave", "list", params],
    queryFn: () => leaveService.list(params),
    enabled,
    refetchInterval: enabled ? POLL_SLOW : false,
    retry: retrySkipAuth,
  });
}

export function useMyLeaves(params: Omit<LeaveQuery, "userId"> = {}) {
  const enabled = useQueryEnabled("hrms:my-leaves");
  return useQuery({
    queryKey: ["leave", "my-list", params],
    queryFn: () => leaveService.myList(params),
    enabled,
    refetchInterval: enabled ? POLL_SLOW : false,
    retry: retrySkipAuth,
  });
}

export function useLeaveBalance(userId?: string) {
  const enabled = useQueryEnabled("hrms:my-leaves");
  return useQuery({
    queryKey: ["leave", "balance", userId],
    queryFn: () => leaveService.balance(userId),
    enabled,
    refetchInterval: enabled ? POLL_SLOW : false,
    retry: retrySkipAuth,
  });
}

export function useApplyLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ body, file }: { body: LeaveApplyPayload; file?: File }) => leaveService.apply(body, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leave"] });
      qc.invalidateQueries({ queryKey: ["team-calendar"] });
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
      qc.invalidateQueries({ queryKey: ["team-calendar"] });
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
      qc.invalidateQueries({ queryKey: ["team-calendar"] });
    },
  });
}

// ── Leave Type Config Hooks ──────────────────────────────────────────────────

export function useLeaveTypeList() {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["hrms:leave_types"] ?? "hrms:leave");
  return useQuery({
    queryKey: ["leave-types", "list"],
    queryFn: () => leaveTypeService.list(),
    enabled,
    refetchInterval: enabled ? POLL_SLOW : false,
    retry: retrySkipAuth,
  });
}

export function useMyLeaveTypes() {
  const enabled = useQueryEnabled("hrms:my-leaves");
  return useQuery({
    queryKey: ["leave-types", "my"],
    queryFn: () => leaveTypeService.listForEmployee(),
    enabled,
    refetchInterval: enabled ? POLL_SLOW : false,
    retry: retrySkipAuth,
  });
}

export function useLeaveTypeMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["leave-types"] });

  const create = useMutation({
    mutationFn: (body: Partial<import("@/types").LeaveTypeConfig>) => leaveTypeService.create(body),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<import("@/types").LeaveTypeConfig> }) =>
      leaveTypeService.update(id, body),
    onSuccess: invalidate,
  });
  const deactivate = useMutation({
    mutationFn: (id: string) => leaveTypeService.deactivate(id),
    onSuccess: invalidate,
  });
  const activate = useMutation({
    mutationFn: (id: string) => leaveTypeService.activate(id),
    onSuccess: invalidate,
  });

  return { create, update, deactivate, activate };
}

// ── Holiday Hooks ────────────────────────────────────────────────────────────

export function useHolidayList(year?: number) {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["hrms:leave_holidays"] ?? "hrms:leave");
  return useQuery({
    queryKey: ["holidays", "list", year],
    queryFn: () => holidayService.listAll(year),
    enabled,
    refetchInterval: enabled ? POLL_SLOW : false,
    retry: retrySkipAuth,
  });
}

export function useMyHolidays(year?: number) {
  const enabled = useQueryEnabled("hrms:my-leaves");
  return useQuery({
    queryKey: ["holidays", "my", year],
    queryFn: () => holidayService.list(year),
    enabled,
    refetchInterval: enabled ? POLL_SLOW : false,
    retry: retrySkipAuth,
  });
}

export function useHolidayMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["holidays"] });
    qc.invalidateQueries({ queryKey: ["team-calendar"] });
  };

  const create = useMutation({
    mutationFn: (body: { name: string; date: string; isRecurring?: boolean }) => holidayService.create(body),
    onSuccess: invalidate,
  });
  const bulkCreate = useMutation({
    mutationFn: (holidays: Array<{ name: string; date: string; isRecurring?: boolean }>) => holidayService.bulkCreate(holidays),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => holidayService.remove(id),
    onSuccess: invalidate,
  });

  return { create, bulkCreate, remove };
}

export function useTeamCalendar(year: number, month: number) {
  const enabled = useQueryEnabled("hrms:team-calendar");
  return useQuery({
    queryKey: ["team-calendar", year, month],
    queryFn: () => holidayService.teamCalendar(year, month),
    enabled,
    refetchInterval: enabled ? POLL_SLOW : false,
    retry: retrySkipAuth,
  });
}

// ── Leave Balance / Allocation Hooks ─────────────────────────────────────────

export function useAllBalances(year?: number) {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["hrms:leave"]);
  return useQuery({
    queryKey: ["leave", "all-balances", year],
    queryFn: () => leaveService.getAllBalances(year),
    enabled,
    refetchInterval: enabled ? POLL_SLOW : false,
    retry: retrySkipAuth,
  });
}

export function useUserBalances(userId: string | undefined, year?: number) {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["hrms:leave"]) && !!userId;
  return useQuery({
    queryKey: ["leave", "user-balances", userId, year],
    queryFn: () => leaveService.getUserBalances(userId as string, year),
    enabled,
    refetchInterval: enabled ? POLL_SLOW : false,
    retry: retrySkipAuth,
  });
}

export function useAllocateLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: import("@/types").LeaveAllocatePayload) => leaveService.allocate(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave"] }),
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

export function useRunMonthlyPayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ month, year }: { month?: number; year?: number }) =>
      payrollService.runMonthly(month, year),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payslips"] }),
  });
}

// ── Payslip Hooks ────────────────────────────────────────────────────────────

export function usePayslipList(params: PayslipQuery) {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["hrms:payslips"]);
  return useQuery({
    queryKey: ["payslips", "list", params],
    queryFn: () => payslipService.list(params),
    enabled,
    refetchInterval: enabled ? POLL_SLOW : false,
    retry: retrySkipAuth,
  });
}

export function useMyPayslips(params: Omit<PayslipQuery, "userId"> = {}) {
  const enabled = useQueryEnabled("hrms:my-payslips");
  return useQuery({
    queryKey: ["payslips", "my-list", params],
    queryFn: () => payslipService.myList(params),
    enabled,
    refetchInterval: enabled ? POLL_SLOW : false,
    retry: retrySkipAuth,
  });
}

export function usePayslip(id: string | undefined) {
  const hasPermission = useQueryEnabled(QUERY_REQUIREMENTS["hrms:payslips"]);
  const enabled = !!id && hasPermission;
  return useQuery({
    queryKey: ["payslips", "detail", id],
    queryFn: () => payslipService.get(id as string),
    enabled,
    refetchInterval: enabled ? POLL_SLOW : false,
    retry: retrySkipAuth,
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
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["hrms:login-activity"]);
  return useQuery({
    queryKey: ["login-activity", "list", params],
    queryFn: () => loginActivityService.list(params),
    enabled,
    refetchInterval: enabled ? POLL_SLOW : false,
    retry: retrySkipAuth,
  });
}

// ── HR Reports Hooks ─────────────────────────────────────────────────────────

export function useHrReport(type: HrReportType, params: HrReportQuery = {}) {
  const hasPermission = useQueryEnabled(QUERY_REQUIREMENTS["hrms:reports"]);
  const enabled = !!type && hasPermission;
  return useQuery({
    queryKey: ["hr-reports", type, params],
    queryFn: () => hrReportsService.getReport(type, params),
    enabled,
    refetchInterval: enabled ? POLL_SLOW : false,
    retry: retrySkipAuth,
  });
}
