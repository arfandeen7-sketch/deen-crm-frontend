"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/States";

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "indigo",
  loading,
  href,
}: {
  label: string;
  value?: number;
  icon: LucideIcon;
  accent?: "indigo" | "emerald" | "amber" | "rose" | "sky" | "violet";
  loading?: boolean;
  href?: string;
}) {
  const accents: Record<string, string> = {
    indigo: "bg-neutral-100 text-neutral-900",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-red-50 text-red-700",
    sky: "bg-sky-50 text-sky-700",
    violet: "bg-purple-50 text-purple-700",
  };

  const inner = (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</p>
        {loading ? (
          <Skeleton className="mt-2 h-7 w-16" />
        ) : (
          <p className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">{value ?? 0}</p>
        )}
      </div>
      <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200/60 shadow-2xs", accents[accent])}>
        <Icon className="h-4.5 w-4.5 shrink-0" />
      </span>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-xl border border-neutral-200/80 bg-white p-5 shadow-2xs transition-all hover:border-neutral-300 hover:shadow-xs"
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-2xs transition-all">
      {inner}
    </div>
  );
}
