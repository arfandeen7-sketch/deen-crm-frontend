"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { OwnerQueryParams } from "@/types";

export type OwnerFilters = Pick<
  OwnerQueryParams,
  | "fullName"
  | "mobileNumber"
  | "alternateMobile"
  | "email"
  | "whatsapp"
  | "nationality"
  | "emirate"
  | "city"
  | "locality"
  | "passportNumber"
  | "emiratesIdNumber"
>;

const textInputClass =
  "h-9 w-40 rounded-lg border border-neutral-200 bg-white px-3 text-xs text-neutral-800 shadow-2xs placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black";

export function OwnerFiltersBar({
  filters,
  onChange,
  onReset,
}: {
  filters: OwnerFilters;
  onChange: <K extends keyof OwnerFilters>(
    key: K,
    value: OwnerFilters[K] | undefined,
  ) => void;
  onReset: () => void;
}) {
  const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== "");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
        <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
      </span>

      <input
        type="text"
        value={filters.fullName ?? ""}
        onChange={(e) => onChange("fullName", e.target.value || undefined)}
        placeholder="Owner Name"
        className={textInputClass}
      />
      <input
        type="text"
        value={filters.mobileNumber ?? ""}
        onChange={(e) => onChange("mobileNumber", e.target.value || undefined)}
        placeholder="Mobile"
        className={textInputClass}
      />
      <input
        type="text"
        value={filters.alternateMobile ?? ""}
        onChange={(e) => onChange("alternateMobile", e.target.value || undefined)}
        placeholder="Alternate Mobile"
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
        value={filters.whatsapp ?? ""}
        onChange={(e) => onChange("whatsapp", e.target.value || undefined)}
        placeholder="WhatsApp"
        className={textInputClass}
      />
      <input
        type="text"
        value={filters.nationality ?? ""}
        onChange={(e) => onChange("nationality", e.target.value || undefined)}
        placeholder="Nationality"
        className={textInputClass}
      />
      <input
        type="text"
        value={filters.emirate ?? ""}
        onChange={(e) => onChange("emirate", e.target.value || undefined)}
        placeholder="Emirate"
        className={textInputClass}
      />
      <input
        type="text"
        value={filters.city ?? ""}
        onChange={(e) => onChange("city", e.target.value || undefined)}
        placeholder="City"
        className={textInputClass}
      />
      <input
        type="text"
        value={filters.locality ?? ""}
        onChange={(e) => onChange("locality", e.target.value || undefined)}
        placeholder="Locality"
        className={textInputClass}
      />
      <input
        type="text"
        value={filters.passportNumber ?? ""}
        onChange={(e) => onChange("passportNumber", e.target.value || undefined)}
        placeholder="Passport No."
        className={textInputClass}
      />
      <input
        type="text"
        value={filters.emiratesIdNumber ?? ""}
        onChange={(e) => onChange("emiratesIdNumber", e.target.value || undefined)}
        placeholder="Emirates ID"
        className={textInputClass}
      />

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          <X className="h-4 w-4" /> Clear
        </Button>
      )}
    </div>
  );
}
