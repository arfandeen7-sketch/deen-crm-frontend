"use client";

import { Download, FileText } from "lucide-react";

export function AttachmentDownload({
  signedUrl,
  filename,
}: {
  signedUrl?: string | null;
  filename?: string | null;
}) {
  if (!signedUrl) {
    return <span className="text-xs text-slate-400">No attachment</span>;
  }

  const name = filename ?? "attachment";

  return (
    <a
      href={signedUrl}
      download={name}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
    >
      <FileText className="h-4 w-4 text-indigo-600" />
      <span className="max-w-[200px] truncate">{name}</span>
      <Download className="h-3.5 w-3.5 text-slate-400" />
    </a>
  );
}
