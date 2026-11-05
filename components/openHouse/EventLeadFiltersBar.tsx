"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  LEAD_INTEREST_OPTIONS,
  LEAD_PURPOSE_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
} from "@/constants/openHouse";
import { DebouncedFilterInput, filterInputClass } from "./OpenHouseShared";
import { eventOptionLabel } from "./EventLeadFormModal";
import type { OpenHouseEventOption } from "@/types";

export interface EventLeadFilters {
  eventId?: string;
  nationality?: string;
  propertyType?: string;
  interestedProject?: string;
  interestLevel?: string;
  purpose?: string;
  budgetMin?: string;
  budgetMax?: string;
  createdFrom?: string;
  createdTo?: string;
}

export function EventLeadFiltersBar({
  filters,
  events,
  onChange,
  onReset,
}: {
  filters: EventLeadFilters;
  events: OpenHouseEventOption[];
  onChange: <K extends keyof EventLeadFilters>(key: K, value: EventLeadFilters[K] | undefined) => void;
  onReset: () => void;
}) {
  const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== "");

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
        </span>

        <Select
          value={filters.eventId ?? ""}
          onChange={(e) => onChange("eventId", e.target.value || undefined)}
          className="h-9 w-full sm:w-64"
        >
          <option value="">All events</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>{eventOptionLabel(ev)}</option>
          ))}
        </Select>

        <Select
          value={filters.propertyType ?? ""}
          onChange={(e) => onChange("propertyType", e.target.value || undefined)}
          className="h-9 w-full sm:w-40"
        >
          <option value="">All property types</option>
          {PROPERTY_TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>

        <Select
          value={filters.interestLevel ?? ""}
          onChange={(e) => onChange("interestLevel", e.target.value || undefined)}
          className="h-9 w-full sm:w-36"
        >
          <option value="">Any interest</option>
          {LEAD_INTEREST_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>

        <Select
          value={filters.purpose ?? ""}
          onChange={(e) => onChange("purpose", e.target.value || undefined)}
          className="h-9 w-full sm:w-36"
        >
          <option value="">Any purpose</option>
          {LEAD_PURPOSE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="h-4 w-4" /> Clear
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <DebouncedFilterInput
          value={filters.nationality}
          onChange={(v) => onChange("nationality", v)}
          placeholder="Nationality"
        />
        <DebouncedFilterInput
          value={filters.interestedProject}
          onChange={(v) => onChange("interestedProject", v)}
          placeholder="Interested project"
        />
        <DebouncedFilterInput
          type="number"
          value={filters.budgetMin}
          onChange={(v) => onChange("budgetMin", v)}
          placeholder="Min budget (AED)"
        />
        <DebouncedFilterInput
          type="number"
          value={filters.budgetMax}
          onChange={(v) => onChange("budgetMax", v)}
          placeholder="Max budget (AED)"
        />
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-neutral-500">Added</span>
          <input
            type="date"
            value={filters.createdFrom ?? ""}
            max={filters.createdTo}
            onChange={(e) => onChange("createdFrom", e.target.value || undefined)}
            className={filterInputClass}
            aria-label="Added from"
          />
          <span className="font-medium text-neutral-500">to</span>
          <input
            type="date"
            value={filters.createdTo ?? ""}
            min={filters.createdFrom}
            onChange={(e) => onChange("createdTo", e.target.value || undefined)}
            className={filterInputClass}
            aria-label="Added to"
          />
        </div>
      </div>
    </div>
  );
}
