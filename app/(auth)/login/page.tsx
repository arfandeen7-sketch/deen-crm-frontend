"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Eye, EyeOff, Calendar, Clock,
  Activity, Database, Users, TrendingUp, Lock, Mail, ChevronRight
} from "lucide-react";
import { loginSchema, type LoginValues } from "@/schemas/auth.schema";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/services/api/client";
import { Button } from "@/components/ui/Button";
import { APP_NAME } from "@/constants";
import { DEMO_AUTH_ENABLED, DEMO_CREDENTIALS } from "@/services/auth/demo";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, hydrated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [dateString, setDateString] = useState("-- --, ----");
  const [timeString, setTimeString] = useState("--:--:--");

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

  useEffect(() => {
    function updateDateTime() {
      const locale = typeof navigator !== "undefined" ? navigator.language : undefined;
      const now = new Date();
      const formattedDate = new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
        .format(now)
        .toUpperCase();
      const formattedTime = new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(now);

      setDateString(formattedDate);
      setTimeString(formattedTime);
    }

    updateDateTime();
    const intervalId = setInterval(updateDateTime, 1000);
    return () => clearInterval(intervalId);
  }, []);

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
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      {/* Paper panel */}
      <div className="hidden w-7/12 flex-col justify-between bg-paper p-12 lg:flex">
        <Image
          src="/logo.png"
          alt="DEEN Properties"
          width={139}
          height={47}
          className="enter h-12 w-auto brightness-0"
        />

        <div className="enter max-w-xl" style={{ "--i": 1 } as React.CSSProperties}>
          <p className="text-[13px] text-ink-2">Real estate management platform</p>
          <h1 className="mt-4 text-[44px] font-normal leading-[1.1] tracking-tight text-ink">
            Manage properties.
            <br />
            Track leads.
            <br />
            Close deals.
          </h1>
          <p className="mt-6 max-w-md text-[14px] leading-relaxed text-ink-2">
            A unified place for property management, CRM operations and lead tracking, built for
            contemporary real estate teams.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            {[
              { icon: Database, label: "Property management" },
              { icon: Users, label: "CRM tracking" },
              { icon: TrendingUp, label: "Lead monitoring" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex h-9 items-center gap-2 rounded-lg border border-ink/15 px-3.5 text-[13px] text-ink"
              >
                <Icon className="h-4 w-4 text-ink-2" strokeWidth={1.5} />
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="enter" style={{ "--i": 2 } as React.CSSProperties}>
          <p className="max-w-lg text-[18px] leading-snug text-ink">
            &ldquo;The best investment we make is in the people and relationships that build DEEN.&rdquo;
          </p>
          <p className="mt-4 text-[12.5px] text-ink-2">Deen Properties · Internal use only</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex w-full flex-col justify-between p-8 lg:w-5/12 lg:p-12">
        <div className="flex items-center justify-between text-[12.5px] text-ink-3">
          <Image
            src="/logo.png"
            alt="DEEN Properties"
            width={139}
            height={47}
            className="h-8 w-auto brightness-0 lg:invisible"
          />
          <div className="flex items-center gap-5 tabular-nums">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" strokeWidth={1.5} />
              {dateString}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" strokeWidth={1.5} />
              {timeString}
            </span>
          </div>
        </div>

        <div className="enter mx-auto my-12 w-full max-w-[420px]" style={{ "--i": 1 } as React.CSSProperties}>
          <h2 className="text-[28px] font-normal tracking-tight text-ink">Welcome back</h2>
          <p className="mt-1.5 text-[13px] text-ink-3">Sign in to continue to your workspace</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] text-ink-2">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" strokeWidth={1.5} />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="name@deen.ae"
                  aria-invalid={errors.email ? true : undefined}
                  className={`block h-12 w-full rounded-xl border bg-white pl-10 pr-3 text-sm text-ink placeholder:text-ink-3 transition-[border-color] duration-[220ms] focus:border-ink focus:outline-none ${errors.email ? "shake border-red-400" : "border-line"}`}
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] text-ink-2">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" strokeWidth={1.5} />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={errors.password ? true : undefined}
                  className={`block h-12 w-full rounded-xl border bg-white pl-10 pr-10 text-sm text-ink placeholder:text-ink-3 transition-[border-color] duration-[220ms] focus:border-ink focus:outline-none ${errors.password ? "shake border-red-400" : "border-line"}`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3.5 text-ink-3 transition-colors hover:text-ink"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={1.5} /> : <Eye className="h-4 w-4" strokeWidth={1.5} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <Button type="submit" loading={isSubmitting} size="lg" className="mt-2 w-full">
              Log in
            </Button>
          </form>

          {DEMO_AUTH_ENABLED && (
            <div className="mt-8 border-t border-line pt-6">
              <p className="mb-3 flex items-center gap-2 text-[12.5px] text-ink-3">
                <Activity className="h-3.5 w-3.5" strokeWidth={1.5} />
                Demo credentials
              </p>
              <div className="flex items-center justify-between rounded-lg bg-fill-soft px-4 py-3 text-[12px] text-ink-2">
                <span>{DEMO_CREDENTIALS.email}</span>
                <span className="text-ink-3">{DEMO_CREDENTIALS.password}</span>
              </div>
              <button
                type="button"
                onClick={fillDemo}
                className="arrow-link mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-line py-3 text-[13px] text-ink transition-[background-color,transform] hover:bg-fill-soft active:scale-[0.985]"
              >
                Fill demo credentials <ChevronRight className="arrow h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </div>
          )}
        </div>

        <div />
      </div>
    </div>
  );
}
