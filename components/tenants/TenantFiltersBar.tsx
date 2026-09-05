"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { TenantQueryParams } from "@/services/tenants/tenants.service";

export type TenantFilters = Pick<
  TenantQueryParams,
  | "fullName"
  | "mobileNumber"
  | "email"
  | "tenantNationality"
  | "ownerName"
  | "building"
  | "unitNumber"
  | "community"
  | "emirate"
  | "agreementStart"
  | "agreementEnd"
  | "modeOfPayment"
>;

const textInputClass =
  "h-9 w-40 rounded-lg border border-neutral-200 bg-white px-3 text-xs text-neutral-800 shadow-2xs placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black";
const dateInputClass =
  "h-9 rounded-lg border border-neutral-200 bg-white px-3 text-xs text-neutral-800 shadow-2xs focus:border-black focus:outline-none focus:ring-1 focus:ring-black";

export function TenantFiltersBar({
  filters,
  onChange,
  onReset,
}: {
  filters: TenantFilters;
  onChange: <K extends keyof TenantFilters>(
    key: K,
    value: TenantFilters[K] | undefined,
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
          value={filters.fullName ?? ""}
          onChange={(e) => onChange("fullName", e.target.value || undefined)}
          placeholder="Tenant Name"
          className={textInputClass}
        />
        <input
          type="text"
          value={filters.mobileNumber ?? ""}
          onChange={(e) => onChange("mobileNumber", e.target.value || undefined)}
          placeholder="Phone"
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
          value={filters.tenantNationality ?? ""}
          onChange={(e) => onChange("tenantNationality", e.target.value || undefined)}
          placeholder="Nationality"
          className={textInputClass}
        />
        <input
          type="text"
          value={filters.ownerName ?? ""}
          onChange={(e) => onChange("ownerName", e.target.value || undefined)}
          placeholder="Owner Name"
          className={textInputClass}
        />
        <input
          type="text"
          value={filters.building ?? ""}
          onChange={(e) => onChange("building", e.target.value || undefined)}
          placeholder="Building / Project"
          className={textInputClass}
        />
        <input
          type="text"
          value={filters.unitNumber ?? ""}
          onChange={(e) => onChange("unitNumber", e.target.value || undefined)}
          placeholder="Unit No."
          className={textInputClass}
        />
        <input
          type="text"
          value={filters.community ?? ""}
          onChange={(e) => onChange("community", e.target.value || undefined)}
          placeholder="Community"
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
          value={filters.modeOfPayment ?? ""}
          onChange={(e) => onChange("modeOfPayment", e.target.value || undefined)}
          placeholder="Mode of Payment"
          className={textInputClass}
        />

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="h-4 w-4" /> Clear
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-medium text-neutral-500">Agreement Start</span>
        <input
          type="date"
          value={filters.agreementStart ?? ""}
          onChange={(e) => onChange("agreementStart", e.target.value || undefined)}
          className={dateInputClass}
        />
        <span className="font-medium text-neutral-500">Agreement End</span>
        <input
          type="date"
          value={filters.agreementEnd ?? ""}
          onChange={(e) => onChange("agreementEnd", e.target.value || undefined)}
          className={dateInputClass}
        />
      </div>
    </div>
  );
}
