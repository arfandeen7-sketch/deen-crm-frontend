"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useFieldOptions } from "@/hooks/useDynamicFields";
import { useAssignableUsers } from "@/hooks/useUsers";
import { useAuth } from "@/hooks/useAuth";
import { useLeadOptions } from "@/hooks/useLeads";
import { useBrokerOptions } from "@/hooks/useBrokers";
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
  const priorities = useFieldOptions("lead_priority");
  const projectTypes = useFieldOptions("project_type");
  const configurations = useFieldOptions("configuration");
  const dynProjectNames = useFieldOptions("project_name");
  const { users } = useAssignableUsers();
  const brokers = useBrokerOptions();
  const { canPage } = useAuth();
  const { data: leadOptions } = useLeadOptions();

  // Merge dynamic_fields project names with actual lead data project names (deduped, sorted)
  const allProjectNames = Array.from(
    new Set([
      ...(leadOptions?.projectNames ?? []),
      ...dynProjectNames,
    ]),
  ).sort((a, b) => a.localeCompare(b));

  const allCities = Array.from(
    new Set(leadOptions?.cities ?? []),
  ).sort((a, b) => a.localeCompare(b));

  const allLocalities = Array.from(
    new Set(leadOptions?.localities ?? []),
  ).sort((a, b) => a.localeCompare(b));

  const allCommunities = Array.from(
    new Set(leadOptions?.communities ?? []),
  ).sort((a, b) => a.localeCompare(b));

  const hasFilters = Boolean(
    filters.search ||
      filters.status ||
      filters.source ||
      filters.assignedTo ||
      filters.category ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.projectType ||
      filters.configuration ||
      filters.projectName ||
      filters.city ||
      filters.locality ||
      filters.ingestionSource ||
      filters.leadPriority ||
      filters.brokerId ||
      filters.serviceType ||
      filters.community,
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={filters.search ?? ""}
          onChange={(v) => onChange("search", v)}
          placeholder="Search name, mobile, project…"
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
          value={filters.serviceType ?? ""}
          onChange={(e) => onChange("serviceType", e.target.value || undefined)}
          className="h-10 w-auto"
        >
          <option value="">All service types</option>
          <option value="Sales">Sales</option>
          <option value="Rent">Rent</option>
          <option value="Lease">Lease</option>
        </Select>
        <Select
          value={filters.leadPriority ?? ""}
          onChange={(e) => onChange("leadPriority", e.target.value || undefined)}
          className="h-10 w-auto"
        >
          <option value="">All priorities</option>
          {priorities.map((p) => (
            <option key={p} value={p}>{p}</option>
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
        <Select
          value={filters.projectName ?? ""}
          onChange={(e) => onChange("projectName", e.target.value || undefined)}
          className="h-10 w-auto"
        >
          <option value="">All projects</option>
          {allProjectNames.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </Select>
        <Select
          value={filters.community ?? ""}
          onChange={(e) => onChange("community", e.target.value || undefined)}
          className="h-10 w-auto"
        >
          <option value="">All communities</option>
          {allCommunities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Select
          value={filters.projectType ?? ""}
          onChange={(e) => onChange("projectType", e.target.value || undefined)}
          className="h-10 w-auto"
        >
          <option value="">All types</option>
          {projectTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
        <Select
          value={filters.configuration ?? ""}
          onChange={(e) => onChange("configuration", e.target.value || undefined)}
          className="h-10 w-auto"
        >
          <option value="">All configs</option>
          {configurations.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Select
          value={filters.city ?? ""}
          onChange={(e) => onChange("city", e.target.value || undefined)}
          className="h-10 w-auto"
        >
          <option value="">All cities</option>
          {allCities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Select
          value={filters.locality ?? ""}
          onChange={(e) => onChange("locality", e.target.value || undefined)}
          className="h-10 w-auto"
        >
          <option value="">All localities</option>
          {allLocalities.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </Select>
        <Select
          value={filters.ingestionSource ?? ""}
          onChange={(e) => onChange("ingestionSource", e.target.value || undefined)}
          className="h-10 w-auto"
        >
          <option value="">All ingestion sources</option>
          <option value="property_finder">Property Finder</option>
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
          <option value="google">Google</option>
          <option value="manual">Manual</option>
          <option value="import">Import</option>
        </Select>
        <Select
          value={filters.brokerId ?? ""}
          onChange={(e) => onChange("brokerId", e.target.value || undefined)}
          className="h-10 w-auto"
        >
          <option value="">All brokers</option>
          {brokers.map((b) => (
            <option key={b.id} value={b.id}>{b.brokerName}</option>
          ))}
        </Select>
        {canPage("leads", "all_leads") && (
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

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="flex items-center gap-1.5 font-medium text-neutral-500">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Lead date
        </span>
        <input
          type="date"
          value={filters.dateFrom ?? ""}
          onChange={(e) => onChange("dateFrom", e.target.value || undefined)}
          className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-xs text-neutral-800 shadow-2xs focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
        <span className="text-neutral-400">to</span>
        <input
          type="date"
          value={filters.dateTo ?? ""}
          onChange={(e) => onChange("dateTo", e.target.value || undefined)}
          className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-xs text-neutral-800 shadow-2xs focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>
    </div>
  );
}
