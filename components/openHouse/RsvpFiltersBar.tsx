"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { RSVP_ARRIVAL_SLOTS, RSVP_STATUS_OPTIONS } from "@/constants/openHouse";
import { formatDate } from "@/lib/utils";
import type { OpenHouseEventOption } from "@/types";

export interface RsvpFilters {
  eventId?: string;
  status?: string;
  expectedArrival?: string;
}

function eventLabel(e: OpenHouseEventOption): string {
  return `${e.eventName} — ${formatDate(e.eventDate)}`;
}

export function RsvpFiltersBar({
  filters,
  events,
  onChange,
  onReset,
}: {
  filters: RsvpFilters;
  events: OpenHouseEventOption[];
  onChange: <K extends keyof RsvpFilters>(key: K, value: RsvpFilters[K] | undefined) => void;
  onReset: () => void;
}) {
  const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== "");

  return (
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
          <option key={ev.id} value={ev.id}>{eventLabel(ev)}</option>
        ))}
      </Select>

      <Select
        value={filters.status ?? ""}
        onChange={(e) => onChange("status", e.target.value || undefined)}
        className="h-9 w-full sm:w-40"
      >
        <option value="">All statuses</option>
        {RSVP_STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </Select>

      <Select
        value={filters.expectedArrival ?? ""}
        onChange={(e) => onChange("expectedArrival", e.target.value || undefined)}
        className="h-9 w-full sm:w-44"
      >
        <option value="">Any arrival time</option>
        {RSVP_ARRIVAL_SLOTS.map((slot) => (
          <option key={slot.value} value={slot.value}>{slot.label}</option>
        ))}
      </Select>

      {hasFilters && (
        <Button type="button" variant="ghost" size="sm" onClick={onReset} className="self-start sm:self-auto">
          <X className="h-3.5 w-3.5" /> Clear
        </Button>
      )}
    </div>
  );
}
