"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BedDouble,
  Bath,
  Maximize,
  MapPin,
  Video,
  FileText,
  Compass,
  ImageIcon,
  Download,
  ExternalLink,
  Loader2,
} from "lucide-react";
import type { PropertySummary } from "@/services/properties/properties.service";
import { propertiesService } from "@/services/properties/properties.service";
import { formatCurrency, displayValue, downloadBlob } from "@/lib/utils";
import { toast } from "sonner";

export function PropertyCard({ property }: { property: PropertySummary }) {
  const [downloading, setDownloading] = useState(false);

  const offeringLabel =
    property.offeringType?.toLowerCase() === "sale"
      ? "For Sale"
      : property.offeringType?.toLowerCase() === "rent"
        ? "For Rent"
        : displayValue(property.offeringType, "");

  const isClosed = property.dealStatus === "sold" || property.dealStatus === "rented";
  const dealBadge =
    property.dealStatus === "sold"
      ? "Sold Out"
      : property.dealStatus === "rented"
        ? "Rented"
        : null;

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/share/${property.id}`
      : `/share/${property.id}`;

  async function handleDownloadPdf(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (downloading) return;
    setDownloading(true);
    try {
      const blob = await propertiesService.downloadPdf(property.id);
      const safeTitle = (property.title || "Property")
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "Property";
      downloadBlob(blob, `DEEN-Properties-${safeTitle}.pdf`);
      toast.success("Property brochure downloaded");
    } catch {
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Link
      href={`/properties/${property.id}`}
      className={`group block overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-2xs transition-all duration-200 hover:shadow-md hover:border-neutral-300 ${
        isClosed ? "grayscale opacity-60 hover:grayscale-0 hover:opacity-100" : ""
      }`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        {property.mainImage ? (
          <img
            src={property.mainImage}
            alt={property.title || "Property"}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-300">
            <ImageIcon className="h-10 w-10" />
          </div>
        )}

        {/* Deal Closed badge — takes precedence over offering badge */}
        {dealBadge ? (
          <span className="absolute left-3 top-3 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm">
            {dealBadge}
          </span>
        ) : offeringLabel ? (
          <span className="absolute left-3 top-3 rounded-full bg-black/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            {offeringLabel}
          </span>
        ) : null}

        {/* Media count badges */}
        <div className="absolute right-3 top-3 flex gap-1.5">
          {property.imageCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
              <ImageIcon className="h-3 w-3" />
              {property.imageCount}
            </span>
          )}
          {property.hasVideo && (
            <span className="flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
              <Video className="h-3 w-3" />
            </span>
          )}
          {property.hasVirtualTour && (
            <span className="flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
              <Compass className="h-3 w-3" />
            </span>
          )}
          {property.hasFloorPlan && (
            <span className="flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
              <FileText className="h-3 w-3" />
            </span>
          )}
        </div>

        {/* Hover action overlay — PDF download + microsite link */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-2 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            title="Download brochure PDF"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-neutral-900 shadow-sm transition-colors hover:bg-white disabled:opacity-60 cursor-pointer"
          >
            {downloading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            PDF
          </button>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Open microsite"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-neutral-900 shadow-sm transition-colors hover:bg-white cursor-pointer"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Microsite
          </a>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Price */}
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-lg font-bold text-neutral-900">
            {property.price != null ? formatCurrency(property.price) : "Price on request"}
          </span>
          {property.offeringType?.toLowerCase() === "rent" && property.price != null && (
            <span className="text-[10px] font-medium text-neutral-400">/year</span>
          )}
        </div>

        {/* Title */}
        <h3 className="mt-1 line-clamp-1 text-sm font-semibold text-neutral-800">
          {displayValue(property.title, "Untitled Property")}
        </h3>

        {/* Location */}
        <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="line-clamp-1">
            {displayValue(property.community, "")}
            {property.community && property.city ? ", " : ""}
            {displayValue(property.city, displayValue(property.emirate, ""))}
          </span>
        </p>

        {/* Specs */}
        <div className="mt-3 flex items-center gap-4 text-xs text-neutral-600">
          {property.bedrooms && (
            <span className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5 text-neutral-400" />
              {property.bedrooms === "studio" ? "Studio" : `${property.bedrooms} Bed`}
            </span>
          )}
          {property.bathrooms && (
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5 text-neutral-400" />
              {property.bathrooms} Bath
            </span>
          )}
          {property.size > 0 && (
            <span className="flex items-center gap-1">
              <Maximize className="h-3.5 w-3.5 text-neutral-400" />
              {property.size.toLocaleString()} sqft
            </span>
          )}
        </div>

        {/* Type + Reference */}
        <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
            {displayValue(property.type, "")}
            {property.type && property.furnishingType ? " · " : ""}
            {displayValue(property.furnishingType, "")}
          </span>
          <span className="text-[10px] font-medium text-neutral-400">
            Ref: {displayValue(property.reference, "—")}
          </span>
        </div>
      </div>
    </Link>
  );
}
