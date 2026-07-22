"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea, Select } from "@/components/ui/Input";
import { useCreateLeaveType, useUpdateLeaveType } from "@/hooks/useHrms";
import { leaveTypeSchema, type LeaveTypeFormValues } from "@/schemas/leave.schema";
import { getErrorMessage } from "@/lib/utils";
import type { LeaveTypeConfig } from "@/types";

interface LeaveTypeFormDialogProps {
  open: boolean;
  onClose: () => void;
  editType: LeaveTypeConfig | null;
}

export function LeaveTypeFormDialog({ open, onClose, editType }: LeaveTypeFormDialogProps) {
  const create = useCreateLeaveType();
  const update = useUpdateLeaveType();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LeaveTypeFormValues>({
    resolver: zodResolver(leaveTypeSchema) as never,
  });

  useEffect(() => {
    if (editType) {
      reset({
        name: editType.name,
        code: editType.code,
        description: editType.description || "",
        isPaid: editType.isPaid,
        annualAllocation: editType.annualAllocation,
        maxDaysPerRequest: editType.maxDaysPerRequest,
        maximumConsecutiveDays: editType.maximumConsecutiveDays,
        maximumRequestsPerMonth: editType.maximumRequestsPerMonth,
        minimumNoticeDays: editType.minimumNoticeDays,
        halfDayAllowed: editType.halfDayAllowed,
        futureDateAllowed: editType.futureDateAllowed,
        backDateAllowed: editType.backDateAllowed,
        backDateLimitDays: editType.backDateLimitDays,
        weekendCounted: editType.weekendCounted,
        holidayCounted: editType.holidayCounted,
        canCombineWith: editType.canCombineWith,
        negativeBalanceAllowed: editType.negativeBalanceAllowed,
        carryForwardEnabled: editType.carryForwardEnabled,
        carryForwardPercentage: editType.carryForwardPercentage,
        carryForwardExpiryMonths: editType.carryForwardExpiryMonths,
        maxCarryForward: editType.maxCarryForward,
        encashmentEnabled: editType.encashmentEnabled,
        encashmentPercentage: editType.encashmentPercentage,
        manualAllocationAllowed: editType.manualAllocationAllowed,
        approvalRequired: editType.approvalRequired,
        approvalLevels: editType.approvalLevels,
        autoApprove: editType.autoApprove,
        notifyHR: editType.notifyHR,
        notifyMaster: editType.notifyMaster,
        notifyManager: editType.notifyManager,
        probationAllowed: editType.probationAllowed,
        genderRestriction: (editType.genderRestriction as "male" | "female" | null) ?? null,
        applicableRoles: editType.applicableRoles,
        requiresMedicalCertificate: editType.requiresMedicalCertificate,
        requiresAttachment: editType.requiresAttachment,
        resetEveryYear: editType.resetEveryYear,
        monthlyAccrual: editType.monthlyAccrual,
        isActive: editType.isActive,
        sortOrder: editType.sortOrder,
      });
    } else {
      reset({
        name: "",
        code: "",
        isPaid: true,
        annualAllocation: 0,
        halfDayAllowed: false,
        futureDateAllowed: true,
        backDateAllowed: false,
        weekendCounted: false,
        holidayCounted: false,
        negativeBalanceAllowed: false,
        carryForwardEnabled: false,
        carryForwardPercentage: 0,
        encashmentEnabled: false,
        encashmentPercentage: 0,
        manualAllocationAllowed: true,
        approvalRequired: true,
        approvalLevels: 1,
        autoApprove: false,
        notifyHR: true,
        notifyMaster: false,
        notifyManager: false,
        probationAllowed: false,
        requiresMedicalCertificate: false,
        requiresAttachment: false,
        resetEveryYear: true,
        monthlyAccrual: false,
        isActive: true,
        sortOrder: 0,
      });
    }
  }, [editType, reset]);

  const onSubmit = (values: LeaveTypeFormValues) => {
    if (editType) {
      update.mutate(
        { code: editType.code, data: values },
        {
          onSuccess: () => {
            toast.success("Leave type updated");
            onClose();
          },
          onError: (err) => toast.error(getErrorMessage(err)),
        },
      );
    } else {
      create.mutate(values, {
        onSuccess: () => {
          toast.success("Leave type created");
          onClose();
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editType ? "Edit Leave Type" : "Create Leave Type"}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={create.isPending || update.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="leave-type-form" loading={create.isPending || update.isPending}>
            {editType ? "Update" : "Create"}
          </Button>
        </>
      }
    >
      <form id="leave-type-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Basic */}
        <section className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-secondary">Basic</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" required error={errors.name?.message}>
              <Input {...register("name")} invalid={!!errors.name} placeholder="Annual Leave" />
            </Field>
            <Field label="Code" required error={errors.code?.message}>
              <Input
                {...register("code")}
                invalid={!!errors.code}
                placeholder="ANNUAL"
                disabled={!!editType}
              />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea {...register("description")} rows={2} placeholder="Optional description" />
            </Field>
            <Field label="Annual Allocation (days)" required error={errors.annualAllocation?.message}>
              <Input type="number" {...register("annualAllocation")} invalid={!!errors.annualAllocation} />
            </Field>
            <Field label="Sort Order" error={errors.sortOrder?.message}>
              <Input type="number" {...register("sortOrder")} />
            </Field>
          </div>
        </section>

        {/* Rules */}
        <section className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-secondary">Rules</h4>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Max Days / Request" error={errors.maxDaysPerRequest?.message}>
              <Input type="number" {...register("maxDaysPerRequest")} placeholder="—" />
            </Field>
            <Field label="Max Consecutive Days" error={errors.maximumConsecutiveDays?.message}>
              <Input type="number" {...register("maximumConsecutiveDays")} placeholder="—" />
            </Field>
            <Field label="Max Requests / Month" error={errors.maximumRequestsPerMonth?.message}>
              <Input type="number" {...register("maximumRequestsPerMonth")} placeholder="—" />
            </Field>
            <Field label="Min Notice Days" error={errors.minimumNoticeDays?.message}>
              <Input type="number" {...register("minimumNoticeDays")} placeholder="—" />
            </Field>
            <Field label="Back Date Limit (days)" error={errors.backDateLimitDays?.message}>
              <Input type="number" {...register("backDateLimitDays")} placeholder="—" />
            </Field>
            <Field label="Gender Restriction">
              <Select {...register("genderRestriction")}>
                <option value="">None</option>
                <option value="male">Male Only</option>
                <option value="female">Female Only</option>
              </Select>
            </Field>
          </div>
        </section>

        {/* Toggles */}
        <section className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-secondary">Options</h4>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {([
              ["isPaid", "Paid Leave"],
              ["halfDayAllowed", "Half Day Allowed"],
              ["futureDateAllowed", "Future Dates"],
              ["backDateAllowed", "Back Dating"],
              ["weekendCounted", "Count Weekends"],
              ["holidayCounted", "Count Holidays"],
              ["negativeBalanceAllowed", "Negative Balance"],
              ["carryForwardEnabled", "Carry Forward"],
              ["encashmentEnabled", "Encashment"],
              ["manualAllocationAllowed", "Manual Allocation"],
              ["approvalRequired", "Approval Required"],
              ["autoApprove", "Auto Approve"],
              ["notifyHR", "Notify HR"],
              ["notifyMaster", "Notify Master"],
              ["notifyManager", "Notify Manager"],
              ["probationAllowed", "Probation Allowed"],
              ["requiresMedicalCertificate", "Medical Certificate"],
              ["requiresAttachment", "Attachment Required"],
              ["resetEveryYear", "Reset Yearly"],
              ["monthlyAccrual", "Monthly Accrual"],
              ["isActive", "Active"],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  {...register(key)}
                  className="h-4 w-4 rounded border-border accent-accent"
                />
                {label}
              </label>
            ))}
          </div>
        </section>

        {/* Carry Forward & Encashment */}
        <section className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-secondary">
            Carry Forward &amp; Encashment
          </h4>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="CF Percentage" error={errors.carryForwardPercentage?.message}>
              <Input type="number" {...register("carryForwardPercentage")} />
            </Field>
            <Field label="CF Expiry Months" error={errors.carryForwardExpiryMonths?.message}>
              <Input type="number" {...register("carryForwardExpiryMonths")} placeholder="—" />
            </Field>
            <Field label="Max Carry Forward" error={errors.maxCarryForward?.message}>
              <Input type="number" {...register("maxCarryForward")} placeholder="—" />
            </Field>
            <Field label="Encashment %" error={errors.encashmentPercentage?.message}>
              <Input type="number" {...register("encashmentPercentage")} />
            </Field>
            <Field label="Approval Levels" error={errors.approvalLevels?.message}>
              <Input type="number" {...register("approvalLevels")} />
            </Field>
          </div>
        </section>
      </form>
    </Modal>
  );
}
