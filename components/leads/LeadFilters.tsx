"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useFieldOptions } from "@/hooks/useDynamicFields";
import { useAssignableUsers } from "@/hooks/useUsers";
import { useAuth } from "@/hooks/useAuth";
import type { LeadQueryParams } from "@/types";

export function LeadFilters({
  filters,
  onChange,
  onReset,
}: {
  filters: LeadQueryParams;
  onChange: <K extends keyof LeadQueryParams>(key: K, value: LeadQueryParams[K]) => void;
  onReset: () => void;
}) {
  const sources = useFieldOptions("source");
  const statuses = useFieldOptions("lead_status");
  const { users } = useAssignableUsers();
  const { can } = useAuth();

  const hasFilters = Boolean(
    filters.search ||
      filters.status ||
      filters.source ||
      filters.assignedTo ||
      filters.category ||
      filters.dateFrom ||
      filters.dateTo,
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={filters.search ?? ""}
          onChange={(v) => onChange("search", v)}
          placeholder="Search name or mobile…"
          className="w-full sm:w-72"
        />
        <Select
          value={filters.status ?? ""}
          onChange={(e) => onChange("status", e.target.value || undefined)}
          className="h-10 w-auto"
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Select
          value={filters.source ?? ""}
          onChange={(e) => onChange("source", e.target.value || undefined)}
          className="h-10 w-auto"
        >
          <option value="">All sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Select
          value={filters.category ?? ""}
          onChange={(e) =>
            onChange("category", (e.target.value || undefined) as LeadQueryParams["category"])
          }
          className="h-10 w-auto"
        >
          <option value="">All categories</option>
          <option value="fresh">Fresh</option>
          <option value="untouched">Untouched</option>
          <option value="imported">Imported</option>
          <option value="assigned">Assigned</option>
          <option value="unassigned">Unassigned</option>
        </Select>
        {can("leads.view.all") && (
          <Select
            value={filters.assignedTo ?? ""}
            onChange={(e) => onChange("assignedTo", e.target.value || undefined)}
            className="h-10 w-auto"
          >
            <option value="">All users</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.fullName}</option>
            ))}
          </Select>
        )}
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="h-4 w-4" /> Clear
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="flex items-center gap-1.5 text-slate-400">
          <SlidersHorizontal className="h-4 w-4" /> Lead date
        </span>
        <input
          type="date"
          value={filters.dateFrom ?? ""}
          onChange={(e) => onChange("dateFrom", e.target.value || undefined)}
          className="h-9 rounded-lg border border-slate-300 px-2 text-sm text-slate-700"
        />
        <span className="text-slate-400">to</span>
        <input
          type="date"
          value={filters.dateTo ?? ""}
          onChange={(e) => onChange("dateTo", e.target.value || undefined)}
          className="h-9 rounded-lg border border-slate-300 px-2 text-sm text-slate-700"
        />
      </div>
    </div>
  );
}
