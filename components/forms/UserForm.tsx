"use client";

import { useState, useCallback } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserValues,
} from "@/schemas/user.schema";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { ROLE_LABELS } from "@/constants";
import { PermissionMatrixInput } from "@/components/permissions/PermissionMatrixInput";
import { useUsers } from "@/hooks/useUsers";
import type { User, GrantEntry } from "@/types";

export type UserFormSubmitValues = CreateUserValues & {
  grants: GrantEntry[];
};

export function UserForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial?: User;
  submitting?: boolean;
  onSubmit: (values: UserFormSubmitValues) => void;
  onCancel?: () => void;
}) {
  const isEdit = !!initial;
  const { data: usersData } = useUsers();
  const [grants, setGrants] = useState<GrantEntry[]>([]);

  const handleGrantsChange = useCallback((newGrants: GrantEntry[]) => {
    setGrants(newGrants);
  }, []);

  const {
    register,
    handleSubmit,
    watch,
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
      managerId: initial?.managerId ?? "",
    },
  });

  const selectedRole = watch("role");
  const managers =
    usersData?.users.filter((u) => u.role === "sales_manager" && u.isActive) ?? [];

  function handleFormSubmit(values: CreateUserValues) {
    onSubmit({ ...values, grants });
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full Name" required error={errors.fullName?.message}>
          <Input invalid={!!errors.fullName} {...register("fullName")} />
        </Field>
        <Field label="Email" required error={errors.email?.message}>
          <Input
            type="email"
            disabled={isEdit}
            invalid={!!errors.email}
            {...register("email")}
          />
        </Field>
        {!isEdit && (
          <Field label="Password" required error={errors.password?.message}>
            <Input
              type="password"
              invalid={!!errors.password}
              {...register("password")}
            />
          </Field>
        )}
        <Field label="Phone" error={errors.phone?.message}>
          <Input {...register("phone")} />
        </Field>
        <Field label="Role" required error={errors.role?.message}>
          <Select {...register("role")}>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        {selectedRole === "sales_executive" && (
          <Field label="Manager" error={errors.managerId?.message}>
            <Select {...register("managerId")}>
              <option value="">No Manager (Unassigned)</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.fullName}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>

      {/* ── Permission Section ───────────────────────────────────────────── */}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <div>
          <p className="text-sm font-semibold text-slate-800">Permissions</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Grant specific module, page, and action access. Zero access by default.
          </p>
        </div>

        {selectedRole === "master" ? (
          <div className="flex items-center gap-3 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3">
            <ShieldCheck className="h-4 w-4 text-violet-500" />
            <span className="text-sm font-medium text-violet-700">
              Master — Full Access (permissions not required)
            </span>
          </div>
        ) : (
          <PermissionMatrixInput
            userId={initial?.id}
            onChange={handleGrantsChange}
          />
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
