import { z } from "zod";

// ── Apply Leave ──────────────────────────────────────────────────────────────

export const leaveApplySchema = z
  .object({
    leaveTypeCode: z.string().min(1, "Leave type is required"),
    dateFrom: z.string().min(1, "Start date is required"),
    dateTo: z.string().min(1, "End date is required"),
    isHalfDay: z.boolean().default(false),
    halfDayPeriod: z.enum(["first_half", "second_half"]).optional(),
    reason: z.string().optional(),
  })
  .refine((d) => !d.isHalfDay || d.halfDayPeriod !== undefined, {
    message: "Half day period is required",
    path: ["halfDayPeriod"],
  })
  .refine(
    (d) => d.isHalfDay || new Date(d.dateTo) >= new Date(d.dateFrom),
    { message: "End date must be on or after start date", path: ["dateTo"] },
  );

export type LeaveApplyFormValues = z.infer<typeof leaveApplySchema>;

// ── Leave Type Config ────────────────────────────────────────────────────────

export const leaveTypeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(10, "Code must be at most 10 characters")
    .regex(/^[A-Z][A-Z0-9]*$/, "Uppercase alphanumeric only"),
  description: z.string().optional(),
  isPaid: z.boolean(),
  annualAllocation: z.coerce.number().int().min(0),
  maxDaysPerRequest: z.coerce.number().int().positive().nullable().or(z.literal("").transform(() => null)),
  maximumConsecutiveDays: z.coerce.number().int().positive().nullable().or(z.literal("").transform(() => null)),
  maximumRequestsPerMonth: z.coerce.number().int().positive().nullable().or(z.literal("").transform(() => null)),
  minimumNoticeDays: z.coerce.number().int().min(0).nullable().or(z.literal("").transform(() => null)),
  halfDayAllowed: z.boolean(),
  futureDateAllowed: z.boolean(),
  backDateAllowed: z.boolean(),
  backDateLimitDays: z.coerce.number().int().positive().nullable().or(z.literal("").transform(() => null)),
  weekendCounted: z.boolean(),
  holidayCounted: z.boolean(),
  canCombineWith: z.string().nullable().or(z.literal("").transform(() => null)),
  negativeBalanceAllowed: z.boolean(),
  carryForwardEnabled: z.boolean(),
  carryForwardPercentage: z.coerce.number().int().min(0).max(100),
  carryForwardExpiryMonths: z.coerce.number().int().positive().nullable().or(z.literal("").transform(() => null)),
  maxCarryForward: z.coerce.number().int().positive().nullable().or(z.literal("").transform(() => null)),
  encashmentEnabled: z.boolean(),
  encashmentPercentage: z.coerce.number().int().min(0).max(100),
  manualAllocationAllowed: z.boolean(),
  approvalRequired: z.boolean(),
  approvalLevels: z.coerce.number().int().min(1),
  autoApprove: z.boolean(),
  notifyHR: z.boolean(),
  notifyMaster: z.boolean(),
  notifyManager: z.boolean(),
  probationAllowed: z.boolean(),
  genderRestriction: z.enum(["male", "female"]).nullable().or(z.literal("").transform(() => null)),
  applicableRoles: z.string().nullable().or(z.literal("").transform(() => null)),
  requiresMedicalCertificate: z.boolean(),
  requiresAttachment: z.boolean(),
  resetEveryYear: z.boolean(),
  monthlyAccrual: z.boolean(),
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int(),
});

export type LeaveTypeFormValues = z.infer<typeof leaveTypeSchema>;

// ── Leave Policy ─────────────────────────────────────────────────────────────

export const leavePolicySchema = z.object({
  financialYearStartMonth: z.coerce.number().int().min(1).max(12),
  financialYearStartDay: z.coerce.number().int().min(1).max(31),
  minimumNoticeDays: z.coerce.number().int().min(0),
  maximumFutureLeaveDays: z.coerce.number().int().positive().nullable().or(z.literal("").transform(() => null)),
  maximumBackdatedLeaveDays: z.coerce.number().int().positive().nullable().or(z.literal("").transform(() => null)),
  defaultCarryForwardPercentage: z.coerce.number().int().min(0).max(100),
  defaultCarryForwardExpiryMonths: z.coerce.number().int().positive().nullable().or(z.literal("").transform(() => null)),
  attendanceIntegrationEnabled: z.boolean(),
  payrollIntegrationEnabled: z.boolean(),
  holidayCountedInLeave: z.boolean(),
  weekendCountedInLeave: z.boolean(),
});

export type LeavePolicyFormValues = z.infer<typeof leavePolicySchema>;

// ── Balance Adjust ───────────────────────────────────────────────────────────

export const adjustBalanceSchema = z.object({
  userId: z.string().min(1, "User is required"),
  leaveTypeCode: z.string().min(1, "Leave type is required"),
  year: z.coerce.number().int().min(2020),
  adjustmentDays: z.coerce
    .number()
    .refine((v) => v !== 0, "Must be non-zero"),
  reason: z.string().min(1, "Reason is required"),
});

export type AdjustBalanceFormValues = z.infer<typeof adjustBalanceSchema>;

