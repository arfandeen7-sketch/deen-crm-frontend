"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/contexts/PermissionContext";

const ALL_TABS = [
  { label: "All Leads",   href: "/leads",             module: "leads",        page: "all_leads" },
  { label: "Untouched",   href: "/leads/untouched",   module: "leads",        page: "untouched_leads" },
  { label: "Fresh",       href: "/leads/fresh",       module: "leads",        page: "fresh_leads" },
  { label: "Imported",    href: "/leads/imported",    module: "leads",        page: "imported_leads" },
  { label: "Assigned",    href: "/leads/assigned",    module: "leads",        page: "assigned_leads" },
  { label: "Non Assigned", href: "/leads/unassigned", module: "leads",        page: "unassigned_leads" },
  { label: "Reports",     href: "/leads/reports",     module: "lead_reports", page: undefined },
] as const;

export function LeadTabs() {
  const pathname = usePathname();
  const { canPage, canModule } = usePermissions();

  const visibleTabs = ALL_TABS.filter((tab) =>
    tab.page ? canPage(tab.module as string, tab.page) : canModule(tab.module as string),
  );

  return (
    <div className="flex overflow-x-auto border-b border-slate-200">
      {visibleTabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "flex-shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
            pathname === tab.href
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
