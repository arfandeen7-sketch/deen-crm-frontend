import { z } from "zod";

export const regularizationApplySchema = z
  .object({
    date: z.string().min(1, "Date is required"),
    requestType: z.enum([
      "missed_check_in",
      "missed_check_out",
      "wrong_check_in_time",
      "wrong_check_out_time",
      "wrong_working_hours",
      "wrong_attendance_status",
      "other",
    ]),
    reason: z.string().min(1, "Reason is required"),
    requestedStatus: z
      .enum(["present", "late", "half_day", "absent", "leave", "weekend", "holiday"])
      .optional(),
    requestedCheckIn: z.string().optional(),
    requestedCheckOut: z.string().optional(),
  })
  .refine(
    (data) => {
      // check-out must be after check-in when both provided
      if (data.requestedCheckIn && data.requestedCheckOut) {
        return data.requestedCheckOut > data.requestedCheckIn;
      }
      return true;
    },
    { message: "Check-out must be after check-in", path: ["requestedCheckOut"] }
  );

export type RegularizationApplyFormValues = z.infer<typeof regularizationApplySchema>;
