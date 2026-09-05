"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input, Field, Select, Textarea } from "@/components/ui/Input";
import {
  manualPropertySchema,
  type ManualPropertyFormValues,
  LISTING_STATUS_LABELS,
} from "@/schemas/owner.schema";
import type { ManualProperty } from "@/types";

interface Props {
  initial?: ManualProperty;
  submitting?: boolean;
  onSubmit: (values: ManualPropertyFormValues) => void | Promise<void>;
  onCancel?: () => void;
}

export function ManualPropertyForm({ initial, submitting, onSubmit, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ManualPropertyFormValues>({
    resolver: zodResolver(manualPropertySchema),
    defaultValues: {
      buildingName: initial?.buildingName ?? "",
      villaName: initial?.villaName ?? "",
      unitNumber: initial?.unitNumber ?? "",
      unitSize: initial?.unitSize ?? "",
      projectName: initial?.projectName ?? "",
      community: initial?.community ?? "",
      emirate: initial?.emirate ?? "",
      city: initial?.city ?? "",
      category: initial?.category ?? "",
      type: initial?.type ?? "",
      configuration: initial?.configuration ?? "",
      bedrooms: initial?.bedrooms ?? "",
      bathrooms: initial?.bathrooms ?? "",
      floorNumber: initial?.floorNumber ?? "",
      parkingSlots: initial?.parkingSlots ?? "",
      price: initial?.price ?? "",
      reference: initial?.reference ?? "",
      listingStatus: initial?.listingStatus ?? "available",
      notes: initial?.notes ?? "",
      remarks: initial?.remarks ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* ── Building / Location ───────────────────────────────────── */}
      <div>
        <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          Building &amp; Location
        </h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Building Name" error={errors.buildingName?.message}>
            <Input placeholder="e.g. Burj Vista Tower 1" {...register("buildingName")} />
          </Field>
          <Field label="Project / Community" error={errors.community?.message}>
            <Input placeholder="e.g. Downtown Dubai" {...register("community")} />
          </Field>
          <Field label="Project Name" error={errors.projectName?.message}>
            <Input placeholder="e.g. Emaar Downtown" {...register("projectName")} />
          </Field>
          <Field label="Emirate" error={errors.emirate?.message}>
            <Input placeholder="e.g. Dubai" {...register("emirate")} />
          </Field>
          <Field label="City" error={errors.city?.message}>
            <Input placeholder="e.g. Dubai" {...register("city")} />
          </Field>
        </div>
      </div>

      {/* ── Unit Details ──────────────────────────────────────────── */}
      <div>
        <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          Unit Details
        </h4>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Unit Number" error={errors.unitNumber?.message}>
            <Input placeholder="e.g. 1204" {...register("unitNumber")} />
          </Field>
          <Field label="Unit Size (sqft)" error={errors.unitSize?.message}>
            <Input placeholder="e.g. 850" {...register("unitSize")} />
          </Field>
          <Field label="Floor Number" error={errors.floorNumber?.message}>
            <Input placeholder="e.g. 12" {...register("floorNumber")} />
          </Field>
          <Field label="Category" error={errors.category?.message}>
            <Select {...register("category")}>
              <option value="">Select category</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
            </Select>
          </Field>
          <Field label="Type" error={errors.type?.message}>
            <Input placeholder="e.g. Apartment, Villa, Office" {...register("type")} />
          </Field>
          <Field label="Villa Name" error={errors.villaName?.message}>
            <Input placeholder="e.g. Villa 42, Palm Villa" {...register("villaName")} />
          </Field>
          <Field label="Configuration" error={errors.configuration?.message}>
            <Input placeholder="e.g. 2BR, Studio" {...register("configuration")} />
          </Field>
          <Field label="Bedrooms" error={errors.bedrooms?.message}>
            <Input placeholder="e.g. 2" {...register("bedrooms")} />
          </Field>
          <Field label="Bathrooms" error={errors.bathrooms?.message}>
            <Input placeholder="e.g. 2" {...register("bathrooms")} />
          </Field>
          <Field label="Parking Slots" error={errors.parkingSlots?.message}>
            <Input placeholder="e.g. 1" {...register("parkingSlots")} />
          </Field>
        </div>
      </div>

      {/* ── Financials & Status ───────────────────────────────────── */}
      <div>
        <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          Financials &amp; Status
        </h4>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Price (AED)" error={errors.price?.message}>
            <Input placeholder="e.g. 1500000" {...register("price")} />
          </Field>
          <Field label="Reference" error={errors.reference?.message}>
            <Input placeholder="e.g. OWN-001" {...register("reference")} />
          </Field>
          <Field label="Listing Status" error={errors.listingStatus?.message}>
            <Select {...register("listingStatus")}>
              {Object.entries(LISTING_STATUS_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      {/* ── Notes ────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Notes" error={errors.notes?.message}>
          <Textarea placeholder="Internal notes about this property…" rows={3} {...register("notes")} />
        </Field>
        <Field label="Remarks" error={errors.remarks?.message}>
          <Textarea placeholder="Additional remarks (e.g. from original source)…" rows={3} {...register("remarks")} />
        </Field>
      </div>

      {/* ── Actions ──────────────────────────────────────────────── */}
      <div className="flex justify-end gap-3 border-t border-neutral-100 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={submitting}>
          {initial ? "Update Property" : "Add Property"}
        </Button>
      </div>
    </form>
  );
}
