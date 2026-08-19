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
import type { PocketListing } from "@/types";
import { pocketListingsService } from "@/services/pocketListings/pocketListings.service";
import { formatCurrency, displayValue, cn, downloadBlob } from "@/lib/utils";
import { toast } from "sonner";

// ── Status badge map ──────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  available: {
    label: "Available",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
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
};

// ── Component ─────────────────────────────────────────────────────────────────

interface PocketListingCardProps {
  listing: PocketListing;
  onClick?: () => void;
}

export function PocketListingCard({ listing, onClick }: PocketListingCardProps) {
  const [downloading, setDownloading] = useState(false);

  const status = STATUS_BADGE[listing.listingStatus] ?? STATUS_BADGE.available;

  const offeringLabel =
    listing.offeringType?.toLowerCase() === "sale"
      ? "For Sale"
      : listing.offeringType?.toLowerCase() === "rent"
        ? "For Rent"
        : displayValue(listing.offeringType, "");

  const isClosed = listing.listingStatus === "sold" || listing.listingStatus === "rented";
  const dealBadge =
    listing.listingStatus === "sold"
      ? "Sold Out"
      : listing.listingStatus === "rented"
        ? "Rented Out"
        : null;

  const hasVideo = !!listing.videoUrl;
  const hasFloorPlan = !!listing.floorPlanUrl;
  const hasVirtualTour = !!listing.virtualTourUrl;

  const priceLabel =
    listing.priceOnRequest || listing.price == null
      ? "Price on request"
      : formatCurrency(listing.price);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/share/pocket/${listing.id}`
      : `/share/pocket/${listing.id}`;

  async function handleDownloadPdf(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (downloading) return;
    setDownloading(true);
    try {
      const blob = await pocketListingsService.downloadPdf(listing.id);
      const safeTitle = (listing.title || "Pocket Listing")
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "Pocket Listing";
      downloadBlob(blob, `DEEN-Properties-${safeTitle}.pdf`);
      toast.success("Listing brochure downloaded");
    } catch {
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Link
      href={`/pocket-listings/${listing.id}`}
      onClick={onClick}
      className={cn(
        "group block overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-2xs transition-all duration-200 hover:shadow-md hover:border-neutral-300",
        isClosed ? "grayscale opacity-60 hover:grayscale-0 hover:opacity-100" : "",
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        {listing.mainImage ? (
          <img
            src={listing.mainImage}
            alt={listing.title || "Pocket Listing"}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-300">
            <ImageIcon className="h-10 w-10" />
          </div>
        )}

        {/* Purple "Pocket Listing" badge — top-left (distinguishes from PF cards) */}
        <span className="absolute left-3 top-3 rounded-full bg-purple-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm">
          Pocket Listing
        </span>

        {/* Deal Closed / offering badge — bottom-left */}
        {dealBadge ? (
          <span className="absolute bottom-3 left-3 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm">
            {dealBadge}
          </span>
        ) : offeringLabel ? (
          <span className="absolute bottom-3 left-3 rounded-full bg-black/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            {offeringLabel}
          </span>
        ) : null}

        {/* Media count badges — top-right */}
        <div className="absolute right-3 top-3 flex gap-1.5">
          {listing.imageCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
              <ImageIcon className="h-3 w-3" />
              {listing.imageCount}
            </span>
          )}
          {hasVideo && (
            <span className="flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
              <Video className="h-3 w-3" />
            </span>
          )}
          {hasVirtualTour && (
            <span className="flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
              <Compass className="h-3 w-3" />
            </span>
          )}
          {hasFloorPlan && (
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
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(shareUrl, "_blank", "noopener,noreferrer");
            }}
            title="Open microsite"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-neutral-900 shadow-sm transition-colors hover:bg-white cursor-pointer"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Microsite
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Price */}
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-lg font-bold text-neutral-900">{priceLabel}</span>
          {listing.offeringType?.toLowerCase() === "rent" &&
            !listing.priceOnRequest &&
            listing.price != null && (
              <span className="text-[10px] font-medium text-neutral-400">
                {listing.priceType && listing.priceType !== "sale"
                  ? `/${listing.priceType}`
                  : "/year"}
              </span>
            )}
        </div>

        {/* Title */}
        <h3 className="mt-1 line-clamp-1 text-sm font-semibold text-neutral-800">
          {displayValue(listing.title, "Untitled Listing")}
        </h3>

        {/* Location */}
        <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="line-clamp-1">
            {displayValue(listing.community, "")}
            {listing.community && listing.city ? ", " : ""}
            {displayValue(listing.city, displayValue(listing.emirate, ""))}
          </span>
        </p>

        {/* Specs */}
        <div className="mt-3 flex items-center gap-4 text-xs text-neutral-600">
          {listing.bedrooms && (
            <span className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5 text-neutral-400" />
              {listing.bedrooms === "studio" ? "Studio" : `${listing.bedrooms} Bed`}
            </span>
          )}
          {listing.bathrooms && (
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5 text-neutral-400" />
              {listing.bathrooms} Bath
            </span>
          )}
          {listing.size != null && listing.size > 0 && (
            <span className="flex items-center gap-1">
              <Maximize className="h-3.5 w-3.5 text-neutral-400" />
              {listing.size.toLocaleString()} sqft
            </span>
          )}
        </div>

        {/* Type + Reference + Status */}
        <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
            {displayValue(listing.type, "")}
            {listing.type && listing.furnishingType ? " · " : ""}
            {displayValue(listing.furnishingType, "")}
          </span>
          <span className="text-[10px] font-medium text-neutral-400">
            Ref: {displayValue(listing.reference, "—")}
          </span>
        </div>

        {/* Status badge row */}
        <div className="mt-2 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              status.className,
            )}
          >
            {status.label}
          </span>
          {listing.createdBy?.fullName && (
            <span className="text-[10px] font-medium text-neutral-400">
              · {listing.createdBy.fullName}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
