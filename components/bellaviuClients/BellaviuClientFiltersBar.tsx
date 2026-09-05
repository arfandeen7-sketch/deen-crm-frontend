"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const BOOKING_CHANNELS = [
  "Direct",
  "Booking.com",
  "Airbnb",
  "Expedia",
  "Agoda",
  "Travel Agent",
  "Walk-in",
  "Other",
];

export interface BellaviuClientFilters {
  name?: string;
  phoneNumber?: string;
  email?: string;
  checkInDate?: string;
  checkOutDate?: string;
  bookingChannel?: string;
  propertyName?: string;
  unitNo?: string;
  countryOfClient?: string;
  locationOfProperty?: string;
}

const dateInputClass =
  "h-9 rounded-lg border border-neutral-200 bg-white px-3 text-xs text-neutral-800 shadow-2xs focus:border-black focus:outline-none focus:ring-1 focus:ring-black";
const textInputClass =
  "h-9 w-40 rounded-lg border border-neutral-200 bg-white px-3 text-xs text-neutral-800 shadow-2xs placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black";

export function BellaviuClientFiltersBar({
  filters,
  onChange,
  onReset,
}: {
  filters: BellaviuClientFilters;
  onChange: <K extends keyof BellaviuClientFilters>(
    key: K,
    value: BellaviuClientFilters[K] | undefined,
  ) => void;
  onReset: () => void;
}) {
  const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== "");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
        </span>

        <input
          type="text"
          value={filters.name ?? ""}
          onChange={(e) => onChange("name", e.target.value || undefined)}
          placeholder="Name"
          className={textInputClass}
        />
        <input
          type="text"
          value={filters.phoneNumber ?? ""}
          onChange={(e) => onChange("phoneNumber", e.target.value || undefined)}
          placeholder="Phone Number"
          className={textInputClass}
        />
        <input
          type="text"
          value={filters.email ?? ""}
          onChange={(e) => onChange("email", e.target.value || undefined)}
          placeholder="Email"
          className={textInputClass}
        />
        <input
          type="text"
          value={filters.propertyName ?? ""}
          onChange={(e) => onChange("propertyName", e.target.value || undefined)}
          placeholder="Property Name"
          className={textInputClass}
        />
        <input
          type="text"
          value={filters.unitNo ?? ""}
          onChange={(e) => onChange("unitNo", e.target.value || undefined)}
          placeholder="Unit No."
          className={textInputClass}
        />
        <input
          type="text"
          value={filters.countryOfClient ?? ""}
          onChange={(e) => onChange("countryOfClient", e.target.value || undefined)}
          placeholder="Country of Client"
          className={textInputClass}
        />
        <input
          type="text"
          value={filters.locationOfProperty ?? ""}
          onChange={(e) => onChange("locationOfProperty", e.target.value || undefined)}
          placeholder="Location of Property"
          className={textInputClass}
        />

        <Select
          value={filters.bookingChannel ?? ""}
          onChange={(e) => onChange("bookingChannel", e.target.value || undefined)}
          className="h-9 w-auto"
        >
          <option value="">All channels</option>
          {BOOKING_CHANNELS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="h-4 w-4" /> Clear
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-medium text-neutral-500">Check-In</span>
        <input
          type="date"
          value={filters.checkInDate ?? ""}
          onChange={(e) => onChange("checkInDate", e.target.value || undefined)}
          className={dateInputClass}
        />
        <span className="font-medium text-neutral-500">Check-Out</span>
        <input
          type="date"
          value={filters.checkOutDate ?? ""}
          onChange={(e) => onChange("checkOutDate", e.target.value || undefined)}
          className={dateInputClass}
        />
      </div>
    </div>
  );
}
