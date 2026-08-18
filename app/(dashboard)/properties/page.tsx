"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Building2, SlidersHorizontal, Plus, ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { ErrorState, EmptyState } from "@/components/ui/States";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { usePropertiesList } from "@/hooks/useProperties";
import { usePropertySubmissionsList } from "@/hooks/usePropertySubmissions";
import { useAuth } from "@/hooks/useAuth";
import { Select } from "@/components/ui/Input";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { DEFAULT_PAGE_SIZE } from "@/constants";

export default function PropertiesPage() {
  const { isMaster } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [offeringType, setOfferingType] = useState("");
  const [category, setCategory] = useState("");
  const [furnishingType, setFurnishingType] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Pending submissions count for the badge on the "Submissions" button
  const { data: pendingData } = usePropertySubmissionsList(
    isMaster ? { status: "pending", pageSize: 1 } : { pageSize: 1 },
  );
  const pendingCount = isMaster ? (pendingData?.meta.total ?? 0) : 0;

  const params = useMemo(
    () => ({
      page,
      perPage: pageSize,
      ...(search && { search }),
      ...(offeringType && { offeringType }),
      ...(category && { category }),
      ...(furnishingType && { furnishingType }),
      orderBy: "-createdAt",
    }),
    [page, pageSize, search, offeringType, category, furnishingType],
  );

  const { data, isLoading, isError, refetch } = usePropertiesList(params);

  const properties = data?.data ?? [];
  const meta = data?.meta;

  function resetFilters() {
    setSearch("");
    setOfferingType("");
    setCategory("");
    setFurnishingType("");
    setPage(1);
  }

  const hasActiveFilters = !!(search || offeringType || category || furnishingType);

  return (
    <div>
      <PageHeader
        title="Properties"
        subtitle="All listings from your Property Finder portal"
        actions={
          <div className="flex items-center gap-2">
            {isMaster && (
              <Link href="/properties/submissions">
                <Button variant="secondary" size="md">
                  <ClipboardList className="h-3.5 w-3.5" />
                  Submissions
                  {pendingCount > 0 && (
                    <span className="ml-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {pendingCount}
                    </span>
                  )}
                </Button>
              </Link>
            )}
            <Link href="/properties/create">
              <Button variant="primary" size="md">
                <Plus className="h-3.5 w-3.5" />
                Add Property
              </Button>
            </Link>
          </div>
        }
      />

      {/* Search + Filter bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by title, reference, or location..."
          className="flex-1"
        />
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Expandable filters */}
      {showFilters && (
        <div className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-neutral-200/80 bg-white p-4 shadow-2xs sm:grid-cols-3">
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
              <option value="sale">For Sale</option>
              <option value="rent">For Rent</option>
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
              Furnishing
            </label>
            <Select
              value={furnishingType}
              onChange={(e) => {
                setFurnishingType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All</option>
              <option value="furnished">Furnished</option>
              <option value="unfurnished">Unfurnished</option>
              <option value="semi-furnished">Semi-Furnished</option>
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                  <div className="h-3 w-16 rounded bg-neutral-200/80" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          message="Failed to load properties from Property Finder. Please try again."
          onRetry={() => refetch()}
        />
      ) : properties.length === 0 ? (
        <EmptyState
          title="No properties found"
          message={
            hasActiveFilters
              ? "Try adjusting your search or filters."
              : "No listings are available on your Property Finder portal yet."
          }
          icon={<Building2 className="h-5 w-5" />}
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
            <span className="font-semibold text-neutral-800">{properties.length}</span>{" "}
            of{" "}
            <span className="font-semibold text-neutral-800">
              {meta?.total ?? properties.length}
            </span>{" "}
            properties
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>

          {meta && meta.total > 0 && (
            <div className="mt-6 overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-2xs">
              <Pagination
                page={page}
                pageSize={pageSize}
                total={meta.total}
                totalPages={meta.totalPages}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
