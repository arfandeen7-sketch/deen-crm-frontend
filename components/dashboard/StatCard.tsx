"use client";

import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/States";
import { CountUp } from "@/components/dashboard/PaperBand";

export function StatCard({
  label,
  value,
  icon: Icon,
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
  const inner = (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[13px] text-ink-2">{label}</p>
        {loading ? (
          <Skeleton className="mt-3 h-9 w-20" />
        ) : (
          <p className="display-num mt-3 text-ink">
            <CountUp value={value ?? 0} />
          </p>
        )}
      </div>
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-fill-soft text-ink">
        {href ? (
          <ArrowRight className="arrow h-5 w-5 shrink-0" strokeWidth={1.5} />
        ) : (
          <Icon className="h-5 w-5 shrink-0" strokeWidth={1.5} />
        )}
      </span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="arrow-link lift block rounded-xl border border-line bg-white p-6">
        {inner}
      </Link>
    );
  }

  return <div className="rounded-xl border border-line bg-white p-6">{inner}</div>;
}
