"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EVENT_STATUS_OPTIONS } from "@/constants/openHouse";
import { DebouncedFilterInput, filterInputClass } from "./OpenHouseShared";

export interface EventFilters {
  status?: string;
  developerName?: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function EventFiltersBar({
  filters,
  onChange,
  onReset,
}: {
  filters: EventFilters;
  onChange: <K extends keyof EventFilters>(key: K, value: EventFilters[K] | undefined) => void;
  onReset: () => void;
}) {
  const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== "");

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
        <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
      </span>

      <DebouncedFilterInput
        value={filters.developerName}
        onChange={(v) => onChange("developerName", v)}
        placeholder="Developer"
      />
      <DebouncedFilterInput
        value={filters.location}
        onChange={(v) => onChange("location", v)}
        placeholder="Location"
      />

      <Select
        value={filters.status ?? ""}
        onChange={(e) => onChange("status", e.target.value || undefined)}
        className="h-9 w-full sm:w-40"
      >
        <option value="">All statuses</option>
        {EVENT_STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </Select>

      <div className="flex items-center gap-2 text-xs">
        <span className="font-medium text-neutral-500">From</span>
        <input
          type="date"
          value={filters.dateFrom ?? ""}
          max={filters.dateTo}
          onChange={(e) => onChange("dateFrom", e.target.value || undefined)}
          className={filterInputClass}
          aria-label="Event date from"
        />
        <span className="font-medium text-neutral-500">To</span>
        <input
          type="date"
          value={filters.dateTo ?? ""}
          min={filters.dateFrom}
          onChange={(e) => onChange("dateTo", e.target.value || undefined)}
          className={filterInputClass}
          aria-label="Event date to"
        />
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          <X className="h-4 w-4" /> Clear
        </Button>
      )}
    </div>
  );
}
