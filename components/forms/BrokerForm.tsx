"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { brokerSchema, type BrokerFormValues } from "@/schemas/broker.schema";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import type { Broker } from "@/types";

export function BrokerForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial?: Broker;
  submitting?: boolean;
  onSubmit: (values: BrokerFormValues) => void;
  onCancel?: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BrokerFormValues>({
    resolver: zodResolver(brokerSchema),
    defaultValues: {
      brokerName: initial?.brokerName ?? "",
      companyName: initial?.companyName ?? "",
      mobileNumber: initial?.mobileNumber ?? "",
      status: initial?.status ?? "active",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Broker Name" required error={errors.brokerName?.message}>
          <Input invalid={!!errors.brokerName} {...register("brokerName")} />
        </Field>
        <Field label="Company Name" error={errors.companyName?.message}>
          <Input {...register("companyName")} />
        </Field>
        <Field label="Mobile Number" required error={errors.mobileNumber?.message}>
          <Input invalid={!!errors.mobileNumber} {...register("mobileNumber")} />
        </Field>
        <Field label="Status" error={errors.status?.message}>
          <Select {...register("status")}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </Select>
        </Field>
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={submitting}>
          {initial ? "Save Changes" : "Create Broker"}
        </Button>
      </div>
    </form>
  );
}
