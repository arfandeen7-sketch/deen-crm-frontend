"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { BookLock, Plus, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { PocketListingCard } from "@/components/pocketListings/PocketListingCard";
import { usePocketListingCreators, usePocketListingsList } from "@/hooks/usePocketListings";
import { AccessGuard, CanAccess } from "@/components/shared/Guards";
import { Select } from "@/components/ui/Input";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import {
  UAE_EMIRATES,
  OFFERING_TYPE_OPTIONS,
  BEDROOM_OPTIONS,
  PROPERTY_TYPES_BY_CATEGORY,
} from "@/schemas/pocketListing.schema";

const PAGE_SIZE = 20;

// All property types (residential + commercial combined, deduped)
const ALL_PROPERTY_TYPES = Array.from(
  new Set([
    ...PROPERTY_TYPES_BY_CATEGORY.residential,
    ...PROPERTY_TYPES_BY_CATEGORY.commercial,
  ])
).sort();

function humanizeSlug(slug: string): string {
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PocketListingsPage() {
  return (
    <AccessGuard module="pocket_listings" page="all_pocket_listings" action="view">
      <PocketListingsContent />
    </AccessGuard>
  );
}

function PocketListingsContent() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [offeringType, setOfferingType] = useState("");
  const [emirate, setEmirate] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [createdById, setCreatedById] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Created-by filter options come from pocket listings themselves (distinct creators),
  // so users without /users permission still see all relevant names.
  const { data: filterUsers = [] } = usePocketListingCreators();

  const params = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      ...(search && { search }),
      ...(status && { status }),
      ...(category && { category }),
      ...(offeringType && { offeringType }),
      ...(emirate && { emirate }),
      ...(propertyType && { type: propertyType }),
      ...(bedrooms && { bedrooms }),
      ...(createdById && { createdById }),
    }),
    [page, search, status, category, offeringType, emirate, propertyType, bedrooms, createdById],
  );

  const { data, isLoading, isError, refetch } = usePocketListingsList(params);

  const listings = data?.data ?? [];
  const meta = data?.meta;

  const hasActiveFilters = !!(
    search || status || category || offeringType ||
    emirate || propertyType || bedrooms || createdById
  );

  function resetFilters() {
    setSearch("");
    setStatus("");
    setCategory("");
    setOfferingType("");
    setEmirate("");
    setPropertyType("");
    setBedrooms("");
    setCreatedById("");
    setPage(1);
  }

  function handleFilterChange<T>(setter: (v: T) => void, value: T) {
    setter(value);
    setPage(1);
  }

  return (
    <div>
      <PageHeader
        title="Off-Market Listings"
        subtitle="Private off-market properties managed internally"
        actions={
          <CanAccess module="pocket_listings" page="all_pocket_listings" action="create">
            <Link href="/pocket-listings/create">
              <Button variant="primary" size="md">
                <Plus className="h-3.5 w-3.5" />
                Add Off-Market Listing
              </Button>
            </Link>
          </CanAccess>
        }
      />

      {/* Search + Filter toggle bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by title, reference, or location…"
          className="flex-1"
        />
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-black text-[9px] font-bold text-white">
              {[search, status, category, offeringType, emirate, propertyType, bedrooms, createdById].filter(Boolean).length}
            </span>
          )}
        </Button>
      </div>

      {/* Expandable filter panel */}
      {showFilters && (
        <div className="mb-6 rounded-xl border border-neutral-200/80 bg-white p-4 shadow-2xs">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Status */}
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Status
              </label>
              <Select
                value={status}
                onChange={(e) => handleFilterChange(setStatus, e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="available">Available</option>
                <option value="sold">Sold</option>
                <option value="rented">Rented</option>
                <option value="off_market">Off Market</option>
              </Select>
            </div>

            {/* Category */}
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Category
              </label>
              <Select
                value={category}
                onChange={(e) => handleFilterChange(setCategory, e.target.value)}
              >
                <option value="">All</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
              </Select>
            </div>

            {/* Offering Type */}
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Offering Type
              </label>
              <Select
                value={offeringType}
                onChange={(e) => handleFilterChange(setOfferingType, e.target.value)}
              >
                <option value="">All</option>
                {OFFERING_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Location (Emirate) */}
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Location
              </label>
              <Select
                value={emirate}
                onChange={(e) => handleFilterChange(setEmirate, e.target.value)}
              >
                <option value="">All Locations</option>
                {UAE_EMIRATES.map((e) => (
                  <option key={e.value} value={e.value}>
                    {e.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Property Type */}
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Property Type
              </label>
              <Select
                value={propertyType}
                onChange={(e) => handleFilterChange(setPropertyType, e.target.value)}
              >
                <option value="">All Types</option>
                {ALL_PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {humanizeSlug(t)}
                  </option>
                ))}
              </Select>
            </div>

            {/* Bedrooms */}
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Bedrooms
              </label>
              <Select
                value={bedrooms}
                onChange={(e) => handleFilterChange(setBedrooms, e.target.value)}
              >
                <option value="">Any</option>
                {BEDROOM_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b === "studio" ? "Studio" : `${b} Bedroom${b === "1" ? "" : "s"}`}
                  </option>
                ))}
              </Select>
            </div>

            {/* User (created by) — always shown; contains at least the current user */}
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Added By
              </label>
              <Select
                value={createdById}
                onChange={(e) => handleFilterChange(setCreatedById, e.target.value)}
              >
                <option value="">All Users</option>
                {filterUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 border-t border-neutral-100 pt-3">
              <Button variant="ghost" onClick={resetFilters} className="text-xs">
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-2xs"
            >
              <div className="aspect-[4/3] bg-neutral-200/80" />
              <div className="space-y-3 p-4">
                <div className="h-5 w-24 rounded bg-neutral-200/80" />
                <div className="h-4 w-full rounded bg-neutral-200/80" />
                <div className="h-3 w-2/3 rounded bg-neutral-200/80" />
                <div className="flex gap-4 pt-2">
                  <div className="h-3 w-16 rounded bg-neutral-200/80" />
                  <div className="h-3 w-16 rounded bg-neutral-200/80" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          message="Failed to load off-market listings. Please try again."
          onRetry={() => refetch()}
        />
      ) : listings.length === 0 ? (
        <EmptyState
          title="No off-market listings found"
          message={
            hasActiveFilters
              ? "Try adjusting your search or filters."
              : "No off-market listings have been added yet."
          }
          icon={<BookLock className="h-5 w-5" />}
          action={
            hasActiveFilters ? (
              <Button variant="outline" onClick={resetFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="mb-4 text-xs font-medium text-neutral-500">
            Showing{" "}
            <span className="font-semibold text-neutral-800">{listings.length}</span>{" "}
            of{" "}
            <span className="font-semibold text-neutral-800">
              {meta?.total ?? listings.length}
            </span>{" "}
            off-market listings
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing) => (
              <PocketListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="mt-6 overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-2xs">
              <Pagination
                page={page}
                pageSize={meta.pageSize}
                total={meta.total}
                totalPages={meta.totalPages}
                onPageChange={setPage}
                onPageSizeChange={() => {}}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
