"use client";

import { useParams } from "next/navigation";
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
  ShieldCheck,
  Star,
  Phone,
  Mail,
  FileText,
  Compass,
  Video,
  Hash,
  Layers,
  Home,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { PropertyGallery } from "@/components/properties/PropertyGallery";
import { PropertyActions } from "@/components/properties/PropertyActions";
import { useProperty } from "@/hooks/useProperties";
import { formatCurrency, formatDate, formatDateTime, displayValue } from "@/lib/utils";

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: property, isLoading, isError, refetch } = useProperty(params.id);

  if (isLoading) {
    return (
      <div>
        <Link
          href="/properties"
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Properties
        </Link>
        <LoadingState label="Loading property details..." />
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div>
        <Link
          href="/properties"
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Properties
        </Link>
        <ErrorState
          message="Failed to load property details from Property Finder."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const offeringLabel =
    property.offeringType?.toLowerCase() === "sale"
      ? "For Sale"
      : property.offeringType?.toLowerCase() === "rent"
        ? "For Rent"
        : displayValue(property.offeringType, "");

  const priceLabel = property.price != null ? formatCurrency(property.price) : "Price on request";

  const dealBadge =
    property.dealStatus === "sold"
      ? "Sold Out"
      : property.dealStatus === "rented"
        ? "Rented"
        : null;
  const isClosed = dealBadge !== null;

  return (
    <div className={isClosed ? "opacity-90" : ""}>
      {/* Back link */}
      <Link
        href="/properties"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Properties
      </Link>

      <PageHeader
        title={displayValue(property.title, "Untitled Property")}
        subtitle={
          [
            offeringLabel,
            [displayValue(property.community, ""), displayValue(property.city, displayValue(property.emirate, ""))]
              .filter(Boolean)
              .join(", "),
          ]
            .filter(Boolean)
            .join(" · ")
        }
        actions={
          <div className="flex items-center gap-2">
            <PropertyActions
              propertyId={property.id}
              propertyTitle={property.title}
              dealClosed={isClosed}
            />
            {dealBadge && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {dealBadge}
              </span>
            )}
          </div>
        }
      />

      {/* ─── Microsite Layout ─── */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: Gallery + Description + Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gallery */}
          <PropertyGallery
            images={property.images}
            video={property.video}
            virtualTour={property.virtualTour}
            floorPlan={property.floorPlan}
            title={property.title}
          />

          {/* Key specs bar */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SpecCard icon={BedDouble} label="Bedrooms" value={property.bedrooms === "studio" ? "Studio" : displayValue(property.bedrooms)} />
            <SpecCard icon={Bath} label="Bathrooms" value={displayValue(property.bathrooms)} />
            <SpecCard icon={Maximize} label="Size" value={property.size > 0 ? `${property.size.toLocaleString()} sqft` : "—"} />
            <SpecCard icon={Car} label="Parking" value={property.parkingSlots > 0 ? `${property.parkingSlots} slots` : "—"} />
          </div>

          {/* Description */}
          {property.description && (
            <Card>
              <CardHeader title="Description" />
              <CardBody>
                <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700">
                  {property.description}
                </p>
              </CardBody>
            </Card>
          )}

          {/* Property Details */}
          <Card>
            <CardHeader title="Property Details" />
            <CardBody>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <DetailRow icon={Home} label="Property Type" value={displayValue(property.type)} />
                <DetailRow icon={Building} label="Category" value={displayValue(property.category)} />
                <DetailRow icon={Sparkles} label="Furnishing" value={displayValue(property.furnishingType)} />
                <DetailRow icon={Layers} label="Completion" value={displayValue(property.completionStatus)} />
                <DetailRow icon={Hash} label="Unit Number" value={displayValue(property.unitNumber)} />
                <DetailRow icon={Layers} label="Floor Number" value={displayValue(property.floorNumber)} />
                <DetailRow icon={Calendar} label="Available From" value={formatDate(property.availableFrom)} />
                <DetailRow icon={ShieldCheck} label="Permit Number" value={displayValue(property.permitNumber)} />
                <DetailRow icon={Hash} label="Reference" value={displayValue(property.reference)} />
                {property.numberOfCheques != null && (
                  <DetailRow icon={FileText} label="No. of Cheques" value={String(property.numberOfCheques)} />
                )}
                {property.priceType && (
                  <DetailRow icon={FileText} label="Price Type" value={displayValue(property.priceType)} />
                )}
                <DetailRow icon={Calendar} label="Published" value={formatDate(property.publishedAt)} />
              </div>
            </CardBody>
          </Card>

          {/* Location */}
          {(property.locationHierarchy || property.coordinates) && (
            <Card>
              <CardHeader title="Location" />
              <CardBody>
                {property.locationHierarchy && (
                  <p className="mb-3 text-sm text-neutral-700">{property.locationHierarchy}</p>
                )}
                {property.coordinates && (
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {property.coordinates.lat.toFixed(6)}, {property.coordinates.lng.toFixed(6)}
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
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
                  {property.amenities.map((amenity, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-sm text-neutral-700"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                      {amenity}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Additional Media Links */}
          {(property.video || property.virtualTour || property.floorPlan) && (
            <Card>
              <CardHeader title="Additional Media" />
              <CardBody>
                <div className="flex flex-wrap gap-3">
                  {property.video && (
                    <MediaLink
                      href={property.video.url}
                      icon={Video}
                      label="Property Video"
                    />
                  )}
                  {property.virtualTour && (
                    <MediaLink
                      href={property.virtualTour.url}
                      icon={Compass}
                      label="Virtual Tour"
                    />
                  )}
                  {property.floorPlan && (
                    <MediaLink
                      href={property.floorPlan.url}
                      icon={FileText}
                      label="Floor Plan"
                    />
                  )}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Right column: Price + Agent + Status sidebar */}
        <div className="space-y-6">
          {/* Price card */}
          <Card className="lg:sticky lg:top-6">
            <CardHeader title="Pricing" />
            <CardBody className="space-y-4">
              <div>
                <p className="text-2xl font-bold text-neutral-900">{priceLabel}</p>
                {property.offeringType?.toLowerCase() === "rent" && property.price != null && (
                  <p className="text-xs text-neutral-400">per year</p>
                )}
              </div>

              {property.qualityScore != null && (
                <div className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-medium text-neutral-700">
                    Quality Score: {property.qualityScore}
                  </span>
                </div>
              )}

              <div className="space-y-2 border-t border-neutral-100 pt-3">
                {dealBadge && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                      Deal Status
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-600">
                      <CheckCircle2 className="h-3 w-3" />
                      {dealBadge}
                    </span>
                  </div>
                )}
                <StatusRow label="Listing Status" value={displayValue(property.listingStatus)} />
                <StatusRow label="Verification" value={displayValue(property.verificationStatus)} />
                <StatusRow label="State" value={displayValue(property.state)} />
              </div>

              <div className="space-y-1 border-t border-neutral-100 pt-3 text-[10px] text-neutral-400">
                <div>Created: {formatDateTime(property.createdAt)}</div>
                <div>Updated: {formatDateTime(property.updatedAt)}</div>
              </div>
            </CardBody>
          </Card>

          {/* Agent card */}
          {(property.agentName || property.agencyName) && (
            <Card>
              <CardHeader title="Listed By" />
              <CardBody className="space-y-3">
                {property.agentName && (
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{property.agentName}</p>
                    {property.agencyName && (
                      <p className="text-xs text-neutral-500">{property.agencyName}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  {property.agentMobile && (
                    <a
                      href={`tel:${property.agentMobile}`}
                      className="flex items-center gap-2 text-xs text-neutral-700 hover:text-neutral-900"
                    >
                      <Phone className="h-3.5 w-3.5 text-neutral-400" />
                      {property.agentMobile}
                    </a>
                  )}
                  {property.agentEmail && (
                    <a
                      href={`mailto:${property.agentEmail}`}
                      className="flex items-center gap-2 text-xs text-neutral-700 hover:text-neutral-900"
                    >
                      <Mail className="h-3.5 w-3.5 text-neutral-400" />
                      {property.agentEmail}
                    </a>
                  )}
                  {property.agencyLicense && (
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <ShieldCheck className="h-3.5 w-3.5 text-neutral-400" />
                      License: {property.agencyLicense}
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Compliance card */}
          {property.compliance && (
            <Card>
              <CardHeader title="Compliance" />
              <CardBody>
                <div className="space-y-2 text-xs">
                  {property.compliance.dldPermitNumber && (
                    <StatusRow label="DLD Permit" value={property.compliance.dldPermitNumber} />
                  )}
                  {property.compliance.expiryDate && (
                    <StatusRow label="Expiry" value={formatDate(property.compliance.expiryDate)} />
                  )}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

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
        <Icon className="h-3.5 w-3.5 text-neutral-400" />
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
