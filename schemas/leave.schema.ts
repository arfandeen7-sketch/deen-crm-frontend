import { z } from "zod";

export const leaveApplySchema = z.object({
  leaveTypeCode: z.string().min(1, "Leave type is required"),
  dateFrom: z.string().min(1, "Start date is required"),
  dateTo: z.string().min(1, "End date is required"),
  reason: z.string().optional(),
  isHalfDay: z.boolean().default(false),
  halfDayPeriod: z.enum(["first_half", "second_half"]).optional(),
}).refine((data) => data.dateTo >= data.dateFrom, {
  message: "End date must be on or after start date",
  path: ["dateTo"],
}).refine((data) => !data.isHalfDay || data.dateFrom === data.dateTo, {
  message: "Half-day leave requires the same start and end date",
  path: ["dateTo"],
});

export type LeaveApplyFormValues = z.infer<typeof leaveApplySchema>;

export const leaveTypeConfigSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required").regex(/^[a-z_]+$/, "Code must be lowercase snake_case"),
  description: z.string().optional(),
  isPaid: z.boolean().default(true),
  applicableRoles: z.string().optional(),
  probationAllowed: z.boolean().default(true),
  requiresMedicalCertificate: z.boolean().default(false),
  requiresAttachment: z.boolean().default(false),
  annualAllocation: z.coerce.number().int().min(0).default(0),
  maxDaysPerRequest: z.coerce.number().int().positive().optional(),
  maximumConsecutiveDays: z.coerce.number().int().positive().optional(),
  maximumRequestsPerMonth: z.coerce.number().int().positive().optional(),
  minimumNoticeDays: z.coerce.number().int().min(0).optional(),
  halfDayAllowed: z.boolean().default(false),
  futureDateAllowed: z.boolean().default(true),
  backDateAllowed: z.boolean().default(true),
  backDateLimitDays: z.coerce.number().int().positive().optional(),
  weekendCounted: z.boolean().default(false),
  holidayCounted: z.boolean().default(false),
  negativeBalanceAllowed: z.boolean().default(false),
  resetEveryYear: z.boolean().default(true),
  carryForwardEnabled: z.boolean().default(false),
  carryForwardPercentage: z.coerce.number().int().min(0).max(100).default(0),
  carryForwardExpiryMonths: z.coerce.number().int().positive().optional(),
  maxCarryForward: z.coerce.number().int().min(0).optional(),
  encashmentEnabled: z.boolean().default(false),
  encashmentPercentage: z.coerce.number().int().min(0).max(100).default(0),
  approvalRequired: z.boolean().default(true),
  autoApprove: z.boolean().default(false),
  notifyHR: z.boolean().default(true),
  notifyMaster: z.boolean().default(false),
  notifyManager: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
});

export type LeaveTypeConfigFormValues = z.infer<typeof leaveTypeConfigSchema>;

export const holidaySchema = z.object({
  name: z.string().min(1, "Holiday name is required"),
  date: z.string().min(1, "Date is required"),
  isRecurring: z.boolean().default(false),
});

export type HolidayFormValues = z.infer<typeof holidaySchema>;

export const leaveAllocateSchema = z.object({
  userId: z.string().uuid("User is required"),
  leaveTypeCode: z.string().min(1, "Leave type is required"),
  year: z.coerce.number().int().min(2020).max(2100),
  days: z.coerce.number().positive("Days must be positive"),
  reason: z.string().optional(),
});

export type LeaveAllocateFormValues = z.infer<typeof leaveAllocateSchema>;
