"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea, Select } from "@/components/ui/Input";
import { useAdjustBalance, useLeaveTypes } from "@/hooks/useHrms";
import { adjustBalanceSchema, type AdjustBalanceFormValues } from "@/schemas/leave.schema";
import { getErrorMessage } from "@/lib/utils";

interface AdjustBalanceDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
  presetLeaveTypeCode?: string;
}

export function AdjustBalanceDialog({
  open,
  onClose,
  userId,
  userName,
  presetLeaveTypeCode,
}: AdjustBalanceDialogProps) {
  const { data: types } = useLeaveTypes(false);
  const adjust = useAdjustBalance();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdjustBalanceFormValues>({
    resolver: zodResolver(adjustBalanceSchema) as never,
    defaultValues: {
      userId,
      year: new Date().getFullYear(),
    },
  });

  useEffect(() => {
    reset({
      userId,
      leaveTypeCode: presetLeaveTypeCode || "",
      year: new Date().getFullYear(),
      adjustmentDays: 0,
      reason: "",
    });
  }, [userId, presetLeaveTypeCode, reset]);

  const onSubmit = (values: AdjustBalanceFormValues) => {
    adjust.mutate(values, {
      onSuccess: () => {
        toast.success("Balance adjusted");
        onClose();
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Adjust Leave Balance"
      description={userName ? `For ${userName}` : undefined}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={adjust.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="adjust-balance-form" loading={adjust.isPending}>
            Adjust
          </Button>
        </>
      }
    >
      <form id="adjust-balance-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Year" required error={errors.year?.message}>
            <Input type="number" {...register("year")} invalid={!!errors.year} />
          </Field>
          <Field
            label="Adjustment Days"
            required
            error={errors.adjustmentDays?.message}
            hint="Positive to add, negative to deduct"
          >
            <Input type="number" step="0.5" {...register("adjustmentDays")} invalid={!!errors.adjustmentDays} />
          </Field>
        </div>
        <Field label="Reason" required error={errors.reason?.message}>
          <Textarea {...register("reason")} rows={3} placeholder="Reason for adjustment" />
        </Field>
      </form>
    </Modal>
  );
}
