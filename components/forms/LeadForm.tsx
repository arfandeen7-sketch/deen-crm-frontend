"use client";

import { useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  leadWithClientSchema,
  type LeadWithClientFormValues,
} from "@/schemas/lead.schema";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { useFieldOptions } from "@/hooks/useDynamicFields";
import { useAssignableUsers } from "@/hooks/useUsers";
import { useAuth } from "@/hooks/useAuth";
import { useBrokerOptions } from "@/hooks/useBrokers";
import { SERVICE_TYPES } from "@/constants";
import { toDatetimeLocal } from "@/lib/utils";
import { getEffectiveServiceType } from "@/lib/leadServiceType";
import type { Client, Lead, Tenant } from "@/types";

export function LeadForm({
  initial,
  initialClient,
  initialTenant,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial?: Lead;
  initialClient?: Client | null;
  initialTenant?: Tenant | null;
  submitting?: boolean;
  onSubmit: (values: LeadWithClientFormValues) => void;
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
  const { user, role } = useAuth();

  // Executives and managers can only work leads assigned to them, so the ones
  // they create default to themselves instead of "Unassigned". The backend
  // applies the same rule, this just keeps the form honest about it.
  const selfAssign = !initial && (role === "sales_executive" || role === "sales_manager");
  // Executives never hand a lead to someone else — they see who owns it, but
  // reassignment is a manager/master action.
  const assigneeLocked = role === "sales_executive";

  // The assignee dropdown only lists users the current role is allowed to
  // assign to, which for an executive is nobody. Without the lead's own
  // assignee in that list the Select has no option matching its value and
  // renders the raw user id, so seed the list with the people we already know.
  const assignableUsers = useMemo(() => {
    const byId = new Map<string, { id: string; fullName: string }>();
    if (initial?.assignedUser) {
      byId.set(initial.assignedUser.id, {
        id: initial.assignedUser.id,
        fullName: initial.assignedUser.fullName,
      });
    }
    if (user && (selfAssign || assigneeLocked)) {
      byId.set(user.id, { id: user.id, fullName: user.fullName });
    }
    users.forEach((u) => byId.set(u.id, { id: u.id, fullName: u.fullName }));
    return Array.from(byId.values());
  }, [initial?.assignedUser, user, selfAssign, assigneeLocked, users]);

  // Effective service type — for PF leads, derive from pfOfferingType when
  // the stored serviceType is the ingestion default "Buy". This makes the
  // dropdown show "Rent" for rental PF leads instead of the hardcoded "Buy".
  const effectiveServiceType = initial
    ? getEffectiveServiceType(initial)
    : "Buy";

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LeadWithClientFormValues>({
    resolver: zodResolver(leadWithClientSchema),
    defaultValues: {
      // Lead fields
      leadName: initial?.leadName ?? "",
      mobileNumber: initial?.mobileNumber ?? "",
      alternateMobile: initial?.alternateMobile ?? "",
      email: initial?.email ?? "",
      source: initial?.source ?? "",
      projectName: initial?.projectName ?? "",
      serviceType: effectiveServiceType,
      leadStatus: initial?.leadStatus ?? "Fresh",
      leadPriority: initial?.leadPriority ?? "",
      assignedTo: initial?.assignedTo ?? (selfAssign ? user?.id ?? "" : ""),
      brokerId: initial?.brokerId ?? "",
      followUpDate: toDatetimeLocal(initial?.followUpDate),
      followUpNote: initial?.followUpNote ?? "",
      city: initial?.city ?? "",
      locality: initial?.locality ?? "",
      unitNumber: initial?.unitNumber ?? "",
      price: initial?.price ?? "",
      propertySize: initial?.propertySize ?? "",
      configuration: initial?.configuration ?? "",
      comments: initial?.comments ?? "",
      // Client (Buyer) Detail fields — pre-fill from existing client record
      clientFullName:         initialClient?.fullName ?? "",
      clientMobileNumber:     initialClient?.mobileNumber ?? "",
      clientEmail:            initialClient?.email ?? "",
      clientDateOfBirth:      initialClient?.dateOfBirth
        ? initialClient.dateOfBirth.slice(0, 10)
        : "",
      clientPassportNumber:   initialClient?.passportNumber ?? "",
      clientEmiratesIdNumber: initialClient?.emiratesIdNumber ?? "",
      // Tenant Detail fields — pre-fill from existing tenant record
      tenantFullName:           initialTenant?.fullName ?? "",
      tenantMobileNumber:       initialTenant?.mobileNumber ?? "",
      tenantEmail:              initialTenant?.email ?? "",
      tenantDateOfBirth:        initialTenant?.dateOfBirth
        ? initialTenant.dateOfBirth.slice(0, 10)
        : "",
      tenantPassportNumber:     initialTenant?.passportNumber ?? "",
      tenantEmiratesIdNumber:   initialTenant?.emiratesIdNumber ?? "",
      tenantAgreementStartDate: initialTenant?.agreementStartDate
        ? initialTenant.agreementStartDate.slice(0, 10)
        : "",
      tenantAgreementEndDate:   initialTenant?.agreementEndDate
        ? initialTenant.agreementEndDate.slice(0, 10)
        : "",
    },
  });

  // Watch serviceType in real-time so the Buyer/Tenant section reacts to
  // dropdown changes without a page reload.
  const currentServiceType = watch("serviceType");
  const showTenantFields = currentServiceType?.toLowerCase() === "rent";

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
            <Field
              label="Assigned User"
              error={errors.assignedTo?.message}
              hint={assigneeLocked ? "Only a manager can reassign this lead" : undefined}
            >
              <Controller
                control={control}
                name="assignedTo"
                render={({ field }) => (
                  <Select
                    {...field}
                    value={field.value ?? ""}
                    disabled={assigneeLocked}
                    placeholder="Unassigned"
                  >
                    {!selfAssign && <option value="">Unassigned</option>}
                    {assignableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.id === user?.id ? `${u.fullName} (me)` : u.fullName}
                      </option>
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
          <Field label="Follow Up Note" error={errors.followUpNote?.message} className="mt-4">
            <Textarea
              placeholder="Optional note for this follow-up…"
              rows={3}
              {...register("followUpNote")}
            />
          </Field>
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

        {/* ── Buyer / Tenant Details (conditional on Service Type) ──────────── */}
        {showTenantFields ? (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 pb-1 border-b border-neutral-100">
              Tenant Details
              <span className="ml-2 font-normal normal-case tracking-normal text-neutral-400">(optional — saved separately from lead)</span>
            </h3>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Tenant Full Name" error={errors.tenantFullName?.message}>
                <Input placeholder="As per passport / Emirates ID" {...register("tenantFullName")} />
              </Field>
              <Field label="Tenant Mobile" error={errors.tenantMobileNumber?.message}>
                <Input placeholder="+9715XXXXXXXX" {...register("tenantMobileNumber")} />
              </Field>
              <Field label="Tenant Email" error={errors.tenantEmail?.message}>
                <Input type="email" placeholder="tenant@example.com" {...register("tenantEmail")} />
              </Field>
              <Field label="Date of Birth" error={errors.tenantDateOfBirth?.message}>
                <Input type="date" {...register("tenantDateOfBirth")} />
              </Field>
              <Field label="Passport Number" error={errors.tenantPassportNumber?.message}>
                <Input placeholder="e.g. A12345678" {...register("tenantPassportNumber")} />
              </Field>
              <Field label="Emirates ID Number" error={errors.tenantEmiratesIdNumber?.message}>
                <Input placeholder="784-XXXX-XXXXXXX-X" {...register("tenantEmiratesIdNumber")} />
              </Field>
              <Field label="Agreement Start Date" error={errors.tenantAgreementStartDate?.message}>
                <Input type="date" {...register("tenantAgreementStartDate")} />
              </Field>
              <Field label="Agreement End Date" error={errors.tenantAgreementEndDate?.message}>
                <Input type="date" {...register("tenantAgreementEndDate")} />
              </Field>
            </section>
            <p className="mt-2 text-xs text-neutral-400">
              Passport, Emirates ID, and Tenant Agreement documents can be uploaded from the lead detail page after saving.
            </p>
          </div>
        ) : (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 pb-1 border-b border-neutral-100">
              Buyer Details
              <span className="ml-2 font-normal normal-case tracking-normal text-neutral-400">(optional — saved separately from lead)</span>
            </h3>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Buyer Full Name" error={errors.clientFullName?.message}>
                <Input placeholder="As per passport / Emirates ID" {...register("clientFullName")} />
              </Field>
              <Field label="Buyer Mobile" error={errors.clientMobileNumber?.message}>
                <Input placeholder="+9715XXXXXXXX" {...register("clientMobileNumber")} />
              </Field>
              <Field label="Buyer Email" error={errors.clientEmail?.message}>
                <Input type="email" placeholder="buyer@example.com" {...register("clientEmail")} />
              </Field>
              <Field label="Date of Birth" error={errors.clientDateOfBirth?.message}>
                <Input type="date" {...register("clientDateOfBirth")} />
              </Field>
              <Field label="Passport Number" error={errors.clientPassportNumber?.message}>
                <Input placeholder="e.g. A12345678" {...register("clientPassportNumber")} />
              </Field>
              <Field label="Emirates ID Number" error={errors.clientEmiratesIdNumber?.message}>
                <Input placeholder="784-XXXX-XXXXXXX-X" {...register("clientEmiratesIdNumber")} />
              </Field>
            </section>
            <p className="mt-2 text-xs text-neutral-400">
              Passport and Emirates ID documents can be uploaded from the lead detail page after saving.
            </p>
          </div>
        )}
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
