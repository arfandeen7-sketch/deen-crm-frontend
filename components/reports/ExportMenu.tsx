"use client";

import { useState } from "react";
import { Download, FileText, FileSpreadsheet, FileType, ChevronDown, Loader2 } from "lucide-react";
import type { ReportFormat, ReportMeta } from "@/types/reports";
import { useReportDownload } from "@/hooks/useReports";
import type { ReportDocumentParams } from "@/services/reports/reports.service";

const FORMAT_LABELS: Record<string, { label: string; icon: typeof FileText }> = {
  pdf: { label: "PDF", icon: FileText },
  xlsx: { label: "Excel", icon: FileSpreadsheet },
  docx: { label: "Word", icon: FileType },
  csv: { label: "CSV", icon: FileText },
};

export function ExportMenu({
  meta,
  params,
}: {
  meta: ReportMeta;
  params: ReportDocumentParams;
}) {
  const [open, setOpen] = useState(false);
  const download = useReportDownload();

  const formats = meta.formats.filter((f) => f !== "json");

  if (formats.length === 0) return null;

  return (
    <div className="relative" data-print="hide">
      <button
        onClick={() => setOpen(!open)}
        disabled={download.isPending}
        className="inline-flex h-9 items-center gap-1.5 rounded-md bg-neutral-900 px-3 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {download.isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        Export
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-40 rounded-md border border-neutral-200 bg-white py-1 shadow-lg">
            {formats.map((format) => {
              const fmt = FORMAT_LABELS[format];
              if (!fmt) return null;
              const Icon = fmt.icon;
              return (
                <button
                  key={format}
                  onClick={() => {
                    download.mutate({ key: meta.key, format: format as ReportFormat, params });
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  <Icon className="h-3.5 w-3.5 text-neutral-400" />
                  {fmt.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
