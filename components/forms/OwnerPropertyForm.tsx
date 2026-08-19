"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Info,
  Plus,
  Check,
  X,
  CheckCircle2,
  Package,
} from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/Button";
import { Field, Select, Textarea } from "@/components/ui/Input";
import { PropertyPickerModal } from "@/components/owners/PropertyPickerModal";
import { PocketListingPickerModal } from "@/components/owners/PocketListingPickerModal";
import { propertiesService, type PropertySummary } from "@/services/properties/properties.service";
import {
  ownerPropertySchema,
  type OwnerPropertyFormValues,
} from "@/schemas/owner.schema";
import type { OwnerProperty, PocketListing } from "@/types";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type PropertySource = "property_finder" | "pocket_listing";

// ── Component ─────────────────────────────────────────────────────────────────

export function OwnerPropertyForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
  /** When true, the form resets after a successful submit so the user can
   *  add another property without closing the modal. */
  multiAdd = false,
}: {
  initial?: OwnerProperty;
  submitting?: boolean;
  onSubmit: (values: OwnerPropertyFormValues) => void | Promise<void>;
  onCancel?: () => void;
  multiAdd?: boolean;
}) {
  // Determine initial source from existing data
  const initialSource: PropertySource =
    initial?.pocketListingId ? "pocket_listing" : "property_finder";

  const [source, setSource] = useState<PropertySource>(
    initial ? initialSource : "property_finder",
  );
  const [selectedPFProperty, setSelectedPFProperty] = useState<PropertySummary | null>(null);
  const [selectedPocketListing, setSelectedPocketListing] = useState<PocketListing | null>(null);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [addedCount, setAddedCount] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<OwnerPropertyFormValues>({
    resolver: zodResolver(ownerPropertySchema),
    defaultValues: {
      projectName: initial?.projectName ?? "",
      projectType: initial?.projectType ?? "",
      reference: initial?.reference ?? "",
      category: initial?.category ?? "",
      type: initial?.type ?? "",
      configuration: initial?.configuration ?? "",
      bedrooms: initial?.bedrooms ?? "",
      bathrooms: initial?.bathrooms ?? "",
      size: initial?.size ?? "",
      price: initial?.price ?? "",
      emirate: initial?.emirate ?? "",
      community: initial?.community ?? "",
      building: initial?.building ?? "",
      unitNumber: initial?.unitNumber ?? "",
      floorNumber: initial?.floorNumber ?? "",
      parkingSlots: initial?.parkingSlots ?? "",
      listingStatus: initial?.listingStatus ?? "available",
      pfListingId: initial?.pfListingId ?? "",
      pocketListingId: initial?.pocketListingId ?? "",
      notes: initial?.notes ?? "",
    },
  });

  // Edit mode: load PF listing details for display
  useEffect(() => {
    if (initial?.pfListingId && !selectedPFProperty) {
      setFetchingDetail(true);
      propertiesService
        .get(initial.pfListingId)
        .then((detail) => {
          setSelectedPFProperty(detail as unknown as PropertySummary);
        })
        .catch(() => {})
        .finally(() => setFetchingDetail(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.pfListingId]);

  // ── Selection handlers ───────────────────────────────────────────────────

  function handlePFPropertySelect(prop: PropertySummary) {
    setSelectedPFProperty(prop);
    const projectName = prop.community || prop.building || "Unknown Project";
    setValue("pfListingId", prop.id);
    setValue("pocketListingId", "");
    setValue("projectName", projectName);
    setValue("reference", prop.reference);
    setValue("category", prop.category);
    setValue("type", prop.type);
    setValue("bedrooms", prop.bedrooms);
    setValue("bathrooms", prop.bathrooms);
    setValue("size", prop.size ? String(prop.size) : "");
    setValue("price", prop.price != null ? String(prop.price) : "");
    setValue("emirate", prop.emirate);
    setValue("community", prop.community ?? "");
    setValue("building", prop.building ?? "");
    setValue("unitNumber", prop.unitNumber);
    setValue("floorNumber", prop.floorNumber);
    setValue("parkingSlots", prop.parkingSlots ? String(prop.parkingSlots) : "");
    setValue("projectType", prop.completionStatus);
  }

  function handlePocketListingSelect(listing: PocketListing) {
    setSelectedPocketListing(listing);
    const projectName = listing.community || listing.building || listing.title;
    setValue("pocketListingId", listing.id);
    setValue("pfListingId", "");
    setValue("projectName", projectName);
    setValue("reference", listing.reference);
    setValue("category", listing.category);
    setValue("type", listing.type);
    setValue("bedrooms", listing.bedrooms ?? "");
    setValue("bathrooms", listing.bathrooms ?? "");
    setValue("size", listing.size ? String(listing.size) : "");
    setValue("price", listing.price != null ? String(listing.price) : "");
    setValue("emirate", listing.emirate);
    setValue("community", listing.community ?? "");
    setValue("building", listing.building ?? "");
    setValue("unitNumber", listing.unitNumber ?? "");
    setValue("floorNumber", listing.floorNumber ?? "");
    setValue("parkingSlots", listing.parkingSlots ? String(listing.parkingSlots) : "");
    setValue("projectType", listing.completionStatus ?? "");
  }

  function handleClearSelection() {
    setSelectedPFProperty(null);
    setSelectedPocketListing(null);
    const emptyFields = {
      pfListingId: "", pocketListingId: "", projectName: "", reference: "",
      category: "", type: "", bedrooms: "", bathrooms: "", size: "", price: "",
      emirate: "", community: "", building: "", unitNumber: "", floorNumber: "",
      parkingSlots: "", projectType: "", notes: "", listingStatus: "available" as const,
    };
    Object.entries(emptyFields).forEach(([k, v]) => setValue(k as any, v));
  }

  function resetForNext() {
    setSelectedPFProperty(null);
    setSelectedPocketListing(null);
    reset({
      projectName: "", projectType: "", reference: "", category: "", type: "",
      configuration: "", bedrooms: "", bathrooms: "", size: "", price: "",
      emirate: "", community: "", building: "", unitNumber: "", floorNumber: "",
      parkingSlots: "", listingStatus: "available", pfListingId: "", pocketListingId: "", notes: "",
    });
    setAddedCount((c) => c + 1);
  }

  function handleSourceSwitch(newSource: PropertySource) {
    if (newSource === source) return;
    setSource(newSource);
    setSelectedPFProperty(null);
    setSelectedPocketListing(null);
    setValue("pfListingId", "");
    setValue("pocketListingId", "");
    setValue("projectName", "");
  }

  async function handleSubmitInternal(values: OwnerPropertyFormValues) {
    if (multiAdd && !isEditMode) {
      try {
        await onSubmit(values);
        resetForNext();
      } catch {
        // Error handled by parent via toast
      }
    } else {
      await onSubmit(values);
    }
  }

  const isEditMode = !!initial;
  const selectedProperty = selectedPFProperty ?? selectedPocketListing;
  const canSubmit = isEditMode || selectedProperty !== null;

  return (
    <form onSubmit={handleSubmit(handleSubmitInternal)} className="space-y-5">
      {/* ── Multi-add success counter ──────────────────────────────── */}
      {multiAdd && !isEditMode && addedCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <p className="text-xs font-medium text-emerald-800">
            {addedCount} {addedCount === 1 ? "property" : "properties"} added successfully.
            Select another property below or click &ldquo;Done&rdquo; to finish.
          </p>
        </div>
      )}

      {/* ── Property Source Tabs ───────────────────────────────────── */}
      {!isEditMode && (
        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
            Property Source <span className="ml-1 text-red-500">*</span>
          </label>

          {/* Tab switcher */}
          <div className="mb-4 flex gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-1">
            <button
              type="button"
              onClick={() => handleSourceSwitch("property_finder")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
                source === "property_finder"
                  ? "bg-white text-neutral-900 shadow-sm border border-neutral-200"
                  : "text-neutral-500 hover:text-neutral-700",
              )}
            >
              <Building2 className="h-4 w-4" />
              Property Finder
            </button>
            <button
              type="button"
              onClick={() => handleSourceSwitch("pocket_listing")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
                source === "pocket_listing"
                  ? "bg-white text-neutral-900 shadow-sm border border-neutral-200"
                  : "text-neutral-500 hover:text-neutral-700",
              )}
            >
              <Package className="h-4 w-4" />
              Pocket Listing
            </button>
          </div>

          {/* PF Listing selector */}
          {source === "property_finder" && (
            <>
              {selectedPFProperty ? (
                <SelectedPropertyCard
                  title={selectedPFProperty.title}
                  image={selectedPFProperty.mainImage}
                  reference={selectedPFProperty.reference}
                  type={selectedPFProperty.type}
                  bedrooms={selectedPFProperty.bedrooms}
                  bathrooms={selectedPFProperty.bathrooms}
                  size={selectedPFProperty.size ? String(selectedPFProperty.size) : ""}
                  price={selectedPFProperty.price != null ? String(selectedPFProperty.price) : ""}
                  emirate={selectedPFProperty.emirate}
                  community={selectedPFProperty.community}
                  source="property_finder"
                  onClear={handleClearSelection}
                />
              ) : (
                <PickerButton
                  label="Select a property from the Properties module"
                  hint="Click to browse available (unlinked) Property Finder listings"
                  onClick={() => setShowPickerModal(true)}
                />
              )}
              <InfoBanner message={
                <>Only properties listed in the <strong>Properties</strong> module and not yet linked to any owner can be selected.</>
              } />
            </>
          )}

          {/* Pocket Listing selector */}
          {source === "pocket_listing" && (
            <>
              {selectedPocketListing ? (
                <SelectedPropertyCard
                  title={selectedPocketListing.title}
                  image={selectedPocketListing.mainImage}
                  reference={selectedPocketListing.reference}
                  type={selectedPocketListing.type}
                  bedrooms={selectedPocketListing.bedrooms ?? ""}
                  bathrooms={selectedPocketListing.bathrooms ?? ""}
                  size={selectedPocketListing.size ? String(selectedPocketListing.size) : ""}
                  price={selectedPocketListing.price != null ? String(selectedPocketListing.price) : ""}
                  emirate={selectedPocketListing.emirate}
                  community={selectedPocketListing.community}
                  source="pocket_listing"
                  onClear={handleClearSelection}
                />
              ) : (
                <PickerButton
                  label="Select a Pocket Listing"
                  hint="Click to browse available (unlinked) pocket listings"
                  icon={<Package className="h-6 w-6 text-neutral-400" />}
                  onClick={() => setShowPickerModal(true)}
                />
              )}
              <InfoBanner message="Only pocket listings not yet linked to any owner can be selected." />
            </>
          )}
        </div>
      )}

      {isEditMode && fetchingDetail && (
        <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <Building2 className="h-4 w-4 animate-pulse text-neutral-400" />
          <p className="text-xs text-neutral-500">Loading property details…</p>
        </div>
      )}

      {/* ── Auto-filled read-only details ─────────────────────────── */}
      {(selectedProperty || isEditMode) && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-4">
          <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Property Details
          </h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField
              label="Project"
              value={
                selectedPFProperty?.community ||
                selectedPFProperty?.building ||
                selectedPocketListing?.community ||
                selectedPocketListing?.building ||
                initial?.projectName
              }
            />
            <DetailField
              label="Reference"
              value={
                selectedPFProperty?.reference ||
                selectedPocketListing?.reference ||
                initial?.reference
              }
            />
            <DetailField
              label="Type"
              value={selectedPFProperty?.type || selectedPocketListing?.type || initial?.type}
            />
            <DetailField
              label="Category"
              value={
                selectedPFProperty?.category || selectedPocketListing?.category || initial?.category
              }
            />
            <DetailField
              label="Bedrooms"
              value={
                selectedPFProperty?.bedrooms || selectedPocketListing?.bedrooms || initial?.bedrooms
              }
            />
            <DetailField
              label="Bathrooms"
              value={
                selectedPFProperty?.bathrooms || selectedPocketListing?.bathrooms || initial?.bathrooms
              }
            />
            <DetailField
              label="Size"
              value={
                selectedPFProperty?.size
                  ? `${selectedPFProperty.size} sqft`
                  : selectedPocketListing?.size
                  ? `${selectedPocketListing.size} sqft`
                  : initial?.size
                  ? `${initial.size} sqft`
                  : undefined
              }
            />
            <DetailField
              label="Price"
              value={
                selectedPFProperty?.price != null
                  ? `AED ${selectedPFProperty.price.toLocaleString()}`
                  : selectedPocketListing?.price != null
                  ? `AED ${selectedPocketListing.price.toLocaleString()}`
                  : initial?.price
                  ? `AED ${initial.price}`
                  : undefined
              }
            />
            <DetailField
              label="Emirate"
              value={
                selectedPFProperty?.emirate ||
                selectedPocketListing?.emirate ||
                initial?.emirate
              }
            />
            <DetailField
              label="Community"
              value={
                selectedPFProperty?.community ||
                selectedPocketListing?.community ||
                initial?.community
              }
            />
            <DetailField
              label="Building"
              value={
                selectedPFProperty?.building ||
                selectedPocketListing?.building ||
                initial?.building
              }
            />
            <DetailField
              label="Unit"
              value={
                selectedPFProperty?.unitNumber ||
                selectedPocketListing?.unitNumber ||
                initial?.unitNumber
              }
            />
          </div>
        </div>
      )}

      {/* ── Editable fields ────────────────────────────────────────── */}
      {(selectedProperty || isEditMode) && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Listing Status" error={errors.listingStatus?.message}>
              <Select {...register("listingStatus")}>
                <option value="available">Available</option>
                <option value="listed">Listed</option>
                <option value="sold">Sold</option>
                <option value="rented">Rented</option>
                <option value="off_market">Off Market</option>
              </Select>
            </Field>
          </div>

          <Field label="Notes" error={errors.notes?.message}>
            <Textarea
              placeholder="Any notes about this property for this owner…"
              rows={3}
              {...register("notes")}
            />
          </Field>
        </>
      )}

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {multiAdd && !isEditMode ? "Done" : "Cancel"}
          </Button>
        )}
        <Button type="submit" loading={submitting} disabled={!canSubmit}>
          {initial ? "Update Property" : "Add Property"}
        </Button>
      </div>

      {/* ── Modals ────────────────────────────────────────────────── */}
      <PropertyPickerModal
        open={showPickerModal && source === "property_finder"}
        onClose={() => setShowPickerModal(false)}
        onSelect={handlePFPropertySelect}
      />
      <PocketListingPickerModal
        open={showPickerModal && source === "pocket_listing"}
        onClose={() => setShowPickerModal(false)}
        onSelect={handlePocketListingSelect}
      />
    </form>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SelectedPropertyCard({
  title,
  image,
  reference,
  type,
  bedrooms,
  bathrooms,
  size,
  price,
  emirate,
  community,
  source,
  onClear,
}: {
  title: string;
  image?: string | null;
  reference?: string;
  type?: string;
  bedrooms?: string;
  bathrooms?: string;
  size?: string;
  price?: string;
  emirate?: string;
  community?: string | null;
  source: PropertySource;
  onClear: () => void;
}) {
  const borderColor =
    source === "pocket_listing" ? "border-purple-200" : "border-emerald-200";
  const bgColor =
    source === "pocket_listing" ? "bg-purple-50/50" : "bg-emerald-50/50";
  const iconBgColor =
    source === "pocket_listing" ? "bg-purple-100" : "bg-emerald-100";
  const iconColor =
    source === "pocket_listing" ? "text-purple-600" : "text-emerald-600";
  const checkColor =
    source === "pocket_listing" ? "text-purple-600" : "text-emerald-600";

  return (
    <div className={cn("rounded-lg border-2 p-4", borderColor, bgColor)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {image ? (
            <img
              src={image}
              alt={title}
              className="h-16 w-16 rounded-lg object-cover"
            />
          ) : (
            <div
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-lg",
                iconBgColor,
              )}
            >
              {source === "pocket_listing" ? (
                <Package className={cn("h-7 w-7", iconColor)} />
              ) : (
                <Building2 className={cn("h-7 w-7", iconColor)} />
              )}
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <Check className={cn("h-4 w-4", checkColor)} />
              <p className="font-medium text-slate-900">{title}</p>
            </div>
            {reference && (
              <p className="mt-0.5 text-xs text-slate-500">Ref: {reference}</p>
            )}
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-600">
              {type && <span>{type}</span>}
              {bedrooms && <span>· {bedrooms} BR</span>}
              {bathrooms && <span>· {bathrooms} Bath</span>}
              {size && <span>· {size} sqft</span>}
              {price && <span>· AED {Number(price).toLocaleString()}</span>}
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              {emirate}
              {community ? ` · ${community}` : ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-rose-600 transition-colors"
          title="Remove selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function PickerButton({
  label,
  hint,
  icon,
  onClick,
}: {
  label: string;
  hint: string;
  icon?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50/50 py-10 text-center transition-colors hover:border-neutral-400 hover:bg-neutral-50"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
        {icon ?? <Plus className="h-6 w-6 text-neutral-400" />}
      </div>
      <p className="mt-3 text-sm font-medium text-neutral-700">{label}</p>
      <p className="mt-1 text-xs text-neutral-400">{hint}</p>
    </button>
  );
}

function InfoBanner({ message }: { message: React.ReactNode }) {
  return (
    <div className="mt-2 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
      <p className="text-xs text-blue-800">{message}</p>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
        {label}
      </p>
      <p className="text-sm text-neutral-800">{value || "—"}</p>
    </div>
  );
}
