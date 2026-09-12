"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  RotateCcw,
  Save,
  Target,
  Trash2,
} from "lucide-react";
import { MasterGuard } from "@/components/shared/Guards";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { cn } from "@/lib/utils";
import {
  useClearSalesTargets,
  useSalesTargets,
  useSaveSalesTargets,
} from "@/hooks/useDashboardAnalytics";
import { formatAed, formatPercent } from "@/components/dashboard/charts/theme";
import type { SalesTargetInput, SalesTargetRow, SalesTargetsResponse } from "@/types";

const COMPANY_KEY = "__company__";

interface Draft {
  revenueTarget: string;
  dealsTarget: string;
  leadsTarget: string;
}

function toDraft(row: {
  revenueTarget: number;
  dealsTarget: number;
  leadsTarget: number;
}): Draft {
  return {
    revenueTarget: row.revenueTarget ? String(row.revenueTarget) : "",
    dealsTarget: row.dealsTarget ? String(row.dealsTarget) : "",
    leadsTarget: row.leadsTarget ? String(row.leadsTarget) : "",
  };
}

function toNumber(value: string): number {
  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

/** Builds the full draft map from a server response. */
function seedDrafts(data: SalesTargetsResponse): Record<string, Draft> {
  const next: Record<string, Draft> = {
    [COMPANY_KEY]: toDraft(
      data.company ?? { revenueTarget: 0, dealsTarget: 0, leadsTarget: 0 },
    ),
  };
  for (const row of data.rows) next[row.userId] = toDraft(row);
  return next;
}

function monthLabel(month: number, year: number): string {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Numeric cell that keeps its own text state so partial input isn't clobbered. */
function TargetInput({
  value,
  onChange,
  placeholder = "—",
  prefix,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  prefix?: string;
}) {
  return (
    <div className="relative">
      {prefix && (
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase text-neutral-400">
          {prefix}
        </span>
      )}
      <Input
        inputMode="numeric"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn("h-9 text-right text-xs tabular-nums", prefix && "pl-9")}
      />
    </div>
  );
}

function TargetsEditor() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const query = useSalesTargets(month, year);
  const save = useSaveSalesTargets(month, year);
  const clear = useClearSalesTargets(month, year);

  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [seededMonth, setSeededMonth] = useState<string | null>(null);

  // Seed the editor from server data during render (React's documented reset
  // pattern) rather than in an effect, which would cascade an extra render.
  // Keyed on month rather than data identity so a background refetch cannot
  // silently discard unsaved edits.
  const dataKey = query.data ? `${query.data.year}-${query.data.month}` : null;
  if (query.data && dataKey !== seededMonth) {
    setSeededMonth(dataKey);
    setDrafts(seedDrafts(query.data));
  }

  const rows = useMemo(() => query.data?.rows ?? [], [query.data?.rows]);

  const draftTotals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        const draft = drafts[row.userId];
        return {
          revenue: acc.revenue + toNumber(draft?.revenueTarget ?? ""),
          deals: acc.deals + toNumber(draft?.dealsTarget ?? ""),
          leads: acc.leads + toNumber(draft?.leadsTarget ?? ""),
        };
      },
      { revenue: 0, deals: 0, leads: 0 },
    );
  }, [rows, drafts]);

  const isDirty = useMemo(() => {
    if (!query.data) return false;
    const company = query.data.company ?? {
      revenueTarget: 0,
      dealsTarget: 0,
      leadsTarget: 0,
    };
    const changed = (key: string, source: Draft) => {
      const draft = drafts[key];
      if (!draft) return false;
      return (
        toNumber(draft.revenueTarget) !== toNumber(source.revenueTarget) ||
        toNumber(draft.dealsTarget) !== toNumber(source.dealsTarget) ||
        toNumber(draft.leadsTarget) !== toNumber(source.leadsTarget)
      );
    };
    if (changed(COMPANY_KEY, toDraft(company))) return true;
    return query.data.rows.some((row) => changed(row.userId, toDraft(row)));
  }, [query.data, drafts]);

  function shiftMonth(delta: number) {
    const date = new Date(Date.UTC(year, month - 1 + delta, 1));
    setMonth(date.getUTCMonth() + 1);
    setYear(date.getUTCFullYear());
  }

  function update(key: string, field: keyof Draft, value: string) {
    setDrafts((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] ?? { revenueTarget: "", dealsTarget: "", leadsTarget: "" }),
        [field]: value,
      },
    }));
  }

  function handleSave() {
    const payload: SalesTargetInput[] = [
      {
        userId: null,
        revenueTarget: toNumber(drafts[COMPANY_KEY]?.revenueTarget ?? ""),
        dealsTarget: toNumber(drafts[COMPANY_KEY]?.dealsTarget ?? ""),
        leadsTarget: toNumber(drafts[COMPANY_KEY]?.leadsTarget ?? ""),
      },
      ...rows.map((row) => ({
        userId: row.userId,
        revenueTarget: toNumber(drafts[row.userId]?.revenueTarget ?? ""),
        dealsTarget: toNumber(drafts[row.userId]?.dealsTarget ?? ""),
        leadsTarget: toNumber(drafts[row.userId]?.leadsTarget ?? ""),
      })),
    ];
    save.mutate(payload);
  }

  function handleReset() {
    if (!query.data) return;
    setDrafts(seedDrafts(query.data));
  }

  /** Copies the previous month's actuals into the draft as a starting point. */
  function seedFromActuals() {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const row of rows) {
        if (row.achievedRevenue <= 0) continue;
        next[row.userId] = {
          revenueTarget: String(Math.round(row.achievedRevenue)),
          dealsTarget: row.achievedDeals ? String(row.achievedDeals) : "",
          leadsTarget: next[row.userId]?.leadsTarget ?? "",
        };
      }
      return next;
    });
  }

  if (query.isLoading) return <LoadingState label="Loading targets…" />;
  if (query.isError) {
    return (
      <ErrorState
        message="Could not load sales targets."
        onRetry={() => query.refetch()}
      />
    );
  }

  return (
    <div className="pb-12">
      <PageHeader
        title="Sales Targets"
        subtitle="Optional monthly quotas. Leave a row blank and that person's dashboard falls back to period-over-period comparison."
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={handleReset} disabled={!isDirty}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              loading={save.isPending}
              disabled={!isDirty}
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              Save targets
            </Button>
          </>
        }
      />

      {/* ── Month navigator ── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => shiftMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-40 px-2 text-center font-secondary text-sm font-bold text-zinc-900">
            {monthLabel(month, year)}
          </span>
          <Button variant="outline" size="icon" onClick={() => shiftMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={seedFromActuals}>
            <Target className="mr-1.5 h-3.5 w-3.5" />
            Match this month&apos;s actuals
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clear.mutate()}
            loading={clear.isPending}
            className="text-red-700 hover:bg-red-50"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Clear month
          </Button>
        </div>
      </div>

      {/* ── Company-wide target ── */}
      <div className="mb-6 rounded-xl border border-neutral-200/80 bg-neutral-50/60 p-5 shadow-2xs">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
          <div>
            <p className="text-xs font-bold text-zinc-800">Company-wide target</p>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              Used on the master dashboard when no individual targets are set. Individual
              targets always take precedence and are summed instead.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Revenue
            </span>
            <TargetInput
              prefix="AED"
              value={drafts[COMPANY_KEY]?.revenueTarget ?? ""}
              onChange={(v) => update(COMPANY_KEY, "revenueTarget", v)}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Deals
            </span>
            <TargetInput
              value={drafts[COMPANY_KEY]?.dealsTarget ?? ""}
              onChange={(v) => update(COMPANY_KEY, "dealsTarget", v)}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Leads
            </span>
            <TargetInput
              value={drafts[COMPANY_KEY]?.leadsTarget ?? ""}
              onChange={(v) => update(COMPANY_KEY, "leadsTarget", v)}
            />
          </label>
        </div>
      </div>

      {/* ── Per-person grid ── */}
      {rows.length === 0 ? (
        <EmptyState
          title="No sales people"
          message="Add active sales managers or executives before setting targets."
          icon={<Target className="h-5 w-5 text-neutral-500" />}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-4xl border-separate border-spacing-0 text-xs">
              <thead>
                <tr className="bg-neutral-50/90">
                  <th className="border-b border-neutral-200/80 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    Employee
                  </th>
                  <th className="w-40 border-b border-neutral-200/80 px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    Revenue target
                  </th>
                  <th className="w-24 border-b border-neutral-200/80 px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    Deals
                  </th>
                  <th className="w-24 border-b border-neutral-200/80 px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    Leads
                  </th>
                  <th className="border-b border-neutral-200/80 px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    Achieved this month
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <Row
                    key={row.userId}
                    row={row}
                    draft={
                      drafts[row.userId] ?? {
                        revenueTarget: "",
                        dealsTarget: "",
                        leadsTarget: "",
                      }
                    }
                    onChange={(field, value) => update(row.userId, field, value)}
                  />
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-neutral-50/90">
                  <td className="border-t border-neutral-200/80 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                    Total
                  </td>
                  <td className="border-t border-neutral-200/80 px-3 py-3 text-right text-xs font-bold tabular-nums text-zinc-900">
                    {formatAed(draftTotals.revenue, { compact: true })}
                  </td>
                  <td className="border-t border-neutral-200/80 px-3 py-3 text-right text-xs font-bold tabular-nums text-zinc-900">
                    {draftTotals.deals || "—"}
                  </td>
                  <td className="border-t border-neutral-200/80 px-3 py-3 text-right text-xs font-bold tabular-nums text-zinc-900">
                    {draftTotals.leads || "—"}
                  </td>
                  <td className="border-t border-neutral-200/80 px-4 py-3 text-right text-xs font-bold tabular-nums text-teal-700">
                    {formatAed(query.data?.totals.achievedRevenue ?? 0, {
                      compact: true,
                    })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  row,
  draft,
  onChange,
}: {
  row: SalesTargetRow;
  draft: Draft;
  onChange: (field: keyof Draft, value: string) => void;
}) {
  const target = toNumber(draft.revenueTarget);
  const progress = target > 0 ? (row.achievedRevenue / target) * 100 : null;

  return (
    <tr>
      <td className="border-t border-neutral-100 px-4 py-2.5">
        <span className="block text-xs font-bold text-zinc-800">{row.fullName}</span>
        <span className="block text-[11px] text-zinc-400">
          {row.designation ?? row.role.replace(/_/g, " ")}
          {row.managerName && ` · reports to ${row.managerName}`}
        </span>
      </td>
      <td className="border-t border-neutral-100 px-3 py-2.5">
        <TargetInput
          prefix="AED"
          value={draft.revenueTarget}
          onChange={(v) => onChange("revenueTarget", v)}
        />
      </td>
      <td className="border-t border-neutral-100 px-3 py-2.5">
        <TargetInput
          value={draft.dealsTarget}
          onChange={(v) => onChange("dealsTarget", v)}
        />
      </td>
      <td className="border-t border-neutral-100 px-3 py-2.5">
        <TargetInput
          value={draft.leadsTarget}
          onChange={(v) => onChange("leadsTarget", v)}
        />
      </td>
      <td className="border-t border-neutral-100 px-4 py-2.5 text-right">
        <span className="block text-xs font-bold tabular-nums text-zinc-900">
          {row.achievedRevenue > 0
            ? formatAed(row.achievedRevenue, { compact: true })
            : "—"}
        </span>
        <span className="block text-[10px] text-zinc-400">
          {row.achievedDeals} deal{row.achievedDeals === 1 ? "" : "s"}
          {progress != null && (
            <span
              className={cn(
                "ml-1 font-bold",
                progress >= 100 ? "text-teal-700" : "text-zinc-500",
              )}
            >
              · {formatPercent(progress, 0)}
            </span>
          )}
        </span>
      </td>
    </tr>
  );
}

export default function TargetsPage() {
  return (
    <MasterGuard>
      <TargetsEditor />
    </MasterGuard>
  );
}
