"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, RotateCcw, CheckCircle2, XCircle } from "lucide-react";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserValues,
} from "@/schemas/user.schema";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { ConfirmModal } from "@/components/ui/Modal";
import { ROLE_LABELS } from "@/constants";
import { PermissionMatrixInput } from "@/components/permissions/PermissionMatrixInput";
import { permissionsService } from "@/services/permissions/permissions.service";
import { useUsers } from "@/hooks/useUsers";
import { useAuth } from "@/hooks/useAuth";
import type { User, GrantEntry, RolePresets, UserRole } from "@/types";

export type UserFormValues = CreateUserValues & {
  confirmPassword?: string;
};

export type UserFormSubmitValues = UserFormValues & {
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
  const { role } = useAuth();
  const canChangeCredentials = role === "master" || role === "hr_manager";
  const { data: usersData } = useUsers();
  const [grants, setGrants] = useState<GrantEntry[]>([]);
  const [rolePresets, setRolePresets] = useState<RolePresets | null>(null);
  const [presetGrants, setPresetGrants] = useState<GrantEntry[] | null>(null);
  const [showRoleChangeModal, setShowRoleChangeModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const pendingRoleRef = useRef<UserRole | null>(null);
  const previousRoleRef = useRef<UserRole>((initial?.role ?? "sales_executive") as UserRole);
  const presetAppliedOnLoadRef = useRef(false);

  const handleGrantsChange = useCallback((newGrants: GrantEntry[]) => {
    setGrants(newGrants);
  }, []);

  // Fetch role presets on mount
  useEffect(() => {
    let cancelled = false;
    permissionsService.getRolePresets().then((presets) => {
      if (cancelled) return;
      setRolePresets(presets);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Convert RolePresetGrant[] to GrantEntry[] (all granted: true)
  function presetToGrants(role: Exclude<UserRole, "master">): GrantEntry[] {
    if (!rolePresets) return [];
    return rolePresets[role].map((g) => ({
      moduleKey: g.moduleKey,
      pageKey: g.pageKey,
      actionKey: g.actionKey,
      granted: true,
    }));
  }

  // Create mode: auto-apply default role preset once presets are loaded
  useEffect(() => {
    if (isEdit || !rolePresets || presetAppliedOnLoadRef.current) return;
    presetAppliedOnLoadRef.current = true;
    const defaultGrants = presetToGrants("sales_executive");
    setPresetGrants(defaultGrants);
  }, [isEdit, rolePresets]);

  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(
      isEdit ? updateUserSchema : createUserSchema,
    ) as unknown as Resolver<UserFormValues>,
    defaultValues: {
      fullName: initial?.fullName ?? "",
      email: initial?.email ?? "",
      password: "",
      confirmPassword: "",
      phone: initial?.phone ?? "",
      role: initial?.role ?? "sales_executive",
      managerId: initial?.managerId ?? "",
    },
  });

  // Re-sync form values when the user record changes (handles React Query
  // returning cached data first and fresh data later).
  useEffect(() => {
    if (!initial) return;
    reset({
      fullName: initial.fullName ?? "",
      email: initial.email ?? "",
      password: "",
      confirmPassword: "",
      phone: initial.phone ?? "",
      role: initial.role ?? "sales_executive",
      managerId: initial.managerId ?? "",
    });
  }, [initial?.id, reset]);

  const selectedRole = watch("role");
  const passwordValue = watch("password") ?? "";
  const confirmPasswordValue = watch("confirmPassword") ?? "";
  const passwordsMismatch =
    confirmPasswordValue.length > 0 && passwordValue !== confirmPasswordValue;
  const passwordsMatch =
    passwordValue.length > 0 &&
    confirmPasswordValue.length > 0 &&
    passwordValue === confirmPasswordValue;
  const managers =
    usersData?.users.filter((u) => u.role === "sales_manager" && u.isActive) ?? [];

  function handleRoleChange(newRole: UserRole) {
    if (newRole === "master" || newRole === previousRoleRef.current) {
      previousRoleRef.current = newRole;
      return;
    }
    if (isEdit) {
      pendingRoleRef.current = newRole;
      setShowRoleChangeModal(true);
    } else {
      previousRoleRef.current = newRole;
      const grants = presetToGrants(newRole as Exclude<UserRole, "master">);
      setPresetGrants(grants);
    }
  }

  function confirmRoleChange() {
    const newRole = pendingRoleRef.current;
    if (!newRole) return;
    previousRoleRef.current = newRole;
    const grants = presetToGrants(newRole as Exclude<UserRole, "master">);
    setPresetGrants(grants);
    setShowRoleChangeModal(false);
    pendingRoleRef.current = null;
  }

  function cancelRoleChange() {
    setShowRoleChangeModal(false);
    pendingRoleRef.current = null;
    // Revert role select to previous value
    reset({ ...watch(), role: previousRoleRef.current } as UserFormValues);
  }

  function handleResetToDefaults() {
    setShowResetModal(true);
  }

  function confirmResetToDefaults() {
    const currentRole = selectedRole as Exclude<UserRole, "master">;
    const grants = presetToGrants(currentRole);
    setPresetGrants(grants);
    setShowResetModal(false);
  }

  function handleFormSubmit(values: UserFormValues) {
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
            autoComplete="email"
            disabled={isEdit && !canChangeCredentials}
            invalid={!!errors.email}
            {...register("email")}
          />
        </Field>
        {!isEdit && (
          <Field label="Password" required error={errors.password?.message}>
            <Input
              type="password"
              autoComplete="new-password"
              invalid={!!errors.password}
              {...register("password")}
            />
          </Field>
        )}
        {isEdit && canChangeCredentials && (
          <>
            <Field
              label="New Password"
              error={errors.password?.message}
              hint="Leave blank to keep the current password. The current password is never shown."
            >
              <Input
                type="password"
                autoComplete="new-password"
                placeholder="Leave blank to keep current password"
                invalid={!!errors.password}
                {...register("password")}
              />
            </Field>
            <Field
              label="Confirm New Password"
              error={
                passwordsMismatch
                  ? "Passwords do not match"
                  : errors.confirmPassword?.message
              }
              success={passwordsMatch ? "Passwords match" : undefined}
            >
              <div className="relative">
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Re-enter new password"
                  className="pr-9"
                  invalid={passwordsMismatch || !!errors.confirmPassword}
                  valid={passwordsMatch}
                  {...register("confirmPassword")}
                />
                {passwordsMatch && (
                  <CheckCircle2
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500"
                    aria-hidden
                  />
                )}
                {passwordsMismatch && (
                  <XCircle
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-500"
                    aria-hidden
                  />
                )}
              </div>
            </Field>
          </>
        )}
        <Field label="Phone" error={errors.phone?.message}>
          <Input {...register("phone")} />
        </Field>
        <Field label="Role" required error={errors.role?.message}>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onChange={(e) => {
                  field.onChange(e.target.value);
                  handleRoleChange(e.target.value as UserRole);
                }}
                onBlur={field.onBlur}
                name={field.name}
              >
                {Object.entries(ROLE_LABELS).map(([v, label]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </Select>
            )}
          />
        </Field>
        {selectedRole === "sales_executive" && (
          <Field label="Manager" error={errors.managerId?.message}>
            <Controller
              name="managerId"
              control={control}
              render={({ field }) => (
                <Select
                  key={`manager-select-${managers.length}`}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || undefined)}
                  onBlur={field.onBlur}
                  name={field.name}
                  placeholder="Select manager…"
                >
                  <option value="">No Manager (Unassigned)</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>{manager.fullName}</option>
                  ))}
                </Select>
              )}
            />
          </Field>
        )}
      </div>

      {/* ── Permission Section ───────────────────────────────────────────── */}
      <div className="space-y-3 rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-800">Permissions</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            Grant specific module, page, and action access. Zero access by default.
          </p>
        </div>

        {selectedRole === "master" ? (
          <div className="flex items-center gap-3 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3">
            <ShieldCheck className="h-4 w-4 text-purple-600 shrink-0" />
            <span className="text-xs font-semibold text-purple-800">
              Master — Full Access (permissions not required)
            </span>
          </div>
        ) : (
          <>
            {isEdit && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetToDefaults}
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  Reset to Role Defaults
                </Button>
              </div>
            )}
            <PermissionMatrixInput
              userId={initial?.id}
              onChange={handleGrantsChange}
              presetGrants={presetGrants}
            />
          </>
        )}
      </div>

      {/* ── Role Change Confirm Dialog (Edit Mode) ──────────────────────────── */}
      <ConfirmModal
        open={showRoleChangeModal}
        onClose={cancelRoleChange}
        onConfirm={confirmRoleChange}
        title="Change role?"
        message="Changing role will replace current permission selections with the new role's defaults. Continue?"
        confirmLabel="Apply New Role"
        danger={false}
      />

      {/* ── Reset to Defaults Confirm Dialog ────────────────────────────────── */}
      <ConfirmModal
        open={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={confirmResetToDefaults}
        title="Reset to role defaults?"
        message="This will replace all current permission selections with the defaults for this user's role. Continue?"
        confirmLabel="Reset to Defaults"
        danger={false}
      />

      <div className="flex items-center justify-end gap-2.5 border-t border-neutral-100 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={submitting} disabled={passwordsMismatch}>
          {isEdit ? "Save Changes" : "Create User"}
        </Button>
      </div>
    </form>
  );
}
