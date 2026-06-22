"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { employeeService, type EmployeeInput, type EmployeeQuery } from "@/services/hr/hr.service";
import { attendanceService, type AttendanceQuery } from "@/services/attendance/attendance.service";
import { leaveService, type LeaveQuery } from "@/services/hrms/leave.service";
import { payrollService, type PayrollPreviewParams } from "@/services/hrms/payroll.service";
import { payslipService, type PayslipQuery } from "@/services/hrms/payslip.service";
import { emailService, type SmtpConfigInput, type EmailTemplateInput } from "@/services/hrms/email.service";
import { loginActivityService, type LoginActivityQuery } from "@/services/hrms/login-activity.service";
import { hrReportsService, type HrReportQuery, type HrReportType } from "@/services/hrms/hr-reports.service";
import type { AttendanceCheckPayload, EmploymentStatus, LeaveApplyPayload, LeaveStatus } from "@/types";

// ── Employee Hooks ───────────────────────────────────────────────────────────

export function useEmployeeList(params: EmployeeQuery) {
  return useQuery({
    queryKey: ["employees", "list", params],
    queryFn: () => employeeService.list(params),
  });
}

export function useEmployee(id: string | undefined) {
  return useQuery({
    queryKey: ["employees", "detail", id],
    queryFn: () => employeeService.get(id as string),
    enabled: !!id,
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
  });
}

export function useMyAttendance(params: Omit<AttendanceQuery, "userId"> = {}) {
  return useQuery({
    queryKey: ["attendance", "my-list", params],
    queryFn: () => attendanceService.myList(params),
  });
}

export function useTodayAttendance() {
  return useQuery({
    queryKey: ["attendance", "today"],
    queryFn: () => attendanceService.today(),
  });
}

export function useAttendanceUserSummary(userId: string, params: { month: number; year: number }) {
  return useQuery({
    queryKey: ["attendance", "user-summary", userId, params],
    queryFn: () => attendanceService.userSummary(userId, params),
    enabled: !!userId,
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

// ── Leave Hooks ──────────────────────────────────────────────────────────────

export function useLeaveList(params: LeaveQuery) {
  return useQuery({
    queryKey: ["leave", "list", params],
    queryFn: () => leaveService.list(params),
  });
}

export function useMyLeaves(params: Omit<LeaveQuery, "userId"> = {}) {
  return useQuery({
    queryKey: ["leave", "my-list", params],
    queryFn: () => leaveService.myList(params),
  });
}

export function useLeaveBalance(userId?: string) {
  return useQuery({
    queryKey: ["leave", "balance", userId],
    queryFn: () => leaveService.balance(userId),
  });
}

export function useApplyLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LeaveApplyPayload) => leaveService.apply(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave"] }),
  });
}

export function useReviewLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reviewNote }: { id: string; status: Extract<LeaveStatus, "approved" | "rejected">; reviewNote?: string }) =>
      leaveService.review(id, status, reviewNote),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave"] }),
  });
}

export function useCancelLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leaveService.cancel(id),
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

// ── Payslip Hooks ────────────────────────────────────────────────────────────

export function usePayslipList(params: PayslipQuery) {
  return useQuery({
    queryKey: ["payslips", "list", params],
    queryFn: () => payslipService.list(params),
  });
}

export function useMyPayslips(params: Omit<PayslipQuery, "userId"> = {}) {
  return useQuery({
    queryKey: ["payslips", "my-list", params],
    queryFn: () => payslipService.myList(params),
  });
}

export function usePayslip(id: string | undefined) {
  return useQuery({
    queryKey: ["payslips", "detail", id],
    queryFn: () => payslipService.get(id as string),
    enabled: !!id,
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
  });
}

// ── HR Reports Hooks ─────────────────────────────────────────────────────────

export function useHrReport(type: HrReportType, params: HrReportQuery = {}) {
  return useQuery({
    queryKey: ["hr-reports", type, params],
    queryFn: () => hrReportsService.getReport(type, params),
    enabled: !!type,
  });
}
