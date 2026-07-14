"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Hash,
  User,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Tag,
  Globe,
  ExternalLink,
  Home,
  Layers,
  DollarSign,
  BedDouble,
  Bath,
  Maximize2,
  CheckCircle,
  MapPin,
  Building2,
  Compass,
  Car,
  FileText,
  Video,
  Star,
  AlertCircle,
  Image as ImageIcon,
  Briefcase,
  RotateCcw,
  Server,
  Award,
  Clock,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  getPropertyFinderDetails,
  PropertyFinderFields,
} from "@/services/leads/propertyFinder.service";
import type { Lead } from "@/types";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils";

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: React.ReactNode;
}) {
  if (value === undefined || value === null) return null;
  if (typeof value === "string" && (value.trim() === "" || value === "—")) return null;
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <div className="mt-0.5 text-sm font-medium text-slate-800 break-words">{value}</div>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 py-2.5 animate-pulse">
      <div className="mt-0.5 h-4 w-4 shrink-0 rounded bg-slate-100" />
      <div className="flex-1 space-y-2">
        <div className="h-2 w-16 rounded bg-slate-100" />
        <div className="h-3.5 w-36 rounded bg-slate-100" />
      </div>
    </div>
  );
}

function SectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <CardBody className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonRow key={i} />
      ))}
    </CardBody>
  );
}

function SectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <CardBody>
      <div className="flex items-center gap-3 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3">
        <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
        <p className="flex-1 text-sm text-rose-700">
          Failed to load Property Finder details.
        </p>
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-md border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          Retry
        </button>
      </div>
    </CardBody>
  );
}

function LinkButton({
  href,
  icon: Icon,
  label,
  variant = "default",
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  variant?: "default" | "primary";
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        variant === "primary"
          ? "inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          : "inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </a>
  );
}

function QualityScore({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color =
    pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 overflow-hidden rounded-full bg-slate-100 h-2">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-slate-700 tabular-nums">{score}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  lead: Pick<
    Lead,
    | "id"
    | "leadName"
    | "lastName"
    | "mobileNumber"
    | "email"
    | "source"
    | "externalLeadId"
    | "responseLink"
    | "locality"
    | "createdAt"
  >;
}

export function PropertyFinderSection({ lead }: Props) {
  const [data, setData] = useState<PropertyFinderFields | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isRawOpen, setIsRawOpen] = useState(false);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(false);
    getPropertyFinderDetails(lead.id)
      .then((r) => setData(r.data.fields))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [lead.id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  if (lead.source !== "Property Finder") return null;

  // ─── Lead Information ──────────────────────────────────────────────────────
  const leadInfoSection = (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <User className="h-3.5 w-3.5" />
            Lead Information
          </span>
        }
      />
      {loading ? (
        <SectionSkeleton rows={6} />
      ) : error ? (
        <SectionError onRetry={fetch} />
      ) : (
        <CardBody className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
          <InfoRow
            icon={Hash}
            label="Lead ID"
            value={data?.leadId || lead.externalLeadId || lead.id}
          />
          <InfoRow
            icon={User}
            label="Name"
            value={
              data?.leadName ||
              `${lead.leadName}${lead.lastName ? ` ${lead.lastName}` : ""}`
            }
          />
          <InfoRow
            icon={Phone}
            label="Mobile"
            value={data?.mobileNumber || lead.mobileNumber}
          />
          <InfoRow
            icon={Mail}
            label="Email"
            value={data?.email || lead.email}
          />
          <InfoRow icon={CheckCircle} label="Status" value={data?.status} />
          <InfoRow icon={MessageSquare} label="Channel" value={data?.channel} />
          <InfoRow
            icon={Calendar}
            label="Inquiry Date"
            value={formatDateTime(data?.inquiryDate || lead.createdAt)}
          />
          <InfoRow icon={Tag} label="Source" value={lead.source} />
          <InfoRow icon={Globe} label="Entity Type" value={data?.entityType} />
          <InfoRow
            icon={ExternalLink}
            label="Response Link"
            value={
              (data?.responseLink || lead.responseLink) ? (
                <a
                  href={(data?.responseLink || lead.responseLink)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline underline-offset-2"
                >
                  <ExternalLink className="h-3 w-3" />
                  View Response
                </a>
              ) : undefined
            }
          />
        </CardBody>
      )}
    </Card>
  );

  // ─── Property Information ──────────────────────────────────────────────────
  const propertyInfoSection = (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Home className="h-3.5 w-3.5" />
            Property Information
          </span>
        }
      />
      {loading ? (
        <SectionSkeleton rows={8} />
      ) : error ? (
        <SectionError onRetry={fetch} />
      ) : (
        <CardBody className="space-y-6">
          {data?.propertyTitle && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Property Title
              </p>
              <p className="text-base font-semibold text-slate-900">{data.propertyTitle}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow icon={Hash} label="Listing Reference" value={data?.propertyReference} />
            <InfoRow icon={Hash} label="Listing ID" value={data?.listingId} />
            <InfoRow icon={Layers} label="Property Type" value={data?.propertyType} />
            <InfoRow icon={Tag} label="Category" value={data?.propertyCategory} />
            <InfoRow
              icon={DollarSign}
              label="Price"
              value={
                data?.price != null
                  ? data.priceType === "yearly"
                    ? `${formatCurrency(data.price)} / year`
                    : formatCurrency(data.price)
                  : undefined
              }
            />
            <InfoRow icon={DollarSign} label="Currency" value={data?.currency} />
            <InfoRow icon={BedDouble} label="Bedrooms" value={data?.bedrooms} />
            <InfoRow icon={Bath} label="Bathrooms" value={data?.bathrooms} />
            <InfoRow
              icon={Maximize2}
              label="Area"
              value={
                data?.area != null
                  ? `${data.area.toLocaleString()} ${data.areaUnit || "sqft"}`
                  : undefined
              }
            />
            <InfoRow icon={Home} label="Furnished Status" value={data?.furnishedStatus} />
            <InfoRow icon={CheckCircle} label="Completion Status" value={data?.completionStatus} />
            <InfoRow icon={Hash} label="Permit Number" value={data?.permitNumber} />
          </div>

          {data?.propertyDescription && (
            <div className="border-t border-slate-100 pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Property Description
              </p>
              <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
                {data.propertyDescription}
              </p>
            </div>
          )}
        </CardBody>
      )}
    </Card>
  );

  // ─── Location ─────────────────────────────────────────────────────────────
  const locationSection = (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" />
            Location
          </span>
        }
      />
      {loading ? (
        <SectionSkeleton rows={5} />
      ) : error ? (
        <SectionError onRetry={fetch} />
      ) : (
        <CardBody className="space-y-4">
          {data?.locationHierarchy && (
            <div className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Location Hierarchy
              </p>
              <p className="text-sm font-medium text-slate-700">{data.locationHierarchy}</p>
            </div>
          )}
          <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow icon={Globe} label="Emirate" value={data?.emirate} />
            <InfoRow icon={MapPin} label="City" value={data?.city} />
            <InfoRow icon={Building2} label="Community Name" value={data?.communityName} />
            <InfoRow icon={Home} label="Building / Tower Name" value={data?.buildingName} />
            <InfoRow
              icon={Compass}
              label="Coordinates"
              value={
                data?.coordinates
                  ? (
                    <a
                      href={`https://www.google.com/maps?q=${data.coordinates.lat},${data.coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline underline-offset-2"
                    >
                      <MapPin className="h-3 w-3" />
                      {data.coordinates.lat.toFixed(6)}, {data.coordinates.lng.toFixed(6)}
                    </a>
                  )
                  : undefined
              }
            />
            <InfoRow icon={Hash} label="Location ID" value={data?.locationId?.toString()} />
          </div>
        </CardBody>
      )}
    </Card>
  );

  // ─── Unit Details ──────────────────────────────────────────────────────────
  const unitSection = (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5" />
            Unit Details
          </span>
        }
      />
      {loading ? (
        <SectionSkeleton rows={4} />
      ) : error ? (
        <SectionError onRetry={fetch} />
      ) : (
        <CardBody className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
          <InfoRow icon={Hash} label="Unit Number" value={data?.unitNumber} />
          <InfoRow icon={Layers} label="Floor Number" value={data?.floorNumber} />
          <InfoRow
            icon={Car}
            label="Parking Slots"
            value={data?.parkingSlots != null ? data.parkingSlots.toString() : undefined}
          />
          <InfoRow
            icon={Calendar}
            label="Available From"
            value={data?.availableFrom ? formatDate(data.availableFrom) : undefined}
          />
        </CardBody>
      )}
    </Card>
  );

  // ─── Agent Information ─────────────────────────────────────────────────────
  const agentSection = (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Briefcase className="h-3.5 w-3.5" />
            Agent Information
          </span>
        }
      />
      {loading ? (
        <SectionSkeleton rows={5} />
      ) : error ? (
        <SectionError onRetry={fetch} />
      ) : (
        <CardBody className="space-y-2">
          {(data?.agentName || data?.agentId) && (
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 border border-slate-100 px-4 py-3 mb-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                <User className="h-5 w-5" />
              </div>
              <div>
                {data.agentName && (
                  <p className="text-sm font-semibold text-slate-800">{data.agentName}</p>
                )}
                {data.agentId && (
                  <p className="text-xs text-slate-500">Agent ID: {data.agentId}</p>
                )}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow
              icon={Mail}
              label="Agent Email"
              value={
                data?.agentEmail ? (
                  <a
                    href={`mailto:${data.agentEmail}`}
                    className="text-blue-600 hover:text-blue-800 underline underline-offset-2"
                  >
                    {data.agentEmail}
                  </a>
                ) : undefined
              }
            />
            <InfoRow icon={Phone} label="Agent Mobile" value={data?.agentMobile} />
            <InfoRow icon={Building2} label="Agency Name" value={data?.agencyName} />
            <InfoRow icon={Hash} label="Agency License" value={data?.agencyLicense} />
          </div>
        </CardBody>
      )}
    </Card>
  );

  // ─── Media ─────────────────────────────────────────────────────────────────
  const hasMedia =
    data?.mainImage ||
    (data?.imageGallery && data.imageGallery.length > 0) ||
    data?.floorPlan ||
    data?.virtualTour ||
    data?.video;

  const mediaSection = (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <ImageIcon className="h-3.5 w-3.5" />
            Media
          </span>
        }
      />
      {loading ? (
        <CardBody>
          <div className="animate-pulse space-y-4">
            <div className="h-52 w-full rounded-lg bg-slate-100" />
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="h-24 rounded-lg bg-slate-100" />
              ))}
            </div>
          </div>
        </CardBody>
      ) : error ? (
        <SectionError onRetry={fetch} />
      ) : !hasMedia ? (
        <CardBody>
          <p className="flex items-center gap-2 text-sm text-slate-400">
            <ImageIcon className="h-4 w-4" />
            No media available
          </p>
        </CardBody>
      ) : (
        <CardBody className="space-y-6">
          {data?.mainImage && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Main Image
              </p>
              <a href={data.mainImage} target="_blank" rel="noopener noreferrer">
                <img
                  src={data.mainImage}
                  alt="Property main image"
                  className="w-full max-h-72 object-cover rounded-lg border border-slate-100 hover:opacity-90 transition-opacity cursor-pointer"
                />
              </a>
            </div>
          )}

          {data?.imageGallery && data.imageGallery.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Image Gallery
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 normal-case tracking-normal">
                  {data.imageGallery.length} photos
                </span>
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {data.imageGallery.slice(0, 8).map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block aspect-square overflow-hidden rounded-lg border border-slate-100"
                  >
                    <img
                      src={url}
                      alt={`Property image ${idx + 1}`}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                      <ExternalLink className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </a>
                ))}
                {data.imageGallery.length > 8 && (
                  <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50">
                    <span className="text-sm font-medium text-slate-500">
                      +{data.imageGallery.length - 8} more
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {(data?.floorPlan || data?.virtualTour || data?.video) && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Additional Media
              </p>
              <div className="flex flex-wrap gap-3">
                {data.floorPlan && (
                  <LinkButton href={data.floorPlan} icon={FileText} label="Floor Plan" />
                )}
                {data.virtualTour && (
                  <LinkButton href={data.virtualTour} icon={Compass} label="Virtual Tour" />
                )}
                {data.video && (
                  <LinkButton href={data.video} icon={Video} label="Property Video" />
                )}
              </div>
            </div>
          )}
        </CardBody>
      )}
    </Card>
  );

  // ─── Amenities ─────────────────────────────────────────────────────────────
  const amenitiesSection =
    !loading && !error && data?.amenities && data.amenities.length > 0 ? (
      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Award className="h-3.5 w-3.5" />
              Amenities
              <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 normal-case tracking-normal">
                {data.amenities.length}
              </span>
            </span>
          }
        />
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {data.amenities.map((amenity, idx) => (
              <Badge
                key={idx}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200 normal-case tracking-normal"
              >
                {amenity}
              </Badge>
            ))}
          </div>
        </CardBody>
      </Card>
    ) : loading ? (
      <Card>
        <CardHeader title={<span className="flex items-center gap-2"><Award className="h-3.5 w-3.5" />Amenities</span>} />
        <CardBody>
          <div className="flex flex-wrap gap-2 animate-pulse">
            {[80, 64, 96, 72, 88, 60].map((w, i) => (
              <div key={i} className="h-6 rounded-full bg-slate-100" style={{ width: w }} />
            ))}
          </div>
        </CardBody>
      </Card>
    ) : null;

  // ─── Listing Details ───────────────────────────────────────────────────────
  const listingSection = (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" />
            Listing Details
          </span>
        }
      />
      {loading ? (
        <SectionSkeleton rows={5} />
      ) : error ? (
        <SectionError onRetry={fetch} />
      ) : (
        <CardBody className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
          <InfoRow
            icon={CheckCircle}
            label="Listing Status"
            value={
              data?.listingStatus ? (
                <Badge className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200 normal-case tracking-normal">
                  {data.listingStatus}
                </Badge>
              ) : undefined
            }
          />
          <InfoRow
            icon={Calendar}
            label="Published Date"
            value={data?.publishedAt ? formatDateTime(data.publishedAt) : undefined}
          />
          <InfoRow
            icon={Clock}
            label="Created Date"
            value={data?.createdAt ? formatDateTime(data.createdAt) : undefined}
          />
          <InfoRow
            icon={Clock}
            label="Updated Date"
            value={data?.updatedAt ? formatDateTime(data.updatedAt) : undefined}
          />
          <InfoRow
            icon={Clock}
            label="Last Updated Date"
            value={data?.lastUpdatedAt ? formatDateTime(data.lastUpdatedAt) : undefined}
          />
          <InfoRow
            icon={CheckCircle}
            label="Verification Status"
            value={
              data?.verificationStatus ? (
                <Badge className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200 normal-case tracking-normal">
                  {data.verificationStatus}
                </Badge>
              ) : undefined
            }
          />
          {data?.qualityScore != null && (
            <div className="flex items-start gap-3 py-2.5 sm:col-span-2 lg:col-span-3">
              <Star className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Quality Score
                </p>
                <div className="mt-1.5 max-w-xs">
                  <QualityScore score={data.qualityScore} />
                </div>
              </div>
            </div>
          )}
        </CardBody>
      )}
    </Card>
  );

  // ─── Links ─────────────────────────────────────────────────────────────────
  const hasLinks = data?.propertyFinderUrl || data?.listingUrl;
  const linksSection =
    !loading && !error && hasLinks ? (
      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <LinkIcon className="h-3.5 w-3.5" />
              Links
            </span>
          }
        />
        <CardBody>
          <div className="flex flex-wrap gap-3">
            {data?.propertyFinderUrl && (
              <LinkButton
                href={data.propertyFinderUrl}
                icon={Globe}
                label="Property Finder URL"
                variant="primary"
              />
            )}
            {data?.listingUrl && (
              <LinkButton href={data.listingUrl} icon={ExternalLink} label="Listing URL" />
            )}
          </div>
        </CardBody>
      </Card>
    ) : loading ? (
      <Card>
        <CardHeader title={<span className="flex items-center gap-2"><LinkIcon className="h-3.5 w-3.5" />Links</span>} />
        <CardBody>
          <div className="flex gap-3 animate-pulse">
            <div className="h-9 w-44 rounded-lg bg-slate-100" />
            <div className="h-9 w-36 rounded-lg bg-slate-100" />
          </div>
        </CardBody>
      </Card>
    ) : null;

  // ─── Compliance ────────────────────────────────────────────────────────────
  const hasCompliance =
    !loading &&
    !error &&
    data &&
    (data.permitNumber != null || data.compliance != null || data.products != null || data.portals != null);

  const complianceSection = hasCompliance ? (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            Compliance
          </span>
        }
      />
      <CardBody className="space-y-4">
        <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
          <InfoRow icon={Hash} label="Permit Number" value={data?.permitNumber} />
        </div>
        {data?.compliance != null && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Compliance Details</p>
            <pre className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs text-slate-600 overflow-x-auto">
              {JSON.stringify(data.compliance, null, 2)}
            </pre>
          </div>
        )}
        {data?.products != null && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Products</p>
            <pre className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs text-slate-600 overflow-x-auto">
              {JSON.stringify(data.products, null, 2)}
            </pre>
          </div>
        )}
        {data?.portals != null && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Portals</p>
            <pre className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs text-slate-600 overflow-x-auto">
              {JSON.stringify(data.portals, null, 2)}
            </pre>
          </div>
        )}
      </CardBody>
    </Card>
  ) : null;

  // ─── Raw Property Finder Payload ───────────────────────────────────────────
  const rawSection = !loading && !error && data ? (
    <Card>
      <button
        type="button"
        onClick={() => setIsRawOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 border-b border-transparent px-6 py-4 text-left hover:bg-slate-50 transition-colors rounded-[8px]"
        style={{ borderBottomColor: isRawOpen ? 'var(--border)' : 'transparent' }}
      >
        <div className="flex items-center gap-2">
          <Server className="h-3.5 w-3.5 text-foreground-secondary" />
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-foreground-secondary">
            Raw Property Finder Payload
          </h3>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600 ring-1 ring-amber-200 normal-case tracking-normal">
            Debug
          </span>
        </div>
        {isRawOpen ? (
          <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
        )}
      </button>
      {isRawOpen && (
        <CardBody>
          <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs leading-relaxed text-emerald-400">
            {JSON.stringify(data, null, 2)}
          </pre>
        </CardBody>
      )}
    </Card>
  ) : null;

  return (
    <>
      {leadInfoSection}
      {propertyInfoSection}
      {locationSection}
      {unitSection}
      {agentSection}
      {mediaSection}
      {amenitiesSection}
      {listingSection}
      {linksSection}
      {complianceSection}
      {rawSection}
    </>
  );
}
