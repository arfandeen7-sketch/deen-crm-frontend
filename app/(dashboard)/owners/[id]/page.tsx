"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Pencil,
  Plus,
  Trash2,
  Phone,
  Mail,
  MessageSquare,
  MapPin,
  Building2,
  Home,
  Bed,
  Bath,
  Maximize,
  Car,
  Layers,
  Tag,
  ImageIcon,
  Video,
  FileText,
  Compass,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { UserAvatar } from "@/components/ui/Avatar";
import { AccessGuard, CanAccess } from "@/components/shared/Guards";
import { useOwner, useOwnerPropertyMutations } from "@/hooks/useOwners";
import { getErrorMessage } from "@/services/api/client";
import { formatCurrency, displayValue } from "@/lib/utils";
import { OwnerPropertyForm } from "@/components/forms/OwnerPropertyForm";
import {
  LISTING_STATUS_LABELS,
  LISTING_STATUS_COLORS,
  type OwnerPropertyFormValues,
} from "@/schemas/owner.schema";
import type { OwnerProperty } from "@/types";

export default function OwnerDetailPage() {
  return (
    <AccessGuard module="owners" page="all_owners" action="view">
      <OwnerDetailContent />
    </AccessGuard>
  );
}

function OwnerDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: owner, isLoading } = useOwner(params.id);
  const { createProperty, updateProperty, removeProperty } =
    useOwnerPropertyMutations();

  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<OwnerProperty | null>(
    null,
  );
  const [deletePropertyId, setDeletePropertyId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Group properties by projectName
  const groupedByProject = useMemo(() => {
    const map = new Map<string, OwnerProperty[]>();
    if (!owner?.properties) return map;
    for (const prop of owner.properties) {
      const arr = map.get(prop.projectName) ?? [];
      arr.push(prop);
      map.set(prop.projectName, arr);
    }
    return map;
  }, [owner]);

  async function handlePropertySubmit(values: OwnerPropertyFormValues) {
    if (!params.id) return;
    setSubmitting(true);
    try {
      if (editingProperty) {
        await updateProperty.mutateAsync({
          ownerId: params.id,
          propertyId: editingProperty.id,
          body: values,
        });
        toast.success("Property updated");
        setShowPropertyModal(false);
        setEditingProperty(null);
      } else {
        await createProperty.mutateAsync({ ownerId: params.id, body: values });
        toast.success("Property added");
        // In multi-add mode, the form resets itself after this resolves.
        // The modal stays open so the user can add more properties.
      }
    } catch (e) {
      toast.error(getErrorMessage(e));
      throw e; // re-throw so the form knows it failed and doesn't reset
    } finally {
      setSubmitting(false);
    }
  }

  function handleClosePropertyModal() {
    setShowPropertyModal(false);
    setEditingProperty(null);
  }

  async function handleDeleteProperty() {
    if (!params.id || !deletePropertyId) return;
    try {
      await removeProperty.mutateAsync({
        ownerId: params.id,
        propertyId: deletePropertyId,
      });
      toast.success("Property removed");
      setDeletePropertyId(null);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-slate-400">Loading owner…</p>
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-slate-400">Owner not found</p>
      </div>
    );
  }

  const totalProperties = owner.properties?.length ?? 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title={owner.fullName}
        subtitle={`${totalProperties} ${totalProperties === 1 ? "property" : "properties"} across ${groupedByProject.size} ${groupedByProject.size === 1 ? "project" : "projects"}`}
        actions={
          <>
            <Link
              href="/owners"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <CanAccess module="owners" page="all_owners" action="edit">
              <Button
                variant="outline"
                onClick={() => router.push(`/owners/${owner.id}/edit`)}
              >
                <Pencil className="h-4 w-4" /> Edit Owner
              </Button>
            </CanAccess>
            <CanAccess module="owners" page="all_owners" action="create">
              <Button
                onClick={() => {
                  setEditingProperty(null);
                  setShowPropertyModal(true);
                }}
              >
                <Plus className="h-4 w-4" /> Add Property
              </Button>
            </CanAccess>
          </>
        }
      />

      {/* ── Owner Contact Card ─────────────────────────────────────── */}
      <Card>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <UserAvatar name={owner.fullName} size="lg" />
          <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ContactItem
              icon={<Phone className="h-4 w-4" />}
              label="Mobile"
              value={owner.mobileNumber}
            />
            <ContactItem
              icon={<Phone className="h-4 w-4" />}
              label="Alternate"
              value={owner.alternateMobile}
            />
            <ContactItem
              icon={<Mail className="h-4 w-4" />}
              label="Email"
              value={owner.email}
            />
            <ContactItem
              icon={<MessageSquare className="h-4 w-4" />}
              label="WhatsApp"
              value={owner.whatsapp}
            />
            <ContactItem
              icon={<MapPin className="h-4 w-4" />}
              label="Emirate"
              value={owner.emirate}
            />
            <ContactItem
              icon={<MapPin className="h-4 w-4" />}
              label="City"
              value={owner.city}
            />
            <ContactItem
              icon={<MapPin className="h-4 w-4" />}
              label="Locality"
              value={owner.locality}
            />
            <ContactItem
              icon={<Tag className="h-4 w-4" />}
              label="Created by"
              value={owner.creator?.fullName}
            />
          </div>
        </CardBody>
        {owner.notes && (
          <div className="border-t border-neutral-100 px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Notes
            </p>
            <p className="mt-1 text-sm text-neutral-700">{owner.notes}</p>
          </div>
        )}
      </Card>

      {/* ── Properties grouped by project ──────────────────────────── */}
      {groupedByProject.size === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-600">
              No properties yet
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Add properties owned by {owner.fullName} across different projects.
            </p>
            <CanAccess module="owners" page="all_owners" action="create">
              <Button
                className="mt-4"
                onClick={() => {
                  setEditingProperty(null);
                  setShowPropertyModal(true);
                }}
              >
                <Plus className="h-4 w-4" /> Add First Property
              </Button>
            </CanAccess>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {Array.from(groupedByProject.entries()).map(([projectName, props]) => (
            <Card key={projectName}>
              <CardHeader
                title={
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    {projectName}
                  </span>
                }
                subtitle={`${props.length} ${props.length === 1 ? "unit" : "units"}`}
              />
              <CardBody className="!p-0">
                <div className="divide-y divide-neutral-100">
                  {props.map((prop) => (
                    <PropertyRow
                      key={prop.id}
                      property={prop}
                      onEdit={() => {
                        setEditingProperty(prop);
                        setShowPropertyModal(true);
                      }}
                      onDelete={() => setDeletePropertyId(prop.id)}
                    />
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* ── Add / Edit Property Modal ──────────────────────────────── */}
      <Modal
        open={showPropertyModal}
        onClose={handleClosePropertyModal}
        title={editingProperty ? "Edit Property" : "Add Properties"}
        description={
          editingProperty
            ? undefined
            : "Select one or more properties from the Properties module to link to this owner."
        }
        size="xl"
      >
        <OwnerPropertyForm
          key={editingProperty?.id ?? "add"}
          initial={editingProperty ?? undefined}
          submitting={submitting}
          onSubmit={handlePropertySubmit}
          onCancel={handleClosePropertyModal}
          multiAdd={!editingProperty}
        />
      </Modal>

      {/* ── Delete Property Confirmation ───────────────────────────── */}
      <ConfirmModal
        open={!!deletePropertyId}
        onClose={() => setDeletePropertyId(null)}
        onConfirm={handleDeleteProperty}
        title="Remove property?"
        message="This will remove the property from this owner's portfolio."
        confirmLabel="Remove"
        loading={removeProperty.isPending}
      />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ContactItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          {label}
        </p>
        <p className="text-sm text-neutral-800">{value || "—"}</p>
      </div>
    </div>
  );
}

function PropertyRow({
  property,
  onEdit,
  onDelete,
}: {
  property: OwnerProperty;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const pf = property.pfListing;
  const pl = property.pocketListing;

  // Derive display values from either the PF listing or the Pocket listing.
  // PF listing takes precedence; pocket listing is the fallback.
  const mainImage = pf?.mainImage ?? pl?.mainImage ?? null;
  const title =
    pf?.title ?? pl?.title ?? property.reference ?? `Unit ${property.unitNumber ?? "—"}`;
  const price = pf?.price ?? pl?.price ?? (property.price ? Number(property.price) : null);
  const size = pf?.size ?? pl?.size ?? (property.size ? Number(property.size) : 0);
  const bedrooms = pf?.bedrooms ?? pl?.bedrooms ?? property.bedrooms ?? "";
  const bathrooms = pf?.bathrooms ?? pl?.bathrooms ?? property.bathrooms ?? "";
  const community = pf?.community ?? pl?.community ?? property.community ?? null;
  const building = pf?.building ?? pl?.building ?? property.building ?? null;
  const emirate = pf?.emirate ?? pl?.emirate ?? property.emirate ?? null;
  const furnishingType = pf?.furnishingType ?? pl?.furnishingType ?? "";
  const offeringType = pf?.offeringType ?? pl?.offeringType ?? "";
  const reference = pf?.reference ?? pl?.reference ?? property.reference ?? "";
  const imageCount = pf?.imageCount ?? pl?.imageCount ?? 0;
  const hasVideo = pf?.hasVideo ?? !!pl?.videoUrl;
  const hasFloorPlan = pf?.hasFloorPlan ?? !!pl?.floorPlanUrl;
  const hasVirtualTour = pf?.hasVirtualTour ?? !!pl?.virtualTourUrl;
  const amenities = pf?.amenities ?? pl?.amenities ?? [];
  const agentName = pf?.agentName ?? null;
  const agencyName = pf?.agencyName ?? null;

  // Deal status — PF uses dealStatus from linked leads; pocket listings use
  // listingStatus (sold/rented) directly on the listing.
  const dealStatus = pf?.dealStatus ?? (pl?.listingStatus === "sold" || pl?.listingStatus === "rented" ? pl.listingStatus : null);
  const isClosed = dealStatus === "sold" || dealStatus === "rented";
  const dealBadge =
    dealStatus === "sold"
      ? "Sold Out"
      : dealStatus === "rented"
        ? "Rented Out"
        : null;
  const rental = pf?.rentalAgreement ?? pl?.rentalAgreement ?? null;

  const offeringLabel =
    offeringType?.toLowerCase() === "sale"
      ? "For Sale"
      : offeringType?.toLowerCase() === "rent"
        ? "For Rent"
        : offeringType;

  return (
    <div className="px-5 py-4 hover:bg-neutral-50/60 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Property image */}
          <div className={`relative h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-slate-100 ${isClosed ? "grayscale opacity-70" : ""}`}>
            {mainImage ? (
              <img
                src={mainImage}
                alt={title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300">
                <ImageIcon className="h-8 w-8" />
              </div>
            )}
            {/* Media badges */}
            <div className="absolute right-1 top-1 flex flex-col gap-1">
              {imageCount > 0 && (
                <span className="flex items-center gap-0.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm">
                  <ImageIcon className="h-2.5 w-2.5" />
                  {imageCount}
                </span>
              )}
              {hasVideo && (
                <span className="flex items-center gap-0.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm">
                  <Video className="h-2.5 w-2.5" />
                </span>
              )}
              {hasVirtualTour && (
                <span className="flex items-center gap-0.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm">
                  <Compass className="h-2.5 w-2.5" />
                </span>
              )}
              {hasFloorPlan && (
                <span className="flex items-center gap-0.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm">
                  <FileText className="h-2.5 w-2.5" />
                </span>
              )}
            </div>
            {/* Deal Closed badge — takes precedence over offering badge (same as Properties module) */}
            {dealBadge ? (
              <span className="absolute left-1 top-1 rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white shadow-sm">
                {dealBadge}
              </span>
            ) : offeringLabel ? (
              <span className="absolute left-1 top-1 rounded-full bg-black/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                {offeringLabel}
              </span>
            ) : null}
          </div>

          {/* Property details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-slate-900 truncate">{title}</p>
              {/* Deal status badge (Sold Out / Rented Out) — same as Properties module */}
              {dealBadge && (
                <span className="inline-flex items-center rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm">
                  {dealBadge}
                </span>
              )}
              {/* Owner-side listing status badge */}
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${LISTING_STATUS_COLORS[property.listingStatus] ?? "bg-slate-100 text-slate-600"}`}
              >
                {LISTING_STATUS_LABELS[property.listingStatus] ?? property.listingStatus}
              </span>
            </div>

            {/* Price */}
            {price != null && (
              <p className="mt-0.5 text-base font-bold text-slate-900">
                {formatCurrency(price)}
                {offeringType?.toLowerCase() === "rent" && (
                  <span className="ml-1 text-[10px] font-medium text-slate-400">/year</span>
                )}
              </p>
            )}

            {/* Location */}
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {displayValue(community, "")}
                {community && building ? ", " : ""}
                {displayValue(building, "")}
                {(community || building) && emirate ? ", " : ""}
                {displayValue(emirate, "")}
              </span>
            </p>

            {/* Specs row */}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
              {property.type && (
                <span className="flex items-center gap-1">
                  <Home className="h-3 w-3 text-slate-400" /> {property.type}
                </span>
              )}
              {bedrooms && (
                <span className="flex items-center gap-1">
                  <Bed className="h-3 w-3 text-slate-400" />
                  {bedrooms === "studio" ? "Studio" : `${bedrooms} BR`}
                </span>
              )}
              {bathrooms && (
                <span className="flex items-center gap-1">
                  <Bath className="h-3 w-3 text-slate-400" /> {bathrooms} Bath
                </span>
              )}
              {size > 0 && (
                <span className="flex items-center gap-1">
                  <Maximize className="h-3 w-3 text-slate-400" /> {size.toLocaleString()} sqft
                </span>
              )}
              {property.floorNumber && (
                <span className="flex items-center gap-1">
                  <Layers className="h-3 w-3 text-slate-400" /> Floor {property.floorNumber}
                </span>
              )}
              {property.parkingSlots && (
                <span className="flex items-center gap-1">
                  <Car className="h-3 w-3 text-slate-400" /> {property.parkingSlots} parking
                </span>
              )}
              {furnishingType && (
                <span className="text-slate-500">{furnishingType}</span>
              )}
            </div>

            {/* Reference + Agent */}
            <div className="mt-2 flex items-center justify-between gap-2 border-t border-neutral-100 pt-2">
              <div className="flex items-center gap-3 text-[10px] font-medium text-slate-400">
                <span>Ref: {displayValue(reference, "—")}</span>
                {agentName && <span>Agent: {agentName}</span>}
                {agencyName && <span>· {agencyName}</span>}
              </div>
              {pf && (
                <Link
                  href={`/properties/${pf.id}`}
                  className="flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  View in Properties <ExternalLink className="h-3 w-3" />
                </Link>
              )}
              {pl && (
                <Link
                  href={`/pocket-listings/${pl.id}`}
                  className="flex items-center gap-1 text-[10px] font-medium text-purple-600 hover:text-purple-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  View in Pocket Listings <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>

            {/* Amenities */}
            {amenities.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {amenities.slice(0, 6).map((a) => (
                  <span
                    key={a}
                    className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                  >
                    {a}
                  </span>
                ))}
                {amenities.length > 6 && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                    +{amenities.length - 6} more
                  </span>
                )}
              </div>
            )}

            {/* Rental agreement details (if rented out) */}
            {dealBadge === "Rented Out" && rental && rental.agreementStartDate && rental.agreementEndDate && (
              <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50/60 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">
                  Rental Agreement
                </p>
                <div className="mt-1 grid gap-2 sm:grid-cols-3">
                  <div>
                    <p className="text-[10px] text-blue-500">Start Date</p>
                    <p className="text-xs font-medium text-blue-900">
                      {new Date(rental.agreementStartDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-blue-500">End Date</p>
                    <p className="text-xs font-medium text-blue-900">
                      {new Date(rental.agreementEndDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-blue-500">Days Remaining</p>
                    <p
                      className={
                        rental.daysRemaining == null
                          ? "text-xs font-medium text-blue-900"
                          : rental.daysRemaining < 0
                            ? "text-xs font-bold text-red-600"
                            : rental.daysRemaining <= 30
                              ? "text-xs font-bold text-amber-600"
                              : "text-xs font-bold text-emerald-600"
                      }
                    >
                      {rental.daysRemaining == null
                        ? "—"
                        : rental.daysRemaining < 0
                          ? `Expired ${Math.abs(rental.daysRemaining)} days ago`
                          : `${rental.daysRemaining} days`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Owner notes */}
            {property.notes && (
              <div className="mt-2 rounded-lg bg-amber-50/60 border border-amber-100 px-3 py-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">
                  Owner Notes
                </p>
                <p className="mt-0.5 text-xs text-amber-800">{property.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <CanAccess module="owners" page="all_owners" action="edit">
            <button
              onClick={onEdit}
              className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              title="Edit property"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </CanAccess>
          <CanAccess module="owners" page="all_owners" action="delete">
            <button
              onClick={onDelete}
              className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              title="Remove property"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </CanAccess>
        </div>
      </div>
    </div>
  );
}
