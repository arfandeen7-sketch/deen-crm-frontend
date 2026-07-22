"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useLeaveTypes, useApplyLeave, useApplyLeaveWithAttachment, useLeaveBalance } from "@/hooks/useHrms";
import { Field, Input, Textarea, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LeaveBalanceCard } from "./LeaveBalanceCard";
import { LeaveAttachmentUpload } from "./LeaveAttachmentUpload";
import { leaveApplySchema, type LeaveApplyFormValues } from "@/schemas/leave.schema";
import { getErrorMessage } from "@/lib/utils";
import { calculateWorkingDays } from "@/lib/leaveUtils";

export function LeaveApplyForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const { data: types } = useLeaveTypes(true);
  const { data: balance } = useLeaveBalance();
  const apply = useApplyLeave();
  const applyWithAttachment = useApplyLeaveWithAttachment();
  const [attachment, setAttachment] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<LeaveApplyFormValues>({
    resolver: zodResolver(leaveApplySchema) as never,
    defaultValues: { isHalfDay: false },
  });

  const selectedTypeCode = watch("leaveTypeCode");
  const isHalfDay = watch("isHalfDay");
  const dateFrom = watch("dateFrom");
  const dateTo = watch("dateTo");

  const selectedType = useMemo(
    () => types?.find((t) => t.code === selectedTypeCode),
    [types, selectedTypeCode],
  );

  const workingDays = useMemo(() => {
    if (!dateFrom || !dateTo) return 0;
    if (isHalfDay) return 0.5;
    return calculateWorkingDays(new Date(dateFrom), new Date(dateTo));
  }, [dateFrom, dateTo, isHalfDay]);

  const needsAttachment =
    selectedType?.requiresAttachment || selectedType?.requiresMedicalCertificate;

  const onSubmit = (values: LeaveApplyFormValues) => {
    if (needsAttachment && attachment) {
      const fd = new FormData();
      fd.append("leaveTypeCode", values.leaveTypeCode);
      fd.append("dateFrom", values.dateFrom);
      fd.append("dateTo", values.isHalfDay ? values.dateFrom : values.dateTo);
      fd.append("isHalfDay", String(values.isHalfDay));
      if (values.halfDayPeriod) fd.append("halfDayPeriod", values.halfDayPeriod);
      if (values.reason) fd.append("reason", values.reason);
      fd.append("attachment", attachment);
      applyWithAttachment.mutate(fd, {
        onSuccess: () => {
          toast.success("Leave application submitted");
          reset();
          setAttachment(null);
          onSuccess?.();
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      });
    } else {
      const payload = {
        ...values,
        dateTo: values.isHalfDay ? values.dateFrom : values.dateTo,
      };
      apply.mutate(payload, {
        onSuccess: () => {
          toast.success("Leave application submitted");
          reset();
          setAttachment(null);
          onSuccess?.();
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Leave Type" required error={errors.leaveTypeCode?.message}>
          <Select {...register("leaveTypeCode")} invalid={!!errors.leaveTypeCode}>
            <option value="">Select leave type</option>
            {types?.map((t) => (
              <option key={t.code} value={t.code}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Available Balance">
          <div className="flex h-10 items-center rounded-lg border border-border bg-panel px-4 text-sm text-foreground-secondary">
            {selectedTypeCode
              ? (() => {
                  const bal = balance?.find((b) => b.leaveTypeCode === selectedTypeCode);
                  return bal ? `${bal.available} days available` : "—";
                })()
              : "Select a leave type"}
          </div>
        </Field>

        <Field label="Start Date" required error={errors.dateFrom?.message}>
          <Input type="date" {...register("dateFrom")} invalid={!!errors.dateFrom} />
        </Field>

        <Field label="End Date" required error={errors.dateTo?.message}>
          <Input
            type="date"
            {...register("dateTo")}
            invalid={!!errors.dateTo}
            disabled={isHalfDay}
          />
        </Field>
      </div>

      {/* Half day */}
      {selectedType?.halfDayAllowed && (
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={isHalfDay}
              onChange={(e) => {
                setValue("isHalfDay", e.target.checked, { shouldValidate: true });
                if (e.target.checked) {
                  setValue("dateTo", dateFrom || "");
                }
              }}
              className="h-4 w-4 rounded border-border accent-accent"
            />
            Half Day
          </label>
          {isHalfDay && (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  value="first_half"
                  {...register("halfDayPeriod")}
                  className="h-4 w-4 accent-accent"
                />
                First Half
              </label>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  value="second_half"
                  {...register("halfDayPeriod")}
                  className="h-4 w-4 accent-accent"
                />
                Second Half
              </label>
            </div>
          )}
          {errors.halfDayPeriod && (
            <p className="text-xs text-rose-600">{errors.halfDayPeriod.message}</p>
          )}
        </div>
      )}

      <Field label="Reason" error={errors.reason?.message}>
        <Textarea {...register("reason")} rows={3} placeholder="Why are you applying for leave?" />
      </Field>

      {/* Attachment */}
      {needsAttachment && (
        <Field
          label={
            selectedType?.requiresMedicalCertificate
              ? "Medical Certificate"
              : "Attachment"
          }
          required
        >
          <LeaveAttachmentUpload file={attachment} onFileChange={setAttachment} />
        </Field>
      )}

      {/* Summary */}
      {selectedType && (
        <div className="rounded-lg border border-border bg-panel p-4">
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <p className="text-xs text-foreground-muted">Allocation</p>
              <p className="font-semibold">{selectedType.annualAllocation} days</p>
            </div>
            <div>
              <p className="text-xs text-foreground-muted">Working Days</p>
              <p className="font-semibold">{workingDays}</p>
            </div>
            <div>
              <p className="text-xs text-foreground-muted">Paid</p>
              <p className="font-semibold">{selectedType.isPaid ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-xs text-foreground-muted">Half Day</p>
              <p className="font-semibold">{selectedType.halfDayAllowed ? "Allowed" : "Not Allowed"}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={apply.isPending || applyWithAttachment.isPending}>
          Submit Leave Request
        </Button>
      </div>
    </form>
  );
}
