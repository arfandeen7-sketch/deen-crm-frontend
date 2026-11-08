"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Check, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { useTenantMutations } from "@/hooks/useTenants";
import { useOwner } from "@/hooks/useOwners";
import { getErrorMessage } from "@/services/api/client";
import { tenantSchema, type TenantFormValues } from "@/schemas/tenant.schema";
import type { Tenant } from "@/types";

interface TenantEditFormProps {
  leadId: string;
  tenant: Tenant;
  open: boolean;
  onClose: () => void;
}

const CHEQUE_STATUSES = ["pending", "cleared", "bounced"];

export function TenantEditForm({ leadId, tenant, open, onClose }: TenantEditFormProps) {
  const { upsert } = useTenantMutations(leadId);

  // Fetch the linked owner's properties for the property selector
  const { data: ownerData } = useOwner(tenant.ownerId ?? "");

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "cheques",
  });

  // Populate form whenever the tenant data changes or modal opens
  useEffect(() => {
    if (open) {
      reset({
        fullName:              tenant.fullName ?? "",
        mobileNumber:          tenant.mobileNumber ?? "",
        email:                 tenant.email ?? "",
        dateOfBirth:           tenant.dateOfBirth ? tenant.dateOfBirth.slice(0, 10) : "",
        tenantNationality:     tenant.tenantNationality ?? "",
        passportNumber:        tenant.passportNumber ?? "",
        emiratesIdNumber:      tenant.emiratesIdNumber ?? "",
        agreementStartDate:    tenant.agreementStartDate ? tenant.agreementStartDate.slice(0, 10) : "",
        agreementEndDate:      tenant.agreementEndDate ? tenant.agreementEndDate.slice(0, 10) : "",
        dateOfNotice:          tenant.dateOfNotice ? tenant.dateOfNotice.slice(0, 10) : "",
        ownerId:               tenant.ownerId ?? "",
        ownerPropertyId:       tenant.ownerPropertyId ?? "",
        ownerManualPropertyId: tenant.ownerManualPropertyId ?? "",
        annualRent:            tenant.annualRent != null ? String(tenant.annualRent) : "",
        securityDeposit:       tenant.securityDeposit != null ? String(tenant.securityDeposit) : "",
        adminFee:              tenant.adminFee != null ? String(tenant.adminFee) : "",
        commission:            tenant.commission != null ? String(tenant.commission) : "",
        currency:              tenant.currency ?? "",
        modeOfPayment:         tenant.modeOfPayment ?? "",
        numberOfCheques:       tenant.numberOfCheques != null ? String(tenant.numberOfCheques) : "",
        cheques: (tenant.cheques ?? []).map((c) => ({
          chequeNumber: c.chequeNumber,
          chequeDate:   c.chequeDate ? c.chequeDate.slice(0, 10) : "",
          amount:       c.amount != null ? String(c.amount) : "",
          status:       c.status ?? "",
        })),
      });
    }
  }, [open, tenant, reset]);

  // Auto-calculate Date of Notice = Agreement End Date − 100 days
  const agreementEndDate = watch("agreementEndDate");
  useEffect(() => {
    if (agreementEndDate) {
      const end = new Date(agreementEndDate);
      if (!isNaN(end.getTime())) {
        const notice = new Date(end);
        notice.setDate(notice.getDate() - 100);
        setValue("dateOfNotice", notice.toISOString().slice(0, 10));
      }
    } else {
      setValue("dateOfNotice", "");
    }
  }, [agreementEndDate, setValue]);

  async function onSubmit(values: TenantFormValues) {
    try {
      await upsert.mutateAsync(values);
      toast.success("Tenant details updated.");
      onClose();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  // Build property options from the linked owner
  const ownerProperties = ownerData?.properties ?? [];
  const ownerManualProperties = ownerData?.manualProperties ?? [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Tenant Details"
      description="Update tenant personal, rental, property, and cheque information."
      size="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ── Personal Information ─────────────────────────────────────── */}
        <FormSection title="Personal Information">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Tenant Name" error={errors.fullName?.message}>
              <Input placeholder="As per ID" {...register("fullName")} />
            </Field>
            <Field label="Phone Number" error={errors.mobileNumber?.message}>
              <Input placeholder="+9715XXXXXXXX" {...register("mobileNumber")} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <Input type="email" placeholder="tenant@example.com" {...register("email")} />
            </Field>
            <Field label="Date of Birth" error={errors.dateOfBirth?.message}>
              <Input type="date" {...register("dateOfBirth")} />
            </Field>
            <Field label="Nationality" error={errors.tenantNationality?.message}>
              <Input placeholder="e.g. Indian, British, Emirati" {...register("tenantNationality")} />
            </Field>
          </div>
        </FormSection>

        {/* ── Identity Documents ───────────────────────────────────────── */}
        <FormSection title="Identity Information">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Passport Number" error={errors.passportNumber?.message}>
              <Input placeholder="e.g. A12345678" {...register("passportNumber")} />
            </Field>
            <Field label="Emirates ID Number" error={errors.emiratesIdNumber?.message}>
              <Input placeholder="784-XXXX-XXXXXXX-X" {...register("emiratesIdNumber")} />
            </Field>
          </div>
        </FormSection>

        {/* ── Owner & Property Link ────────────────────────────────────── */}
        <FormSection title="Owner & Property Link">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Owner" error={errors.ownerId?.message}>
              <Select {...register("ownerId")}>
                <option value="">— No owner linked —</option>
                {tenant.owner && (
                  <option value={tenant.owner.id}>
                    {tenant.owner.fullName} ({tenant.owner.mobileNumber})
                  </option>
                )}
              </Select>
            </Field>
            <Field label="Property (Manual Portfolio)" error={errors.ownerManualPropertyId?.message}>
              <Select {...register("ownerManualPropertyId")}>
                <option value="">— No property linked —</option>
                {ownerManualProperties.map((mp) => (
                  <option key={mp.id} value={mp.id}>
                    {mp.buildingName ?? "Unknown Building"}
                    {mp.unitNumber ? ` — Unit ${mp.unitNumber}` : ""}
                    {mp.community ? `, ${mp.community}` : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Property (PF/Pocket-Linked)" error={errors.ownerPropertyId?.message}>
              <Select {...register("ownerPropertyId")}>
                <option value="">— No PF property linked —</option>
                {ownerProperties.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.projectName}
                    {op.unitNumber ? ` — Unit ${op.unitNumber}` : ""}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </FormSection>

        {/* ── Tenancy Agreement ────────────────────────────────────────── */}
        <FormSection title="Tenancy Agreement">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Agreement Start Date" error={errors.agreementStartDate?.message}>
              <Input type="date" {...register("agreementStartDate")} />
            </Field>
            <Field label="Agreement End Date" error={errors.agreementEndDate?.message}>
              <Input type="date" {...register("agreementEndDate")} />
            </Field>
            <Field
              label="Date of Notice"
              error={errors.dateOfNotice?.message}
              hint="Auto-calculated as 100 days before the agreement end date."
            >
              <Input
                type="date"
                readOnly
                className="bg-neutral-50 text-slate-500"
                {...register("dateOfNotice")}
              />
            </Field>
          </div>
        </FormSection>

        {/* ── Rental Financials ────────────────────────────────────────── */}
        <FormSection title="Rental Financials">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Annual Rent" error={errors.annualRent?.message}>
              <Input type="number" step="0.01" placeholder="e.g. 85000" {...register("annualRent")} />
            </Field>
            <Field label="Security Deposit" error={errors.securityDeposit?.message}>
              <Input type="number" step="0.01" placeholder="e.g. 5000" {...register("securityDeposit")} />
            </Field>
            <Field label="Admin Fee" error={errors.adminFee?.message}>
              <Input type="number" step="0.01" placeholder="e.g. 1000" {...register("adminFee")} />
            </Field>
            <Field label="Commission" error={errors.commission?.message}>
              <Input type="number" step="0.01" placeholder="e.g. 4250" {...register("commission")} />
            </Field>
            <Field label="Currency" error={errors.currency?.message}>
              <Input placeholder="AED" {...register("currency")} />
            </Field>
            <Field label="Number of Cheques" error={errors.numberOfCheques?.message}>
              <Input type="number" placeholder="e.g. 4" {...register("numberOfCheques")} />
            </Field>
            <Field label="Mode of Payment" error={errors.modeOfPayment?.message}>
              <Input placeholder="e.g. 4 cheques" {...register("modeOfPayment")} />
            </Field>
          </div>
        </FormSection>

        {/* ── Cheque Schedule ──────────────────────────────────────────── */}
        <FormSection title="Cheque Schedule">
          <div className="space-y-3">
            {fields.length === 0 && (
              <p className="text-sm text-slate-400">
                No cheques added yet. Click &quot;Add Cheque&quot; to create the cheque schedule.
              </p>
            )}
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-1 gap-3 rounded-lg border border-neutral-200 bg-neutral-50/50 p-3 sm:grid-cols-[40px_1fr_1fr_1fr_auto]"
              >
                {/* Cheque number (read-only badge) */}
                <div className="flex items-center">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-xs font-bold text-neutral-700">
                    {index + 1}
                  </span>
                  <input type="hidden" value={index + 1} {...register(`cheques.${index}.chequeNumber` as const)} />
                </div>
                <Field label="Cheque Date">
                  <Input type="date" {...register(`cheques.${index}.chequeDate` as const)} />
                </Field>
                <Field label="Amount">
                  <Input type="number" step="0.01" placeholder="e.g. 21250" {...register(`cheques.${index}.amount` as const)} />
                </Field>
                <Field label="Status">
                  <Select {...register(`cheques.${index}.status` as const)}>
                    <option value="">— None —</option>
                    {CHEQUE_STATUSES.map((s) => (
                      <option key={s} value={s} className="capitalize">{s}</option>
                    ))}
                  </Select>
                </Field>
                <div className="flex items-end pb-1.5">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="rounded p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                    title="Remove cheque"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ chequeNumber: fields.length + 1, chequeDate: "", amount: "", status: "" })}
            >
              <Plus className="h-3.5 w-3.5" /> Add Cheque
            </Button>
          </div>
        </FormSection>

        {/* ── Actions ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={upsert.isPending}>
            <Check className="h-4 w-4" /> Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Form section wrapper ──────────────────────────────────────────────────────

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold text-neutral-500">
        {title}
      </p>
      {children}
    </div>
  );
}
