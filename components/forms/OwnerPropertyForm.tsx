"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Info, Plus, Check, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Select, Textarea } from "@/components/ui/Input";
import { PropertyPickerModal } from "@/components/owners/PropertyPickerModal";
import { propertiesService, type PropertySummary } from "@/services/properties/properties.service";
import {
  ownerPropertySchema,
  type OwnerPropertyFormValues,
} from "@/schemas/owner.schema";
import type { OwnerProperty } from "@/types";

export function OwnerPropertyForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
  /** When true, the form resets after a successful submit so the user can
   *  add another property without closing the modal. Shows "Add Property"
   *  (submit + reset) and "Done" (close) buttons. */
  multiAdd = false,
}: {
  initial?: OwnerProperty;
  submitting?: boolean;
  /** Submit handler. In multi-add mode, should return a promise that
   *  resolves on success so the form can reset. */
  onSubmit: (values: OwnerPropertyFormValues) => void | Promise<void>;
  onCancel?: () => void;
  multiAdd?: boolean;
}) {
  const [selectedProperty, setSelectedProperty] = useState<PropertySummary | null>(null);
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
      notes: initial?.notes ?? "",
    },
  });

  // When editing an existing property with a pfListingId, load the PF listing
  // summary for display.
  useEffect(() => {
    if (initial?.pfListingId && !selectedProperty) {
      setFetchingDetail(true);
      propertiesService
        .get(initial.pfListingId)
        .then((detail) => {
          setSelectedProperty(detail as unknown as PropertySummary);
        })
        .catch(() => {
          // If the listing is no longer on PF, just leave it null
        })
        .finally(() => setFetchingDetail(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.pfListingId]);

  // When a property is selected from the modal, auto-fill all fields
  function handlePropertySelect(prop: PropertySummary) {
    setSelectedProperty(prop);
    // Use community as projectName (the development/project name),
    // fall back to building, then to the title.
    const projectName = prop.community || prop.building || "Unknown Project";
    setValue("pfListingId", prop.id);
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

  function handleClearSelection() {
    setSelectedProperty(null);
    setValue("pfListingId", "");
    setValue("projectName", "");
    setValue("reference", "");
    setValue("category", "");
    setValue("type", "");
    setValue("bedrooms", "");
    setValue("bathrooms", "");
    setValue("size", "");
    setValue("price", "");
    setValue("emirate", "");
    setValue("community", "");
    setValue("building", "");
    setValue("unitNumber", "");
    setValue("floorNumber", "");
    setValue("parkingSlots", "");
    setValue("projectType", "");
    setValue("notes", "");
    setValue("listingStatus", "available");
  }

  /** Reset the form to its empty state so the user can add another property. */
  function resetForNext() {
    setSelectedProperty(null);
    reset({
      projectName: "",
      projectType: "",
      reference: "",
      category: "",
      type: "",
      configuration: "",
      bedrooms: "",
      bathrooms: "",
      size: "",
      price: "",
      emirate: "",
      community: "",
      building: "",
      unitNumber: "",
      floorNumber: "",
      parkingSlots: "",
      listingStatus: "available",
      pfListingId: "",
      notes: "",
    });
    setAddedCount((c) => c + 1);
  }

  const isEditMode = !!initial;
  const canSubmit = isEditMode || selectedProperty !== null;

  /** In multi-add mode, wrap onSubmit so we can reset after success. */
  async function handleSubmitInternal(values: OwnerPropertyFormValues) {
    if (multiAdd && !isEditMode) {
      try {
        await onSubmit(values);
        // Success — reset the form for the next property
        resetForNext();
      } catch {
        // Error is handled by the parent (toast). Form stays as-is so the
        // user can retry or pick a different property.
      }
    } else {
      await onSubmit(values);
    }
  }

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

      {/* ── Property Selector ──────────────────────────────────────── */}
      {!isEditMode && (
        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
            Select Property <span className="ml-1 text-red-500">*</span>
          </label>

          {selectedProperty ? (
            // Show selected property card
            <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {selectedProperty.mainImage ? (
                    <img
                      src={selectedProperty.mainImage}
                      alt={selectedProperty.title}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-emerald-100">
                      <Building2 className="h-7 w-7 text-emerald-600" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-emerald-600" />
                      <p className="font-medium text-slate-900">{selectedProperty.title}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Ref: {selectedProperty.reference}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-600">
                      <span>{selectedProperty.type}</span>
                      {selectedProperty.bedrooms && <span>· {selectedProperty.bedrooms} BR</span>}
                      {selectedProperty.bathrooms && <span>· {selectedProperty.bathrooms} Bath</span>}
                      <span>· {selectedProperty.size} sqft</span>
                      {selectedProperty.price != null && (
                        <span>· AED {selectedProperty.price.toLocaleString()}</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {selectedProperty.emirate}
                      {selectedProperty.community ? ` · ${selectedProperty.community}` : ""}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-rose-600 transition-colors"
                  title="Remove selection"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            // Show button to open the picker modal
            <button
              type="button"
              onClick={() => setShowPickerModal(true)}
              className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50/50 py-10 text-center transition-colors hover:border-neutral-400 hover:bg-neutral-50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                <Plus className="h-6 w-6 text-neutral-400" />
              </div>
              <p className="mt-3 text-sm font-medium text-neutral-700">
                Select a property from the Properties module
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                Click to browse available (unlinked) properties
              </p>
            </button>
          )}

          <div className="mt-2 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <p className="text-xs text-blue-800">
              Only properties already listed in the{" "}
              <strong>Properties</strong> module and not yet linked to any owner
              can be selected.
            </p>
          </div>
        </div>
      )}

      {isEditMode && fetchingDetail && (
        <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <Building2 className="h-4 w-4 animate-pulse text-neutral-400" />
          <p className="text-xs text-neutral-500">Loading property details…</p>
        </div>
      )}

      {/* ── Auto-filled Property Details (read-only display) ────────── */}
      {(selectedProperty || isEditMode) && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-4">
          <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Property Details (from Properties module)
          </h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField
              label="Project"
              value={selectedProperty?.community || selectedProperty?.building || initial?.projectName}
            />
            <DetailField value={selectedProperty?.reference || initial?.reference} label="Reference" />
            <DetailField value={selectedProperty?.type || initial?.type} label="Type" />
            <DetailField value={selectedProperty?.category || initial?.category} label="Category" />
            <DetailField value={selectedProperty?.bedrooms || initial?.bedrooms} label="Bedrooms" />
            <DetailField value={selectedProperty?.bathrooms || initial?.bathrooms} label="Bathrooms" />
            <DetailField
              label="Size"
              value={
                selectedProperty?.size
                  ? `${selectedProperty.size} sqft`
                  : initial?.size
                    ? `${initial.size} sqft`
                    : undefined
              }
            />
            <DetailField
              label="Price"
              value={
                selectedProperty?.price != null
                  ? `AED ${selectedProperty.price.toLocaleString()}`
                  : initial?.price
                    ? `AED ${initial.price}`
                    : undefined
              }
            />
            <DetailField value={selectedProperty?.emirate || initial?.emirate} label="Emirate" />
            <DetailField value={selectedProperty?.community || initial?.community} label="Community" />
            <DetailField value={selectedProperty?.building || initial?.building} label="Building" />
            <DetailField value={selectedProperty?.unitNumber || initial?.unitNumber} label="Unit" />
            <DetailField value={selectedProperty?.floorNumber || initial?.floorNumber} label="Floor" />
            <DetailField
              label="Parking"
              value={
                selectedProperty?.parkingSlots
                  ? String(selectedProperty.parkingSlots)
                  : initial?.parkingSlots
                    ? String(initial.parkingSlots)
                    : undefined
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
          {initial
            ? "Update Property"
            : multiAdd
              ? "Add Property"
              : "Add Property"}
        </Button>
      </div>

      {/* ── Property Picker Modal ──────────────────────────────────── */}
      <PropertyPickerModal
        open={showPickerModal}
        onClose={() => setShowPickerModal(false)}
        onSelect={handlePropertySelect}
      />
    </form>
  );
}

// ── Helper ───────────────────────────────────────────────────────────────────

function DetailField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
        {label}
      </p>
      <p className="text-sm text-neutral-800">{value || "—"}</p>
    </div>
  );
}
