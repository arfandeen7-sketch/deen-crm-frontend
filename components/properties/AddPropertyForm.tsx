"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import {
  propertySubmissionSchema,
  buildPFPayload,
  PROPERTY_TYPES,
  AMENITIES,
  BEDROOM_OPTIONS,
  BATHROOM_OPTIONS,
  type PropertySubmissionFormValues,
} from "@/schemas/propertySubmission.schema";

export function AddPropertyForm({
  submitting,
  onSubmit,
  onCancel,
}: {
  submitting?: boolean;
  onSubmit: (payload: Record<string, unknown>) => void;
  onCancel?: () => void;
}) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PropertySubmissionFormValues>({
    resolver: zodResolver(propertySubmissionSchema),
    defaultValues: {
      category: "residential",
      furnishingType: "unfurnished",
      uaeEmirate: "dubai",
      priceType: "sale",
      imageUrls: [],
      amenities: [],
      hasParkingOnSite: false,
      hasGarden: false,
      hasKitchen: false,
      priceOnRequest: false,
    },
  });

  const uaeEmirate = watch("uaeEmirate");
  const needsCompliance = uaeEmirate === "dubai" || uaeEmirate === "abu_dhabi";

  function handleValid(values: PropertySubmissionFormValues) {
    const payload = buildPFPayload(values as any);
    onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit(handleValid)} className="space-y-6">
      {/* ── Basic Information ─────────────────────────────────────── */}
      <FormSection title="Basic Information">
        <Field label="Title (English)" required error={errors.titleEn?.message}>
          <Input {...register("titleEn")} placeholder="e.g. Luxury 2BR Apartment in Marina Gate" invalid={!!errors.titleEn} />
        </Field>

        <Field label="Description (English)" required error={errors.descriptionEn?.message} className="md:col-span-2">
          <Textarea
            {...register("descriptionEn")}
            placeholder="Full property description..."
            rows={4}
            invalid={!!errors.descriptionEn}
          />
        </Field>

        <Field label="Reference" required error={errors.reference?.message}>
          <Input {...register("reference")} placeholder="e.g. REF-001" invalid={!!errors.reference} />
        </Field>

        <Field label="Category" required error={errors.category?.message}>
          <Select {...register("category")}>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
          </Select>
        </Field>

        <Field label="Property Type" required error={errors.type?.message}>
          <Select {...register("type")}>
            <option value="">Select type...</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Furnishing Type" required error={errors.furnishingType?.message}>
          <Select {...register("furnishingType")}>
            <option value="unfurnished">Unfurnished</option>
            <option value="semi-furnished">Semi-Furnished</option>
            <option value="furnished">Furnished</option>
          </Select>
        </Field>

        <Field label="Emirate" required error={errors.uaeEmirate?.message}>
          <Select {...register("uaeEmirate")}>
            <option value="dubai">Dubai</option>
            <option value="abu_dhabi">Abu Dhabi</option>
            <option value="northern_emirates">Northern Emirates</option>
          </Select>
        </Field>

        <Field label="Location ID" required error={errors.locationId?.message} hint="PF location ID (numeric)">
          <Input type="number" {...register("locationId")} placeholder="e.g. 12345" invalid={!!errors.locationId} />
        </Field>
      </FormSection>

      {/* ── Property Details ──────────────────────────────────────── */}
      <FormSection title="Property Details">
        <Field label="Size (sqft)" required error={errors.size?.message}>
          <Input type="number" {...register("size")} placeholder="e.g. 1200" invalid={!!errors.size} />
        </Field>

        <Field label="Bedrooms" error={errors.bedrooms?.message}>
          <Select {...register("bedrooms")}>
            <option value="">Select...</option>
            {BEDROOM_OPTIONS.map((b) => (
              <option key={b} value={b}>{b === "studio" ? "Studio" : b}</option>
            ))}
          </Select>
        </Field>

        <Field label="Bathrooms" error={errors.bathrooms?.message}>
          <Select {...register("bathrooms")}>
            <option value="">Select...</option>
            {BATHROOM_OPTIONS.map((b) => (
              <option key={b} value={b}>{b === "none" ? "None" : b}</option>
            ))}
          </Select>
        </Field>

        <Field label="Unit Number" error={errors.unitNumber?.message}>
          <Input {...register("unitNumber")} placeholder="e.g. 1201" />
        </Field>

        <Field label="Floor Number" error={errors.floorNumber?.message}>
          <Input {...register("floorNumber")} placeholder="e.g. 12" />
        </Field>

        <Field label="Parking Slots" error={errors.parkingSlots?.message}>
          <Input type="number" {...register("parkingSlots")} placeholder="e.g. 2" />
        </Field>

        <Field label="Available From" error={errors.availableFrom?.message}>
          <Input type="date" {...register("availableFrom")} />
        </Field>

        <Field label="Finishing Type" error={errors.finishingType?.message}>
          <Select {...register("finishingType")}>
            <option value="">Select...</option>
            <option value="fully-finished">Fully Finished</option>
            <option value="semi-finished">Semi-Finished</option>
            <option value="unfinished">Unfinished</option>
          </Select>
        </Field>

        <Field label="Project Status" error={errors.projectStatus?.message}>
          <Select {...register("projectStatus")}>
            <option value="">Select...</option>
            <option value="completed">Completed</option>
            <option value="off_plan">Off Plan</option>
            <option value="completed_primary">Completed Primary</option>
            <option value="off_plan_primary">Off Plan Primary</option>
          </Select>
        </Field>

        <Field label="Developer" error={errors.developer?.message}>
          <Input {...register("developer")} placeholder="e.g. Emaar" />
        </Field>

        <Field label="Age (years)" error={errors.age?.message}>
          <Input type="number" {...register("age")} placeholder="e.g. 5" />
        </Field>

        <Field label="Built-up Area (sqft)" error={errors.builtUpArea?.message} hint="UAE villas/townhouses only">
          <Input type="number" {...register("builtUpArea")} placeholder="e.g. 2000" />
        </Field>

        <Field label="Number of Floors" error={errors.numberOfFloors?.message}>
          <Input type="number" {...register("numberOfFloors")} placeholder="e.g. 3" />
        </Field>

        <div className="flex flex-col gap-3 md:col-span-2">
          <Controller
            control={control}
            name="hasParkingOnSite"
            render={({ field }) => (
              <Checkbox label="Has parking on site" checked={!!field.value} onChange={field.onChange} />
            )}
          />
          <Controller
            control={control}
            name="hasGarden"
            render={({ field }) => (
              <Checkbox label="Has garden" checked={!!field.value} onChange={field.onChange} />
            )}
          />
          <Controller
            control={control}
            name="hasKitchen"
            render={({ field }) => (
              <Checkbox label="Has kitchen" checked={!!field.value} onChange={field.onChange} />
            )}
          />
        </div>
      </FormSection>

      {/* ── Pricing ───────────────────────────────────────────────── */}
      <FormSection title="Pricing">
        <Field label="Price Type" required error={errors.priceType?.message}>
          <Select {...register("priceType")}>
            <option value="sale">Sale</option>
            <option value="yearly">Yearly Rent</option>
            <option value="monthly">Monthly Rent</option>
            <option value="weekly">Weekly Rent</option>
            <option value="daily">Daily Rent</option>
          </Select>
        </Field>

        <Field label="Price Amount" required error={errors.priceAmount?.message}>
          <Input type="number" {...register("priceAmount")} placeholder="e.g. 1500000" invalid={!!errors.priceAmount} />
        </Field>

        <Field label="Down Payment" error={errors.downPayment?.message} hint="Required for sale">
          <Input type="number" {...register("downPayment")} placeholder="e.g. 200000" />
        </Field>

        <Field label="Number of Cheques" error={errors.numberOfCheques?.message} hint="For rental">
          <Input type="number" {...register("numberOfCheques")} placeholder="e.g. 1" />
        </Field>

        <Field label="Minimal Rental Period" error={errors.minimalRentalPeriod?.message}>
          <Input type="number" {...register("minimalRentalPeriod")} placeholder="e.g. 30" />
        </Field>

        <div className="flex items-end">
          <Controller
            control={control}
            name="priceOnRequest"
            render={({ field }) => (
              <Checkbox label="Price on request" checked={!!field.value} onChange={field.onChange} />
            )}
          />
        </div>
      </FormSection>

      {/* ── Media ─────────────────────────────────────────────────── */}
      <FormSection title="Media (Images & Videos)">
        <ImageUrlsField control={control} error={errors.imageUrls?.message as string | undefined} />

        <Field label="Video URL" error={errors.videoUrl?.message}>
          <Input {...register("videoUrl")} placeholder="https://..." />
        </Field>

        <Field label="Virtual Tour URL" error={errors.virtualTourUrl?.message}>
          <Input {...register("virtualTourUrl")} placeholder="https://..." />
        </Field>

        <Field label="Floor Plan URL" error={errors.floorPlanUrl?.message}>
          <Input {...register("floorPlanUrl")} placeholder="https://..." />
        </Field>
      </FormSection>

      {/* ── Amenities ─────────────────────────────────────────────── */}
      <FormSection title="Amenities">
        <div className="md:col-span-2">
          <Controller
            control={control}
            name="amenities"
            render={({ field }) => (
              <AmenitiesSelector selected={field.value ?? []} onChange={field.onChange} />
            )}
          />
        </div>
      </FormSection>

      {/* ── Compliance ────────────────────────────────────────────── */}
      {needsCompliance && (
        <FormSection title="Compliance (Required for Dubai / Abu Dhabi)">
          <Field label="Listing Advertisement Number" error={errors.complianceListingAdvertisementNumber?.message} hint="RERA / ADREC permit number">
            <Input {...register("complianceListingAdvertisementNumber")} placeholder="e.g. 12345" />
          </Field>

          <Field label="Compliance Type" error={errors.complianceType?.message}>
            <Select {...register("complianceType")}>
              <option value="">Select...</option>
              <option value="rera">RERA (Dubai)</option>
              <option value="adrec">ADREC (Abu Dhabi)</option>
            </Select>
          </Field>

          <Field label="Issuing Client License Number" error={errors.complianceIssuingClientLicenseNumber?.message}>
            <Input {...register("complianceIssuingClientLicenseNumber")} placeholder="Brokerage license number" />
          </Field>
        </FormSection>
      )}

      {/* ── Actions ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 border-t border-neutral-100 pt-4">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={submitting}>
          Submit for Approval
        </Button>
      </div>
    </form>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-2xs">
      <h3 className="mb-4 text-sm font-semibold text-neutral-900">{title}</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-neutral-300 text-black focus:ring-black"
      />
      {label}
    </label>
  );
}

function ImageUrlsField({
  control,
  error,
}: {
  control: any;
  error?: string;
}) {
  return (
    <Controller
      control={control}
      name="imageUrls"
      render={({ field }: { field: any }) => (
        <div className="md:col-span-2">
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
              Image URLs <span className="ml-1 text-red-500">*</span>
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => field.onChange([...(field.value ?? []), ""])}
            >
              <Plus className="h-3.5 w-3.5" /> Add Image
            </Button>
          </div>
          <div className="space-y-2">
            {(field.value ?? []).map((url: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50">
                  {url ? (
                    <img src={url} alt="" className="h-full w-full rounded-lg object-cover" />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-neutral-300" />
                  )}
                </div>
                <Input
                  value={url}
                  onChange={(e) => {
                    const next = [...(field.value ?? [])];
                    next[idx] = e.target.value;
                    field.onChange(next);
                  }}
                  placeholder="https://example.com/image.jpg"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const next = [...(field.value ?? [])];
                    next.splice(idx, 1);
                    field.onChange(next);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {(!field.value || field.value.length === 0) && (
              <p className="text-xs text-neutral-400">Click "Add Image" to add property images.</p>
            )}
          </div>
          {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
        </div>
      )}
    />
  );
}

function AmenitiesSelector({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (value: string[]) => void;
}) {
  function toggle(amenity: string) {
    if (selected.includes(amenity)) {
      onChange(selected.filter((a) => a !== amenity));
    } else {
      onChange([...selected, amenity]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {AMENITIES.map((amenity) => {
        const isSelected = selected.includes(amenity);
        return (
          <button
            key={amenity}
            type="button"
            onClick={() => toggle(amenity)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              isSelected
                ? "bg-black text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {amenity.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        );
      })}
    </div>
  );
}
