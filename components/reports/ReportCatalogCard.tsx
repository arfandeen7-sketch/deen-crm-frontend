"use client";

import Link from "next/link";
import { FileText, FileSpreadsheet, FileType, BarChart2, Briefcase, Building2 } from "lucide-react";
import type { ReportCatalogEntry } from "@/types/reports";

const DOMAIN_ICON = {
  sales: BarChart2,
  hr: Briefcase,
  portfolio: Building2,
} as const;

const FORMAT_ICONS = {
  pdf: FileText,
  xlsx: FileSpreadsheet,
  docx: FileType,
  csv: FileText,
} as const;

export function ReportCatalogCard({ entry }: { entry: ReportCatalogEntry }) {
  const DomainIcon = DOMAIN_ICON[entry.domain] ?? BarChart2;

  return (
    <Link
      href={`/reports/${entry.key}`}
      className="group flex flex-col gap-3 rounded-xl border border-neutral-200/80 bg-white p-4 transition-colors hover:border-neutral-300 hover:bg-neutral-50/50"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
          <DomainIcon className="h-4 w-4" />
        </div>
        <div className="flex gap-1" data-print="hide">
          {entry.formats
            .filter((f) => f !== "json")
            .map((f) => {
              const Icon = FORMAT_ICONS[f];
              return Icon ? (
                <div key={f} className="text-neutral-300 group-hover:text-neutral-400">
                  <Icon className="h-3.5 w-3.5" />
                </div>
              ) : null;
            })}
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-neutral-700">
          {entry.title}
        </h3>
        <p className="text-xs leading-relaxed text-neutral-500">{entry.subtitle}</p>
      </div>
    </Link>
  );
}
