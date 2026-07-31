"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useLeadMutations } from "@/hooks/useLeads";
import { leadsService } from "@/services/leads/leads.service";
import { getErrorMessage } from "@/services/api/client";
import { downloadBlob } from "@/lib/utils";
import type { ImportResult } from "@/types";

interface ImportLeadsModalProps {
  open: boolean;
  onClose: () => void;
}

export function ImportLeadsModal({ open, onClose }: ImportLeadsModalProps) {
  const { importLeads } = useLeadMutations();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [downloading, setDownloading] = useState(false);

  function handleClose() {
    setFile(null);
    setResult(null);
    onClose();
  }

  const FILE_INPUT_ID = "import-leads-file-input";

  async function handleUpload() {
    if (!file) return toast.error("Choose a file first");
    try {
      const res = await importLeads.mutateAsync(file);
      setResult(res);
      toast.success(`Imported ${res.imported} lead(s)`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  async function handleTemplate() {
    setDownloading(true);
    try {
      const blob = await leadsService.template();
      downloadBlob(blob, "leads_import_template.xlsx");
      toast.success("Template downloaded");
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Import Leads"
      description="Bulk upload leads from a CSV or Excel file"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleTemplate} loading={downloading}>
            <Download className="h-4 w-4" /> Download Template
          </Button>
          {file && (
            <Button variant="outline" onClick={() => { setFile(null); setResult(null); }}>
              Clear
            </Button>
          )}
          <Button onClick={handleUpload} loading={importLeads.isPending} disabled={!file}>
            <UploadCloud className="h-4 w-4" /> Upload & Import
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <label
          htmlFor={FILE_INPUT_ID}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) setFile(f);
          }}
          className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50/40"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-gray-900">
            <UploadCloud className="h-6 w-6" />
          </span>
          {file ? (
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              {file.name}
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-slate-700">
                Drop your file here, or click to browse
              </p>
              <p className="text-xs text-slate-400">Supports .csv, .xlsx (max 5MB)</p>
            </>
          )}
          <input
            id={FILE_INPUT_ID}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-emerald-50 p-4">
                <p className="text-xs text-emerald-700">Imported</p>
                <p className="text-2xl font-semibold text-emerald-700">{result.imported}</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-4">
                <p className="text-xs text-amber-700">Skipped</p>
                <p className="text-2xl font-semibold text-amber-700">{result.skipped}</p>
              </div>
              <div className="rounded-lg bg-rose-50 p-4">
                <p className="text-xs text-rose-700">Errors</p>
                <p className="text-2xl font-semibold text-rose-700">{result.errors.length}</p>
              </div>
            </div>

            {result.errors.length > 0 ? (
              <div className="max-h-48 overflow-y-auto rounded-lg bg-background">
                <table className="w-full border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr className="text-[11px] font-semibold uppercase tracking-wider text-foreground-secondary">
                      <th className="whitespace-nowrap border-b border-border bg-section px-4 py-2.5">Row</th>
                      <th className="whitespace-nowrap border-b border-border bg-section px-4 py-2.5">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((err, i) => (
                      <tr key={i} className="border-b border-border last:border-b-0">
                        <td className="whitespace-nowrap border-b border-border px-4 py-2.5 text-sm font-medium text-foreground-secondary">
                          {err.row}
                        </td>
                        <td className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-sm text-rose-600">
                          <AlertCircle className="h-4 w-4 shrink-0" /> {err.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="flex items-center gap-2 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> All rows imported successfully.
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
