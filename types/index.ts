// Domain types mirroring the DEEN CRM backend (Prisma schema + API contracts).

import type { PropertyDetail } from "@/services/properties/properties.service";

export type UserRole = "master" | "hr_manager" | "sales_manager" | "sales_executive";

// ── 3-Level Permission System (Module → Page → Action) ──────────────────────

export interface AccessMap {
  isMaster: boolean;
  modules: string[];
  pages: Record<string, string[]>;
  actions: Record<string, string[]>;
}

export interface RegistryAction {
  key: string;
  label: string;
  sortOrder: number;
}

export interface RegistryPage {
  key: string;
  label: string;
  sortOrder: number;
  actions: RegistryAction[];
}

export interface RegistryModule {
  key: string;
  label: string;
  icon: string;
  sortOrder: number;
  pages: RegistryPage[];
}

export interface GrantEntry {
  moduleKey: string;
  pageKey: string;
  actionKey: string;
  granted: boolean;
}

export interface PermissionGrants {
  userId: string;
  fullName: string;
  role: string;
  isMasterUser: boolean;
  grants: GrantEntry[];
  registry: RegistryModule[];
}

export interface RolePresetGrant {
  moduleKey: string;
  pageKey: string;
  actionKey: string;
}

export type RolePresets = Record<Exclude<UserRole, "master">, RolePresetGrant[]>;

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

export type LeaveStatus = "pending" | "hr_approved" | "approved" | "rejected" | "cancelled";

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
  // Team hierarchy fields
  managerId?: string | null;
  manager?: Pick<User, "id" | "fullName"> | null;
  teamMembers?: Pick<User, "id" | "fullName" | "email" | "role">[];
  _count?: {
    teamMembers?: number;
  };
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
  lastName?: string | null;
  leadDate: string;
  followUpDate?: string | null;
  followUpNote?: string | null;
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
  // assignedBy = user who performed the latest assignment (the assigner).
  // assignedAt = timestamp of the latest assignment. Independent from createdBy.
  assignedBy?: string | null;
  assignedAt?: string | null;
  brokerId?: string | null;
  isImported: boolean;
  isTouched: boolean;
  // Total number of assignment events recorded in LeadActivity (action='assigned').
  // Powers the "(+N more)" indicator in the Assignment History column.
  assignmentCount?: number;
  createdBy: string;
  ingestionSource: LeadIngestionSource;
  externalLeadId?: string | null;
  responseLink?: string | null;
  createdAt: string;
  updatedAt: string;
  assignedUser?: Pick<User, "id" | "fullName"> | null;
  assignedByUser?: Pick<User, "id" | "fullName"> | null;
  creator?: Pick<User, "id" | "fullName"> | null;
  broker?: Pick<Broker, "id" | "brokerName"> | null;
  statusHistory?: LeadStatusHistory[];
  client?: Client | null;
  // Property Finder enrichment fields
  pfPropertyTitle?: string | null;
  pfPropertyReference?: string | null;
  pfListingId?: string | null;
  pfPropertyCategory?: string | null;
  pfOfferingType?: string | null;
  pfPropertyType?: string | null;
  pfCurrency?: string | null;
  pfBedrooms?: string | null;
  pfBathrooms?: string | null;
  pfFurnishedStatus?: string | null;
  pfCompletionStatus?: string | null;
  pfCommunityName?: string | null;
  pfBuildingName?: string | null;
  pfEmirate?: string | null;
  pfListingStatus?: string | null;
  pfAgentName?: string | null;
  pfAgencyName?: string | null;
  pfPermitNumber?: string | null;
  pfChannel?: string | null;
  pfLeadStatus?: string | null;
  pfEntityType?: string | null;
  pfPublicProfileId?: string | null;
  pfTags?: string | null;
  /** User-defined field values, keyed by CustomField.key. */
  customFields?: Record<string, string> | null;
}

// ── Client Details ────────────────────────────────────────────────────────────

export interface Client {
  id: string;
  leadId: string;
  // Personal info
  fullName?: string | null;
  mobileNumber?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  // Identity document numbers
  passportNumber?: string | null;
  emiratesIdNumber?: string | null;
  // Passport document metadata
  passportFilePath?: string | null;
  passportFileName?: string | null;
  passportMimeType?: string | null;
  passportUploadedAt?: string | null;
  passportUploadedBy?: string | null;
  // Emirates ID document metadata
  emiratesIdFilePath?: string | null;
  emiratesIdFileName?: string | null;
  emiratesIdMimeType?: string | null;
  emiratesIdUploadedAt?: string | null;
  emiratesIdUploadedBy?: string | null;
  // Signed download URLs (generated per-request, not stored)
  passportUrl?: string | null;
  emiratesIdUrl?: string | null;
  // Audit
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  lead?: Pick<Lead, "id" | "leadName" | "leadStatus"> & {
    assignedUser?: Pick<User, "id" | "fullName"> | null;
    creator?: Pick<User, "id" | "fullName"> | null;
    sale?: { amount: number; closedAt: string } | null;
  } | null;
  creator?: Pick<User, "id" | "fullName"> | null;
  passportUploader?: Pick<User, "id" | "fullName"> | null;
  emiratesUploader?: Pick<User, "id" | "fullName"> | null;
}

// ── Tenant Details ────────────────────────────────────────────────────────────

export interface Tenant {
  id: string;
  leadId: string;
  // Personal info
  fullName?: string | null;
  mobileNumber?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  // Identity document numbers
  passportNumber?: string | null;
  emiratesIdNumber?: string | null;
  // Tenancy agreement
  agreementStartDate?: string | null;
  agreementEndDate?: string | null;
  // Passport document metadata
  passportFilePath?: string | null;
  passportFileName?: string | null;
  passportMimeType?: string | null;
  passportUploadedAt?: string | null;
  passportUploadedBy?: string | null;
  // Emirates ID document metadata
  emiratesIdFilePath?: string | null;
  emiratesIdFileName?: string | null;
  emiratesIdMimeType?: string | null;
  emiratesIdUploadedAt?: string | null;
  emiratesIdUploadedBy?: string | null;
  // Tenant agreement document metadata
  agreementFilePath?: string | null;
  agreementFileName?: string | null;
  agreementMimeType?: string | null;
  agreementUploadedAt?: string | null;
  agreementUploadedBy?: string | null;
  // Signed download URLs (generated per-request, not stored)
  passportUrl?: string | null;
  emiratesIdUrl?: string | null;
  agreementUrl?: string | null;
  // Audit
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  lead?: Pick<Lead, "id" | "leadName" | "leadStatus" | "serviceType" | "projectName"> & {
    assignedUser?: Pick<User, "id" | "fullName"> | null;
    creator?: Pick<User, "id" | "fullName"> | null;
  } | null;
  creator?: Pick<User, "id" | "fullName"> | null;
  passportUploader?: Pick<User, "id" | "fullName"> | null;
  emiratesUploader?: Pick<User, "id" | "fullName"> | null;
  agreementUploader?: Pick<User, "id" | "fullName"> | null;
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

// ── Deal Closed / Sales ───────────────────────────────────────────────────────

export interface ClosedDealClient {
  id: string;
  fullName?: string | null;
  mobileNumber?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  passportNumber?: string | null;
  emiratesIdNumber?: string | null;
  hasPassportFile: boolean;
  hasEmiratesIdFile: boolean;
}

export interface ClosedDeal {
  id: string;           // LeadSale id
  leadId: string;
  leadName: string;
  mobileNumber: string;
  leadSource: string;
  projectName?: string | null;
  community?: string | null;
  propertyType?: string | null;
  unitNumber?: string | null;
  propertySize?: string | null;
  propertyPrice?: string | null;
  salesValue: number;
  currency: string;
  leadStatus: string;
  // people
  salesUser?: Pick<User, "id" | "fullName"> | null;
  salesUserRole?: string | null;
  salesManager?: Pick<User, "id" | "fullName"> | null;
  closedBy?: Pick<User, "id" | "fullName"> | null;
  assignedTo?: Pick<User, "id" | "fullName"> | null;
  createdBy?: Pick<User, "id" | "fullName"> | null;
  // dates
  closedAt: string;
  leadCreatedAt: string;
  // client
  client?: ClosedDealClient | null;
}

export interface DealClosedStats {
  totalDeals: number;
  totalSalesValue: number;
  avgDealValue: number;
  thisMonthDeals: number;
  thisMonthSalesValue: number;
}

export interface DealEmployeeSummary {
  employeeId: string;
  employeeName: string;
  role?: string | null;
  managerName?: string | null;
  closedDeals: number;
  totalSalesValue: number;
}

export interface DealClosedQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  closedFrom?: string;
  closedTo?: string;
  employeeId?: string;
  managerId?: string;
  projectName?: string;
  community?: string;
  source?: string;
  propertyType?: string;
}

// ── HRMS: Attendance ─────────────────────────────────────────────────────────

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  checkInPhoto?: string | null;
  checkOutPhoto?: string | null;
  checkInPhotoUrl?: string | null;
  checkOutPhotoUrl?: string | null;
  checkInLatitude?: number | null;
  checkInLongitude?: number | null;
  checkOutLatitude?: number | null;
  checkOutLongitude?: number | null;
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
  photo: Blob | File;
  latitude: number;
  longitude: number;
}

// ── HRMS: Attendance Regularization (Correction Requests) ───────────────────

export type RegularizationStatus = "pending" | "approved" | "rejected";

export type RegularizationRequestType =
  | "missed_check_in"
  | "missed_check_out"
  | "wrong_check_in_time"
  | "wrong_check_out_time"
  | "wrong_working_hours"
  | "wrong_attendance_status"
  | "other";

export interface AttendanceRegularization {
  id: string;
  attendanceId?: string | null;
  userId: string;
  date: string;
  requestedStatus?: AttendanceStatus | null;
  requestedCheckIn?: string | null;
  requestedCheckOut?: string | null;
  reason: string;
  attachmentUrl?: string | null;
  status: RegularizationStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  requestType: RegularizationRequestType;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, "id" | "fullName" | "employeeId"> | null;
  reviewer?: Pick<User, "id" | "fullName"> | null;
  attendance?: Pick<AttendanceRecord, "id" | "status"> | null;
}

export interface RegularizationApplyPayload {
  date: string;
  requestType: RegularizationRequestType;
  reason: string;
  requestedStatus?: AttendanceStatus;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
}

export interface AttendanceConfig {
  id: number;
  officeName: string;
  officeLatitude: number;
  officeLongitude: number;
  geofenceRadius: number;
  workStartTime: string;
  workEndTime: string;
  lateStartTime: string;
  halfDayStartTime: string;
  minFullDayHours: number;
  minHalfDayHours: number;
  weekendDays: string;
  isActive: boolean;
  updatedAt: string;
  updatedBy?: string | null;
}

export interface AttendanceSummary {
  userId?: string;
  month?: number;
  year?: number;
  total: number;
  present: number;
  late: number;
  half_day: number;
  absent: number;
  leave: number;
  weekend: number;
  holiday: number;
  presentDays?: number;
  absentDays?: number;
  lateDays?: number;
  halfDays?: number;
  leaveDays?: number;
  overtimeHours?: number;
  totalWorkingDays?: number;
}

// ── HRMS: Leave Management ───────────────────────────────────────────────────

export interface LeaveTypeConfig {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
  isPaid: boolean;
  applicableRoles?: string | null;
  genderRestriction?: string | null;
  probationAllowed: boolean;
  requiresMedicalCertificate: boolean;
  requiresAttachment: boolean;
  annualAllocation: number;
  maxDaysPerRequest?: number | null;
  maximumConsecutiveDays?: number | null;
  maximumRequestsPerMonth?: number | null;
  minimumNoticeDays?: number | null;
  halfDayAllowed: boolean;
  futureDateAllowed: boolean;
  backDateAllowed: boolean;
  backDateLimitDays?: number | null;
  weekendCounted: boolean;
  holidayCounted: boolean;
  canCombineWith?: string | null;
  negativeBalanceAllowed: boolean;
  resetEveryYear: boolean;
  monthlyAccrual: boolean;
  carryForwardEnabled: boolean;
  carryForwardPercentage: number;
  carryForwardExpiryMonths?: number | null;
  maxCarryForward?: number | null;
  encashmentEnabled: boolean;
  encashmentPercentage: number;
  manualAllocationAllowed: boolean;
  approvalRequired: boolean;
  approvalLevels: number;
  autoApprove: boolean;
  notifyHR: boolean;
  notifyMaster: boolean;
  notifyManager: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveTypeConfigWithBalance extends LeaveTypeConfig {
  balance: LeaveBalanceEntry;
}

export interface LeaveBalanceEntry {
  leaveTypeCode: string;
  leaveTypeName: string;
  allocated: number;
  carryForward: number;
  adjustment: number;
  used: number;
  remaining: number;
}

export interface LeaveBalancesResponse {
  userId: string;
  fullName: string;
  balances: LeaveBalanceEntry[];
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  year: number;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarLeaveEntry {
  id: string;
  userId: string;
  userFullName: string;
  dateFrom: string; // YYYY-MM-DD
  dateTo: string; // YYYY-MM-DD
  totalDays: number;
  isHalfDay: boolean;
  halfDayPeriod?: string | null;
  leaveType: string;
  leaveTypeCode?: string | null;
  leaveTypeName?: string | null;
  status: 'approved' | 'hr_approved' | 'pending';
}

export interface TeamCalendarResponse {
  holidays: Holiday[];
  leaves: CalendarLeaveEntry[];
}

export interface LeaveAudit {
  id: string;
  leaveRequestId: string;
  action: string;
  changedBy: string;
  oldStatus?: string | null;
  newStatus?: string | null;
  reason?: string | null;
  meta?: unknown;
  createdAt: string;
  changer?: Pick<User, "id" | "fullName"> | null;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  leaveType: LeaveType;
  leaveTypeCode?: string | null;
  dateFrom: string;
  dateTo: string;
  totalDays: number;
  reason?: string | null;
  attachmentUrl?: string | null;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  halfDayPeriod?: string | null;
  isHalfDay: boolean;
  status: LeaveStatus;
  hrReviewedBy?: string | null;
  hrReviewedAt?: string | null;
  hrReviewNote?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, "id" | "fullName"> | null;
  reviewer?: Pick<User, "id" | "fullName"> | null;
  leaveTypeConfig?: Pick<LeaveTypeConfig, "id" | "name" | "code"> | null;
  leaveAudits?: LeaveAudit[];
  attachmentSignedUrl?: string | null;
}

export interface LeaveApplyPayload {
  leaveTypeCode: string;
  dateFrom: string;
  dateTo: string;
  reason?: string;
  isHalfDay?: boolean;
  halfDayPeriod?: "first_half" | "second_half";
}

export interface LeaveAllocatePayload {
  userId: string;
  leaveTypeCode: string;
  year: number;
  days: number;
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

// ── HRMS: Payroll Preview Figures ─────────────────────────────────────────────
// Computed (not persisted) salary figures for one employee for a month.
// Mirrors `PayrollFigures` in deen-crm-backend/src/services/hrms/payroll.service.ts.

export interface PayrollFigures {
  userId: string;
  fullName: string;
  employeeId: string | null;
  department: string | null;
  designation: string | null;
  bankName: string | null;
  bankIban: string | null;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  presentDays: number;
  halfDays: number;
  approvedLeaveDays: number;
  unpaidLeaveDays: number;
  workingDaysInMonth: number;
  overtimeAmount: number;
  deductions: number;
  netSalary: number;
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
  /** Nested meta object — same data as the top-level fields above. */
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface ApiError {
  error?: string;
  message?: string;
  required?: {
    module?: string;
    page?: string;
    action?: string;
  };
}

// Dashboard responses
export interface DashboardRecentDeal {
  id: string;
  leadId: string;
  leadName: string;
  amount: number;
  currency: string;
  closedAt: string;
  employeeId: string;
  employeeName: string;
  closerId: string;
  closerName: string;
}

export interface DashboardSummary {
  sourceCounts: { source: string; count: number }[];
  totalLeads: number;
  dealsClosed?: number;
  salesAmount?: number;
  avgDealValue?: number;
  recentDeals?: DashboardRecentDeal[];
}

export interface StatusAnalytics {
  analytics: { status: string; leadCount: number; updateCount: number }[];
  windowHours: number;
}

// ── Employee Activity (dashboard) ────────────────────────────────────────────

export interface EmployeeActivitySummary {
  totalEmployees: number;
  present: number;
  late: number;
  halfDay: number;
  notCheckedIn: number;
  absent: number;
  onLeave: number;
  totalFollowupsToday: number;
  totalMissedFollowups: number;
  totalActivitiesToday: number;
}

export interface EmployeeActivityLead {
  id: string;
  leadName: string;
  leadStatus: string;
  followUpDate: string | null;
  source: string;
  mobileNumber: string;
}

export interface EmployeeActivityTimelineEntry {
  id: string;
  action: string;
  leadName: string;
  createdAt: string;
  metadata: unknown;
}

export interface EmployeeActivityRow {
  userId: string;
  fullName: string;
  role: UserRole;
  department: string | null;
  designation: string | null;
  attendance: {
    status: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    workingHours: string | null;
  };
  leadsAssigned?: number;
  followupsToday?: number;
  missedFollowups?: number;
  activitiesToday?: Record<string, number>;
  lastActivityAt?: string | null;
  leads?: EmployeeActivityLead[];
  activityTimeline?: EmployeeActivityTimelineEntry[];
}

export interface EmployeeActivityResponse {
  summary: EmployeeActivitySummary;
  employees: EmployeeActivityRow[];
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

// ── Owners ───────────────────────────────────────────────────────────────────

export type OwnerPropertyListingStatus =
  | "available"
  | "listed"
  | "sold"
  | "rented"
  | "off_market";

export interface OwnerProperty {
  id: string;
  ownerId: string;
  propertySource?: "property_finder" | "pocket_listing";
  projectName: string;
  projectType?: string | null;
  reference?: string | null;
  category?: string | null;
  type?: string | null;
  configuration?: string | null;
  bedrooms?: string | null;
  bathrooms?: string | null;
  size?: string | null;
  price?: string | null;
  emirate?: string | null;
  community?: string | null;
  building?: string | null;
  unitNumber?: string | null;
  floorNumber?: string | null;
  parkingSlots?: string | null;
  listingStatus: OwnerPropertyListingStatus;
  pfListingId?: string | null;
  pocketListingId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  /** Full PF listing details — populated by the getById endpoint. */
  pfListing?: PropertyDetail | null;
  /** Full Pocket Listing details — populated by the getById endpoint. */
  pocketListing?: PocketListing | null;
}

export interface Owner {
  id: string;
  fullName: string;
  mobileNumber: string;
  mobileNormalized: string;
  alternateMobile?: string | null;
  email?: string | null;
  emailNormalized?: string | null;
  whatsapp?: string | null;
  emirate?: string | null;
  city?: string | null;
  locality?: string | null;
  notes?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  creator?: Pick<User, "id" | "fullName"> | null;
  properties?: OwnerProperty[];
  _count?: { properties: number };
}

export interface OwnerWithProperties extends Owner {
  properties: OwnerProperty[];
}

export interface OwnerQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export type OwnerInput = Partial<
  Omit<Owner, "id" | "mobileNormalized" | "emailNormalized" | "createdById" | "createdAt" | "updatedAt" | "creator" | "properties" | "_count">
>;

export type OwnerPropertyInput = Partial<
  Omit<OwnerProperty, "id" | "ownerId" | "createdAt" | "updatedAt">
>;

// ── Pocket Listings ────────────────────────────────────────────────────────────

export type PocketListingStatus = "available" | "sold" | "rented" | "off_market";

export interface PocketListingImage {
  id: string;
  pocketListingId: string;
  sortOrder: number;
  mimeType: string;
  filename: string;
  url: string;
}

export interface PocketListing {
  id: string;
  reference: string;
  title: string;
  description?: string | null;
  category: string;
  type: string;
  offeringType: string;
  furnishingType?: string | null;
  completionStatus?: string | null;
  developer?: string | null;
  emirate: string;
  city?: string | null;
  community?: string | null;
  building?: string | null;
  locationHierarchy?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  unitNumber?: string | null;
  floorNumber?: string | null;
  parkingSlots?: number | null;
  bedrooms?: string | null;
  bathrooms?: string | null;
  size?: number | null;
  builtUpArea?: number | null;
  price?: number | null;
  currency: string;
  priceType?: string | null;
  priceOnRequest: boolean;
  numberOfCheques?: number | null;
  amenities: string[];
  listingStatus: PocketListingStatus;
  availableFrom?: string | null;
  rentalStartDate?: string | null;
  rentalEndDate?: string | null;
  rentalAgreement?: {
    agreementStartDate: string | null;
    agreementEndDate: string | null;
    daysRemaining: number | null;
  } | null;
  videoUrl?: string | null;
  virtualTourUrl?: string | null;
  floorPlanUrl?: string | null;
  notes?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  // Enriched
  mainImage?: string | null;
  imageCount: number;
  images: PocketListingImage[];
  createdBy?: Pick<User, "id" | "fullName" | "email" | "role"> | null;
  source?: "pocket_listing";
}

export interface PocketListingQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  category?: string;
  type?: string;
  emirate?: string;
  offeringType?: string;
  createdById?: string;
}

export type PocketListingInput = Omit<
  PocketListing,
  | "id"
  | "reference"
  | "createdAt"
  | "updatedAt"
  | "createdBy"
  | "images"
  | "mainImage"
  | "imageCount"
  | "rentalAgreement"
  | "source"
>;

/** A system field the user can map a CSV column to. */
export interface ImportSystemField {
  key: string;
  label: string;
  required: boolean;
}

export type CustomFieldEntity = "lead";
export type CustomFieldType = "text";

export interface CustomFieldDefinition {
  id: string;
  entity: CustomFieldEntity;
  key: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Response from POST /leads/import/parse — step 1 of the mapping wizard. */
export interface ImportParseResult {
  headers: string[];
  previewRows: Record<string, string>[];
  systemFields: ImportSystemField[];
  customFields?: ImportSystemField[];
}

/** Mapping of CSV header name -> system field key (or "" for unmapped). */
export type ImportMapping = Record<string, string>;

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
  ingestionSource?: string;
  leadPriority?: string;
  brokerId?: string;
  community?: string;
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
  touched?: number;
  converted?: number;
  conversionRate?: number;
  statusBreakdown?: Record<string, number>;
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
  dealsClosed?: number;
  salesAmount?: number;
  avgDealValue?: number;
  manuallyCreated?: number;
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
  converted?: number;
  dealsClosed?: number;
  salesAmount?: number;
  avgDealValue?: number;
  manuallyCreated?: number;
}

export interface LeadTimeSeriesItem {
  date: string;
  count: number;
}

// ── Lead Report: Phase 1/2/3 enhancements ───────────────────────────────────

/** NEW BACKEND ENDPOINT REQUIRED: GET /leads/report/priority */
export interface LeadPriorityReportItem {
  priority: string;
  count: number;
  percentage: number;
}

/** NEW BACKEND ENDPOINT REQUIRED: GET /leads/report/geo */
export interface LeadGeoReportItem {
  city: string;
  count: number;
  percentage: number;
}

/**
 * NEW BACKEND ENDPOINT REQUIRED: GET /leads/report/summary
 * Provides metrics that cannot be derived client-side from existing
 * /leads/report and /dashboard/status-analytics responses (true "new leads
 * created" count independent of assignment, and average first-touch response
 * time). All other KPI fields are computed client-side as a fallback when
 * this endpoint is unavailable.
 */
export interface LeadReportSummary {
  newLeads: number;
  avgResponseTimeMinutes: number | null;
}

export interface KpiComparisonValue {
  current: number;
  previous: number;
  deltaPct: number | null;
}

export interface LeadReportKpis {
  totalLeads: KpiComparisonValue;
  newLeads: KpiComparisonValue;
  touchRate: KpiComparisonValue;
  conversionRate: KpiComparisonValue;
  followUpCompletionRate: KpiComparisonValue;
  avgResponseTimeMinutes: number | null;
  dealsClosed: KpiComparisonValue;
  salesAmount: KpiComparisonValue;
}

export interface LeadFunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

export interface EmployeePerformance extends UserPerformanceItem {
  role?: UserRole;
  department?: string | null;
  designation?: string | null;
  profilePhoto?: string | null;
  touchRate: number;
  conversionRate: number;
  followUpCompletionRate: number;
  performanceScore: number;
  weeklyActivity: { date: string; count: number }[];
  recentActivity: LeadActivity[];
}

export interface LeaderboardEntry {
  userId: string;
  fullName: string;
  value: number;
  rank: number;
}

// ── Lead Activity ────────────────────────────────────────────────────────────

export type LeadActivityAction =
  | "created"
  | "status_changed"
  | "comment_added"
  | "followup_scheduled"
  | "followup_completed"
  | "assigned"
  | "unassigned"
  | "field_updated"
  | "imported"
  | "viewed";

export interface LeadActivity {
  id: string;
  leadId: string;
  actorId: string;
  action: LeadActivityAction;
  metadata: Record<string, unknown>;
  createdAt: string;
  actor?: Pick<User, "id" | "fullName"> | null;
}

// ── Assignment History ───────────────────────────────────────────────────────
// Reuses LeadActivity (action = 'assigned') as the permanent audit trail.
// Each entry represents one assignment/reassignment event in the chain.

export type AssignmentType = "manual" | "bulk" | "created" | "imported";

export interface AssignmentHistoryUser {
  id: string;
  name: string;
}

export interface AssignmentHistoryEntry {
  id: string;
  /** "assigned" = assigned/reassigned to a user; "unassigned" = cleared. */
  action: "assigned" | "unassigned";
  assignedBy: AssignmentHistoryUser | null;
  assignedTo: AssignmentHistoryUser | null;
  assignedAt: string;
  type: AssignmentType;
}

export interface AssignmentHistoryResponse {
  leadId: string;
  count: number;
  history: AssignmentHistoryEntry[];
}

// ── Follow-up History ────────────────────────────────────────────────────────
// Reuses LeadActivity (action = followup_scheduled | followup_completed).

export interface FollowupHistoryEntry {
  id: string;
  action: "followup_scheduled" | "followup_completed";
  followUpDate: string | null;
  followUpNote: string | null;
  actor: Pick<User, "id" | "fullName"> | null;
  createdAt: string;
}

export interface FollowupHistoryResponse {
  leadId: string;
  count: number;
  history: FollowupHistoryEntry[];
}

// ── App Notifications ────────────────────────────────────────────────────────

export interface AssignmentNotificationLead {
  id: string;
  leadName: string;
  mobileNumber: string;
  source: string;
  serviceType: string;
  projectName: string | null;
}

export interface AppNotification {
  id: string;
  type: "assignment" | "followup" | "system" | "leave" | "regularization" | "payslip" | "deal_closed";
  title: string;
  body: string | null;
  leadId: string | null;
  leads: AssignmentNotificationLead[] | null;
  isRead: boolean;
  createdAt: string;
}

// ── Team Management ──────────────────────────────────────────────────────────

export interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  employeeId?: string | null;
  department?: string | null;
  designation?: string | null;
  isActive: boolean;
  createdAt: string;
  stats?: {
    totalLeads: number;
    activeLeads: number;
    convertedLeads: number;
    dealsClosed?: number;
    salesAmount?: number;
    avgDealValue?: number;
  };
}

export interface TeamOverview {
  id: string;
  fullName: string;
  email: string;
  teamMembers: Pick<User, "id" | "fullName" | "email" | "role">[];
  stats: {
    teamSize: number;
    managerLeads: number;
    teamLeads: number;
    totalLeads: number;
    dealsClosed?: number;
    salesAmount?: number;
  };
}

export interface AllTeamsResponse {
  teams: TeamOverview[];
  unassignedExecutives: Pick<User, "id" | "fullName" | "email">[];
  totalTeams: number;
  totalUnassigned: number;
}

export interface MyTeamResponse {
  teamMembers: TeamMember[];
  count: number;
}

export interface TeamMembersResponse {
  manager: Pick<User, "id" | "fullName" | "role">;
  teamMembers: TeamMember[];
  count: number;
}

export interface AssignTeamPayload {
  managerId: string;
  executiveIds: string[];
}

export interface ReassignExecutivePayload {
  executiveId: string;
  newManagerId: string | null;
}

export interface UnassignExecutivePayload {
  executiveId: string;
}

// ── Integrations (OAuth Lead Sources) ───────────────────────────────────────

export type IntegrationProvider = "meta" | "google";
export type IntegrationStatus =
  | "pending"
  | "active"
  | "error"
  | "reauthorization_required"
  | "disconnected";
export type IntegrationHealthStatus = "healthy" | "degraded" | "down" | "unknown";
export type ConnectedAccountType =
  | "meta_page"
  | "meta_instagram_business"
  | "meta_ad_account"
  | "google_customer";
export type SyncJobStatus = "queued" | "running" | "completed" | "failed" | "dead_letter";
export type WebhookEventStatus =
  | "received"
  | "queued"
  | "processing"
  | "processed"
  | "retryable_failed"
  | "duplicate"
  | "dead_letter";

export interface IntegrationProviderInfo {
  key: IntegrationProvider;
  label: string;
  icon: string;
}

export interface Integration {
  id: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  displayName: string;
  ownerUserId: string;
  createdAt: string;
  updatedAt: string;
  lastHealthCheckAt?: string | null;
  healthStatus: IntegrationHealthStatus;
  connectedAccounts?: ConnectedAccount[];
}

export interface ConnectedAccount {
  id: string;
  integrationId: string;
  externalAccountId: string;
  accountType: ConnectedAccountType;
  name: string;
  parentExternalAccountId?: string | null;
  metadata?: Record<string, unknown>;
  selected?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeadForm {
  id?: string;
  externalFormId: string;
  name: string;
  externalAccountId: string;
  metadata?: Record<string, unknown>;
  enabled?: boolean;
}

export interface ConnectResponse {
  authorizationUrl: string;
  state: string;
  expiresAt: string;
  integrationId: string;
}

export interface HealthCheckResponse {
  integrationId: string;
  status: IntegrationStatus;
  healthy: boolean;
  issues: string[];
}

export interface CredentialHealth {
  status: IntegrationStatus;
  lastRefreshAt?: string | null;
  accessTokenExpiresAt?: string | null;
  daysUntilExpiry?: number | null;
}

export interface WebhookStats {
  received: number;
  processed: number;
  failed: number;
  duplicate: number;
  deadLetter: number;
  oldestUnprocessedAgeMs?: number | null;
}

export interface SyncStats {
  total: number;
  completed: number;
  failed: number;
  running: number;
  lastCompletedAt?: string | null;
  avgDurationMs?: number | null;
}

export interface LeadStats {
  totalIngested: number;
  duplicates: number;
}

export interface HealthReport {
  integrationId: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  credentialHealth: CredentialHealth;
  accountCount: number;
  leadSourceCount: number;
  webhookStats: WebhookStats;
  syncStats: SyncStats;
  leadStats: LeadStats;
}

export interface IntegrationsDashboard {
  summary: {
    totalIntegrations: number;
    activeIntegrations: number;
    needingAttention: number;
    totalLeadsIngested: number;
    totalDuplicates: number;
    totalDeadLetterEvents: number;
    totalFailedSyncs: number;
  };
  integrations: HealthReport[];
}

export interface SyncJob {
  id: string;
  status: SyncJobStatus;
  jobType: string;
  startedAt?: string | null;
  completedAt?: string | null;
  result?: {
    fetchedCount?: number;
    createdCount?: number;
    duplicateCount?: number;
  } | null;
  errorMessage?: string | null;
}

export interface WebhookEvent {
  id: string;
  status: WebhookEventStatus;
  eventType?: string;
  payload?: Record<string, unknown>;
  receivedAt?: string | null;
  processedAt?: string | null;
  errorMessage?: string | null;
}

// ── Activity Stream ──────────────────────────────────────────────────────────

export type ActivityActorType = "user" | "system" | "external" | "unknown";
export type ActivityOutcome = "success" | "failure" | "partial";
export type ActivitySource = "api" | "worker" | "cron" | "webhook";

export interface ActivityEvent {
  id: string;
  occurredAt: string;
  occurredDate: string;
  eventName: string;
  category: string;
  actorType: ActivityActorType;
  actorUserId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  subjectType?: string | null;
  subjectId?: string | null;
  subjectLabel?: string | null;
  outcome: ActivityOutcome;
  source: ActivitySource;
  requestId?: string | null;
  correlationId?: string | null;
  route?: string | null;
  httpMethod?: string | null;
  httpStatus?: number | null;
  summary: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  deviceInfo?: string | null;
  schemaVersion: number;
}

export interface ActivityListResponse {
  data: ActivityEvent[];
  meta: {
    total: number;
    date: string;
    pageSize: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}

export interface ActivityFilterMeta {
  categories: string[];
  eventNames: string[];
  actorTypes: string[];
  outcomes: string[];
  sources: string[];
}

export interface ActivityListParams {
  date?: string;
  cursor?: string;
  pageSize?: number;
  actorUserId?: string;
  category?: string;
  eventName?: string;
  actorType?: ActivityActorType;
  outcome?: ActivityOutcome;
  source?: ActivitySource;
  search?: string;
}

// ── Todos (dashboard self-service) ───────────────────────────────────────────

export type TodoPriority = "no_priority" | "low" | "medium" | "high";

export interface Todo {
  id: string;
  userId: string;
  title: string;
  priority: TodoPriority;
  isDone: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoInput {
  title: string;
  priority?: TodoPriority;
}

export interface UpdateTodoInput {
  title?: string;
  priority?: TodoPriority;
  isDone?: boolean;
}

export interface EmployeeTodoGroup {
  user: Pick<User, "id" | "fullName" | "email" | "role" | "department" | "designation">;
  todos: Todo[];
  openCount: number;
  doneCount: number;
}
