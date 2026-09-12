"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ROLE_QUICK_ACTIONS } from "@/constants/dashboard";
import { PanelHeading } from "./DashboardShell";
import type { UserRole } from "@/types";

/**
 * Shared quick-action tiles. Previously duplicated inline in all four role
 * dashboards; the markup now lives here and each dashboard just passes its role.
 */
export function QuickActionsPanel({
  role,
  title = "Quick Actions",
  subtitle = "Frequent tools",
  /** "column" fits a sidebar slot; "row" spans a full-width section. */
  layout = "column",
  className,
}: {
  role: UserRole;
  title?: string;
  subtitle?: string;
  layout?: "column" | "row";
  className?: string;
}) {
  const actions = ROLE_QUICK_ACTIONS[role] ?? [];

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <PanelHeading title={title} subtitle={subtitle} />

      <div
        className={cn(
          "mt-4 flex-1 gap-2.5",
          layout === "row"
            ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
            : "flex flex-col justify-center",
        )}
      >
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex items-center gap-3.5 rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50/50"
          >
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
                action.accent,
              )}
            >
              <action.icon className="h-5 w-5" />
            </span>
            <span className="font-secondary text-sm font-bold text-zinc-700 transition-colors group-hover:text-zinc-900">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
