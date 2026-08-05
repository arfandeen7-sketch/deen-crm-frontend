"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadSchema, type LeadFormValues } from "@/schemas/lead.schema";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { useFieldOptions } from "@/hooks/useDynamicFields";
import { useAssignableUsers } from "@/hooks/useUsers";
import { useBrokerOptions } from "@/hooks/useBrokers";
import { SERVICE_TYPES } from "@/constants";
import { toDatetimeLocal } from "@/lib/utils";
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
  const isPFLead = initial?.ingestionSource === "property_finder";

  const sources = useFieldOptions("source");
  const statuses = useFieldOptions("lead_status");
  const priorities = useFieldOptions("lead_priority");
  const projects = useFieldOptions("project_name");
  const configurations = useFieldOptions("configuration");
  const { users } = useAssignableUsers();
  const brokers = useBrokerOptions();

  const {
    register,
    control,
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
      followUpDate: toDatetimeLocal(initial?.followUpDate),
      city: initial?.city ?? "",
      locality: initial?.locality ?? "",
      unitNumber: initial?.unitNumber ?? "",
      price: initial?.price ?? "",
      propertySize: initial?.propertySize ?? "",
      configuration: initial?.configuration ?? "",
      comments: initial?.comments ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 pb-1 border-b border-neutral-100">Client Information</h3>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Lead Name" required error={errors.leadName?.message}>
              <Input placeholder="Full name" invalid={!!errors.leadName} {...register("leadName")} />
            </Field>
            <Field
              label="Mobile Number"
              required
              error={errors.mobileNumber?.message}
              hint={isPFLead ? "Locked — imported from Property Finder" : undefined}
            >
              <Input
                placeholder="+9715XXXXXXXX"
                invalid={!!errors.mobileNumber}
                readOnly={isPFLead}
                className={isPFLead ? "bg-neutral-50 text-neutral-500 cursor-not-allowed select-none" : undefined}
                {...register("mobileNumber")}
              />
            </Field>
            <Field label="Alternate Mobile" error={errors.alternateMobile?.message}>
              <Input placeholder="Optional" {...register("alternateMobile")} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <Input type="email" placeholder="name@example.com" {...register("email")} />
            </Field>
          </section>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 pb-1 border-b border-neutral-100">Lead Attributes & Assignment</h3>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Source" required error={errors.source?.message}>
              <Controller
                control={control}
                name="source"
                render={({ field }) => (
                  <Select invalid={!!errors.source} {...field}>
                    <option value="">Select source</option>
                    {sources.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>
                )}
              />
            </Field>
            <Field label="Project" error={errors.projectName?.message}>
              <Controller
                control={control}
                name="projectName"
                render={({ field }) => (
                  <Select {...field}>
                    <option value="">Select project</option>
                    {projects.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </Select>
                )}
              />
            </Field>
            <Field label="Service Type" required error={errors.serviceType?.message}>
              <Select invalid={!!errors.serviceType} {...register("serviceType")}>
                {SERVICE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </Field>
            <Field label="Lead Status" required error={errors.leadStatus?.message}>
              <Controller
                control={control}
                name="leadStatus"
                render={({ field }) => (
                  <Select invalid={!!errors.leadStatus} {...field}>
                    {statuses.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>
                )}
              />
            </Field>
            <Field label="Lead Priority" error={errors.leadPriority?.message}>
              <Controller
                control={control}
                name="leadPriority"
                render={({ field }) => (
                  <Select {...field}>
                    <option value="">Select priority</option>
                    {priorities.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </Select>
                )}
              />
            </Field>
            <Field label="Follow Up Date &amp; Time" error={errors.followUpDate?.message}>
              <Input type="datetime-local" {...register("followUpDate")} />
            </Field>
            <Field label="Assigned User" error={errors.assignedTo?.message}>
              <Controller
                control={control}
                name="assignedTo"
                render={({ field }) => (
                  <Select
                    {...field}
                    value={field.value ?? ""}
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.fullName}</option>
                    ))}
                  </Select>
                )}
              />
            </Field>
            <Field label="Broker" error={errors.brokerId?.message}>
              <Controller
                control={control}
                name="brokerId"
                render={({ field }) => (
                  <Select {...field}>
                    <option value="">No broker</option>
                    {brokers.map((b) => (
                      <option key={b.id} value={b.id}>{b.brokerName}</option>
                    ))}
                  </Select>
                )}
              />
            </Field>
          </section>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 pb-1 border-b border-neutral-100">Property Details</h3>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="City" error={errors.city?.message}>
              <Input placeholder="e.g. Dubai" {...register("city")} />
            </Field>
            <Field label="Locality" error={errors.locality?.message}>
              <Input placeholder="e.g. Business Bay" {...register("locality")} />
            </Field>
            <Field label="Unit Number" error={errors.unitNumber?.message}>
              <Input placeholder="e.g. 1204" {...register("unitNumber")} />
            </Field>
            <Field label="Price (AED)" error={errors.price?.message}>
              <Input type="text" placeholder="e.g. 1500000" {...register("price")} />
            </Field>
            <Field label="Property Size (sqft)" error={errors.propertySize?.message}>
              <Input type="text" placeholder="e.g. 850" {...register("propertySize")} />
            </Field>
            <Field label="Configuration" error={errors.configuration?.message}>
              <Controller
                control={control}
                name="configuration"
                render={({ field }) => (
                  <Select {...field}>
                    <option value="">Select config</option>
                    {configurations.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                )}
              />
            </Field>
          </section>
        </div>

        <Field label="Comments" error={errors.comments?.message}>
          <Textarea placeholder="Notes about this lead…" {...register("comments")} />
        </Field>
      </div>

      <div className="flex items-center justify-end gap-2.5 border-t border-neutral-100 pt-4">
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
