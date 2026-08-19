"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
  BedDouble,
  Bath,
  Maximize,
  MapPin,
  Car,
  Building2,
  Calendar,
  ShieldCheck,
  Star,
  Phone,
  Mail,
  FileText,
  Compass,
  Video,
  Layers,
  Home,
  Sparkles,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  Expand,
  ImageIcon,
  Globe,
  ArrowUpRight,
} from "lucide-react";
import { propertiesService, type PropertyDetail } from "@/services/properties/properties.service";
import { formatCurrency, formatDate, displayValue } from "@/lib/utils";

// ── DEEN brand constants (keep in sync with propertyBrochure.service.ts) ─────
const BRAND = {
  name: "DEEN PROPERTIES",
  tagline: "Premium Real Estate",
  address: "Office 1801, Opal Tower Burj Khalifa Blvd, Business Bay Dubai, UAE P.O. Box 417679",
  phone: "+971 50 885 8144",
  email: "info@deenpropertiesuae.com",
  website: "deenpropertiesuae.com",
};

const NAV_LINKS = [
  { label: "Overview",    href: "#overview"    },
  { label: "Description", href: "#description" },
  { label: "Amenities",   href: "#amenities"   },
  { label: "Location",    href: "#location"    },
  { label: "Gallery",     href: "#gallery"     },
];

const GOLD = "#B8945F";
const CHARCOAL = "#0A0A0A";

export default function SharePropertyPage() {
  const params = useParams<{ id: string }>();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await propertiesService.getPublic(params.id);
        if (!cancelled) setProperty(data);
      } catch {
        if (!cancelled) setError("This property is no longer available.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (loading) return <LoadingScreen />;
  if (error || !property)
    return (
      <ShareShell>
        <NotFoundState message={error} />
      </ShareShell>
    );

  return (
    <ShareShell>
      <ShareContent property={property} />
    </ShareShell>
  );
}

// ── Shell: premium header + footer ───────────────────────────────────────────

function ShareShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    e.preventDefault();
    setMobileNavOpen(false);
    const id = href.replace("#", "");
    const el = document.getElementById(id);
    if (el) {
      // Account for the sticky header height (72px)
      const y = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF7]">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]">
        {/* Top gold accent line */}
        <div className="h-px w-full bg-[#B8945F]" />

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-0 lg:px-10">
          {/* Logo */}
          <div className="flex shrink-0 items-center py-3">
            <Image
              src="/deen-new-logo.png"
              alt="DEEN Properties"
              width={180}
              height={58}
              className="h-12 w-auto brightness-0 invert"
              priority
            />
          </div>

          {/* Center nav — desktop */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="rounded px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/60 transition-colors hover:text-[#B8945F] cursor-pointer select-none"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right: phone CTA */}
          <a
            href={`tel:${BRAND.phone}`}
            className="hidden shrink-0 items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-medium text-white/70 transition-colors hover:border-[#B8945F] hover:text-[#B8945F] sm:inline-flex"
          >
            <Phone className="h-3.5 w-3.5" />
            {BRAND.phone}
          </a>

          {/* Mobile hamburger */}
          <button
            className="flex items-center justify-center rounded p-2 text-white/70 hover:text-white md:hidden cursor-pointer"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile nav drawer */}
        {mobileNavOpen && (
          <div className="border-t border-white/10 bg-[#0A0A0A] px-6 pb-4 pt-2 md:hidden">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="rounded px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/60 transition-colors hover:text-[#B8945F] cursor-pointer"
                >
                  {link.label}
                </a>
              ))}
              <a
                href={`tel:${BRAND.phone}`}
                className="mt-2 flex items-center gap-2 text-xs text-white/50 hover:text-[#B8945F]"
              >
                <Phone className="h-3.5 w-3.5" />
                {BRAND.phone}
              </a>
            </nav>
          </div>
        )}

        {/* Bottom gold accent line */}
        <div className="h-px w-full bg-[#B8945F]/40" />
      </header>

      {children}

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <PremiumFooter />
    </div>
  );
}

function PremiumFooter() {
  return (
    <footer className="mt-auto bg-[#0A0A0A] text-white">
      {/* Top gold accent line */}
      <div className="h-px w-full bg-[#B8945F]" />

      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {/* Brand column */}
          <div className="md:col-span-1">
            <Image
              src="/deen-new-logo.png"
              alt="DEEN Properties"
              width={180}
              height={50}
              className="h-10 w-auto brightness-0 invert"
            />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/60">
              {BRAND.tagline}. Curated luxury living across Dubai&apos;s most
              distinguished communities.
            </p>
          </div>

          {/* Contact column */}
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B8945F]">
              Contact
            </h4>
            <ul className="mt-5 space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#B8945F]" />
                <span>{BRAND.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-[#B8945F]" />
                <a href={`tel:${BRAND.phone}`} className="hover:text-white">
                  {BRAND.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-[#B8945F]" />
                <a href={`mailto:${BRAND.email}`} className="hover:text-white">
                  {BRAND.email}
                </a>
              </li>
            </ul>
          </div>

          {/* Web column */}
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B8945F]">
              Discover More
            </h4>
            <ul className="mt-5 space-y-3 text-sm text-white/70">
              <li className="flex items-center gap-3">
                <Globe className="h-4 w-4 shrink-0 text-[#B8945F]" />
                <a
                  href={`https://${BRAND.website}`}
                  className="inline-flex items-center gap-1 hover:text-white"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {BRAND.website}
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </li>
            </ul>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/80">
              <ShieldCheck className="h-3.5 w-3.5 text-[#B8945F]" />
              Licensed Real Estate Broker
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-[11px] text-white/40">
            © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </p>
          <p className="text-[11px] text-white/40">
            Information deemed reliable but not guaranteed.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ── Loading / not found ──────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAF7]">
      <div className="text-center">
        <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-[#E8E5DF] border-t-[#B8945F]" />
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#6B6B6B]">
          Loading Presentation
        </p>
      </div>
    </div>
  );
}

function NotFoundState({ message }: { message?: string | null }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-32 text-center">
      <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-[#F4F1EB]">
        <Building2 className="h-9 w-9 text-[#B8945F]" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-[#0A0A0A]">
        Property Unavailable
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#6B6B6B]">
        {message ?? "This property listing is no longer available for viewing."}
      </p>
    </div>
  );
}

// ── Main content ─────────────────────────────────────────────────────────────

function ShareContent({ property }: { property: PropertyDetail }) {
  const offeringLabel =
    property.offeringType?.toLowerCase() === "sale"
      ? "For Sale"
      : property.offeringType?.toLowerCase() === "rent"
        ? "For Rent"
        : displayValue(property.offeringType, "");

  const priceLabel = property.price != null ? formatCurrency(property.price) : "Price on Request";
  const isRent = property.offeringType?.toLowerCase() === "rent";

  const dealBadge =
    property.dealStatus === "sold"
      ? "Sold"
      : property.dealStatus === "rented"
        ? "Rented"
        : null;

  const locationParts = [
    displayValue(property.community, ""),
    displayValue(property.building, ""),
    displayValue(property.city, displayValue(property.emirate, "")),
  ].filter(Boolean);

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <ShareHero property={property} dealBadge={dealBadge} offeringLabel={offeringLabel} />

      {/* ── Title + price bar ─────────────────────────────────────────── */}
      <section className="border-b border-[#E8E5DF] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                {offeringLabel && (
                  <span className="inline-flex items-center rounded-full bg-[#0A0A0A] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white">
                    {offeringLabel}
                  </span>
                )}
                {dealBadge && (
                  <span className="inline-flex items-center rounded-full bg-[#9B2D2D] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white">
                    {dealBadge}
                  </span>
                )}
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#0A0A0A] sm:text-4xl lg:text-5xl">
                {displayValue(property.title, "Untitled Property")}
              </h1>
              {locationParts.length > 0 && (
                <p className="mt-3 flex items-center gap-2 text-sm text-[#6B6B6B]">
                  <MapPin className="h-4 w-4 text-[#B8945F]" />
                  {locationParts.join(", ")}
                </p>
              )}
            </div>
            <div className="lg:text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B8945F]">
                Price
              </p>
              <p className="mt-1 text-3xl font-bold text-[#0A0A0A] sm:text-4xl">
                {priceLabel}
              </p>
              {isRent && property.price != null && (
                <p className="mt-1 text-xs text-[#6B6B6B]">per year</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Key specs strip ───────────────────────────────────────────── */}
      <section className="bg-[#FAFAF7]">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid grid-cols-2 divide-x divide-y divide-[#E8E5DF] border-x border-y border-[#E8E5DF] sm:grid-cols-4 sm:divide-y-0">
            <KeySpec
              icon={BedDouble}
              label="Bedrooms"
              value={property.bedrooms === "studio" ? "Studio" : displayValue(property.bedrooms)}
            />
            <KeySpec
              icon={Bath}
              label="Bathrooms"
              value={displayValue(property.bathrooms)}
            />
            <KeySpec
              icon={Maximize}
              label="Size"
              value={property.size > 0 ? `${property.size.toLocaleString()} sqft` : "—"}
            />
            <KeySpec
              icon={Home}
              label="Type"
              value={displayValue(property.type)}
            />
          </div>
        </div>
      </section>

      {/* ── Content grid ──────────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* Left: content sections */}
          <div className="space-y-12 lg:col-span-2">
            {/* Overview */}
            <Section id="overview" title="Property Overview" icon={Sparkles}>
              <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                <InfoRow icon={Home} label="Property Type" value={displayValue(property.type)} />
                <InfoRow icon={Building2} label="Project" value={displayValue(property.building)} />
                <InfoRow icon={Building2} label="Community" value={displayValue(property.community)} />
                <InfoRow icon={Layers} label="Category" value={displayValue(property.category)} />
                <InfoRow icon={Sparkles} label="Furnishing" value={displayValue(property.furnishingType)} />
                <InfoRow icon={Layers} label="Completion" value={displayValue(property.completionStatus)} />
                <InfoRow icon={Calendar} label="Available From" value={formatDate(property.availableFrom)} />
                <InfoRow icon={Car} label="Parking" value={property.parkingSlots > 0 ? `${property.parkingSlots} slots` : "—"} />
              </div>
            </Section>

            {/* Description */}
            {property.description && (
              <Section id="description" title="Description" icon={FileText}>
                <p className="whitespace-pre-line text-[15px] leading-relaxed text-[#3A3A3A]">
                  {property.description}
                </p>
              </Section>
            )}

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <Section id="amenities" title="Amenities" icon={CheckCircle2}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {property.amenities.map((amenity, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 rounded-lg bg-[#F4F1EB] px-4 py-3 text-sm text-[#1A1A1A]"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#B8945F]">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </span>
                      {amenity}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Location */}
            {(property.locationHierarchy || property.coordinates) && (
              <Section id="location" title="Location" icon={MapPin}>
                {property.locationHierarchy && (
                  <p className="text-[15px] leading-relaxed text-[#3A3A3A]">
                    {property.locationHierarchy}
                  </p>
                )}
                {property.coordinates && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-[#6B6B6B]">
                    <MapPin className="h-3.5 w-3.5 text-[#B8945F]" />
                    {property.coordinates.lat.toFixed(6)}, {property.coordinates.lng.toFixed(6)}
                  </div>
                )}
              </Section>
            )}

            {/* Image gallery */}
            {property.images && property.images.length > 1 && (
              <Section id="gallery" title="Gallery" icon={ImageIcon}>
                <GalleryGrid images={property.images} title={property.title} />
              </Section>
            )}

            {/* Additional media */}
            {(property.video || property.virtualTour || property.floorPlan) && (
              <Section title="Additional Media" icon={Video}>
                <div className="flex flex-wrap gap-3">
                  {property.video && (
                    <MediaLink href={property.video.url} icon={Video} label="Property Video" />
                  )}
                  {property.virtualTour && (
                    <MediaLink href={property.virtualTour.url} icon={Compass} label="Virtual Tour" />
                  )}
                  {property.floorPlan && (
                    <MediaLink href={property.floorPlan.url} icon={FileText} label="Floor Plan" />
                  )}
                </div>
              </Section>
            )}
          </div>

          {/* Right: sticky sidebar */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Price card */}
              <SidebarCard>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B8945F]">
                  List Price
                </p>
                <p className="mt-2 text-3xl font-bold text-[#0A0A0A]">{priceLabel}</p>
                {isRent && property.price != null && (
                  <p className="mt-1 text-xs text-[#6B6B6B]">per year</p>
                )}

                {property.qualityScore != null && (
                  <div className="mt-5 flex items-center gap-2 rounded-lg bg-[#F4F1EB] px-3.5 py-2.5">
                    <Star className="h-4 w-4 text-[#B8945F]" />
                    <span className="text-xs font-medium text-[#1A1A1A]">
                      Quality Score: {property.qualityScore}
                    </span>
                  </div>
                )}

                <div className="mt-5 space-y-2.5 border-t border-[#E8E5DF] pt-5">
                  <SidebarRow label="Reference" value={displayValue(property.reference)} />
                  <SidebarRow label="Listing Status" value={displayValue(property.listingStatus)} />
                  <SidebarRow label="Verification" value={displayValue(property.verificationStatus)} />
                  <SidebarRow label="Permit" value={displayValue(property.permitNumber)} />
                </div>
              </SidebarCard>

              {/* Agent card */}
              {(property.agentName || property.agencyName) && (
                <SidebarCard>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B8945F]">
                    Your DEEN Advisor
                  </p>
                  <div className="mt-4">
                    {property.agentName && (
                      <p className="text-base font-bold text-[#0A0A0A]">{property.agentName}</p>
                    )}
                    {property.agencyName && (
                      <p className="mt-0.5 text-xs text-[#6B6B6B]">{property.agencyName}</p>
                    )}
                  </div>
                  <div className="mt-5 space-y-2.5">
                    {property.agentMobile && (
                      <a
                        href={`tel:${property.agentMobile}`}
                        className="flex items-center gap-2.5 text-sm text-[#1A1A1A] transition-colors hover:text-[#B8945F]"
                      >
                        <Phone className="h-4 w-4 text-[#B8945F]" />
                        {property.agentMobile}
                      </a>
                    )}
                    {property.agentEmail && (
                      <a
                        href={`mailto:${property.agentEmail}`}
                        className="flex items-center gap-2.5 text-sm text-[#1A1A1A] transition-colors hover:text-[#B8945F]"
                      >
                        <Mail className="h-4 w-4 text-[#B8945F]" />
                        {property.agentEmail}
                      </a>
                    )}
                    {property.agencyLicense && (
                      <div className="flex items-center gap-2.5 text-xs text-[#6B6B6B]">
                        <ShieldCheck className="h-4 w-4 text-[#B8945F]" />
                        License: {property.agencyLicense}
                      </div>
                    )}
                  </div>
                </SidebarCard>
              )}

              {/* Compliance */}
              {property.compliance && (
                <SidebarCard>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B8945F]">
                    Compliance
                  </p>
                  <div className="mt-4 space-y-2.5">
                    {property.compliance.dldPermitNumber && (
                      <SidebarRow label="DLD Permit" value={property.compliance.dldPermitNumber} />
                    )}
                    {property.compliance.expiryDate && (
                      <SidebarRow label="Expiry" value={formatDate(property.compliance.expiryDate)} />
                    )}
                  </div>
                </SidebarCard>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

// ── Hero (full-bleed gallery) ────────────────────────────────────────────────

function ShareHero({
  property,
  dealBadge,
  offeringLabel,
}: {
  property: PropertyDetail;
  dealBadge: string | null;
  offeringLabel: string;
}) {
  const mediaItems = buildMediaItems(property);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const next = useCallback(() => {
    setActiveIndex((i) => (i + 1) % mediaItems.length);
  }, [mediaItems.length]);

  const prev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + mediaItems.length) % mediaItems.length);
  }, [mediaItems.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxOpen, next, prev]);

  if (mediaItems.length === 0) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center bg-[#0A0A0A] text-white/40">
        <div className="text-center">
          <ImageIcon className="mx-auto h-14 w-14" />
          <p className="mt-3 text-xs uppercase tracking-[0.2em]">No Images Available</p>
        </div>
      </div>
    );
  }

  const current = mediaItems[activeIndex];

  return (
    <>
      <div className="relative bg-[#0A0A0A]">
        <div className="aspect-[16/10] w-full sm:aspect-[21/9] lg:aspect-[2.4/1]">
          {current.type === "image" && (
            <img
              src={current.url}
              alt={`${property.title} — Image ${activeIndex + 1}`}
              className="h-full w-full object-cover"
            />
          )}
          {current.type === "video" && (
            <div className="relative h-full w-full">
              <img
                src={current.thumbnail}
                alt={`${property.title} — Video`}
                className="h-full w-full object-cover opacity-70"
              />
              <a
                href={current.url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-xl transition-transform hover:scale-110">
                  <Video className="h-7 w-7 text-[#0A0A0A]" />
                </span>
              </a>
            </div>
          )}
          {current.type === "virtualTour" && (
            <a
              href={current.url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative flex h-full w-full items-center justify-center"
            >
              <img
                src={current.thumbnail || ""}
                alt={`${property.title} — Virtual Tour`}
                className="h-full w-full object-cover opacity-70"
              />
              <span className="absolute flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-xl transition-transform hover:scale-110">
                <Compass className="h-7 w-7 text-[#0A0A0A]" />
              </span>
            </a>
          )}
          {current.type === "floorPlan" && (
            <a
              href={current.url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative flex h-full w-full items-center justify-center bg-[#F4F1EB]"
            >
              <img
                src={current.url}
                alt={`${property.title} — Floor Plan`}
                className="h-full w-full object-contain"
              />
            </a>
          )}
        </div>

        {/* Badges */}
        <div className="absolute left-6 top-6 flex gap-2.5 lg:left-10">
          {dealBadge ? (
            <span className="rounded-full bg-[#9B2D2D] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white shadow-lg">
              {dealBadge}
            </span>
          ) : offeringLabel ? (
            <span className="rounded-full bg-[#0A0A0A]/85 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white shadow-lg backdrop-blur-sm">
              {offeringLabel}
            </span>
          ) : null}
        </div>

        {/* Expand (images only) */}
        {current.type === "image" && (
          <button
            onClick={() => setLightboxOpen(true)}
            className="absolute right-6 top-6 rounded-full bg-[#0A0A0A]/60 p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-[#0A0A0A]/80 cursor-pointer"
            aria-label="View full size"
          >
            <Expand className="h-4 w-4" />
          </button>
        )}

        {/* Nav arrows */}
        {mediaItems.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/25 cursor-pointer"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/25 cursor-pointer"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Counter */}
        {mediaItems.length > 1 && (
          <span className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-[#0A0A0A]/70 px-4 py-1.5 text-[10px] font-medium text-white backdrop-blur-sm">
            {activeIndex + 1} / {mediaItems.length}
          </span>
        )}
      </div>

      {/* Thumbnails */}
      {mediaItems.length > 1 && (
        <div className="border-b border-[#E8E5DF] bg-white">
          <div className="mx-auto max-w-7xl px-6 py-4 lg:px-10">
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {mediaItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                    idx === activeIndex
                      ? "border-[#B8945F] opacity-100"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  {item.type === "image" && (
                    <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
                  )}
                  {item.type === "video" && (
                    <div className="relative h-full w-full">
                      <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Video className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                  {item.type === "virtualTour" && (
                    <div className="flex h-full w-full items-center justify-center bg-[#0A0A0A]">
                      <Compass className="h-5 w-5 text-white" />
                    </div>
                  )}
                  {item.type === "floorPlan" && (
                    <div className="flex h-full w-full items-center justify-center bg-[#F4F1EB]">
                      <FileText className="h-5 w-5 text-[#6B6B6B]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && current.type === "image" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute right-6 top-6 rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20 cursor-pointer"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
          <button
            className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3.5 text-white transition-colors hover:bg-white/20 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <img
            src={current.url}
            alt={`${property.title} — Full size`}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3.5 text-white transition-colors hover:bg-white/20 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      )}
    </>
  );
}

// ── Reusable UI ──────────────────────────────────────────────────────────────

function KeySpec({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 bg-white px-5 py-7 text-center">
      <Icon className="h-6 w-6 text-[#B8945F]" />
      <span className="text-xl font-bold text-[#0A0A0A]">{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6B6B6B]">
        {label}
      </span>
    </div>
  );
}

function Section({
  id,
  title,
  icon: Icon,
  children,
}: {
  id?: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="mb-6 flex items-center gap-3">
        <span className="h-6 w-1 bg-[#B8945F]" />
        <Icon className="h-4 w-4 text-[#B8945F]" />
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0A0A0A]">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#E8E5DF] pb-3">
      <span className="flex items-center gap-2.5 text-sm text-[#6B6B6B]">
        <Icon className="h-4 w-4 text-[#B8945F]" />
        {label}
      </span>
      <span className="text-sm font-semibold text-[#0A0A0A]">{value}</span>
    </div>
  );
}

function SidebarCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#E8E5DF] bg-white p-6 shadow-sm">
      {children}
    </div>
  );
}

function SidebarRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6B6B6B]">
        {label}
      </span>
      <span className="text-xs font-medium text-[#1A1A1A]">{value}</span>
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
      className="inline-flex items-center gap-2.5 rounded-lg border border-[#E8E5DF] bg-white px-5 py-3 text-sm font-medium text-[#1A1A1A] transition-colors hover:border-[#B8945F] hover:text-[#B8945F]"
    >
      <Icon className="h-4 w-4 text-[#B8945F]" />
      {label}
      <ArrowUpRight className="h-3.5 w-3.5" />
    </a>
  );
}

// ── Gallery grid (below hero) ────────────────────────────────────────────────

function GalleryGrid({
  images,
  title,
}: {
  images: Array<{ original: string; watermarked: string; width: number; height: number }>;
  title: string;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const galleryImages = images.slice(1); // hero already shows the first

  if (galleryImages.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {galleryImages.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setLightboxIndex(idx)}
            className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-[#F4F1EB]"
          >
            <img
              src={img.original}
              alt={`${title} — ${idx + 2}`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-[#0A0A0A]/0 transition-colors group-hover:bg-[#0A0A0A]/15" />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute right-6 top-6 rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20 cursor-pointer"
            onClick={() => setLightboxIndex(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <button
            className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3.5 text-white transition-colors hover:bg-white/20 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((i) =>
                i === null ? 0 : (i - 1 + galleryImages.length) % galleryImages.length,
              );
            }}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <img
            src={galleryImages[lightboxIndex]?.original}
            alt={`${title} — Full size`}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3.5 text-white transition-colors hover:bg-white/20 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((i) =>
                i === null ? 0 : (i + 1) % galleryImages.length,
              );
            }}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      )}
    </>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

type MediaItem =
  | { type: "image"; url: string; thumbnail: string }
  | { type: "video"; url: string; thumbnail: string }
  | { type: "virtualTour"; url: string; thumbnail: string }
  | { type: "floorPlan"; url: string; thumbnail: string };

function buildMediaItems(property: PropertyDetail): MediaItem[] {
  return [
    ...(property.images ?? []).map((img) => ({
      type: "image" as const,
      url: img.original,
      thumbnail: img.original,
    })),
    ...(property.video
      ? [{ type: "video" as const, url: property.video.url, thumbnail: property.video.thumbnailUrl }]
      : []),
    ...(property.virtualTour
      ? [{
          type: "virtualTour" as const,
          url: property.virtualTour.url,
          thumbnail: property.images[0]?.original ?? "",
        }]
      : []),
    ...(property.floorPlan
      ? [{ type: "floorPlan" as const, url: property.floorPlan.url, thumbnail: property.floorPlan.url }]
      : []),
  ];
}
