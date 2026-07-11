"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useLeadMutations } from "@/hooks/useLeads";
import { leadsService } from "@/services/leads/leads.service";
import { getErrorMessage } from "@/services/api/client";
import { downloadBlob } from "@/lib/utils";
import { AccessGuard } from "@/components/shared/Guards";
import type { ImportResult } from "@/types";

export default function ImportLeadsPage() {
  const { importLeads } = useLeadMutations();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [downloading, setDownloading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <AccessGuard module="leads" page="all_leads" action="import">
    <div className="space-y-5">
      <Link href="/leads" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to leads
      </Link>
      <PageHeader
        title="Import Leads"
        subtitle="Bulk upload leads from a CSV or Excel file"
        actions={
          <Button variant="outline" onClick={handleTemplate} loading={downloading}>
            <Download className="h-4 w-4" /> Download Template
          </Button>
        }
      />

      <Card>
        <CardBody>
          <div
            onClick={() => inputRef.current?.click()}
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
                <p className="text-xs text-slate-400">Supports .csv, .xlsx (max 10MB)</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="mt-4 flex justify-end gap-2">
            {file && (
              <Button variant="outline" onClick={() => { setFile(null); setResult(null); }}>
                Clear
              </Button>
            )}
            <Button onClick={handleUpload} loading={importLeads.isPending} disabled={!file}>
              <UploadCloud className="h-4 w-4" /> Upload & Import
            </Button>
          </div>
        </CardBody>
      </Card>

      {result && (
        <Card>
          <CardHeader title="Import Report" />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-2">Row</th>
                      <th className="px-4 py-2">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.errors.map((err, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 font-medium text-slate-700">{err.row}</td>
                        <td className="flex items-center gap-2 px-4 py-2 text-rose-600">
                          <AlertCircle className="h-4 w-4" /> {err.reason}
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
          </CardBody>
        </Card>
      )}
    </div>
    </AccessGuard>
  );
}
