"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserValues,
} from "@/schemas/user.schema";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { ROLE_LABELS } from "@/constants";
import type { User } from "@/types";

export function UserForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial?: User;
  submitting?: boolean;
  onSubmit: (values: CreateUserValues) => void;
  onCancel?: () => void;
}) {
  const isEdit = !!initial;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserValues>({
    // Edit mode validates a subset (no email/password); cast to the unified form type.
    resolver: zodResolver(
      isEdit ? updateUserSchema : createUserSchema,
    ) as unknown as Resolver<CreateUserValues>,
    defaultValues: {
      fullName: initial?.fullName ?? "",
      email: initial?.email ?? "",
      password: "",
      phone: initial?.phone ?? "",
      role: initial?.role ?? "sales_executive",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full Name" required error={errors.fullName?.message}>
          <Input invalid={!!errors.fullName} {...register("fullName")} />
        </Field>
        <Field label="Email" required error={errors.email?.message}>
          <Input type="email" disabled={isEdit} invalid={!!errors.email} {...register("email")} />
        </Field>
        {!isEdit && (
          <Field label="Password" required error={errors.password?.message}>
            <Input type="password" invalid={!!errors.password} {...register("password")} />
          </Field>
        )}
        <Field label="Phone" error={errors.phone?.message}>
          <Input {...register("phone")} />
        </Field>
        <Field label="Role" required error={errors.role?.message}>
          <Select {...register("role")}>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={submitting}>
          {isEdit ? "Save Changes" : "Create User"}
        </Button>
      </div>
    </form>
  );
}
