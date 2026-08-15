"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, Controller, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Image as ImageIcon, Search, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { getErrorMessage } from "@/services/api/client";
import { usePropertySubmissionMutations } from "@/hooks/usePropertySubmissions";
import {
  propertySubmissionsService,
  type DldPermitLookup,
  type PfLocationMatch,
} from "@/services/properties/propertySubmissions.service";
import {
  propertySubmissionSchema,
  buildPFPayload,
  PROPERTY_TYPES,
  PROPERTY_TYPES_BY_CATEGORY,
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
  onSubmit: (payload: Record<string, unknown>, images: File[]) => void;
  onCancel?: () => void;
}) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PropertySubmissionFormValues>({
    resolver: zodResolver(propertySubmissionSchema),
    defaultValues: {
      category: "residential",
      furnishingType: "unfurnished",
      uaeEmirate: "dubai",
      priceType: "sale",
      images: [],
      amenities: [],
      hasParkingOnSite: false,
      hasGarden: false,
      hasKitchen: false,
      priceOnRequest: false,
    },
  });

  const uaeEmirate = watch("uaeEmirate");
  const category = watch("category");
  const selectedType = watch("type");
  const needsCompliance = uaeEmirate === "dubai" || uaeEmirate === "abu_dhabi";
  const [dldSummary, setDldSummary] = useState<DldPermitLookup["permit"] | null>(null);
  const [allowedTypes, setAllowedTypes] = useState<string[] | null>(null);
  const [locationMatches, setLocationMatches] = useState<PfLocationMatch[]>([]);
  const typeOptions = (() => {
    const categoryTypes = PROPERTY_TYPES_BY_CATEGORY[category ?? "residential"] ?? PROPERTY_TYPES;
    if (!allowedTypes) return categoryTypes;
    const matched = categoryTypes.filter((t) => allowedTypes.includes(t));
    return matched.length > 0 ? matched : categoryTypes;
  })();

  useEffect(() => {
    if (selectedType && typeOptions.length > 0 && !typeOptions.includes(selectedType)) {
      setValue("type", "", { shouldValidate: true });
    }
  }, [selectedType, typeOptions, setValue]);

  function applyDldPrefill(lookup: DldPermitLookup) {
    const form = lookup.form;
    const keys = Object.keys(form) as Array<keyof typeof form>;
    for (const key of keys) {
      const value = form[key];
      if (value == null || value === "") continue;
      setValue(key as keyof PropertySubmissionFormValues, value as never, {
        shouldDirty: true,
        shouldValidate: false,
      });
    }
    setDldSummary(lookup.permit);
    setAllowedTypes(lookup.allowedTypes);
    setLocationMatches(lookup.locationMatches ?? []);
    if (!lookup.form.locationId) {
      setValue("locationId", undefined as never, { shouldValidate: false });
    }
    toast.success("Property details loaded from Dubai Land Department.");
  }

  function handleValid(values: PropertySubmissionFormValues) {
    const payload = buildPFPayload(values as any);
    const files = (values.images ?? []).map((img) => img.file).filter((f): f is File => f instanceof File);
    onSubmit(payload, files);
  }

  return (
    <form onSubmit={handleSubmit(handleValid)} className="space-y-6">
      <DldLookupCard
        uaeEmirate={uaeEmirate}
        onEmirateChange={(value) => setValue("uaeEmirate", value)}
        onLoaded={applyDldPrefill}
      />

      {dldSummary && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Loaded from DLD permit <span className="font-semibold">{dldSummary.permitNumber}</span>
          {dldSummary.locationName ? ` · ${dldSummary.locationName}` : ""}
          {dldSummary.listingType ? ` · ${dldSummary.listingType}` : ""}
          {dldSummary.saleType ? ` · ${dldSummary.saleType}` : ""}
          {dldSummary.sizeSqm ? ` · ${dldSummary.sizeSqm} sqm (${Math.round(dldSummary.sizeSqm * 10.76391041671)} sqft)` : ""}
          {dldSummary.expiresAt ? ` · expires ${dldSummary.expiresAt.slice(0, 10)}` : ""}.
          Do not change price, type, or location unless the permit is updated with DLD first.
        </div>
      )}
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

        <Field
          label="Reference"
          error={errors.reference?.message}
          hint="Leave blank to auto-generate, like PF Expert. Or enter your own internal code — not the RERA permit."
        >
          <Input {...register("reference")} placeholder="Optional — auto-generated if empty" invalid={!!errors.reference} />
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
            {typeOptions.map((t) => (
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

        <Field
          label="Location"
          required
          error={errors.locationId?.message}
          hint="Search Property Finder locations. Do not type a raw ID."
          className="md:col-span-2"
        >
          <LocationPicker
            control={control}
            suggested={locationMatches}
            locationNameHint={dldSummary?.locationName}
          />
        </Field>
      </FormSection>

      {/* ── Property Details ──────────────────────────────────────── */}
      <FormSection title="Property Details">
        <Field
          label="Size (sqft)"
          required
          error={errors.size?.message}
          hint={dldSummary?.sizeSqm ? `Converted from DLD ${dldSummary.sizeSqm} sqm` : undefined}
        >
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
        <ImageUploadField control={control} error={errors.images?.message as string | undefined} />

        <Field label="Video URL" error={errors.videoUrl?.message}>
          <Input {...register("videoUrl")} placeholder="https://..." />
        </Field>

        <Field label="360 Tour URL" error={errors.virtualTourUrl?.message}>
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
          <Field label="RERA / ADREC Permit Number" required error={errors.complianceListingAdvertisementNumber?.message} hint="From the permit card (Dubai RERA numbers often look like 7116777484), not your internal reference">
            <Input {...register("complianceListingAdvertisementNumber")} placeholder="e.g. 7116777484" invalid={!!errors.complianceListingAdvertisementNumber} />
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

function DldLookupCard({
  uaeEmirate,
  onEmirateChange,
  onLoaded,
}: {
  uaeEmirate?: string;
  onEmirateChange: (value: "dubai" | "abu_dhabi" | "northern_emirates") => void;
  onLoaded: (lookup: DldPermitLookup) => void;
}) {
  const { lookupPermit } = usePropertySubmissionMutations();
  const [permitNumber, setPermitNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");

  const permitType: "rera" | "adrec" = uaeEmirate === "abu_dhabi" ? "adrec" : "rera";
  const isNorthern = uaeEmirate === "northern_emirates";

  async function handleLookup() {
    if (!permitNumber.trim() || !licenseNumber.trim()) {
      toast.error("Enter the permit number and company license number.");
      return;
    }
    try {
      const result = await lookupPermit.mutateAsync({
        permitNumber: permitNumber.trim(),
        licenseNumber: licenseNumber.trim(),
        permitType,
      });
      onLoaded(result);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-2xs">
      <h3 className="mb-1 text-sm font-semibold text-neutral-900">
        {permitType === "adrec" ? "ADREC permit lookup" : "RERA permit lookup (DLD)"}
      </h3>
      <p className="mb-4 text-xs text-neutral-500">
        Enter the permit number and brokerage license. We fetch official details from
        {permitType === "adrec" ? " ADREC " : " Dubai Land Department "}
        via Property Finder and fill the listing.
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Emirate" required>
          <Select
            value={uaeEmirate ?? "dubai"}
            onChange={(e) =>
              onEmirateChange(e.target.value as "dubai" | "abu_dhabi" | "northern_emirates")
            }
          >
            <option value="dubai">Dubai</option>
            <option value="abu_dhabi">Abu Dhabi</option>
            <option value="northern_emirates">Northern Emirates</option>
          </Select>
        </Field>
        {isNorthern ? (
          <p className="self-end text-xs text-neutral-500 md:col-span-1">
            DLD / ADREC lookup is not required for Northern Emirates. Fill the listing below.
          </p>
        ) : (
          <>
            <span className="hidden md:block" />
            <Field
              label={permitType === "adrec" ? "ADREC Permit Number" : "RERA Permit Number"}
              required
            >
              <Input
                value={permitNumber}
                onChange={(e) => setPermitNumber(e.target.value)}
                placeholder="Permit / listing advertisement number"
              />
            </Field>
            <Field label="Company License Number" required hint="Real estate brokerage license">
              <Input
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="Issuing client license number"
              />
            </Field>
          </>
        )}
      </div>
      {!isNorthern && (
        <div className="mt-4">
          <Button type="button" onClick={handleLookup} loading={lookupPermit.isPending}>
            <Search className="h-3.5 w-3.5" />
            Fetch from {permitType === "adrec" ? "ADREC" : "DLD"}
          </Button>
        </div>
      )}
    </div>
  );
}

function LocationPicker({
  control,
  suggested,
  locationNameHint,
}: {
  control: Control<PropertySubmissionFormValues>;
  suggested: PfLocationMatch[];
  locationNameHint?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PfLocationMatch[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const rows = await propertySubmissionsService.searchLocations(term);
        if (!cancelled) setResults(rows);
      } catch (err) {
        if (!cancelled) {
          setResults([]);
          toast.error(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <Controller
      control={control}
      name="locationId"
      render={({ field }) => {
        const selectedId = Number(field.value);
        const selected =
          (Number.isInteger(selectedId) && selectedId > 0
            ? [...suggested, ...results].find((loc) => loc.id === selectedId)
            : undefined) ??
          (Number.isInteger(selectedId) && selectedId > 0
            ? { id: selectedId, name: locationNameHint || `Location ${selectedId}` }
            : undefined);

        const options = [
          ...suggested,
          ...results.filter((loc) => !suggested.some((match) => match.id === loc.id)),
        ];

        return (
          <div className="space-y-2">
            {selected && (
              <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm">
                <span>
                  <span className="font-medium text-neutral-900">{selected.name}</span>
                  <span className="ml-2 text-xs text-neutral-500">ID {selected.id}</span>
                </span>
                <button
                  type="button"
                  className="text-xs font-medium text-neutral-600 hover:text-neutral-900"
                  onClick={() => field.onChange(undefined)}
                >
                  Change
                </button>
              </div>
            )}
            {!selected && (
              <>
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={locationNameHint ? `Search “${locationNameHint}”` : "Search community, tower, or area"}
                />
                {searching && <p className="text-xs text-neutral-500">Searching Property Finder…</p>}
                {locationNameHint && suggested.length !== 1 && (
                  <p className="text-xs text-neutral-500">
                    DLD location: {locationNameHint}. Pick the matching Property Finder location.
                  </p>
                )}
                {options.length > 0 && (
                  <ul className="max-h-56 overflow-auto rounded-lg border border-neutral-200 bg-white">
                    {options.map((loc) => (
                      <li key={loc.id}>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-neutral-50"
                          onClick={() => {
                            field.onChange(loc.id);
                            setQuery("");
                            setResults([]);
                          }}
                        >
                          <span className="text-neutral-900">{loc.name}</span>
                          {loc.type && (
                            <span className="text-xs uppercase tracking-wide text-neutral-400">{loc.type}</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {query.trim().length >= 2 && !searching && results.length === 0 && (
                  <p className="text-xs text-neutral-500">No Property Finder locations matched that search.</p>
                )}
              </>
            )}
          </div>
        );
      }}
    />
  );
}

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

function ImageUploadField({
  control,
  error,
}: {
  control: any;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropOver, setDropOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  type FormImage = { id: string; file: File; preview: string };

  return (
    <Controller
      control={control}
      name="images"
      render={({ field }: { field: any }) => {
        const images: FormImage[] = field.value ?? [];

        function addFiles(fileList: FileList | File[]) {
          const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
          const files = Array.from(fileList).filter((f) => allowed.includes(f.type) || f.type.startsWith("image/"));
          if (files.length === 0) {
            toast.error("Please choose JPEG, PNG, or WebP images.");
            return;
          }
          const invalid = files.find((f) => !allowed.includes(f.type));
          if (invalid) {
            toast.error("Only JPEG, PNG, or WebP images are accepted.");
            return;
          }
          const tooLarge = files.find((f) => f.size > 15 * 1024 * 1024);
          if (tooLarge) {
            toast.error("Each image must be 15 MB or smaller.");
            return;
          }
          const tooSmall = files.find((f) => f.size < 5 * 1024);
          if (tooSmall) {
            toast.error("Each image must be at least 5 KB.");
            return;
          }

          field.onChange([
            ...images,
            ...files.map((file) => ({
              id: crypto.randomUUID(),
              file,
              preview: URL.createObjectURL(file),
            })),
          ]);
          if (inputRef.current) inputRef.current.value = "";
        }

        function removeAt(idx: number) {
          const next = [...images];
          const [removed] = next.splice(idx, 1);
          if (removed?.preview) URL.revokeObjectURL(removed.preview);
          field.onChange(next);
        }

        function move(from: number, to: number) {
          if (to < 0 || to >= images.length || from === to) return;
          const next = [...images];
          const [item] = next.splice(from, 1);
          next.splice(to, 0, item);
          field.onChange(next);
        }

        return (
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
              Images <span className="ml-1 text-red-500">*</span>
            </label>
            <p className="mb-2 text-xs text-neutral-500">
              JPEG, PNG, or WebP. Landscape recommended. Max 15 MB each. Drag to reorder — the first image is the cover photo.
            </p>

            {images.length > 0 && (
              <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    draggable
                    onDragStart={() => setDragIndex(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragIndex != null) move(dragIndex, idx);
                      setDragIndex(null);
                    }}
                    onDragEnd={() => setDragIndex(null)}
                    className={`group relative aspect-[4/3] cursor-grab overflow-hidden rounded-lg border bg-neutral-50 active:cursor-grabbing ${
                      dragIndex === idx ? "border-black opacity-70" : "border-neutral-200"
                    }`}
                  >
                    <img src={img.preview} alt="" className="pointer-events-none h-full w-full object-cover" />
                    <span className="absolute top-1.5 left-1.5 rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-semibold text-white">
                      {idx === 0 ? "Cover" : idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAt(idx)}
                      className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Remove image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/50 to-transparent px-1 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => move(idx, idx - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-white disabled:opacity-30"
                        aria-label="Move earlier"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === images.length - 1}
                        onClick={() => move(idx, idx + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-white disabled:opacity-30"
                        aria-label="Move later"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDropOver(true);
              }}
              onDragLeave={() => setDropOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDropOver(false);
                if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
              }}
              className={`flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-sm transition-colors ${
                dropOver
                  ? "border-black bg-neutral-50"
                  : "border-neutral-200 bg-neutral-50/60 hover:border-neutral-400 hover:bg-neutral-50"
              }`}
            >
              <Upload className="h-6 w-6 text-neutral-400" />
              <span className="font-medium text-neutral-700">Drop images here or click to upload</span>
              {images.length === 0 && (
                <span className="flex items-center gap-1 text-xs text-neutral-400">
                  <ImageIcon className="h-3.5 w-3.5" /> At least one image is required
                </span>
              )}
            </button>

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) addFiles(e.target.files);
              }}
            />
            {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
          </div>
        );
      }}
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
