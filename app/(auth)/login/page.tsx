"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Building2, Eye, EyeOff } from "lucide-react";
import { loginSchema, type LoginValues } from "@/schemas/auth.schema";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/services/api/client";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { APP_NAME } from "@/constants";
import { DEMO_AUTH_ENABLED, DEMO_CREDENTIALS } from "@/services/auth/demo";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, hydrated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  function fillDemo() {
    setValue("email", DEMO_CREDENTIALS.email);
    setValue("password", DEMO_CREDENTIALS.password);
  }

  useEffect(() => {
    if (hydrated && isAuthenticated) router.replace("/dashboard/overview");
  }, [hydrated, isAuthenticated, router]);

  async function onSubmit(values: LoginValues) {
    try {
      await login(values.email, values.password);
      toast.success("Welcome back!");
      router.replace("/dashboard/overview");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
          <Building2 className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-semibold text-white">{APP_NAME}</h1>
        <p className="mt-1 text-sm text-slate-400">
          Sign in to your account to continue
        </p>
      </div>

      <div className="rounded-2xl bg-white p-8 shadow-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <Field label="Email" required error={errors.email?.message}>
            <Input
              type="email"
              autoComplete="email"
              placeholder="you@deen.ae"
              invalid={!!errors.email}
              {...register("email")}
            />
          </Field>

          <Field label="Password" required error={errors.password?.message}>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                invalid={!!errors.password}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <Button type="submit" size="lg" loading={isSubmitting} className="mt-2 w-full">
            Sign in
          </Button>
        </form>

        {DEMO_AUTH_ENABLED && (
          <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm">
            <p className="font-medium text-indigo-900">Demo login</p>
            <p className="mt-1 text-indigo-700">
              <span className="font-mono">{DEMO_CREDENTIALS.email}</span>
              {" · "}
              <span className="font-mono">{DEMO_CREDENTIALS.password}</span>
            </p>
            <button
              type="button"
              onClick={fillDemo}
              className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Use these credentials
            </button>
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-slate-500">
        DEEN Properties · Internal use only
      </p>
    </div>
  );
}
