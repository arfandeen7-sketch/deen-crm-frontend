"use client";

import { useState } from "react";
import {
  Search,
  Building2,
  BedDouble,
  Bath,
  Maximize,
  MapPin,
  ImageIcon,
  Check,
  X,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/States";
import { useAvailableProperties } from "@/hooks/useOwners";
import { formatCurrency, displayValue, cn } from "@/lib/utils";
import type { PropertySummary } from "@/services/properties/properties.service";

const PAGE_SIZE = 12;

export function PropertyPickerModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (property: PropertySummary) => void;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useAvailableProperties({
    page,
    perPage: PAGE_SIZE,
    search: search || undefined,
  });

  const properties = data?.data ?? [];

  function handleSelect(prop: PropertySummary) {
    setSelectedId(prop.id);
  }

  function handleConfirm() {
    const selected = properties.find((p) => p.id === selectedId);
    if (selected) {
      onSelect(selected);
      // Reset state
      setSelectedId(null);
      setSearch("");
      setPage(1);
      onClose();
    }
  }

  function handleClose() {
    setSelectedId(null);
    setSearch("");
    setPage(1);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Select a Property"
      description="Only properties listed in the Properties module and not yet linked to any owner are shown."
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedId}>
            {selectedId ? "Add Selected Property" : "Select a property"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Search bar */}
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
            setSelectedId(null);
          }}
          placeholder="Search properties by title, reference, community…"
          className="w-full"
        />

        {/* Results */}
        {isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <LoadingState label="Loading available properties…" />
          </div>
        ) : isError ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <ErrorState onRetry={refetch} />
          </div>
        ) : properties.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <EmptyState
              title={
                search
                  ? "No unlinked properties found"
                  : "No available properties"
              }
              message={
                search
                  ? "Try a different search term, or all matching properties may already be linked to owners."
                  : "All properties from the Properties module are already linked to owners."
              }
            />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((prop) => (
              <PropertySelectCard
                key={prop.id}
                property={prop}
                selected={selectedId === prop.id}
                onClick={() => handleSelect(prop)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.meta.total > 0 && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
            <p className="text-xs text-neutral-500">
              Page {data.meta.page} of {data.meta.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Selectable Property Card ─────────────────────────────────────────────────

function PropertySelectCard({
  property,
  selected,
  onClick,
}: {
  property: PropertySummary;
  selected: boolean;
  onClick: () => void;
}) {
  const offeringLabel =
    property.offeringType?.toLowerCase() === "sale"
      ? "For Sale"
      : property.offeringType?.toLowerCase() === "rent"
        ? "For Rent"
        : displayValue(property.offeringType, "");

  // Deal status — same logic as the Properties module
  const isClosed = property.dealStatus === "sold" || property.dealStatus === "rented";
  const dealBadge =
    property.dealStatus === "sold"
      ? "Sold Out"
      : property.dealStatus === "rented"
        ? "Rented Out"
        : null;
  const rental = property.rentalAgreement;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative block w-full overflow-hidden rounded-xl border-2 bg-white text-left shadow-2xs transition-all duration-200 hover:shadow-md",
        selected
          ? "border-emerald-500 ring-2 ring-emerald-500/20"
          : "border-neutral-200/80 hover:border-neutral-300",
        isClosed && "grayscale opacity-60 hover:grayscale-0 hover:opacity-100",
      )}
    >
      {/* Selected checkmark */}
      {selected && (
        <div className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
          <Check className="h-4 w-4" />
        </div>
      )}

      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        {property.mainImage ? (
          <img
            src={property.mainImage}
            alt={property.title || "Property"}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-300">
            <ImageIcon className="h-10 w-10" />
          </div>
        )}

        {/* Deal Closed badge — takes precedence over offering badge (same as Properties module) */}
        {dealBadge ? (
          <span className="absolute left-3 top-3 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm">
            {dealBadge}
          </span>
        ) : offeringLabel ? (
          <span className="absolute left-3 top-3 rounded-full bg-black/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            {offeringLabel}
          </span>
        ) : null}
      </div>

      {/* Body */}
      <div className="p-3">
        {/* Price */}
        <p className="text-base font-bold text-neutral-900">
          {property.price != null ? formatCurrency(property.price) : "Price on request"}
        </p>

        {/* Title */}
        <h3 className="mt-0.5 line-clamp-1 text-xs font-semibold text-neutral-800">
          {displayValue(property.title, "Untitled Property")}
        </h3>

        {/* Location */}
        <p className="mt-1 flex items-center gap-1 text-[11px] text-neutral-500">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="line-clamp-1">
            {displayValue(property.community, "")}
            {property.community && property.city ? ", " : ""}
            {displayValue(property.city, displayValue(property.emirate, ""))}
          </span>
        </p>

        {/* Specs */}
        <div className="mt-2 flex items-center gap-3 text-[11px] text-neutral-600">
          {property.bedrooms && (
            <span className="flex items-center gap-0.5">
              <BedDouble className="h-3 w-3 text-neutral-400" />
              {property.bedrooms === "studio" ? "Studio" : `${property.bedrooms}BR`}
            </span>
          )}
          {property.bathrooms && (
            <span className="flex items-center gap-0.5">
              <Bath className="h-3 w-3 text-neutral-400" />
              {property.bathrooms}
            </span>
          )}
          {property.size > 0 && (
            <span className="flex items-center gap-0.5">
              <Maximize className="h-3 w-3 text-neutral-400" />
              {property.size.toLocaleString()}
            </span>
          )}
        </div>

        {/* Rental agreement details (if rented out) */}
        {dealBadge === "Rented Out" && rental && rental.agreementStartDate && rental.agreementEndDate && (
          <div className="mt-2 rounded-lg bg-amber-50 border border-amber-100 px-2 py-1.5">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-amber-600">
              Rental Agreement
            </p>
            <div className="mt-0.5 flex items-center justify-between text-[10px] text-amber-800">
              <span>
                {new Date(rental.agreementStartDate).toLocaleDateString()} →{" "}
                {new Date(rental.agreementEndDate).toLocaleDateString()}
              </span>
            </div>
            {rental.daysRemaining != null && (
              <p className={cn(
                "mt-0.5 text-[10px] font-semibold",
                rental.daysRemaining < 0 ? "text-red-600" : rental.daysRemaining <= 30 ? "text-amber-600" : "text-emerald-600",
              )}>
                {rental.daysRemaining < 0
                  ? `Expired ${Math.abs(rental.daysRemaining)} days ago`
                  : `${rental.daysRemaining} days remaining`}
              </p>
            )}
          </div>
        )}

        {/* Reference */}
        <p className="mt-2 border-t border-neutral-100 pt-2 text-[10px] font-medium text-neutral-400">
          Ref: {displayValue(property.reference, "—")}
        </p>
      </div>
    </button>
  );
}
