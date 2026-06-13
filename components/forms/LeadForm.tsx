"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadSchema, type LeadFormValues } from "@/schemas/lead.schema";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { useFieldOptions } from "@/hooks/useDynamicFields";
import { useAssignableUsers } from "@/hooks/useUsers";
import { useBrokerOptions } from "@/hooks/useBrokers";
import { SERVICE_TYPES } from "@/constants";
import type { Lead } from "@/types";

export function LeadForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial?: Lead;
  submitting?: boolean;
  onSubmit: (values: LeadFormValues) => void;
  onCancel?: () => void;
}) {
  const sources = useFieldOptions("source");
  const statuses = useFieldOptions("lead_status");
  const priorities = useFieldOptions("lead_priority");
  const projects = useFieldOptions("project_name");
  const { users } = useAssignableUsers();
  const brokers = useBrokerOptions();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      leadName: initial?.leadName ?? "",
      mobileNumber: initial?.mobileNumber ?? "",
      alternateMobile: initial?.alternateMobile ?? "",
      email: initial?.email ?? "",
      source: initial?.source ?? "",
      projectName: initial?.projectName ?? "",
      serviceType: initial?.serviceType ?? "Buy",
      leadStatus: initial?.leadStatus ?? "Fresh",
      leadPriority: initial?.leadPriority ?? "",
      assignedTo: initial?.assignedTo ?? "",
      brokerId: initial?.brokerId ?? "",
      followUpDate: initial?.followUpDate?.slice(0, 10) ?? "",
      city: initial?.city ?? "",
      locality: initial?.locality ?? "",
      comments: initial?.comments ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Lead Name" required error={errors.leadName?.message}>
          <Input placeholder="Full name" invalid={!!errors.leadName} {...register("leadName")} />
        </Field>
        <Field label="Mobile Number" required error={errors.mobileNumber?.message}>
          <Input placeholder="+9715XXXXXXXX" invalid={!!errors.mobileNumber} {...register("mobileNumber")} />
        </Field>
        <Field label="Alternate Mobile" error={errors.alternateMobile?.message}>
          <Input placeholder="Optional" {...register("alternateMobile")} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" placeholder="name@example.com" {...register("email")} />
        </Field>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Source" required error={errors.source?.message}>
          <Select invalid={!!errors.source} {...register("source")}>
            <option value="">Select source</option>
            {sources.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </Field>
        <Field label="Project" error={errors.projectName?.message}>
          <Select {...register("projectName")}>
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
        </Field>
        <Field label="Service Type" required error={errors.serviceType?.message}>
          <Select invalid={!!errors.serviceType} {...register("serviceType")}>
            {SERVICE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </Field>
        <Field label="Lead Status" required error={errors.leadStatus?.message}>
          <Select invalid={!!errors.leadStatus} {...register("leadStatus")}>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </Field>
        <Field label="Lead Priority" error={errors.leadPriority?.message}>
          <Select {...register("leadPriority")}>
            <option value="">Select priority</option>
            {priorities.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
        </Field>
        <Field label="Follow Up Date" error={errors.followUpDate?.message}>
          <Input type="date" {...register("followUpDate")} />
        </Field>
        <Field label="Assigned User" error={errors.assignedTo?.message}>
          <Select {...register("assignedTo")}>
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.fullName}</option>
            ))}
          </Select>
        </Field>
        <Field label="Broker" error={errors.brokerId?.message}>
          <Select {...register("brokerId")}>
            <option value="">No broker</option>
            {brokers.map((b) => (
              <option key={b.id} value={b.id}>{b.brokerName}</option>
            ))}
          </Select>
        </Field>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="City" error={errors.city?.message}>
          <Input placeholder="e.g. Dubai" {...register("city")} />
        </Field>
        <Field label="Locality" error={errors.locality?.message}>
          <Input placeholder="e.g. Business Bay" {...register("locality")} />
        </Field>
      </section>

      <Field label="Comments" error={errors.comments?.message}>
        <Textarea placeholder="Notes about this lead…" {...register("comments")} />
      </Field>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={submitting}>
          {initial ? "Save Changes" : "Create Lead"}
        </Button>
      </div>
    </form>
  );
}
