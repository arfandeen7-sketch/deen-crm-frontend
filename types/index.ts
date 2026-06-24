// Domain types mirroring the DEEN CRM backend (Prisma schema + API contracts).

export type UserRole = "master" | "hr_manager" | "sales_manager" | "sales_executive";

export type EmploymentStatus = "active" | "on_leave" | "suspended" | "resigned" | "terminated";

export type BrokerStatus = "active" | "inactive" | "suspended";

export type LeadIngestionSource =
  | "facebook"
  | "instagram"
  | "google"
  | "property_finder"
  | "manual"
  | "import";

export type AttendanceStatus = "present" | "absent" | "half_day" | "late" | "leave" | "weekend" | "holiday";

export type LeaveType = "annual" | "sick" | "emergency" | "unpaid";

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export type PayrollStatus = "draft" | "generated" | "sent";

// Dynamic field categories (backend: dynamic_fields.category)
export type DynamicFieldCategory =
  | "source"
  | "project_name"
  | "project_type"
  | "payment_plan"
  | "configuration"
  | "location"
  | "handover_year"
  | "lead_priority"
  | "lead_status"
  | "department"
  | "designation"
  | "bank_name";

// ── User / Employee (single model — all users are employees) ─────────────────

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  profilePhoto?: string | null;
  role: UserRole;
  isActive: boolean;
  modules?: string[];
  moduleAccess?: string[] | null;
  moduleAccessOverridden?: boolean;
  // Employee fields
  employeeId?: string | null;
  department?: string | null;
  designation?: string | null;
  joiningDate?: string | null;
  basicSalary?: number | null;
  allowances?: number | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankIban?: string | null;
  leaveBalance?: LeaveBalance | null;
  employmentStatus?: EmploymentStatus | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  annual: number;
  sick: number;
  emergency: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface DynamicField {
  id: string;
  category: string;
  value: string;
  meta?: Record<string, unknown> | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Broker {
  id: string;
  brokerName: string;
  companyName?: string | null;
  mobileNumber: string;
  status: BrokerStatus;
  postedBy: string;
  createdAt: string;
  updatedAt: string;
  poster?: Pick<User, "id" | "fullName"> | null;
}

export interface Lead {
  id: string;
  leadName: string;
  leadDate: string;
  followUpDate?: string | null;
  projectName?: string | null;
  serviceType: string;
  mobileNumber: string;
  alternateMobile?: string | null;
  source: string;
  fbFormName?: string | null;
  email?: string | null;
  city?: string | null;
  locality?: string | null;
  unitNumber?: string | null;
  price?: string | null;
  propertySize?: string | null;
  projectType?: string | null;
  configuration?: string | null;
  comments?: string | null;
  leadStatus: string;
  leadPriority?: string | null;
  assignedTo?: string | null;
  brokerId?: string | null;
  isImported: boolean;
  isTouched: boolean;
  createdBy: string;
  ingestionSource: LeadIngestionSource;
  externalLeadId?: string | null;
  createdAt: string;
  updatedAt: string;
  assignedUser?: Pick<User, "id" | "fullName"> | null;
  creator?: Pick<User, "id" | "fullName"> | null;
  broker?: Pick<Broker, "id" | "brokerName"> | null;
  statusHistory?: LeadStatusHistory[];
}

export interface LeadStatusHistory {
  id: string;
  leadId: string;
  oldStatus?: string | null;
  newStatus: string;
  changedBy: string;
  changedAt: string;
  changer?: Pick<User, "id" | "fullName"> | null;
}

// ── HRMS: Attendance ─────────────────────────────────────────────────────────

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  checkInPhotoUrl?: string | null;
  checkOutPhotoUrl?: string | null;
  status: AttendanceStatus;
  totalWorkingHours?: number | null;
  isManualOverride?: boolean;
  overrideReason?: string | null;
  leaveType?: string | null;
  recordedBy?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, "id" | "fullName" | "role" | "department"> | null;
}

export interface AttendanceReport {
  records: AttendanceRecord[];
  summary: AttendanceSummary;
}

export interface AttendanceCheckPayload {
  photo: string; // base64 encoded image
}

export interface AttendanceSummary {
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;
  leaveDays: number;
  overtimeHours: number;
  totalWorkingDays: number;
}

// ── HRMS: Leave Management ───────────────────────────────────────────────────

export interface LeaveRequest {
  id: string;
  userId: string;
  leaveType: LeaveType;
  dateFrom: string;
  dateTo: string;
  totalDays: number;
  reason?: string | null;
  status: LeaveStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, "id" | "fullName" | "department"> | null;
  reviewer?: Pick<User, "id" | "fullName"> | null;
}

export interface LeaveApplyPayload {
  leaveType: LeaveType;
  dateFrom: string;
  dateTo: string;
  reason?: string;
}

// ── HRMS: Payroll ────────────────────────────────────────────────────────────

export interface PayrollRecord {
  id: string;
  userId: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  grossSalary: number;
  presentDays: number;
  halfDays: number;
  leaveDays: number;
  unpaidLeaveDays: number;
  latePenalty: number;
  deductions: number;
  leaveDeductions: number;
  overtime: number;
  overtimeAmount: number;
  netSalary: number;
  status: PayrollStatus;
  processedBy?: string | null;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, "id" | "fullName" | "department" | "designation" | "bankName" | "bankAccountNumber"> | null;
  processor?: Pick<User, "id" | "fullName"> | null;
}

export interface PayrollGeneratePayload {
  month: number;
  year: number;
  userIds?: string[];
}

export interface PayrollDashboard {
  totalEmployees: number;
  payrollPending: number;
  payrollProcessed: number;
  totalSalary: number;
}

// ── HRMS: Payslip ────────────────────────────────────────────────────────────

export interface Payslip {
  id: string;
  userId: string;
  month: number;
  year: number;
  basicSalary: string;
  allowances: string;
  presentDays: number;
  halfDays: number;
  approvedLeaveDays: number;
  unpaidLeaveDays: number;
  overtimeAmount: number;
  deductions: number;
  netSalary: number;
  status: PayrollStatus;
  pdfUrl?: string | null;
  generatedBy?: string | null;
  sentAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, "id" | "fullName" | "department" | "designation" | "employeeId" | "bankName" | "bankAccountNumber"> | null;
}

// ── HRMS: Email Configuration ────────────────────────────────────────────────

export interface SmtpConfig {
  id: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  encryption: "tls" | "ssl" | "none";
  fromName: string;
  fromEmail: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: "payslip" | "leave_approved" | "leave_rejected" | "welcome" | "custom";
  createdAt: string;
  updatedAt: string;
}

// ── HRMS: Login Activity ─────────────────────────────────────────────────────

export interface LoginActivity {
  id: string;
  userId: string;
  loginTime: string;
  logoutTime?: string | null;
  sessionDuration?: number | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  user?: Pick<User, "id" | "fullName" | "role"> | null;
}

// ── HRMS: HR Dashboard ───────────────────────────────────────────────────────

export interface HrDashboardSummary {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  loggedInUsers: number;
  pendingLeaves: number;
  payrollPending: number;
  payrollProcessed: number;
}

export interface EmployeeDashboard {
  todayStatus: AttendanceStatus | "not_checked_in";
  lastLoginTime?: string | null;
  currentMonthAttendance: AttendanceSummary;
  leaveBalance: LeaveBalance;
  latestPayslipMonth?: string | null;
}

// ── API envelope types (backend Section 9.3) ────────────────────────────────

export interface ApiSuccess<T> {
  data: T;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
}

// Dashboard responses
export interface DashboardSummary {
  sourceCounts: { source: string; count: number }[];
  totalLeads: number;
}

export interface StatusAnalytics {
  analytics: { status: string; leadCount: number; updateCount: number }[];
  windowHours: number;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

export interface UsersListResponse {
  users: User[];
  roleCounts: Record<UserRole, number>;
}

// Common list query params
export interface LeadQueryParams {
  page?: number;
  pageSize?: number;
  source?: string;
  status?: string;
  assignedTo?: string;
  serviceType?: string;
  projectName?: string;
  city?: string;
  locality?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  category?: "fresh" | "untouched" | "imported" | "assigned" | "unassigned";
  projectType?: string;
  configuration?: string;
}

// ── Lead Report types ────────────────────────────────────────────────────────

export interface LeadReportParams {
  dateFrom?: string;
  dateTo?: string;
  period?: "daily" | "weekly" | "monthly";
}

export interface LeadSourceReportItem {
  source: string;
  count: number;
  percentage: number;
}

export interface LeadStatusReportItem {
  status: string;
  count: number;
  percentage: number;
}

export interface LeadReportRow {
  groupKey: string;
  groupLabel: string;
  totalAssigned: number;
  touched: number;
  untouched: number;
  followedUp: number;
  missedFollowUps: number;
  statusBreakdown: Record<string, number>;
  lastActivityAt?: string | null;
}

export interface LeadReportResponse {
  groupBy: "user" | "source";
  rows: LeadReportRow[];
}

export interface UserPerformanceItem {
  userId: string;
  fullName: string;
  assigned: number;
  touched: number;
  untouched: number;
  followedUp: number;
  missedFollowUps: number;
  statusBreakdown: Record<string, number>;
  lastActivityAt?: string | null;
}

export interface LeadTimeSeriesItem {
  date: string;
  count: number;
}

// ── Lead Activity ────────────────────────────────────────────────────────────

export type LeadActivityAction =
  | "created"
  | "status_changed"
  | "comment_added"
  | "followup_scheduled"
  | "assigned"
  | "field_updated"
  | "imported";

export interface LeadActivity {
  id: string;
  leadId: string;
  actorId: string;
  action: LeadActivityAction;
  metadata: Record<string, unknown>;
  createdAt: string;
  actor?: Pick<User, "id" | "fullName"> | null;
}

// ── App Notifications ────────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  leadId?: string | null;
  isRead: boolean;
  createdAt: string;
}
