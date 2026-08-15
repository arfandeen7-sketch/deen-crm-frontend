"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { ownerSchema, type OwnerFormValues } from "@/schemas/owner.schema";
import type { Owner } from "@/types";

export function OwnerForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial?: Owner;
  submitting?: boolean;
  onSubmit: (values: OwnerFormValues) => void;
  onCancel?: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OwnerFormValues>({
    resolver: zodResolver(ownerSchema),
    defaultValues: {
      fullName: initial?.fullName ?? "",
      mobileNumber: initial?.mobileNumber ?? "",
      alternateMobile: initial?.alternateMobile ?? "",
      email: initial?.email ?? "",
      whatsapp: initial?.whatsapp ?? "",
      emirate: initial?.emirate ?? "",
      city: initial?.city ?? "",
      locality: initial?.locality ?? "",
      notes: initial?.notes ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* ── Personal Information ───────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Full Name" required error={errors.fullName?.message}>
          <Input
            placeholder="e.g. Mohammed Al Rashid"
            invalid={!!errors.fullName}
            {...register("fullName")}
          />
        </Field>

        <Field
          label="Mobile Number"
          required
          error={errors.mobileNumber?.message}
          hint="Used as the unique key — no duplicate owners"
        >
          <Input
            placeholder="+971 50 123 4567"
            invalid={!!errors.mobileNumber}
            {...register("mobileNumber")}
          />
        </Field>

        <Field label="Alternate Mobile" error={errors.alternateMobile?.message}>
          <Input placeholder="Optional" {...register("alternateMobile")} />
        </Field>

        <Field label="Email" error={errors.email?.message}>
          <Input
            type="email"
            placeholder="owner@example.com"
            invalid={!!errors.email}
            {...register("email")}
          />
        </Field>

        <Field label="WhatsApp" error={errors.whatsapp?.message}>
          <Input placeholder="Optional" {...register("whatsapp")} />
        </Field>

        <Field label="Emirate" error={errors.emirate?.message}>
          <Input placeholder="e.g. Dubai" {...register("emirate")} />
        </Field>

        <Field label="City" error={errors.city?.message}>
          <Input placeholder="e.g. Dubai" {...register("city")} />
        </Field>

        <Field label="Locality" error={errors.locality?.message}>
          <Input placeholder="e.g. Marina" {...register("locality")} />
        </Field>
      </div>

      <Field label="Notes" error={errors.notes?.message}>
        <Textarea
          placeholder="Any notes about this owner…"
          rows={3}
          {...register("notes")}
        />
      </Field>

      {!initial && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-xs text-amber-800">
            If an owner with the same mobile number already exists, the system
            will link to the existing owner instead of creating a duplicate.
          </p>
        </div>
      )}

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={submitting}>
          {initial ? "Update Owner" : "Create Owner"}
        </Button>
      </div>
    </form>
  );
}
