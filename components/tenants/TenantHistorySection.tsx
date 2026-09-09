"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  History,
  ChevronDown,
  ChevronUp,
  Building2,
  User,
  CalendarClock,
  DollarSign,
  Receipt,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Trash2,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select } from "@/components/ui/Input";
import { useTenantHistory, useTenantPropertyMutations } from "@/hooks/useTenants";
import { getErrorMessage } from "@/services/api/client";
import { formatDate, formatCurrency, formatDateTime } from "@/lib/utils";
import type { TenantAgreementHistory, TenantAgreementHistoryCheque } from "@/types";

// ---- Schema ---------------------------------------------------------------

const historyFormSchema = z.object({
  agreementStartDate: z.string().optional(),
  agreementEndDate: z.string().optional(),
  dateOfNotice: z.string().optional(),
  propertySnapshot: z.string().optional(),
  ownerName: z.string().optional(),
  annualRent: z.string().optional(),
  securityDeposit: z.string().optional(),
  adminFee: z.string().optional(),
  commission: z.string().optional(),
  currency: z.string().optional(),
  modeOfPayment: z.string().optional(),
  numberOfCheques: z.string().optional(),
  cheques: z.array(
    z.object({
      chequeNumber: z.number(),
      chequeDate: z.string().optional(),
      amount: z.string().optional(),
      status: z.string().optional(),
    }),
  ),
});

type HistoryFormValues = z.infer<typeof historyFormSchema>;

const CHEQUE_STATUSES = ["pending", "cleared", "bounced"];

// ---- Props ----------------------------------------------------------------

interface TenantHistorySectionProps {
  leadId: string;
}

// ---- Main component -------------------------------------------------------

export function TenantHistorySection({ leadId }: TenantHistorySectionProps) {
  const { data: history, isLoading } = useTenantHistory(leadId);
  const [showAddModal, setShowAddModal] = useState(false);

  // Sort by agreement year ascending (oldest first) — safety net on top of
  // the backend sort, so manually-added older records land in the right spot.
  const sortedHistory = (history ?? []).slice().sort((a, b) => {
    const ya = getAgreementYear(a);
    const yb = getAgreementYear(b);
    if (ya == null && yb == null) return a.periodNumber - b.periodNumber;
    if (ya == null) return 1;  // nulls last
    if (yb == null) return -1;
    return ya - yb;
  });

  const count = sortedHistory.length;

  return (
    <>
      <Card>
        <CardHeader
          title="Agreement History"
          subtitle={
            count > 0
              ? `${count} completed period${count > 1 ? "s" : ""}`
              : "No previous records yet"
          }
          action={
            <div className="flex items-center gap-2">
              {count > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <History className="h-3.5 w-3.5" /> Oldest first
                </span>
              )}
              <Button size="sm" variant="outline" onClick={() => setShowAddModal(true)}>
                <Plus className="h-3.5 w-3.5" /> Add Previous Record
              </Button>
            </div>
          }
        />
        <CardBody className="!p-0">
          {isLoading ? (
            <div className="px-5 py-8 text-center text-sm text-slate-400">
              Loading history...
            </div>
          ) : count === 0 ? (
            <div className="px-5 py-8 text-center">
              <History className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm text-slate-400">
                No previous agreement records. Click &quot;Add Previous Record&quot;
                to manually enter past tenancy details.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {sortedHistory.map((period, idx) => (
                <PeriodRow
                  key={period.id}
                  period={period}
                  isLast={idx === sortedHistory.length - 1}
                />
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {showAddModal && (
        <AddHistoryModal
          leadId={leadId}
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </>
  );
}

// ---- Add History Modal ----------------------------------------------------

function AddHistoryModal({
  leadId,
  open,
  onClose,
}: {
  leadId: string;
  open: boolean;
  onClose: () => void;
}) {
  const { createHistory } = useTenantPropertyMutations();

  const form = useForm<HistoryFormValues>({
    resolver: zodResolver(historyFormSchema),
    defaultValues: {
      agreementStartDate: "",
      agreementEndDate: "",
      dateOfNotice: "",
      propertySnapshot: "",
      ownerName: "",
      annualRent: "",
      securityDeposit: "",
      adminFee: "",
      commission: "",
      currency: "AED",
      modeOfPayment: "",
      numberOfCheques: "",
      cheques: [],
    },
  });

  const {
    fields: chequeFields,
    append: chequeAppend,
    remove: chequeRemove,
  } = useFieldArray({ control: form.control, name: "cheques" });

  // Auto-calculate Date of Notice (end date - 100 days)
  const endDate = form.watch("agreementEndDate");
  useState(() => {
    form.setValue("dateOfNotice", endDate ? calcNotice(endDate) : "");
  });
  // Use useEffect-like approach via watch + setValue on render
  if (endDate) {
    const computed = calcNotice(endDate);
    const current = form.getValues("dateOfNotice");
    if (computed !== current) {
      form.setValue("dateOfNotice", computed);
    }
  }

  async function onSubmit(values: HistoryFormValues) {
    try {
      await createHistory.mutateAsync({
        leadId,
        body: {
          agreementStartDate: values.agreementStartDate || undefined,
          agreementEndDate: values.agreementEndDate || undefined,
          dateOfNotice: values.dateOfNotice || undefined,
          propertySnapshot: values.propertySnapshot || undefined,
          ownerName: values.ownerName || undefined,
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
      toast.success("Previous record added successfully.");
      form.reset();
      onClose();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Previous Agreement Record"
      description="Manually enter details of a past tenancy period."
      size="xl"
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Property & Owner */}
        <Section title="Property & Owner">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Property Label"
              hint="e.g. Marina Towers, Unit 4B, Dubai Marina"
              error={form.formState.errors.propertySnapshot?.message}
            >
              <Input
                placeholder="Building, unit, community..."
                {...form.register("propertySnapshot")}
              />
            </Field>
            <Field label="Owner Name" error={form.formState.errors.ownerName?.message}>
              <Input placeholder="Owner full name" {...form.register("ownerName")} />
            </Field>
          </div>
        </Section>

        {/* Agreement Dates */}
        <Section title="Agreement Dates">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field
              label="Start Date"
              error={form.formState.errors.agreementStartDate?.message}
            >
              <Input type="date" {...form.register("agreementStartDate")} />
            </Field>
            <Field
              label="End Date"
              error={form.formState.errors.agreementEndDate?.message}
            >
              <Input type="date" {...form.register("agreementEndDate")} />
            </Field>
            <Field
              label="Date of Notice"
              hint="Auto-calculated as 100 days before the end date."
              error={form.formState.errors.dateOfNotice?.message}
            >
              <Input
                type="date"
                readOnly
                className="bg-neutral-50 text-slate-500"
                {...form.register("dateOfNotice")}
              />
            </Field>
          </div>
        </Section>

        {/* Financials */}
        <Section title="Rental Financials">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Annual Rent" error={form.formState.errors.annualRent?.message}>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 85000"
                {...form.register("annualRent")}
              />
            </Field>
            <Field
              label="Security Deposit"
              error={form.formState.errors.securityDeposit?.message}
            >
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 5000"
                {...form.register("securityDeposit")}
              />
            </Field>
            <Field label="Admin Fee" error={form.formState.errors.adminFee?.message}>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 1000"
                {...form.register("adminFee")}
              />
            </Field>
            <Field label="Commission" error={form.formState.errors.commission?.message}>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 4250"
                {...form.register("commission")}
              />
            </Field>
            <Field label="Currency" error={form.formState.errors.currency?.message}>
              <Input placeholder="AED" {...form.register("currency")} />
            </Field>
            <Field
              label="Number of Cheques"
              error={form.formState.errors.numberOfCheques?.message}
            >
              <Input
                type="number"
                placeholder="e.g. 4"
                {...form.register("numberOfCheques")}
              />
            </Field>
            <Field
              label="Mode of Payment"
              error={form.formState.errors.modeOfPayment?.message}
            >
              <Input
                placeholder="e.g. 4 cheques"
                {...form.register("modeOfPayment")}
              />
            </Field>
          </div>
        </Section>

        {/* Cheque Schedule */}
        <Section title="Cheque Schedule">
          <div className="space-y-3">
            {chequeFields.length === 0 && (
              <p className="text-sm text-slate-400">
                No cheques added yet. Click &quot;Add Cheque&quot; to create the
                cheque schedule.
              </p>
            )}
            {chequeFields.map((field, index) => (
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
                    {...form.register(`cheques.${index}.chequeNumber`)}
                  />
                </div>
                <Field label="Cheque Date">
                  <Input type="date" {...form.register(`cheques.${index}.chequeDate`)} />
                </Field>
                <Field label="Amount">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 21250"
                    {...form.register(`cheques.${index}.amount`)}
                  />
                </Field>
                <Field label="Status">
                  <Select {...form.register(`cheques.${index}.status`)}>
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
                    onClick={() => chequeRemove(index)}
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
              onClick={() =>
                chequeAppend({
                  chequeNumber: chequeFields.length + 1,
                  chequeDate: "",
                  amount: "",
                  status: "",
                })
              }
            >
              <Plus className="h-3.5 w-3.5" /> Add Cheque
            </Button>
          </div>
        </Section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={createHistory.isPending}>
            <CheckCircle2 className="h-4 w-4" /> Save Record
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ---- Period row (collapsible) ---------------------------------------------

function PeriodRow({
  period,
  isLast,
}: {
  period: TenantAgreementHistory;
  isLast: boolean;
}) {
  const [open, setOpen] = useState(isLast);

  const daysLabel = durationLabel(period.agreementStartDate, period.agreementEndDate);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left transition-colors hover:bg-neutral-50"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Year badge */}
          {(() => {
            const year = getAgreementYear(period);
            return year != null ? (
              <span className="flex h-7 shrink-0 items-center rounded-md bg-indigo-50 px-2 text-xs font-bold text-indigo-600 ring-1 ring-inset ring-indigo-600/20">
                {year}
              </span>
            ) : (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                {period.periodNumber}
              </span>
            );
          })()}
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800">
              Period {period.periodNumber}
              {isLast && (
                <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                  Most Recent
                </span>
              )}
            </p>
            <p className="truncate text-xs text-slate-400">
              {formatDate(period.agreementStartDate)} &rarr; {formatDate(period.agreementEndDate)}
              {daysLabel ? ` (${daysLabel})` : ""}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          {period.annualRent != null && (
            <span className="hidden text-xs font-medium text-slate-700 sm:block">
              {formatCurrency(Number(period.annualRent))} / yr
            </span>
          )}
          {period.propertySnapshot && (
            <span className="hidden max-w-[180px] truncate text-xs text-slate-500 md:block">
              {period.propertySnapshot}
            </span>
          )}
          {open ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>

      {open && (
        <div className="space-y-4 border-t border-neutral-100 bg-neutral-50/50 px-5 py-4">
          {(period.propertySnapshot || period.ownerName) && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {period.propertySnapshot && (
                <InfoItem icon={Building2} label="Property" value={period.propertySnapshot} />
              )}
              {period.ownerName && (
                <InfoItem icon={User} label="Owner" value={period.ownerName} />
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <InfoItem icon={CalendarClock} label="Start Date" value={formatDate(period.agreementStartDate)} />
            <InfoItem icon={CalendarClock} label="End Date" value={formatDate(period.agreementEndDate)} />
            <InfoItem icon={CalendarClock} label="Date of Notice" value={formatDate(period.dateOfNotice)} />
          </div>

          {(period.annualRent != null ||
            period.securityDeposit != null ||
            period.adminFee != null ||
            period.commission != null ||
            period.modeOfPayment) && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {period.annualRent != null && (
                <InfoItem icon={DollarSign} label="Annual Rent" value={formatCurrency(Number(period.annualRent))} />
              )}
              {period.securityDeposit != null && (
                <InfoItem icon={DollarSign} label="Security Deposit" value={formatCurrency(Number(period.securityDeposit))} />
              )}
              {period.adminFee != null && (
                <InfoItem icon={DollarSign} label="Admin Fee" value={formatCurrency(Number(period.adminFee))} />
              )}
              {period.commission != null && (
                <InfoItem icon={DollarSign} label="Commission" value={formatCurrency(Number(period.commission))} />
              )}
              {period.modeOfPayment && (
                <InfoItem icon={Receipt} label="Mode of Payment" value={period.modeOfPayment} />
              )}
              {period.numberOfCheques != null && (
                <InfoItem icon={Receipt} label="No. of Cheques" value={String(period.numberOfCheques)} />
              )}
            </div>
          )}

          {period.cheques.length > 0 && (
            <ChequesTimeline cheques={period.cheques} currency={period.currency} />
          )}

          {period.renewedByUser && (
            <p className="text-[11px] text-slate-400">
              Added by{" "}
              <span className="font-medium text-slate-500">
                {period.renewedByUser.fullName}
              </span>{" "}
              on {formatDateTime(period.renewedAt)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Cheque timeline ------------------------------------------------------

function ChequesTimeline({
  cheques,
  currency,
}: {
  cheques: TenantAgreementHistoryCheque[];
  currency?: string | null;
}) {
  const total = cheques.reduce((sum, c) => sum + (c.amount ? Number(c.amount) : 0), 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          Cheque Timeline
        </p>
        {total > 0 && (
          <span className="text-xs text-slate-500">
            Total {formatCurrency(total)} {currency ?? "AED"}
          </span>
        )}
      </div>

      <div className="relative">
        <div className="absolute left-3.5 top-4 bottom-4 w-px bg-neutral-200" />
        <div className="space-y-2">
          {cheques.map((cheque) => {
            const status = cheque.status?.toLowerCase() ?? "";
            const isCleared = status === "cleared";
            const isBounced = status === "bounced";

            return (
              <div key={cheque.id} className="relative flex items-start gap-3">
                <div className="relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-neutral-200">
                  {isCleared ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : isBounced ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-slate-400" />
                  )}
                </div>
                <div className="flex flex-1 items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2">
                  <div>
                    <p className="text-xs font-medium text-slate-700">
                      Cheque #{cheque.chequeNumber}
                      {cheque.chequeDate && (
                        <span className="ml-2 font-normal text-slate-400">
                          {formatDate(cheque.chequeDate)}
                        </span>
                      )}
                    </p>
                    {cheque.amount != null && (
                      <p className="text-[11px] text-slate-500">
                        {formatCurrency(Number(cheque.amount))}
                      </p>
                    )}
                  </div>
                  <ChequeStatusBadge status={cheque.status} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---- Helpers --------------------------------------------------------------

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

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
      <div>
        <p className="text-[11px] text-slate-400">{label}</p>
        <p className="text-xs font-medium text-slate-700">{value ?? "—"}</p>
      </div>
    </div>
  );
}

function ChequeStatusBadge({ status }: { status?: string | null }) {
  if (!status) return <span className="text-[10px] text-slate-400">—</span>;
  const lower = status.toLowerCase();
  const cls =
    lower === "cleared"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
      : lower === "bounced"
        ? "bg-red-50 text-red-700 ring-red-600/20"
        : "bg-amber-50 text-amber-700 ring-amber-600/20";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset capitalize ${cls}`}
    >
      {status}
    </span>
  );
}

function calcNotice(endDateStr: string): string {
  const d = new Date(endDateStr);
  if (isNaN(d.getTime())) return "";
  d.setDate(d.getDate() - 100);
  return d.toISOString().slice(0, 10);
}

function durationLabel(start?: string | null, end?: string | null): string | null {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
  const days = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return null;
  const months = Math.round(days / 30.44);
  if (months >= 12) {
    const years = Math.round(months / 12);
    return `${years} yr${years > 1 ? "s" : ""}`;
  }
  return `${months} mo`;
}

/** Extracts the agreement year from the start date (falls back to end date). */
function getAgreementYear(period: TenantAgreementHistory): number | null {
  const dateStr = period.agreementStartDate ?? period.agreementEndDate;
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d.getFullYear();
}
