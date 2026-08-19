"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import {
  pocketListingSchema,
  type PocketListingFormValues,
  type PocketListingFormOutput,
  PROPERTY_TYPES_BY_CATEGORY,
  RESIDENTIAL_AMENITIES,
  COMMERCIAL_AMENITIES,
  BEDROOM_OPTIONS,
  BATHROOM_OPTIONS,
  UAE_EMIRATES,
  POCKET_LISTING_STATUS_OPTIONS,
  FURNISHING_TYPE_OPTIONS,
  COMPLETION_STATUS_OPTIONS,
  PRICE_TYPE_OPTIONS,
  CURRENCY_OPTIONS,
  OFFERING_TYPE_OPTIONS,
} from "@/schemas/pocketListing.schema";
import type { PocketListingImage } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PocketListingFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<PocketListingFormValues>;
  existingImages?: PocketListingImage[];
  submitting?: boolean;
  onSubmit: (formData: FormData) => Promise<void>;
  onRemoveImage?: (imageId: string) => Promise<void>;
  onCancel?: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function humanizeSlug(slug: string): string {
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 border-b border-neutral-100 pb-2">
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PocketListingForm({
  mode,
  defaultValues,
  existingImages = [],
  submitting,
  onSubmit,
  onRemoveImage,
  onCancel,
}: PocketListingFormProps) {
  const [newImages, setNewImages] = useState<File[]>([]);
  const [removingImageId, setRemovingImageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PocketListingFormValues>({
    resolver: zodResolver(pocketListingSchema),
    defaultValues: {
      title: "",
      category: "residential",
      type: "",
      offeringType: "sale",
      emirate: "",
      currency: "AED",
      priceOnRequest: false,
      listingStatus: "available",
      amenities: [],
      ...defaultValues,
    },
  });

  const category = watch("category") as "residential" | "commercial";
  const offeringType = watch("offeringType");
  const priceOnRequest = watch("priceOnRequest");
  const listingStatus = watch("listingStatus");

  const typeOptions =
    PROPERTY_TYPES_BY_CATEGORY[category] ??
    PROPERTY_TYPES_BY_CATEGORY["residential"];
  const amenityOptions =
    category === "commercial" ? COMMERCIAL_AMENITIES : RESIDENTIAL_AMENITIES;

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleValid(values: PocketListingFormOutput) {
    const fd = new FormData();

    // Send the entire body as a JSON string — backend's parseBody() reads
    // req.body.body first, so this avoids multer's string-only type coercion.
    fd.append("body", JSON.stringify(values));

    // New image files
    newImages.forEach((file) => fd.append("images", file));

    await onSubmit(fd);
  }

  // ── Image handlers ──────────────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setNewImages((prev) => [...prev, ...files]);
    e.target.value = "";
  }

  function removeNewImage(idx: number) {
    setNewImages((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleRemoveExisting(imageId: string) {
    if (!onRemoveImage) return;
    setRemovingImageId(imageId);
    try {
      await onRemoveImage(imageId);
    } finally {
      setRemovingImageId(null);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <form
      onSubmit={handleSubmit(handleValid as never)}
      className="space-y-8"
    >
      {/* ── Classification ─────────────────────────────────────────────────── */}
      <FormSection title="Classification">
        <Field
          label="Title"
          required
          error={errors.title?.message}
          className="md:col-span-2"
        >
          <Input
            {...register("title")}
            placeholder="e.g. Luxury 2BR Apartment in Marina Gate"
            invalid={!!errors.title}
          />
        </Field>

        <Field label="Category" required error={errors.category?.message}>
          <Select {...register("category")}>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
          </Select>
        </Field>

        <Field label="Property Type" required error={errors.type?.message}>
          <Select {...register("type")} invalid={!!errors.type}>
            <option value="">Select type…</option>
            {typeOptions.map((t) => (
              <option key={t} value={t}>
                {humanizeSlug(t)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Offering Type" required error={errors.offeringType?.message}>
          <Select {...register("offeringType")}>
            {OFFERING_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Listing Status" error={errors.listingStatus?.message}>
          <Select {...register("listingStatus")}>
            {POCKET_LISTING_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Furnishing" error={errors.furnishingType?.message}>
          <Select {...register("furnishingType")}>
            <option value="">— None —</option>
            {FURNISHING_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Completion Status" error={errors.completionStatus?.message}>
          <Select {...register("completionStatus")}>
            <option value="">— None —</option>
            {COMPLETION_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Developer" error={errors.developer?.message}>
          <Input {...register("developer")} placeholder="e.g. Emaar" />
        </Field>
      </FormSection>

      {/* ── Location ───────────────────────────────────────────────────────── */}
      <FormSection title="Location">
        <Field label="Emirate" required error={errors.emirate?.message}>
          <Select {...register("emirate")} invalid={!!errors.emirate}>
            <option value="">Select emirate…</option>
            {UAE_EMIRATES.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="City" error={errors.city?.message}>
          <Input {...register("city")} placeholder="e.g. Dubai" />
        </Field>

        <Field label="Community / Project" error={errors.community?.message}>
          <Input {...register("community")} placeholder="e.g. Dubai Marina" />
        </Field>

        <Field label="Building" error={errors.building?.message}>
          <Input {...register("building")} placeholder="e.g. Marina Gate 1" />
        </Field>

        <Field label="Unit Number" error={errors.unitNumber?.message}>
          <Input {...register("unitNumber")} placeholder="e.g. 2204" />
        </Field>

        <Field label="Floor Number" error={errors.floorNumber?.message}>
          <Input {...register("floorNumber")} placeholder="e.g. 22" />
        </Field>
      </FormSection>

      {/* ── Specifications ─────────────────────────────────────────────────── */}
      <FormSection title="Specifications">
        <Field label="Bedrooms" error={errors.bedrooms?.message}>
          <Select {...register("bedrooms")}>
            <option value="">— None —</option>
            {BEDROOM_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {b === "studio"
                  ? "Studio"
                  : `${b} Bedroom${b === "1" ? "" : "s"}`}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Bathrooms" error={errors.bathrooms?.message}>
          <Select {...register("bathrooms")}>
            <option value="">— None —</option>
            {BATHROOM_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {b === "none"
                  ? "None"
                  : `${b} Bathroom${b === "1" ? "" : "s"}`}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Size (sqft)" error={errors.size?.message}>
          <Input
            {...register("size")}
            type="number"
            min={0}
            placeholder="e.g. 1200"
            invalid={!!errors.size}
          />
        </Field>

        <Field label="Built-Up Area (sqft)" error={errors.builtUpArea?.message}>
          <Input
            {...register("builtUpArea")}
            type="number"
            min={0}
            placeholder="e.g. 1100"
          />
        </Field>

        <Field label="Parking Slots" error={errors.parkingSlots?.message}>
          <Input
            {...register("parkingSlots")}
            type="number"
            min={0}
            placeholder="e.g. 1"
          />
        </Field>
      </FormSection>

      {/* ── Pricing ────────────────────────────────────────────────────────── */}
      <FormSection title="Pricing">
        <Field label="Currency" error={errors.currency?.message}>
          <Select {...register("currency")}>
            {CURRENCY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Price" error={errors.price?.message}>
          <Input
            {...register("price")}
            type="number"
            min={0}
            placeholder="e.g. 1500000"
            disabled={!!priceOnRequest}
            invalid={!!errors.price}
          />
        </Field>

        <Field label="Price Type" error={errors.priceType?.message}>
          <Select {...register("priceType")} disabled={offeringType === "sale"}>
            <option value="">— None —</option>
            {PRICE_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Number of Cheques" error={errors.numberOfCheques?.message}>
          <Input
            {...register("numberOfCheques")}
            type="number"
            min={0}
            placeholder="e.g. 4"
          />
        </Field>

        <div className="flex items-center gap-2.5 pt-1 md:col-span-2">
          <input
            id="priceOnRequest"
            type="checkbox"
            {...register("priceOnRequest")}
            className="h-4 w-4 rounded border-neutral-300 text-black focus:ring-black cursor-pointer"
          />
          <label
            htmlFor="priceOnRequest"
            className="text-sm text-neutral-700 cursor-pointer"
          >
            Price on Request
          </label>
        </div>
      </FormSection>

      {/* ── Rental Agreement (when rent offering or rented status) ────────── */}
      {(offeringType === "rent" || listingStatus === "rented") && (
        <FormSection title="Rental Agreement">
          <Field label="Rental Start Date" error={errors.rentalStartDate?.message}>
            <Input {...register("rentalStartDate")} type="date" />
          </Field>

          <Field label="Rental End Date" error={errors.rentalEndDate?.message}>
            <Input {...register("rentalEndDate")} type="date" />
          </Field>

          <Field label="Available From" error={errors.availableFrom?.message}>
            <Input {...register("availableFrom")} type="date" />
          </Field>
        </FormSection>
      )}

      {/* ── Amenities ──────────────────────────────────────────────────────── */}
      <div>
        <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 border-b border-neutral-100 pb-2">
          Amenities
        </h3>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {amenityOptions.map((amenity) => (
            <label
              key={amenity}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                value={amenity}
                {...register("amenities")}
                className="h-4 w-4 rounded border-neutral-300 text-black focus:ring-black"
              />
              <span className="text-xs text-neutral-700">
                {humanizeSlug(amenity)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* ── Media Links ────────────────────────────────────────────────────── */}
      <FormSection title="Media Links">
        <Field label="Video URL" error={errors.videoUrl?.message}>
          <Input
            {...register("videoUrl")}
            placeholder="https://youtube.com/..."
          />
        </Field>

        <Field label="Virtual Tour URL" error={errors.virtualTourUrl?.message}>
          <Input {...register("virtualTourUrl")} placeholder="https://..." />
        </Field>

        <Field label="Floor Plan URL" error={errors.floorPlanUrl?.message}>
          <Input {...register("floorPlanUrl")} placeholder="https://..." />
        </Field>
      </FormSection>

      {/* ── Description & Notes ────────────────────────────────────────────── */}
      <FormSection title="Description & Notes">
        <Field
          label="Description"
          error={errors.description?.message}
          className="md:col-span-2"
        >
          <Textarea
            {...register("description")}
            rows={4}
            placeholder="Full listing description…"
          />
        </Field>

        <Field
          label="Internal Notes"
          error={errors.notes?.message}
          className="md:col-span-2"
        >
          <Textarea
            {...register("notes")}
            rows={3}
            placeholder="Notes visible only to your team…"
          />
        </Field>
      </FormSection>

      {/* ── Images ─────────────────────────────────────────────────────────── */}
      <div>
        <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 border-b border-neutral-100 pb-2">
          Images
        </h3>

        {/* Existing images */}
        {existingImages.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-neutral-500">
              Existing ({existingImages.length})
            </p>
            <div className="flex flex-wrap gap-3">
              {existingImages.map((img) => (
                <div key={img.id} className="relative group">
                  <img
                    src={img.url}
                    alt={img.filename}
                    className="h-24 w-24 rounded-lg object-cover border border-neutral-200 shadow-2xs"
                  />
                  {onRemoveImage && (
                    <button
                      type="button"
                      onClick={() => handleRemoveExisting(img.id)}
                      disabled={removingImageId === img.id}
                      title="Remove image"
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white shadow transition-all hover:bg-red-700 disabled:opacity-50 opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New images staged for upload */}
        {newImages.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-neutral-500">
              New — staged for upload ({newImages.length})
            </p>
            <div className="flex flex-wrap gap-3">
              {newImages.map((file, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="h-24 w-24 rounded-lg object-cover border border-neutral-200 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(idx)}
                    title="Remove"
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white shadow transition-all hover:bg-red-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload trigger */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 text-xs font-medium text-neutral-600 transition-colors hover:border-neutral-400 hover:bg-neutral-100 cursor-pointer"
        >
          <Upload className="h-4 w-4 text-neutral-400" />
          Upload Images
        </button>
      </div>

      {/* ── Actions ────────────────────────────────────────────────────────── */}
      <div className="flex justify-end gap-3 border-t border-neutral-100 pt-6">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={submitting}>
          {mode === "edit" ? "Save Changes" : "Create Listing"}
        </Button>
      </div>
    </form>
  );
}
