"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BedDouble,
  Bath,
  Maximize,
  MapPin,
  Car,
  Building,
  Calendar,
  FileText,
  Compass,
  Video,
  Hash,
  Layers,
  Home,
  Sparkles,
  CheckCircle2,
  Pencil,
  Trash2,
  AlertTriangle,
  User,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
import { PropertyGallery } from "@/components/properties/PropertyGallery";
import { AccessGuard, CanAccess } from "@/components/shared/Guards";
import { usePocketListing, usePocketListingMutations } from "@/hooks/usePocketListings";
import { useAuth } from "@/hooks/useAuth";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  displayValue,
} from "@/lib/utils";

// ── Status badge config ───────────────────────────────────────────────────────

const STATUS_CONFIG = {
  available: {
    label: "Available",
    className:
      "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  sold: {
    label: "Sold",
    className: "bg-red-50 text-red-700 border border-red-200",
  },
  rented: {
    label: "Rented",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  off_market: {
    label: "Off Market",
    className: "bg-zinc-100 text-zinc-600 border border-zinc-200",
  },
} as const;

// ── Page wrapper (permission gate) ───────────────────────────────────────────

export default function PocketListingDetailPage() {
  return (
    <AccessGuard
      module="pocket_listings"
      page="all_pocket_listings"
      action="view"
    >
      <PocketListingDetailContent />
    </AccessGuard>
  );
}

// ── Page content ─────────────────────────────────────────────────────────────

function PocketListingDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: listing, isLoading, isError, refetch } = usePocketListing(params.id);
  const { remove } = usePocketListingMutations();
  const { user, isMaster } = useAuth();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Loading / error states ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div>
        <BackLink />
        <LoadingState label="Loading pocket listing…" />
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div>
        <BackLink />
        <ErrorState
          message="Failed to load pocket listing details."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // Capture id in a stable local const so TypeScript closure narrowing works
  const listingId = listing.id;

  // Only the creator or a master can edit/delete. Other users can view
  // (gated by AccessGuard) but the action buttons are hidden.
  const canModify = isMaster || listing.createdById === user?.id;

  // ── Derived values ────────────────────────────────────────────────────────

  const statusCfg =
    STATUS_CONFIG[listing.listingStatus] ?? STATUS_CONFIG.available;

  const offeringLabel =
    listing.offeringType?.toLowerCase() === "sale"
      ? "For Sale"
      : listing.offeringType?.toLowerCase() === "rent"
        ? "For Rent"
        : displayValue(listing.offeringType, "");

  const priceLabel =
    listing.priceOnRequest || listing.price == null
      ? "Price on Request"
      : formatCurrency(listing.price);

  const priceSubLabel =
    !listing.priceOnRequest &&
    listing.priceType &&
    listing.priceType !== "sale"
      ? `per ${listing.priceType}`
      : null;

  // ── Delete handler ────────────────────────────────────────────────────────

  async function handleDelete() {
    setDeleting(true);
    try {
      await remove.mutateAsync(listingId);
      toast.success("Pocket listing deleted successfully.");
      router.push("/pocket-listings");
    } catch {
      toast.error("Failed to delete listing. Please try again.");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Back link */}
      <Link
        href="/pocket-listings"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Pocket Listings
      </Link>

      {/* Page header */}
      <PageHeader
        title={displayValue(listing.title, "Untitled Listing")}
        subtitle={
          [
            offeringLabel,
            [
              displayValue(listing.community, ""),
              displayValue(listing.city, displayValue(listing.emirate, "")),
            ]
              .filter(Boolean)
              .join(", "),
          ]
            .filter(Boolean)
            .join(" · ")
        }
        actions={
          <div className="flex items-center gap-2">
            {/* Edit — only creator or master */}
            {canModify && (
              <CanAccess
                module="pocket_listings"
                page="all_pocket_listings"
                action="edit"
              >
                <Link href={`/pocket-listings/${listingId}/edit`}>
                  <Button variant="outline" size="sm">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                </Link>
              </CanAccess>
            )}

            {/* Delete — only creator or master */}
            {canModify && (
              <CanAccess
                module="pocket_listings"
                page="all_pocket_listings"
                action="delete"
              >
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-600" />
                    <span className="text-xs text-red-700">Sure?</span>
                    <Button
                      variant="danger"
                      size="sm"
                      loading={deleting}
                      onClick={handleDelete}
                      className="ml-1"
                    >
                      Delete
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleting}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-red-600 hover:border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                )}
              </CanAccess>
            )}
          </div>
        }
      />

      {/* ── Main layout ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Gallery + Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Gallery */}
          <PropertyGallery
            images={listing.images.map((img) => ({
              original: img.url,
              watermarked: img.url,
              width: 0,
              height: 0,
            }))}
            video={
              listing.videoUrl
                ? {
                    url: listing.videoUrl,
                    thumbnailUrl: listing.images[0]?.url ?? "",
                  }
                : null
            }
            virtualTour={
              listing.virtualTourUrl
                ? { url: listing.virtualTourUrl }
                : null
            }
            floorPlan={
              listing.floorPlanUrl
                ? {
                    url: listing.floorPlanUrl,
                    watermarkedUrl: listing.floorPlanUrl,
                  }
                : null
            }
            title={listing.title}
          />

          {/* Quick-spec bar */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SpecCard
              icon={BedDouble}
              label="Bedrooms"
              value={
                listing.bedrooms === "studio"
                  ? "Studio"
                  : displayValue(listing.bedrooms)
              }
            />
            <SpecCard
              icon={Bath}
              label="Bathrooms"
              value={displayValue(listing.bathrooms)}
            />
            <SpecCard
              icon={Maximize}
              label="Size"
              value={
                listing.size && listing.size > 0
                  ? `${listing.size.toLocaleString()} sqft`
                  : "—"
              }
            />
            <SpecCard
              icon={Car}
              label="Parking"
              value={
                listing.parkingSlots && listing.parkingSlots > 0
                  ? `${listing.parkingSlots} slot${listing.parkingSlots > 1 ? "s" : ""}`
                  : "—"
              }
            />
          </div>

          {/* Description */}
          {listing.description && (
            <Card>
              <CardHeader title="Description" />
              <CardBody>
                <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700">
                  {listing.description}
                </p>
              </CardBody>
            </Card>
          )}

          {/* Classification */}
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <Home className="h-3.5 w-3.5" />
                  Classification
                </span>
              }
            />
            <CardBody>
              <div className="grid grid-cols-1 gap-x-6 gap-y-0 sm:grid-cols-2">
                <DetailRow icon={Building} label="Category" value={displayValue(listing.category)} />
                <DetailRow icon={Home} label="Property Type" value={displayValue(listing.type)} />
                <DetailRow icon={Sparkles} label="Furnishing" value={displayValue(listing.furnishingType)} />
                <DetailRow icon={Layers} label="Completion" value={displayValue(listing.completionStatus)} />
                <DetailRow icon={Building} label="Developer" value={displayValue(listing.developer)} />
                <DetailRow icon={Hash} label="Reference" value={displayValue(listing.reference)} />
              </div>
            </CardBody>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  Location
                </span>
              }
            />
            <CardBody>
              {listing.locationHierarchy && (
                <p className="mb-3 text-sm text-neutral-700">
                  {listing.locationHierarchy}
                </p>
              )}
              <div className="grid grid-cols-1 gap-x-6 gap-y-0 sm:grid-cols-2">
                <DetailRow icon={MapPin} label="Emirate" value={displayValue(listing.emirate)} />
                <DetailRow icon={MapPin} label="City" value={displayValue(listing.city)} />
                <DetailRow icon={MapPin} label="Community" value={displayValue(listing.community)} />
                <DetailRow icon={Building} label="Building" value={displayValue(listing.building)} />
                <DetailRow icon={Hash} label="Unit" value={displayValue(listing.unitNumber)} />
                <DetailRow icon={Layers} label="Floor" value={displayValue(listing.floorNumber)} />
              </div>
            </CardBody>
          </Card>

          {/* Specs */}
          <Card>
            <CardHeader title="Specifications" />
            <CardBody>
              <div className="grid grid-cols-1 gap-x-6 gap-y-0 sm:grid-cols-2">
                <DetailRow icon={BedDouble} label="Bedrooms" value={listing.bedrooms === "studio" ? "Studio" : displayValue(listing.bedrooms)} />
                <DetailRow icon={Bath} label="Bathrooms" value={displayValue(listing.bathrooms)} />
                <DetailRow icon={Maximize} label="Size" value={listing.size ? `${listing.size.toLocaleString()} sqft` : "—"} />
                <DetailRow icon={Maximize} label="Built-Up Area" value={listing.builtUpArea ? `${listing.builtUpArea.toLocaleString()} sqft` : "—"} />
                <DetailRow icon={Car} label="Parking Slots" value={listing.parkingSlots != null ? String(listing.parkingSlots) : "—"} />
              </div>
            </CardBody>
          </Card>

          {/* Pricing details */}
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <DollarSign className="h-3.5 w-3.5" />
                  Pricing
                </span>
              }
            />
            <CardBody>
              <div className="grid grid-cols-1 gap-x-6 gap-y-0 sm:grid-cols-2">
                <DetailRow icon={DollarSign} label="Price" value={priceLabel} />
                <DetailRow icon={DollarSign} label="Currency" value={displayValue(listing.currency)} />
                <DetailRow icon={FileText} label="Price Type" value={displayValue(listing.priceType)} />
                {listing.numberOfCheques != null && (
                  <DetailRow icon={FileText} label="No. of Cheques" value={String(listing.numberOfCheques)} />
                )}
              </div>
            </CardBody>
          </Card>

          {/* Amenities */}
          {listing.amenities && listing.amenities.length > 0 && (
            <Card>
              <CardHeader
                title={
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    Amenities
                  </span>
                }
              />
              <CardBody>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {listing.amenities.map((amenity, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-sm text-neutral-700"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span className="capitalize">
                        {amenity.replace(/[-_]/g, " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Rental Agreement */}
          {listing.rentalAgreement && (
            <Card>
              <CardHeader title="Rental Agreement" />
              <CardBody>
                <div className="grid grid-cols-1 gap-x-6 gap-y-0 sm:grid-cols-2">
                  <DetailRow
                    icon={Calendar}
                    label="Start Date"
                    value={formatDate(listing.rentalAgreement.agreementStartDate)}
                  />
                  <DetailRow
                    icon={Calendar}
                    label="End Date"
                    value={formatDate(listing.rentalAgreement.agreementEndDate)}
                  />
                  {listing.rentalAgreement.daysRemaining != null && (
                    <DetailRow
                      icon={Calendar}
                      label="Days Remaining"
                      value={
                        listing.rentalAgreement.daysRemaining > 0
                          ? `${listing.rentalAgreement.daysRemaining} days`
                          : "Expired"
                      }
                    />
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Media links */}
          {(listing.videoUrl || listing.virtualTourUrl || listing.floorPlanUrl) && (
            <Card>
              <CardHeader title="Additional Media" />
              <CardBody>
                <div className="flex flex-wrap gap-3">
                  {listing.videoUrl && (
                    <MediaLink
                      href={listing.videoUrl}
                      icon={Video}
                      label="Property Video"
                    />
                  )}
                  {listing.virtualTourUrl && (
                    <MediaLink
                      href={listing.virtualTourUrl}
                      icon={Compass}
                      label="Virtual Tour"
                    />
                  )}
                  {listing.floorPlanUrl && (
                    <MediaLink
                      href={listing.floorPlanUrl}
                      icon={FileText}
                      label="Floor Plan"
                    />
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Notes */}
          {listing.notes && (
            <Card>
              <CardHeader title="Internal Notes" />
              <CardBody>
                <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700">
                  {listing.notes}
                </p>
              </CardBody>
            </Card>
          )}

          {/* Created by */}
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5" />
                  Added By
                </span>
              }
            />
            <CardBody>
              <div className="grid grid-cols-1 gap-x-6 gap-y-0 sm:grid-cols-2">
                <DetailRow
                  icon={User}
                  label="Added By"
                  value={displayValue(listing.createdBy?.fullName)}
                />
                <DetailRow
                  icon={Calendar}
                  label="Created"
                  value={formatDateTime(listing.createdAt)}
                />
                <DetailRow
                  icon={Calendar}
                  label="Last Updated"
                  value={formatDateTime(listing.updatedAt)}
                />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right: Sticky price & status panel */}
        <div className="space-y-4">
          <Card className="lg:sticky lg:top-6">
            {/* Purple "Pocket Listing" banner */}
            <div className="rounded-t-xl bg-purple-600 px-5 py-2.5 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white">
                Pocket Listing
              </span>
            </div>

            <CardBody className="space-y-4">
              {/* Price */}
              <div>
                <p className="text-2xl font-bold text-neutral-900">
                  {priceLabel}
                </p>
                {priceSubLabel && (
                  <p className="text-xs text-neutral-400">{priceSubLabel}</p>
                )}
              </div>

              {/* Status badge */}
              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${statusCfg.className}`}
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {statusCfg.label}
                </span>

                {offeringLabel && (
                  <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-700">
                    {offeringLabel}
                  </span>
                )}
              </div>

              {/* Reference */}
              <div className="space-y-2 border-t border-neutral-100 pt-3">
                <StatusRow
                  label="Reference"
                  value={displayValue(listing.reference)}
                />
                <StatusRow
                  label="Category"
                  value={displayValue(listing.category)}
                />
                <StatusRow
                  label="Type"
                  value={displayValue(listing.type)}
                />
                {listing.availableFrom && (
                  <StatusRow
                    label="Available From"
                    value={formatDate(listing.availableFrom)}
                  />
                )}
              </div>

              {/* Timestamps */}
              <div className="space-y-1 border-t border-neutral-100 pt-3 text-[10px] text-neutral-400">
                <div>Created: {formatDateTime(listing.createdAt)}</div>
                <div>Updated: {formatDateTime(listing.updatedAt)}</div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BackLink() {
  return (
    <Link
      href="/pocket-listings"
      className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-800"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> Back to Pocket Listings
    </Link>
  );
}

function SpecCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-neutral-200/80 bg-white p-4 shadow-2xs">
      <Icon className="h-5 w-5 text-neutral-400" />
      <span className="text-sm font-semibold text-neutral-900">{value}</span>
      <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
        {label}
      </span>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-neutral-50 py-2">
      <span className="flex items-center gap-2 text-xs text-neutral-500">
        <Icon className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
        {label}
      </span>
      <span className="text-xs font-medium text-neutral-800">{value}</span>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
        {label}
      </span>
      <span className="text-xs font-medium text-neutral-700">{value}</span>
    </div>
  );
}

function MediaLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-xs font-medium text-neutral-700 shadow-2xs transition-colors hover:bg-neutral-50 hover:text-neutral-900"
    >
      <Icon className="h-4 w-4 text-neutral-400" />
      {label}
    </a>
  );
}
