"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Clock, CheckCircle2, XCircle, ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { usePropertySubmissionsList } from "@/hooks/usePropertySubmissions";
import { useAuth } from "@/hooks/useAuth";
import { MasterGuard } from "@/components/shared/Guards";
import { formatDateTime, displayValue } from "@/lib/utils";
import type { PropertySubmissionStatus } from "@/services/properties/propertySubmissions.service";

const PAGE_SIZE = 10;

export default function PropertySubmissionsPage() {
  return (
    <MasterGuard>
      <SubmissionsContent />
    </MasterGuard>
  );
}

function SubmissionsContent() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PropertySubmissionStatus | "">("");

  const params = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      ...(search && { search }),
      ...(status && { status }),
    }),
    [page, search, status],
  );

  const { data, isLoading, isError, refetch } = usePropertySubmissionsList(params);

  return (
    <div>
      <Link
        href="/properties"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Properties
      </Link>

      <PageHeader
        title="Property Submissions"
        subtitle="Review and approve properties submitted by your team for Property Finder publishing"
      />

      {/* Filter bar */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by reference or title..."
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as PropertySubmissionStatus | "");
            setPage(1);
          }}
          className="w-auto"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      {/* Content */}
      <div className="mt-6">
        {isLoading ? (
          <LoadingState label="Loading submissions..." />
        ) : isError ? (
          <ErrorState message="Failed to load property submissions" onRetry={() => refetch()} />
        ) : !data?.data?.length ? (
          <EmptyState
            icon={<ClipboardList className="h-8 w-8" />}
            title="No property submissions"
            message="When team members submit properties for approval, they will appear here."
          />
        ) : (
          <div className="space-y-3">
            {data.data.map((submission) => (
              <SubmissionRow key={submission.id} submission={submission} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.meta.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            page={data.meta.page}
            pageSize={data.meta.pageSize}
            total={data.meta.total}
            totalPages={data.meta.totalPages}
            onPageChange={setPage}
            onPageSizeChange={() => {}}
          />
        </div>
      )}
    </div>
  );
}

function SubmissionRow({ submission }: { submission: any }) {
  const payload = submission.payload as Record<string, any>;
  const titleEn = payload?.title?.en ?? "Untitled";
  const reference = payload?.reference ?? "—";
  const type = payload?.type ?? "";
  const category = payload?.category ?? "";
  const uaeEmirate = payload?.uaeEmirate ?? "";
  const priceType = payload?.price?.type ?? "";
  const priceAmount = payload?.price?.amounts?.[priceType] as number | undefined;
  const size = payload?.size as number | undefined;
  const imageUrls: string[] =
    (submission.images ?? []).map((img: { url?: string }) => img.url).filter(Boolean) as string[];
  const payloadImageUrls: string[] = (payload?.media?.images ?? []).map((img: any) => img?.original?.url).filter(Boolean);
  const mainImage = imageUrls[0] ?? payloadImageUrls[0] ?? null;

  return (
    <Link
      href={`/properties/submissions/${submission.id}`}
      className="flex items-center gap-4 rounded-xl border border-neutral-200/80 bg-white p-4 shadow-2xs transition-all hover:shadow-md hover:border-neutral-300"
    >
      {/* Image */}
      <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
        {mainImage ? (
          <img src={mainImage} alt={titleEn} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-300">
            <ClipboardList className="h-6 w-6" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-neutral-900">{titleEn}</h3>
          <StatusBadge status={submission.status} />
        </div>
        <p className="mt-0.5 text-xs text-neutral-500">
          Ref: {reference} · {type} · {category} · {uaeEmirate}
          {size ? ` · ${size} sqft` : ""}
          {priceAmount ? ` · AED ${priceAmount.toLocaleString()}` : ""}
        </p>
        <p className="mt-0.5 text-[10px] text-neutral-400">
          Submitted by {submission.submittedBy?.fullName ?? "Unknown"} on {formatDateTime(submission.createdAt)}
          {submission.reviewedAt && ` · Reviewed ${formatDateTime(submission.reviewedAt)}`}
        </p>
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: PropertySubmissionStatus }) {
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-600">
        <Clock className="h-3 w-3" /> Pending
      </span>
    );
  }
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-green-600">
        <CheckCircle2 className="h-3 w-3" /> Approved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-600">
      <XCircle className="h-3 w-3" /> Rejected
    </span>
  );
}
