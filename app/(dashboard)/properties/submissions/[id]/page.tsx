"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Check,
  Trash2,
  ExternalLink,
  BedDouble,
  Bath,
  Maximize,
  MapPin,
  Image as ImageIcon,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { usePropertySubmission, usePropertySubmissionMutations } from "@/hooks/usePropertySubmissions";
import { useAuth } from "@/hooks/useAuth";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import type { PropertySubmissionStatus } from "@/services/properties/propertySubmissions.service";

export default function PropertySubmissionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isMaster, user } = useAuth();
  const { data: submission, isLoading, isError, refetch } = usePropertySubmission(params.id);
  const { review, withdraw } = usePropertySubmissionMutations();

  const [reviewNote, setReviewNote] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);

  if (isLoading) {
    return (
      <div>
        <BackLink />
        <LoadingState label="Loading submission..." />
      </div>
    );
  }

  if (isError || !submission) {
    return (
      <div>
        <BackLink />
        <ErrorState message="Failed to load property submission" onRetry={() => refetch()} />
      </div>
    );
  }

  const payload = submission.payload as Record<string, any>;
  const titleEn = payload?.title?.en ?? "Untitled Property";
  const descriptionEn = payload?.description?.en ?? "";
  const reference = payload?.reference ?? "—";
  const type = payload?.type ?? "";
  const category = payload?.category ?? "";
  const furnishingType = payload?.furnishingType ?? "";
  const uaeEmirate = payload?.uaeEmirate ?? "";
  const size = payload?.size as number | undefined;
  const bedrooms = payload?.bedrooms as string | undefined;
  const bathrooms = payload?.bathrooms as string | undefined;
  const priceType = payload?.price?.type ?? "";
  const priceAmount = payload?.price?.amounts?.[priceType] as number | undefined;
  const amenities: string[] = payload?.amenities ?? [];
  const images: Array<{ original?: { url?: string } }> = payload?.media?.images ?? [];
  const videoUrl = payload?.media?.videos?.default as string | undefined;
  const virtualTourUrl = (payload?.media?.virtualTours?.[0]?.url ?? payload?.media?.virtualTour?.url) as string | undefined;
  const floorPlanUrl = payload?.media?.floorPlan?.url as string | undefined;
  const compliance = payload?.compliance;
  const locationId = payload?.location?.id;

  const isPending = submission.status === "pending";
  const canWithdraw = isPending && (isMaster || submission.submittedById === user?.id);

  async function handleApprove() {
    try {
      await review.mutateAsync({ id: params.id, status: "approved" });
      toast.success("Property approved and pushed to Property Finder.");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to approve submission");
    }
  }

  async function handleReject() {
    try {
      await review.mutateAsync({ id: params.id, status: "rejected", reviewNote: reviewNote || undefined });
      toast.success("Property submission rejected.");
      setShowRejectBox(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to reject submission");
    }
  }

  async function handleWithdraw() {
    if (!confirm("Withdraw this property submission? This will delete it.")) return;
    try {
      await withdraw.mutateAsync(params.id);
      toast.success("Submission withdrawn.");
      router.push("/properties");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to withdraw submission");
    }
  }

  return (
    <div>
      <BackLink />

      <PageHeader
        title={titleEn}
        subtitle={`Ref: ${reference} · ${type} · ${category} · ${uaeEmirate}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={submission.status} />
            {canWithdraw && (
              <Button variant="ghost" size="sm" onClick={handleWithdraw} loading={withdraw.isPending}>
                <Trash2 className="h-3.5 w-3.5" /> Withdraw
              </Button>
            )}
          </div>
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Property preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          {images.length > 0 && (
            <Card>
              <CardHeader title={`Images (${images.length})`} />
              <CardBody>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((img, idx) => (
                    <a
                      key={idx}
                      href={img.original?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-[4/3] overflow-hidden rounded-lg border border-neutral-200"
                    >
                      <img
                        src={img.original?.url}
                        alt={`Image ${idx + 1}`}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                      />
                    </a>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Description */}
          {descriptionEn && (
            <Card>
              <CardHeader title="Description" />
              <CardBody>
                <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700">{descriptionEn}</p>
              </CardBody>
            </Card>
          )}

          {/* Property Details */}
          <Card>
            <CardHeader title="Property Details" />
            <CardBody>
              <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                <DetailItem label="Type" value={type} />
                <DetailItem label="Category" value={category} />
                <DetailItem label="Furnishing" value={furnishingType} />
                <DetailItem label="Emirate" value={uaeEmirate} />
                <DetailItem label="Size" value={size ? `${size} sqft` : undefined} />
                <DetailItem label="Bedrooms" value={bedrooms === "studio" ? "Studio" : bedrooms} />
                <DetailItem label="Bathrooms" value={bathrooms} />
                <DetailItem label="Location ID" value={locationId ? String(locationId) : undefined} />
                <DetailItem label="Price Type" value={priceType} />
                <DetailItem label="Price Amount" value={priceAmount != null ? formatCurrency(priceAmount) : undefined} />
              </div>
            </CardBody>
          </Card>

          {/* Amenities */}
          {amenities.length > 0 && (
            <Card>
              <CardHeader title="Amenities" />
              <CardBody>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((a) => (
                    <span
                      key={a}
                      className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700"
                    >
                      {a.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Additional Media */}
          {(videoUrl || virtualTourUrl || floorPlanUrl) && (
            <Card>
              <CardHeader title="Additional Media" />
              <CardBody>
                <div className="flex flex-wrap gap-3">
                  {videoUrl && <MediaLink href={videoUrl} label="Video" />}
                  {virtualTourUrl && <MediaLink href={virtualTourUrl} label="Virtual Tour" />}
                  {floorPlanUrl && <MediaLink href={floorPlanUrl} label="Floor Plan" />}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Compliance */}
          {compliance && (
            <Card>
              <CardHeader title="Compliance" />
              <CardBody>
                <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                  <DetailItem label="Permit Number" value={compliance.listingAdvertisementNumber} />
                  <DetailItem label="Type" value={compliance.type} />
                  <DetailItem label="License Number" value={compliance.issuingClientLicenseNumber} />
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Right: Submission info + approval actions */}
        <div className="space-y-6">
          {/* Submission info */}
          <Card>
            <CardHeader title="Submission Info" />
            <CardBody className="space-y-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Submitted by</p>
                <p className="text-sm font-semibold text-neutral-900">{submission.submittedBy?.fullName ?? "Unknown"}</p>
                <p className="text-xs text-neutral-500">{submission.submittedBy?.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Submitted on</p>
                <p className="text-sm text-neutral-700">{formatDateTime(submission.createdAt)}</p>
              </div>
              {submission.reviewedBy && (
                <>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Reviewed by</p>
                    <p className="text-sm font-semibold text-neutral-900">{submission.reviewedBy.fullName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Reviewed on</p>
                    <p className="text-sm text-neutral-700">{formatDateTime(submission.reviewedAt)}</p>
                  </div>
                </>
              )}
              {submission.reviewNote && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Review note</p>
                  <p className="text-sm text-neutral-700">{submission.reviewNote}</p>
                </div>
              )}
              {submission.pfListingId && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">PF Listing ID</p>
                  <p className="text-sm font-mono text-neutral-700">{submission.pfListingId}</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Approval actions (master only, pending only) */}
          {isMaster && isPending && (
            <Card>
              <CardHeader title="Review Actions" />
              <CardBody className="space-y-4">
                <p className="text-xs text-neutral-500">
                  Approving will push this listing to Property Finder via the Enterprise API. Rejecting will notify the submitter.
                </p>

                {showRejectBox ? (
                  <>
                    <Textarea
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="Rejection reason (optional)..."
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="danger"
                        size="md"
                        onClick={handleReject}
                        loading={review.isPending}
                        className="flex-1"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Confirm Rejection
                      </Button>
                      <Button variant="secondary" size="md" onClick={() => setShowRejectBox(false)}>
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleApprove}
                      loading={review.isPending}
                      className="flex-1"
                    >
                      <Check className="h-3.5 w-3.5" /> Approve & Publish
                    </Button>
                    <Button
                      variant="danger"
                      size="md"
                      onClick={() => setShowRejectBox(true)}
                    >
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/properties/submissions"
      className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-800"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> Back to Submissions
    </Link>
  );
}

function StatusBadge({ status }: { status: PropertySubmissionStatus }) {
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-600">
        <Clock className="h-3.5 w-3.5" /> Pending
      </span>
    );
  }
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-green-600">
        <CheckCircle2 className="h-3.5 w-3.5" /> Approved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-red-600">
      <XCircle className="h-3.5 w-3.5" /> Rejected
    </span>
  );
}

function DetailItem({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-50 py-2">
      <span className="text-xs text-neutral-500">{label}</span>
      <span className="text-xs font-medium text-neutral-800">{value ?? "—"}</span>
    </div>
  );
}

function MediaLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-xs font-medium text-neutral-700 shadow-2xs transition-colors hover:bg-neutral-50"
    >
      <ExternalLink className="h-4 w-4 text-neutral-400" />
      {label}
    </a>
  );
}
