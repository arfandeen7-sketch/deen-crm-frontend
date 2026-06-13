import { z } from "zod";

export const leaveApplySchema = z.object({
  leaveType: z.enum(["annual", "sick", "emergency", "unpaid"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().min(5, "Reason must be at least 5 characters"),
});

export type LeaveApplyFormValues = z.infer<typeof leaveApplySchema>;

export const leaveBalanceSchema = z.object({
  annual: z.coerce.number().min(0),
  sick: z.coerce.number().min(0),
  emergency: z.coerce.number().min(0),
});

export type LeaveBalanceFormValues = z.infer<typeof leaveBalanceSchema>;
