import { z } from "zod";

export const leaveApplySchema = z.object({
  leaveType: z.enum(["annual", "sick", "emergency", "unpaid"]),
  dateFrom: z.string().min(1, "Start date is required"),
  dateTo: z.string().min(1, "End date is required"),
  reason: z.string().optional(),
});

export type LeaveApplyFormValues = z.infer<typeof leaveApplySchema>;

export const leaveBalanceSchema = z.object({
  annual: z.coerce.number().min(0),
  sick: z.coerce.number().min(0),
  emergency: z.coerce.number().min(0),
});

export type LeaveBalanceFormValues = z.infer<typeof leaveBalanceSchema>;
