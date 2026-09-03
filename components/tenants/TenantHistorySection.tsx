"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { useTenantHistory } from "@/hooks/useTenants";
import { formatDate, formatCurrency, formatDateTime } from "@/lib/utils";
import type { TenantAgreementHistory, TenantAgreementHistoryCheque } from "@/types";

interface TenantHistorySectionProps {
  leadId: string;
}

export function TenantHistorySection({ leadId }: TenantHistorySectionProps) {
  const { data: history, isLoading } = useTenantHistory(leadId);

  if (isLoading) return null;
  if (!history || history.length === 0) return null;

  return (
    <Card>
      <CardHeader
        title="Agreement History"
        subtitle={`${history.length} completed period${history.length > 1 ? "s" : ""}`}
        action={
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <History className="h-3.5 w-3.5" /> Oldest first
          </div>
        }
      />
      <CardBody className="!p-0">
        <div className="divide-y divide-neutral-100">
          {history.map((period, idx) => (
            <PeriodRow
              key={period.id}
              period={period}
              isLast={idx === history.length - 1}
            />
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

// ---- Period row (collapsible) --------------------------------------------

function PeriodRow({
  period,
  isLast,
}: {
  period: TenantAgreementHistory;
  isLast: boolean;
}) {
  const [open, setOpen] = useState(isLast); // expand the most-recent period by default

  const daysLabel = durationLabel(period.agreementStartDate, period.agreementEndDate);

  return (
    <div>
      {/* Header row */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left transition-colors hover:bg-neutral-50"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Period badge */}
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
            {period.periodNumber}
          </span>
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

      {/* Expanded content */}
      {open && (
        <div className="space-y-4 border-t border-neutral-100 bg-neutral-50/50 px-5 py-4">
          {/* Property & owner */}
          {(period.propertySnapshot || period.ownerName) && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {period.propertySnapshot && (
                <InfoItem
                  icon={Building2}
                  label="Property"
                  value={period.propertySnapshot}
                />
              )}
              {period.ownerName && (
                <InfoItem icon={User} label="Owner" value={period.ownerName} />
              )}
            </div>
          )}

          {/* Agreement dates */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <InfoItem
              icon={CalendarClock}
              label="Start Date"
              value={formatDate(period.agreementStartDate)}
            />
            <InfoItem
              icon={CalendarClock}
              label="End Date"
              value={formatDate(period.agreementEndDate)}
            />
            <InfoItem
              icon={CalendarClock}
              label="Date of Notice"
              value={formatDate(period.dateOfNotice)}
            />
          </div>

          {/* Financials */}
          {(period.annualRent != null ||
            period.securityDeposit != null ||
            period.adminFee != null ||
            period.commission != null ||
            period.modeOfPayment) && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {period.annualRent != null && (
                <InfoItem
                  icon={DollarSign}
                  label="Annual Rent"
                  value={formatCurrency(Number(period.annualRent))}
                />
              )}
              {period.securityDeposit != null && (
                <InfoItem
                  icon={DollarSign}
                  label="Security Deposit"
                  value={formatCurrency(Number(period.securityDeposit))}
                />
              )}
              {period.adminFee != null && (
                <InfoItem
                  icon={DollarSign}
                  label="Admin Fee"
                  value={formatCurrency(Number(period.adminFee))}
                />
              )}
              {period.commission != null && (
                <InfoItem
                  icon={DollarSign}
                  label="Commission"
                  value={formatCurrency(Number(period.commission))}
                />
              )}
              {period.modeOfPayment && (
                <InfoItem
                  icon={Receipt}
                  label="Mode of Payment"
                  value={period.modeOfPayment}
                />
              )}
              {period.numberOfCheques != null && (
                <InfoItem
                  icon={Receipt}
                  label="No. of Cheques"
                  value={String(period.numberOfCheques)}
                />
              )}
            </div>
          )}

          {/* Cheque timeline */}
          {period.cheques.length > 0 && (
            <ChequesTimeline cheques={period.cheques} currency={period.currency} />
          )}

          {/* Renewed by */}
          {period.renewedByUser && (
            <p className="text-[11px] text-slate-400">
              Renewed by{" "}
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

// ---- Cheque timeline ----------------------------------------------------

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

      {/* Timeline strip */}
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute left-3.5 top-4 bottom-4 w-px bg-neutral-200" />

        <div className="space-y-2">
          {cheques.map((cheque) => {
            const status = cheque.status?.toLowerCase() ?? "";
            const isCleared = status === "cleared";
            const isBounced = status === "bounced";

            return (
              <div key={cheque.id} className="relative flex items-start gap-3">
                {/* Status dot */}
                <div className="relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-neutral-200">
                  {isCleared ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : isBounced ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-slate-400" />
                  )}
                </div>

                {/* Content */}
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

// ---- Helper components --------------------------------------------------

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

// ---- Duration label helper -----------------------------------------------

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
