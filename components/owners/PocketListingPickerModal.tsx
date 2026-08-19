"use client";

import { useState } from "react";
import {
  Package,
  BedDouble,
  Bath,
  Maximize,
  MapPin,
  ImageIcon,
  Check,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/States";
import { useAvailablePocketListings } from "@/hooks/usePocketListings";
import { formatCurrency, cn } from "@/lib/utils";
import type { PocketListing } from "@/types";

const PAGE_SIZE = 12;

const STATUS_LABELS: Record<string, string> = {
  available: "Available",
  sold: "Sold",
  rented: "Rented",
  off_market: "Off Market",
};

const STATUS_COLORS: Record<string, string> = {
  available: "bg-emerald-600",
  sold: "bg-red-600",
  rented: "bg-amber-500",
  off_market: "bg-zinc-500",
};

export function PocketListingPickerModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (listing: PocketListing) => void;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useAvailablePocketListings({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
  });

  const listings = data?.data ?? [];

  function handleConfirm() {
    const selected = listings.find((l) => l.id === selectedId);
    if (selected) {
      onSelect(selected);
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
      title="Select a Pocket Listing"
      description="Only pocket listings not yet linked to any owner are shown."
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedId}>
            {selectedId ? "Add Selected Pocket Listing" : "Select a pocket listing"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
            setSelectedId(null);
          }}
          placeholder="Search by title, reference, community…"
          className="w-full"
        />

        {isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <LoadingState label="Loading pocket listings…" />
          </div>
        ) : isError ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <ErrorState onRetry={refetch} />
          </div>
        ) : listings.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <EmptyState
              title={search ? "No pocket listings found" : "No available pocket listings"}
              message={
                search
                  ? "Try a different search term."
                  : "All pocket listings are already linked to owners, or none have been created yet."
              }
            />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <PocketListingSelectCard
                key={listing.id}
                listing={listing}
                selected={selectedId === listing.id}
                onClick={() => setSelectedId(listing.id)}
              />
            ))}
          </div>
        )}

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

// ── Selectable Pocket Listing Card ───────────────────────────────────────────

function PocketListingSelectCard({
  listing,
  selected,
  onClick,
}: {
  listing: PocketListing;
  selected: boolean;
  onClick: () => void;
}) {
  const priceLabel = listing.priceOnRequest
    ? "Price on request"
    : listing.price != null
    ? formatCurrency(listing.price)
    : "Price on request";

  const statusLabel = STATUS_LABELS[listing.listingStatus] ?? listing.listingStatus;
  const statusColor = STATUS_COLORS[listing.listingStatus] ?? "bg-zinc-500";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative block w-full overflow-hidden rounded-xl border-2 bg-white text-left shadow-2xs transition-all duration-200 hover:shadow-md",
        selected
          ? "border-purple-500 ring-2 ring-purple-500/20"
          : "border-neutral-200/80 hover:border-neutral-300",
      )}
    >
      {selected && (
        <div className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-purple-500 text-white shadow-lg">
          <Check className="h-4 w-4" />
        </div>
      )}

      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        {listing.mainImage ? (
          <img
            src={listing.mainImage}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-neutral-300">
            <Package className="h-8 w-8" />
            <span className="text-[10px] font-medium">Pocket Listing</span>
          </div>
        )}

        {/* Pocket Listing badge */}
        <span className="absolute left-3 top-3 rounded-full bg-purple-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm">
          Pocket
        </span>

        {/* Status badge */}
        <span
          className={cn(
            "absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm",
            statusColor,
          )}
        >
          {statusLabel}
        </span>
      </div>

      {/* Body */}
      <div className="p-3">
        <p className="text-base font-bold text-neutral-900">{priceLabel}</p>
        <h3 className="mt-0.5 line-clamp-1 text-xs font-semibold text-neutral-800">
          {listing.title}
        </h3>

        <p className="mt-1 flex items-center gap-1 text-[11px] text-neutral-500">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="line-clamp-1">
            {[listing.community, listing.emirate].filter(Boolean).join(", ")}
          </span>
        </p>

        <div className="mt-2 flex items-center gap-3 text-[11px] text-neutral-600">
          {listing.bedrooms && (
            <span className="flex items-center gap-0.5">
              <BedDouble className="h-3 w-3 text-neutral-400" />
              {listing.bedrooms === "studio" ? "Studio" : `${listing.bedrooms}BR`}
            </span>
          )}
          {listing.bathrooms && (
            <span className="flex items-center gap-0.5">
              <Bath className="h-3 w-3 text-neutral-400" />
              {listing.bathrooms}
            </span>
          )}
          {listing.size != null && listing.size > 0 && (
            <span className="flex items-center gap-0.5">
              <Maximize className="h-3 w-3 text-neutral-400" />
              {listing.size.toLocaleString()}
            </span>
          )}
        </div>

        <p className="mt-2 border-t border-neutral-100 pt-2 text-[10px] font-medium text-neutral-400">
          Ref: {listing.reference}
        </p>
      </div>
    </button>
  );
}
