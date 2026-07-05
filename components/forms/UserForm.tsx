"use client";

import { useState, useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserValues,
  type UpdateUserValues,
} from "@/schemas/user.schema";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { ROLE_LABELS } from "@/constants";
import { cn } from "@/lib/utils";
import { PermissionMatrixInput } from "@/components/permissions/PermissionMatrixInput";
import { permissionsService } from "@/services/permissions/permissions.service";
import type { User, ModuleName, PermissionAction } from "@/types";

type SubmitValues = CreateUserValues & Pick<UpdateUserValues, "moduleAccess" | "moduleAccessOverridden"> & {
  permissions?: Record<ModuleName, PermissionAction[]>;
};

export function UserForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial?: User;
  submitting?: boolean;
  onSubmit: (values: SubmitValues) => void;
  onCancel?: () => void;
}) {
  const isEdit = !!initial;

  const [overrideEnabled, setOverrideEnabled] = useState<boolean>(
    initial?.moduleAccessOverridden ?? false,
  );
  const [permissions, setPermissions] = useState<Record<ModuleName, PermissionAction[]>>({} as Record<ModuleName, PermissionAction[]>);

  useEffect(() => {
    if (isEdit && initial && overrideEnabled) {
      permissionsService
        .getUserPermissions(initial.id)
        .then((data) => setPermissions(data.permissions))
        .catch(() => {});
    }
  }, [isEdit, initial, overrideEnabled]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserValues>({
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

  function handleFormSubmit(values: CreateUserValues) {
    onSubmit({
      ...values,
      permissions: overrideEnabled ? permissions : undefined,
      moduleAccessOverridden: overrideEnabled || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
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

      <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">Custom Module Access</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Override the role defaults and grant specific module access to this user.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={overrideEnabled}
              onClick={() => setOverrideEnabled((v) => !v)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
                overrideEnabled ? "bg-gray-900" : "bg-slate-200",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none block h-5 w-5 rounded-full bg-white shadow transition-transform",
                  overrideEnabled ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
          </div>

          {overrideEnabled && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Select specific permissions for each module. View permission is automatically granted when any other permission is selected.
              </p>
              <PermissionMatrixInput
                value={permissions}
                onChange={setPermissions}
              />
            </div>
          )}

          {!overrideEnabled && (
            <p className="text-xs text-slate-400">
              Access is currently determined by the user&apos;s role. Enable the toggle above to assign custom modules.
            </p>
          )}
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
