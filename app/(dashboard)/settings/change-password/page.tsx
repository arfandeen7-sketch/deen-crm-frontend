"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { changePasswordSchema, type ChangePasswordValues } from "@/schemas/auth.schema";
import { authService } from "@/services/auth/auth.service";
import { getErrorMessage } from "@/services/api/client";

export default function ChangePasswordPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({ resolver: zodResolver(changePasswordSchema) });

  async function onSubmit(values: ChangePasswordValues) {
    try {
      await authService.changePassword(values.currentPassword, values.newPassword);
      toast.success("Password changed successfully");
      reset();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Change Password" subtitle="Update your account password" />

      <Card className="max-w-xl">
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Field label="Current Password" required error={errors.currentPassword?.message}>
              <Input type="password" autoComplete="current-password" invalid={!!errors.currentPassword} {...register("currentPassword")} />
            </Field>
            <Field label="New Password" required error={errors.newPassword?.message} hint="At least 8 characters">
              <Input type="password" autoComplete="new-password" invalid={!!errors.newPassword} {...register("newPassword")} />
            </Field>
            <Field label="Confirm New Password" required error={errors.confirmPassword?.message}>
              <Input type="password" autoComplete="new-password" invalid={!!errors.confirmPassword} {...register("confirmPassword")} />
            </Field>
            <div className="flex justify-end border-t border-slate-100 pt-4">
              <Button type="submit" loading={isSubmitting}>
                Update Password
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
