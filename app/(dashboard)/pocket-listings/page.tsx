"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { BookLock, Plus, Search, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { PocketListingCard } from "@/components/pocketListings/PocketListingCard";
import { usePocketListingsList } from "@/hooks/usePocketListings";
import { AccessGuard, CanAccess } from "@/components/shared/Guards";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const PAGE_SIZE = 20;

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
  const [showFilters, setShowFilters] = useState(false);

  const params = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      ...(search && { search }),
      ...(status && { status }),
      ...(category && { category }),
      ...(offeringType && { offeringType }),
    }),
    [page, search, status, category, offeringType],
  );

  const { data, isLoading, isError, refetch } = usePocketListingsList(params);

  const listings = data?.data ?? [];
  const meta = data?.meta;

  const hasActiveFilters = !!(search || status || category || offeringType);

  function resetFilters() {
    setSearch("");
    setStatus("");
    setCategory("");
    setOfferingType("");
    setPage(1);
  }

  return (
    <div>
      <PageHeader
        title="Pocket Listings"
        subtitle="Private off-market properties managed internally"
        actions={
          <CanAccess module="pocket_listings" page="all_pocket_listings" action="create">
            <Link href="/pocket-listings/create">
              <Button variant="primary" size="md">
                <Plus className="h-3.5 w-3.5" />
                Add Pocket Listing
              </Button>
            </Link>
          </CanAccess>
        }
      />

      {/* Search + Filter toggle bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Search by title, reference, or location…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Expandable filter panel */}
      {showFilters && (
        <div className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-neutral-200/80 bg-white p-4 shadow-2xs sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Status
            </label>
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="rented">Rented</option>
              <option value="off_market">Off Market</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Category
            </label>
            <Select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Offering Type
            </label>
            <Select
              value={offeringType}
              onChange={(e) => {
                setOfferingType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All</option>
              <option value="sale">Sale</option>
              <option value="rent">Rent</option>
            </Select>
          </div>
          {hasActiveFilters && (
            <div className="sm:col-span-3">
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
          message="Failed to load pocket listings. Please try again."
          onRetry={() => refetch()}
        />
      ) : listings.length === 0 ? (
        <EmptyState
          title="No pocket listings found"
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
            pocket listings
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
