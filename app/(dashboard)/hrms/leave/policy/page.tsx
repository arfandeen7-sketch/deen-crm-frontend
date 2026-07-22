"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useLeavePolicy, useUpdateLeavePolicy } from "@/hooks/useHrms";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { AccessGuard } from "@/components/shared/Guards";
import { leavePolicySchema, type LeavePolicyFormValues } from "@/schemas/leave.schema";
import { getErrorMessage } from "@/lib/utils";
import { MONTH_NAMES } from "@/lib/leaveUtils";

export default function HrLeavePolicyPage() {
  const { data: policy, isLoading } = useLeavePolicy();
  const update = useUpdateLeavePolicy();
  const { canAction } = useAuth();
  const canEdit = canAction("hrms", "leave", "manage_policy");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeavePolicyFormValues>({
    resolver: zodResolver(leavePolicySchema) as never,
  });

  useEffect(() => {
    if (policy) {
      reset({
        financialYearStartMonth: policy.financialYearStartMonth,
        financialYearStartDay: policy.financialYearStartDay,
        minimumNoticeDays: policy.minimumNoticeDays,
        maximumFutureLeaveDays: policy.maximumFutureLeaveDays,
        maximumBackdatedLeaveDays: policy.maximumBackdatedLeaveDays,
        defaultCarryForwardPercentage: policy.defaultCarryForwardPercentage,
        defaultCarryForwardExpiryMonths: policy.defaultCarryForwardExpiryMonths,
        attendanceIntegrationEnabled: policy.attendanceIntegrationEnabled,
        payrollIntegrationEnabled: policy.payrollIntegrationEnabled,
        holidayCountedInLeave: policy.holidayCountedInLeave,
        weekendCountedInLeave: policy.weekendCountedInLeave,
      });
    }
  }, [policy, reset]);

  const onSubmit = (values: LeavePolicyFormValues) => {
    update.mutate(values, {
      onSuccess: () => toast.success("Leave policy updated"),
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  if (isLoading) {
    return (
      <AccessGuard module="hrms" page="leave">
        <p className="py-8 text-center text-sm text-foreground-muted">Loading policy…</p>
      </AccessGuard>
    );
  }

  return (
    <AccessGuard module="hrms" page="leave">
      <div className="space-y-6">
        <PageHeader
          title="Leave Policy"
          subtitle="Global leave policy configuration"
        />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Financial Year */}
          <Card>
            <CardHeader title="Financial Year" />
            <CardBody>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Start Month" required error={errors.financialYearStartMonth?.message}>
                  <Select {...register("financialYearStartMonth")}>
                    {MONTH_NAMES.map((m, i) => (
                      <option key={i} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Start Day" required error={errors.financialYearStartDay?.message}>
                  <Input type="number" min={1} max={31} {...register("financialYearStartDay")} />
                </Field>
              </div>
            </CardBody>
          </Card>

          {/* Leave Rules */}
          <Card>
            <CardHeader title="Leave Rules" />
            <CardBody>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Min Notice Days" required error={errors.minimumNoticeDays?.message}>
                  <Input type="number" min={0} {...register("minimumNoticeDays")} />
                </Field>
                <Field label="Max Future Days" error={errors.maximumFutureLeaveDays?.message}>
                  <Input type="number" {...register("maximumFutureLeaveDays")} placeholder="—" />
                </Field>
                <Field label="Max Backdated Days" error={errors.maximumBackdatedLeaveDays?.message}>
                  <Input type="number" {...register("maximumBackdatedLeaveDays")} placeholder="—" />
                </Field>
              </div>
            </CardBody>
          </Card>

          {/* Carry Forward */}
          <Card>
            <CardHeader title="Carry Forward Defaults" />
            <CardBody>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Default CF %" required error={errors.defaultCarryForwardPercentage?.message}>
                  <Input type="number" min={0} max={100} {...register("defaultCarryForwardPercentage")} />
                </Field>
                <Field label="Default CF Expiry Months" error={errors.defaultCarryForwardExpiryMonths?.message}>
                  <Input type="number" {...register("defaultCarryForwardExpiryMonths")} placeholder="—" />
                </Field>
              </div>
            </CardBody>
          </Card>

          {/* Integrations */}
          <Card>
            <CardHeader title="Integrations" />
            <CardBody>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" {...register("attendanceIntegrationEnabled")} className="h-4 w-4 rounded border-border accent-accent" />
                  Attendance Integration
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" {...register("payrollIntegrationEnabled")} className="h-4 w-4 rounded border-border accent-accent" />
                  Payroll Integration
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" {...register("holidayCountedInLeave")} className="h-4 w-4 rounded border-border accent-accent" />
                  Holidays Counted in Leave
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" {...register("weekendCountedInLeave")} className="h-4 w-4 rounded border-border accent-accent" />
                  Weekends Counted in Leave
                </label>
              </div>
            </CardBody>
          </Card>

          {canEdit && (
            <div className="flex justify-end">
              <Button type="submit" loading={update.isPending}>
                Save Policy
              </Button>
            </div>
          )}
        </form>
      </div>
    </AccessGuard>
  );
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="w-full rounded-[6px] border border-border bg-background px-4 py-2 text-sm text-foreground shadow-none focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
      {...props}
    >
      {children}
    </select>
  );
}
