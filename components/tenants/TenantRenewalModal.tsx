"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  RefreshCw,
  ArrowRightLeft,
  Check,
  Plus,
  Trash2,
  Building2,
  AlertCircle,
  User,
  Search,
  Loader2,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { useTenantPropertyMutations, useTenantAvailableProperties, type AvailableManualProperty } from "@/hooks/useTenants";
import { getErrorMessage } from "@/services/api/client";
import type { PropertyTenantSummary } from "@/types";

// ---- Minimal property info needed by the renewal modal -------------------
// Compatible with both ManualProperty and TenantOwnerManualPropertySummary.
export interface RenewalPropertyInfo {
  id: string;
  buildingName?: string | null;
  unitNumber?: string | null;
  community?: string | null;
  emirate?: string | null;
}

// ---- Schemas --------------------------------------------------------------

const renewalFormSchema = z.object({
  agreementStartDate: z.string().optional(),
  agreementEndDate: z.string().min(1, "New end date is required"),
  dateOfNotice: z.string().optional(),
  annualRent: z.string().optional(),
  securityDeposit: z.string().optional(),
  adminFee: z.string().optional(),
  commission: z.string().optional(),
  currency: z.string().optional(),
  modeOfPayment: z.string().optional(),
  numberOfCheques: z.string().optional(),
  cheques: z
    .array(
      z.object({
        chequeNumber: z.number(),
        chequeDate: z.string().optional(),
        amount: z.string().optional(),
        status: z.string().optional(),
      }),
    )
    .optional(),
});

const movePropertyFormSchema = renewalFormSchema.extend({
  newOwnerManualPropertyId: z.string().min(1, "Please select a property"),
});

type RenewalFormValues = z.infer<typeof renewalFormSchema>;
type MovePropertyFormValues = z.infer<typeof movePropertyFormSchema>;

// ---- Constants -----------------------------------------------------------

const CHEQUE_STATUSES = ["pending", "cleared", "bounced"];
type RenewalMode = "renew" | "move";

// ---- Props ---------------------------------------------------------------

interface TenantRenewalModalProps {
  tenant: PropertyTenantSummary;
  currentProperty: RenewalPropertyInfo;
  ownerId: string;
  open: boolean;
  onClose: () => void;
}

// ---- Component -----------------------------------------------------------

export function TenantRenewalModal({
  tenant,
  currentProperty,
  open,
  onClose,
}: TenantRenewalModalProps) {
  const [mode, setMode] = useState<RenewalMode>("renew");
  const [propertySearch, setPropertySearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { renewContract, moveProperty } = useTenantPropertyMutations();

  // Debounce the property search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(propertySearch), 350);
    return () => clearTimeout(t);
  }, [propertySearch]);

  // Fetch all available properties (all owners) when in move mode
  const { data: availableData, isLoading: availableLoading } =
    useTenantAvailableProperties(mode === "move" ? debouncedSearch || undefined : undefined);

  const availableProperties: AvailableManualProperty[] = (
    availableData?.data ?? []
  ).filter((p) => p.id !== currentProperty.id);

  // ---- Renew form --------------------------------------------------------
  const renewForm = useForm<RenewalFormValues>({
    resolver: zodResolver(renewalFormSchema),
    defaultValues: buildDefaults(tenant),
  });
  const {
    fields: renewFields,
    append: renewAppend,
    remove: renewRemove,
  } = useFieldArray({ control: renewForm.control, name: "cheques" });

  // ---- Move form ---------------------------------------------------------
  const moveForm = useForm<MovePropertyFormValues>({
    resolver: zodResolver(movePropertyFormSchema),
    defaultValues: { ...buildDefaults(tenant), newOwnerManualPropertyId: "" },
  });
  const {
    fields: moveFields,
    append: moveAppend,
    remove: moveRemove,
  } = useFieldArray({ control: moveForm.control, name: "cheques" });

  // Auto-calculate Date of Notice (end date - 100 days)
  const renewEnd = renewForm.watch("agreementEndDate");
  useEffect(() => {
    renewForm.setValue("dateOfNotice", renewEnd ? calcNotice(renewEnd) : "");
  }, [renewEnd, renewForm]);

  const moveEnd = moveForm.watch("agreementEndDate");
  useEffect(() => {
    moveForm.setValue("dateOfNotice", moveEnd ? calcNotice(moveEnd) : "");
  }, [moveEnd, moveForm]);

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setMode("renew");
      setPropertySearch("");
      setDebouncedSearch("");
      renewForm.reset(buildDefaults(tenant));
      moveForm.reset({ ...buildDefaults(tenant), newOwnerManualPropertyId: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ---- Submit handlers ---------------------------------------------------

  const handleRenew = useCallback(
    async (values: RenewalFormValues) => {
      try {
        await renewContract.mutateAsync({
          leadId: tenant.leadId,
          body: {
            newAgreementStartDate: values.agreementStartDate || undefined,
            newAgreementEndDate: values.agreementEndDate,
            dateOfNotice: values.dateOfNotice || undefined,
            annualRent: values.annualRent || undefined,
            securityDeposit: values.securityDeposit || undefined,
            adminFee: values.adminFee || undefined,
            commission: values.commission || undefined,
            currency: values.currency || undefined,
            modeOfPayment: values.modeOfPayment || undefined,
            numberOfCheques: values.numberOfCheques || undefined,
            cheques: values.cheques,
          },
        });
        toast.success("Contract renewed successfully.");
        onClose();
      } catch (e) {
        toast.error(getErrorMessage(e));
      }
    },
    [renewContract, tenant.leadId, onClose],
  );

  const handleMove = useCallback(
    async (values: MovePropertyFormValues) => {
      try {
        await moveProperty.mutateAsync({
          leadId: tenant.leadId,
          body: {
            newOwnerManualPropertyId: values.newOwnerManualPropertyId,
            newAgreementStartDate: values.agreementStartDate || undefined,
            newAgreementEndDate: values.agreementEndDate,
            dateOfNotice: values.dateOfNotice || undefined,
            annualRent: values.annualRent || undefined,
            securityDeposit: values.securityDeposit || undefined,
            adminFee: values.adminFee || undefined,
            commission: values.commission || undefined,
            currency: values.currency || undefined,
            modeOfPayment: values.modeOfPayment || undefined,
            numberOfCheques: values.numberOfCheques || undefined,
            cheques: values.cheques,
          },
        });
        toast.success("Tenant moved to new property successfully.");
        onClose();
      } catch (e) {
        toast.error(getErrorMessage(e));
      }
    },
    [moveProperty, tenant.leadId, onClose],
  );

  const isPending = renewContract.isPending || moveProperty.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Renew Tenant"
      description={`Renew the contract for ${tenant.fullName ?? "this tenant"}`}
      size="xl"
    >
      <div className="space-y-5">
        {/* Mode selector */}
        <div className="flex gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-1">
          <ModeTab
            active={mode === "renew"}
            icon={<RefreshCw className="h-4 w-4" />}
            label="Renew — Same Property"
            sublabel={propertyLabel(currentProperty)}
            onClick={() => setMode("renew")}
          />
          <ModeTab
            active={mode === "move"}
            icon={<ArrowRightLeft className="h-4 w-4" />}
            label="Move to Another Property"
            sublabel="Any owner's available unit"
            onClick={() => setMode("move")}
          />
        </div>

        {/* Renew mode */}
        {mode === "renew" && (
          <form
            onSubmit={renewForm.handleSubmit(handleRenew)}
            className="space-y-6"
          >
            <SharedFields
              form={renewForm}
              chequeFields={renewFields}
              onAppend={() =>
                renewAppend({
                  chequeNumber: renewFields.length + 1,
                  chequeDate: "",
                  amount: "",
                  status: "",
                })
              }
              onRemove={renewRemove}
            />
            <FormActions onCancel={onClose} loading={isPending} submitLabel="Renew Contract" />
          </form>
        )}

        {/* Move mode */}
        {mode === "move" && (
          <form
            onSubmit={moveForm.handleSubmit(handleMove)}
            className="space-y-6"
          >
            {/* Property picker */}
            <Section title="Select New Property">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by building, unit, community, or owner name..."
                  value={propertySearch}
                  onChange={(e) => setPropertySearch(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300"
                />
                {availableLoading && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                )}
              </div>

              {/* Results */}
              {!availableLoading && availableProperties.length === 0 ? (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                  <p className="text-sm text-amber-800">
                    {debouncedSearch
                      ? "No available properties match your search."
                      : "No available properties found across all owners."}
                  </p>
                </div>
              ) : (
                <Field
                  label="Available Property"
                  required
                  error={moveForm.formState.errors.newOwnerManualPropertyId?.message}
                >
                  <Select
                    {...moveForm.register("newOwnerManualPropertyId")}
                    size={Math.min(availableProperties.length + 1, 8)}
                    className="h-auto"
                  >
                    <option value="">Select a property...</option>
                    {availableProperties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {propertyLabel(p)}
                        {p.type || p.bedrooms ? ` — ${[p.bedrooms ? `${p.bedrooms} BR` : null, p.type].filter(Boolean).join(", ")}` : ""}
                        {" | "}
                        {p.owner.fullName}
                        {p.listingStatus !== "available" ? ` (${p.listingStatus})` : ""}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}

              {/* Preview card for selected property */}
              <SelectedPropertyPreview
                propertyId={moveForm.watch("newOwnerManualPropertyId")}
                properties={availableProperties}
              />
            </Section>

            {/* Info banner — current property will be released */}
            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
              <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold">Current property will be released</p>
                <p className="mt-0.5 text-blue-700">
                  {propertyLabel(currentProperty)} will be set back to &quot;Available&quot;.
                </p>
              </div>
            </div>

            <SharedFields
              form={moveForm}
              chequeFields={moveFields}
              onAppend={() =>
                moveAppend({
                  chequeNumber: moveFields.length + 1,
                  chequeDate: "",
                  amount: "",
                  status: "",
                })
              }
              onRemove={moveRemove}
            />
            <FormActions onCancel={onClose} loading={isPending} submitLabel="Move & Renew" />
          </form>
        )}
      </div>
    </Modal>
  );
}

// ---- Selected property preview card -------------------------------------

function SelectedPropertyPreview({
  propertyId,
  properties,
}: {
  propertyId: string;
  properties: AvailableManualProperty[];
}) {
  const selected = properties.find((p) => p.id === propertyId);
  if (!selected) return null;

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Building2 className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900">{propertyLabel(selected)}</p>
          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
            {selected.type && <span>{selected.type}</span>}
            {selected.bedrooms && <span>{selected.bedrooms} BR</span>}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-600">
            <User className="h-3 w-3 text-slate-400" />
            <span className="font-medium">{selected.owner.fullName}</span>
            {selected.owner.mobileNumber && (
              <span className="text-slate-400">· {selected.owner.mobileNumber}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Sub-components ------------------------------------------------------

function ModeTab({
  active,
  icon,
  label,
  sublabel,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  sublabel?: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center gap-2.5 rounded-md px-3 py-2.5 text-left transition-all ${
        active
          ? "bg-white shadow-sm ring-1 ring-neutral-200 text-slate-900"
          : "text-slate-500 hover:text-slate-700"
      }`}
    >
      <span className={active ? "text-slate-700" : "text-slate-400"}>{icon}</span>
      <div className="min-w-0">
        <p className={`text-xs font-semibold ${active ? "text-slate-900" : "text-slate-600"}`}>
          {label}
        </p>
        {sublabel && (
          <p className="truncate text-[11px] text-slate-400">{sublabel}</p>
        )}
      </div>
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
        {title}
      </p>
      {children}
    </div>
  );
}

function FormActions({
  onCancel,
  loading,
  submitLabel,
}: {
  onCancel: () => void;
  loading: boolean;
  submitLabel: string;
}) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" loading={loading}>
        <Check className="h-4 w-4" /> {submitLabel}
      </Button>
    </div>
  );
}

/** Shared agreement + financials + cheques fields used by both modes. */
function SharedFields({
  form,
  chequeFields,
  onAppend,
  onRemove,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chequeFields: any[];
  onAppend: () => void;
  onRemove: (index: number) => void;
}) {
  const { register, formState: { errors } } = form;

  return (
    <>
      <Section title="New Tenancy Agreement">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="New Start Date" error={errors.agreementStartDate?.message}>
            <Input type="date" {...register("agreementStartDate")} />
          </Field>
          <Field label="New End Date" required error={errors.agreementEndDate?.message}>
            <Input type="date" {...register("agreementEndDate")} />
          </Field>
          <Field
            label="Date of Notice"
            hint="Auto-calculated as 100 days before the end date."
            error={errors.dateOfNotice?.message}
          >
            <Input
              type="date"
              readOnly
              className="bg-neutral-50 text-slate-500"
              {...register("dateOfNotice")}
            />
          </Field>
        </div>
      </Section>

      <Section title="Rental Financials">
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
      </Section>

      <Section title="Cheque Schedule">
        <div className="space-y-3">
          {chequeFields.length === 0 && (
            <p className="text-sm text-slate-400">
              No cheques added yet. Click &quot;Add Cheque&quot; to create the cheque schedule.
            </p>
          )}
          {chequeFields.map((field: { id: string }, index: number) => (
            <div
              key={field.id}
              className="grid grid-cols-1 gap-3 rounded-lg border border-neutral-200 bg-neutral-50/50 p-3 sm:grid-cols-[40px_1fr_1fr_1fr_auto]"
            >
              <div className="flex items-center">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-xs font-bold text-neutral-700">
                  {index + 1}
                </span>
                <input
                  type="hidden"
                  value={index + 1}
                  {...register(`cheques.${index}.chequeNumber`)}
                />
              </div>
              <Field label="Cheque Date">
                <Input type="date" {...register(`cheques.${index}.chequeDate`)} />
              </Field>
              <Field label="Amount">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 21250"
                  {...register(`cheques.${index}.amount`)}
                />
              </Field>
              <Field label="Status">
                <Select {...register(`cheques.${index}.status`)}>
                  <option value="">None</option>
                  {CHEQUE_STATUSES.map((s) => (
                    <option key={s} value={s} className="capitalize">
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="flex items-end pb-1.5">
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="rounded p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                  title="Remove cheque"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={onAppend}>
            <Plus className="h-3.5 w-3.5" /> Add Cheque
          </Button>
        </div>
      </Section>
    </>
  );
}

// ---- Helpers -------------------------------------------------------------

function calcNotice(endDateStr: string): string {
  const d = new Date(endDateStr);
  if (isNaN(d.getTime())) return "";
  d.setDate(d.getDate() - 100);
  return d.toISOString().slice(0, 10);
}

function buildDefaults(tenant: PropertyTenantSummary): RenewalFormValues {
  return {
    agreementStartDate: tenant.agreementEndDate
      ? tenant.agreementEndDate.slice(0, 10)
      : "",
    agreementEndDate: "",
    dateOfNotice: "",
    annualRent: tenant.annualRent != null ? String(tenant.annualRent) : "",
    securityDeposit: tenant.securityDeposit != null ? String(tenant.securityDeposit) : "",
    adminFee: "",
    commission: tenant.commission != null ? String(tenant.commission) : "",
    currency: tenant.currency ?? "AED",
    modeOfPayment: tenant.modeOfPayment ?? "",
    numberOfCheques: tenant.numberOfCheques != null ? String(tenant.numberOfCheques) : "",
    cheques: [],
  };
}

function propertyLabel(p: RenewalPropertyInfo | AvailableManualProperty): string {
  const parts = [
    p.buildingName,
    p.unitNumber ? `Unit ${p.unitNumber}` : null,
    p.community,
    p.emirate,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : p.id.slice(0, 8);
}
