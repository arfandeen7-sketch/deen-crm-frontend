"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "All Leads", href: "/leads" },
  { label: "Untouched", href: "/leads/untouched" },
  { label: "Imported", href: "/leads/imported" },
  { label: "Assigned", href: "/leads/assigned" },
  { label: "Non Assigned", href: "/leads/unassigned" },
  { label: "Reports", href: "/leads/reports" },
];

export function LeadTabs() {
  const pathname = usePathname();

  return (
    <div className="flex overflow-x-auto border-b border-slate-200">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "flex-shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
            pathname === tab.href
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
