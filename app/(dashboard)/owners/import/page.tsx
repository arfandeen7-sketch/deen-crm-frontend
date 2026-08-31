"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  X,
  Info,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { AccessGuard } from "@/components/shared/Guards";
import { useOwnerTenantFullAccess } from "@/hooks/useOwnerTenantFullAccess";
import { ownerManualPropertiesService } from "@/services/owners/ownerManualProperties.service";
import type { OwnerImportPreviewResult, OwnerImportResult, OwnerImportSystemField } from "@/types";

// ── Step types ────────────────────────────────────────────────────────────────

type Step = "upload" | "mapping" | "result";

// ── Page guard ────────────────────────────────────────────────────────────────

export default function OwnerImportPage() {
  return (
    <AccessGuard module="owners" page="all_owners" action="view">
      <ImportContent />
    </AccessGuard>
  );
}

// ── Main content ──────────────────────────────────────────────────────────────

function ImportContent() {
  const router = useRouter();
  const isMaster = useOwnerTenantFullAccess();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Non-master users should not see this page
  if (!isMaster) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <AlertCircle className="h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm font-medium text-slate-600">Access Denied</p>
        <p className="mt-1 text-xs text-slate-400">
          Only Master users can access the Owner Import feature.
        </p>
      </div>
    );
  }

  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<OwnerImportPreviewResult | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [result, setResult] = useState<OwnerImportResult | null>(null);

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [importing, setImporting] = useState(false);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(null);
    setMapping({});
    setResult(null);
    setStep("upload");
  }

  async function handlePreview() {
    if (!file) return;
    setLoadingPreview(true);
    try {
      const data = await ownerManualPropertiesService.importPreview(file);
      setPreview(data);
      // Use the server-computed suggested mapping (alias-aware, covers Zoho CSV
      // column names like "Phone", "EID Number", "Building Name", etc.)
      setMapping(data.suggestedMapping ?? {});
      setStep("mapping");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? "Failed to parse file");
    } finally {
      setLoadingPreview(false);
    }
  }

  /**
   * Set a mapping: csvHeader → systemKey.
   * Clears any previously mapped csvHeader that was bound to the same systemKey
   * (one-to-one: one system field can only be mapped from one CSV column).
   */
  function handleMappingChange(csvHeader: string, systemKey: string) {
    setMapping((prev) => {
      const next = { ...prev };
      // Remove any other csv header that was previously mapped to this systemKey
      for (const [h, k] of Object.entries(next)) {
        if (k === systemKey && h !== csvHeader) delete next[h];
      }
      if (csvHeader) {
        next[csvHeader] = systemKey;
      } else {
        // User selected "— Not mapped —" — remove the binding for this key
        for (const [h, k] of Object.entries(next)) {
          if (k === systemKey) delete next[h];
        }
      }
      return next;
    });
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    try {
      const data = await ownerManualPropertiesService.importOwners(file, mapping);
      setResult(data);
      setStep("result");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? "Import failed");
    } finally {
      setImporting(false);
    }
  }

  function handleReset() {
    setFile(null);
    setPreview(null);
    setMapping({});
    setResult(null);
    setStep("upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Required fields validation ────────────────────────────────────────────

  const requiredFields = preview?.systemFields.filter((sf) => sf.required) ?? [];
  const mappedSystemKeys = Object.values(mapping).filter(Boolean);
  const allRequiredMapped = requiredFields.every((sf) =>
    mappedSystemKeys.includes(sf.key)
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <PageHeader
        title="Import Owners"
        subtitle="Upload a CSV or Excel file to import owners and their properties"
        actions={
          <Link
            href="/owners"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Owners
          </Link>
        }
      />

      {/* ── Stepper ──────────────────────────────────────────────────── */}
      <StepIndicator step={step} />

      {/* ── Upload ───────────────────────────────────────────────────── */}
      {step === "upload" && (
        <Card>
          <CardHeader title="Upload File" subtitle="Accepted formats: CSV, XLSX (max 10 MB)" />
          <CardBody className="space-y-5">
            {/* Drop zone */}
            <div
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 py-14 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/30"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileSpreadsheet className="h-12 w-12 text-neutral-300" />
              <p className="mt-3 text-sm font-medium text-neutral-600">
                Click to browse, or drag and drop your file here
              </p>
              <p className="mt-1 text-xs text-neutral-400">CSV or XLSX · Max 10 MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={handleFileChange}
            />

            {file && (
              <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-emerald-900">{file.name}</p>
                    <p className="text-xs text-emerald-600">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded p-1 text-emerald-500 hover:bg-emerald-100 hover:text-emerald-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Instructions */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <div className="space-y-1.5 text-xs text-blue-800">
                  <p className="font-semibold">How it works</p>
                  <ul className="list-disc space-y-1 pl-4">
                    <li>Upload your CSV/XLSX file with owner and property data.</li>
                    <li>Map each column in your file to the appropriate CRM field.</li>
                    <li>Owners are deduplicated by mobile number — existing owners are updated, new ones are created.</li>
                    <li>Properties are added as Manual Properties linked to each owner.</li>
                    <li>Only <strong>Master</strong> users can perform this import.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handlePreview}
                disabled={!file}
                loading={loadingPreview}
              >
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Column Mapping ────────────────────────────────────────────── */}
      {step === "mapping" && preview && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Map Columns"
              subtitle={`${preview.headers.length} columns detected in your file`}
            />
            <CardBody className="space-y-4">
              {/* Owner fields */}
              <FieldGroup
                title="Owner Fields"
                fields={preview.systemFields.filter((sf) => sf.section === "owner")}
                headers={preview.headers}
                mapping={mapping}
                onChange={handleMappingChange}
              />
              {/* Property fields */}
              <FieldGroup
                title="Property Fields"
                fields={preview.systemFields.filter((sf) => sf.section === "property")}
                headers={preview.headers}
                mapping={mapping}
                onChange={handleMappingChange}
              />

              {!allRequiredMapped && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                  <p className="text-xs text-amber-800">
                    Please map all required fields before importing.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
                <Button variant="outline" onClick={() => setStep("upload")}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!allRequiredMapped}
                  loading={importing}
                >
                  Import Data
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Data preview table */}
          {preview.previewRows.length > 0 && (
            <Card>
              <CardHeader
                title="Data Preview"
                subtitle={`First ${preview.previewRows.length} rows from your file`}
              />
              <CardBody className="!p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-neutral-100 bg-neutral-50">
                        {preview.headers.map((h) => (
                          <th
                            key={h}
                            className="px-4 py-2.5 text-left font-semibold text-neutral-500"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.previewRows.map((row, i) => (
                        <tr
                          key={i}
                          className="border-b border-neutral-50 hover:bg-neutral-50/60"
                        >
                          {preview.headers.map((h) => (
                            <td key={h} className="max-w-[180px] truncate px-4 py-2 text-neutral-700">
                              {row[h] || "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* ── Result ─────────────────────────────────────────────────────── */}
      {step === "result" && result && (
        <Card>
          <CardBody className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Import Complete</p>
                <p className="text-sm text-slate-500">Your data has been processed.</p>
              </div>
            </div>

            {/* Summary stats */}
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <StatCard label="Owners Created" value={result.ownersCreated} color="emerald" />
              <StatCard label="Owners Updated" value={result.ownersUpdated} color="blue" />
              <StatCard label="Properties Added" value={result.propertiesCreated} color="purple" />
              <StatCard label="Props Skipped (dup)" value={result.propertiesSkipped ?? 0} color="amber" />
              <StatCard label="Rows Skipped" value={result.skipped} color="amber" />
            </div>

            {/* Errors / warnings */}
            {result.errors.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Issues ({result.errors.length})
                </p>
                <div className="max-h-60 overflow-y-auto rounded-lg border border-neutral-200 divide-y divide-neutral-100">
                  {result.errors.map((err, i) => (
                    <div key={i} className="flex items-start gap-2 px-4 py-2.5">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                      <p className="text-xs text-slate-600">
                        <span className="font-medium">Row {err.row}:</span> {err.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button onClick={() => router.push("/owners")}>View Owners</Button>
              <Button variant="outline" onClick={handleReset}>
                Import Another File
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "upload", label: "Upload File" },
    { key: "mapping", label: "Map Columns" },
    { key: "result", label: "Import Result" },
  ];
  const currentIdx = steps.findIndex((s) => s.key === step);

  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                i < currentIdx
                  ? "bg-emerald-500 text-white"
                  : i === currentIdx
                    ? "bg-blue-600 text-white"
                    : "bg-neutral-200 text-neutral-500"
              }`}
            >
              {i < currentIdx ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={`text-xs font-medium ${
                i === currentIdx ? "text-blue-700" : "text-neutral-500"
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="mx-3 h-px w-8 bg-neutral-200" />
          )}
        </div>
      ))}
    </div>
  );
}

function FieldGroup({
  title,
  fields,
  headers,
  mapping,
  onChange,
}: {
  title: string;
  fields: OwnerImportSystemField[];
  headers: string[];
  mapping: Record<string, string>;
  onChange: (csvHeader: string, systemKey: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
        {title}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((sf) => {
          // Find which CSV header is currently mapped to this system field
          const mappedHeader =
            Object.entries(mapping).find(([, v]) => v === sf.key)?.[0] ?? "";

          return (
            <div key={sf.key} className="flex items-center gap-3">
              <div className="w-44 shrink-0">
                <p className="text-xs font-medium text-slate-700">
                  {sf.label}
                  {sf.required && <span className="ml-1 text-red-500">*</span>}
                </p>
              </div>
              <Select
                className="flex-1 text-xs"
                value={mappedHeader}
                onChange={(e) => {
                  // Delegate fully to parent — it owns the mapping state and
                  // handles de-duplication (one system field per CSV column).
                  onChange(e.target.value, sf.key);
                }}
              >
                <option value="">— Not mapped —</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </Select>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "emerald" | "blue" | "purple" | "amber";
}) {
  const colorMap = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    purple: "border-purple-200 bg-purple-50 text-purple-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
  };
  return (
    <div className={`rounded-lg border p-4 text-center ${colorMap[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-xs font-medium">{label}</p>
    </div>
  );
}
