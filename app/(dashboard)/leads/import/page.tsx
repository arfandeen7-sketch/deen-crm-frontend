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
  ArrowRight,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { useLeadMutations } from "@/hooks/useLeads";
import { leadsService } from "@/services/leads/leads.service";
import { getErrorMessage } from "@/services/api/client";
import { downloadBlob, displayValue } from "@/lib/utils";
import { autoMatchColumns, dedupeMapping } from "@/lib/import-mapping";
import { AccessGuard } from "@/components/shared/Guards";
import type {
  ImportMapping,
  ImportParseResult,
  ImportResult,
} from "@/types";

type Step = "upload" | "map" | "result";

export default function ImportLeadsPage() {
  const { importLeads, parseImport } = useLeadMutations();
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ImportParseResult | null>(null);
  const [mapping, setMapping] = useState<ImportMapping>({});
  const [result, setResult] = useState<ImportResult | null>(null);
  const [downloading, setDownloading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset everything when a new file is chosen.
  function selectFile(f: File | null) {
    setFile(f);
    setParseResult(null);
    setMapping({});
    setResult(null);
  }

  // Step 1 -> 2: parse the file on the backend and seed the auto-mapping.
  async function handleParse() {
    if (!file) return toast.error("Choose a file first");
    try {
      const parsed = await parseImport.mutateAsync(file);
      setParseResult(parsed);
      setMapping(autoMatchColumns(parsed.headers, parsed.systemFields));
      setStep("map");
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  // Step 2 -> 3: send the file + the user's mapping to the import endpoint.
  async function handleImport() {
    if (!file || !parseResult) return;
    // Collapse any accidental duplicate system-key assignments so the UI
    // selection (first match) is what the backend receives.
    const cleanMapping = dedupeMapping(mapping);
    setMapping(cleanMapping);
    // Validate required system fields are mapped.
    const missingRequired = parseResult.systemFields
      .filter((f) => f.required)
      .filter((f) => !Object.values(cleanMapping).includes(f.key));
    if (missingRequired.length > 0) {
      toast.error(
        `Please map required fields: ${missingRequired.map((f) => f.label).join(", ")}`,
      );
      return;
    }
    try {
      const res = await importLeads.mutateAsync({ file, mapping: cleanMapping });
      setResult(res);
      setStep("result");
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

  function reset() {
    selectFile(null);
    setStep("upload");
  }

  return (
    <AccessGuard module="leads" page="all_leads" action="import">
      <div className="space-y-5">
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to leads
        </Link>
        <PageHeader
          title="Import Leads"
          subtitle="Bulk upload leads from a CSV or Excel file. Any cell values are accepted — empty cells become N/A, and new dropdown values are added automatically."
          actions={
            <Button variant="outline" onClick={handleTemplate} loading={downloading}>
              <Download className="h-4 w-4" /> Download Template
            </Button>
          }
        />

        <Stepper step={step} />

        {step === "upload" && (
          <UploadStep
            file={file}
            inputRef={inputRef}
            onSelect={selectFile}
            onParse={handleParse}
            parsing={parseImport.isPending}
          />
        )}

        {step === "map" && parseResult && (
          <MapStep
            parseResult={parseResult}
            mapping={mapping}
            onMappingChange={setMapping}
            onBack={() => setStep("upload")}
            onImport={handleImport}
            importing={importLeads.isPending}
          />
        )}

        {step === "result" && result && (
          <ResultStep result={result} onReset={reset} />
        )}
      </div>
    </AccessGuard>
  );
}

/* ------------------------------------------------------------------ Stepper */

function Stepper({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "upload", label: "Upload" },
    { key: "map", label: "Map Columns" },
    { key: "result", label: "Result" },
  ];
  const activeIdx = steps.findIndex((s) => s.key === step);
  return (
    <div className="flex items-center gap-2 text-xs">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <span
            className={
              "flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold " +
              (i < activeIdx
                ? "border-emerald-500 bg-emerald-500 text-white"
                : i === activeIdx
                  ? "border-indigo-500 bg-indigo-500 text-white"
                  : "border-slate-200 bg-white text-slate-400")
            }
          >
            {i < activeIdx ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
          </span>
          <span
            className={
              i === activeIdx
                ? "font-medium text-slate-700"
                : "text-slate-400"
            }
          >
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <span className="mx-1 h-px w-6 bg-slate-200" />
          )}
        </div>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------- Upload step */

function UploadStep({
  file,
  inputRef,
  onSelect,
  onParse,
  parsing,
}: {
  file: File | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSelect: (f: File | null) => void;
  onParse: () => void;
  parsing: boolean;
}) {
  return (
    <Card>
      <CardBody>
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) onSelect(f);
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
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          {file && (
            <Button variant="outline" onClick={() => onSelect(null)}>
              Clear
            </Button>
          )}
          <Button onClick={onParse} loading={parsing} disabled={!file}>
            {parsing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}{" "}
            Continue
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

/* ----------------------------------------------------------------- Map step */

function MapStep({
  parseResult,
  mapping,
  onMappingChange,
  onBack,
  onImport,
  importing,
}: {
  parseResult: ImportParseResult;
  mapping: ImportMapping;
  onMappingChange: (m: ImportMapping) => void;
  onBack: () => void;
  onImport: () => void;
  importing: boolean;
}) {
  const { headers, previewRows, systemFields } = parseResult;

  function setMappingFor(csvHeader: string, systemKey: string) {
    const next = { ...mapping };
    // Remove any previous CSV header that was mapped to this system key,
    // so switching to "Do not import" actually clears the old mapping.
    for (const [h, k] of Object.entries(next)) {
      if (k === systemKey) delete next[h];
    }
    // Only add a new entry when a real CSV header was chosen (non-empty).
    if (csvHeader) next[csvHeader] = systemKey;
    onMappingChange(next);
  }

  // For each system field, find the (first) CSV header mapped to it, if any.
  function headerForSystem(key: string): string | undefined {
    return Object.entries(mapping).find(([, k]) => k === key)?.[0];
  }

  // A small sample value to display under each CSV header in the table.
  function sampleFor(csvHeader: string): string {
    for (const row of previewRows) {
      const v = row[csvHeader];
      if (v && v.trim()) return v;
    }
    return "";
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Map Columns"
          subtitle="Match each system field to a column from your file. Required fields (*) must be mapped — cells may be empty (saved as N/A). New source, status, and similar values are created automatically."
        />
        <CardBody className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-[11px] font-semibold uppercase tracking-wider text-foreground-secondary">
                  <th className="whitespace-nowrap border-b border-border bg-section px-4 py-3">
                    System Field
                  </th>
                  <th className="whitespace-nowrap border-b border-border bg-section px-4 py-3">
                    CSV Column
                  </th>
                  <th className="whitespace-nowrap border-b border-border bg-section px-4 py-3">
                    Sample Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {systemFields.map((field) => {
                  const mappedHeader = headerForSystem(field.key);
                  return (
                    <tr key={field.key} className="border-b border-border last:border-b-0">
                      <td className="whitespace-nowrap border-b border-border px-4 py-3 text-sm font-medium text-foreground">
                        {field.label}
                        {field.required && <span className="ml-1 text-red-500">*</span>}
                      </td>
                      <td className="border-b border-border px-4 py-3">
                        <Select
                          value={mappedHeader ?? ""}
                          placeholder="-- Do not import --"
                          onChange={(e) =>
                            setMappingFor(e.target.value, field.key)
                          }
                          className="min-w-[220px]"
                        >
                          <option value="">-- Do not import --</option>
                          {headers.map((h) => (
                            <option
                              key={h}
                              value={h}
                              disabled={
                                mapping[h] !== field.key &&
                                mapping[h] !== "" &&
                                mapping[h] !== undefined
                              }
                            >
                              {h}
                            </option>
                          ))}
                        </Select>
                      </td>
                      <td className="border-b border-border px-4 py-3 text-xs text-foreground-secondary">
                        {mappedHeader ? (
                          sampleFor(mappedHeader) || (
                            <span className="text-slate-300">—</span>
                          )
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <UnmappedHeaders
            headers={headers}
            mapping={mapping}
            onAutoMatch={() =>
              onMappingChange(
                autoMatchColumns(headers, systemFields),
              )
            }
          />

          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={onBack} disabled={importing}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={onImport} loading={importing}>
              <UploadCloud className="h-4 w-4" /> Save &amp; Import
            </Button>
          </div>
        </CardBody>
      </Card>

      <PreviewTable parseResult={parseResult} mapping={mapping} />
    </div>
  );
}

function UnmappedHeaders({
  headers,
  mapping,
  onAutoMatch,
}: {
  headers: string[];
  mapping: ImportMapping;
  onAutoMatch: () => void;
}) {
  const unmapped = headers.filter((h) => !mapping[h]);
  if (unmapped.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-800">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>
        {unmapped.length} column(s) not mapped:{" "}
        <span className="font-medium">{unmapped.join(", ")}</span>
      </span>
      <button
        type="button"
        onClick={onAutoMatch}
        className="ml-auto rounded-md border border-amber-300 bg-white px-2 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-100"
      >
        Re-run auto-match
      </button>
    </div>
  );
}

function PreviewTable({
  parseResult,
  mapping,
}: {
  parseResult: ImportParseResult;
  mapping: ImportMapping;
}) {
  const { previewRows, systemFields } = parseResult;
  // Build the system-key -> csvHeader reverse lookup (first match wins,
  // matching the Select UI and backend applyMapping preference).
  const reverse: Record<string, string> = {};
  for (const [csvHeader, systemKey] of Object.entries(mapping)) {
    if (systemKey && !(systemKey in reverse)) reverse[systemKey] = csvHeader;
  }
  const mappedFields = systemFields.filter((f) => reverse[f.key]);

  if (mappedFields.length === 0) return null;

  return (
    <Card>
      <CardHeader
        title="Preview (first 5 rows)"
        subtitle="How your data will look after applying the mapping."
      />
      <CardBody>
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-wider text-foreground-secondary">
                {mappedFields.map((f) => (
                  <th
                    key={f.key}
                    className="whitespace-nowrap border-b border-border bg-section px-4 py-3"
                  >
                    {f.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={mappedFields.length}
                    className="px-4 py-6 text-center text-xs text-slate-400"
                  >
                    No data rows in file.
                  </td>
                </tr>
              ) : (
                previewRows.map((row, i) => (
                  <tr key={i} className="border-b border-border last:border-b-0">
                    {mappedFields.map((f) => {
                      const csvHeader = reverse[f.key];
                      return (
                        <td
                          key={f.key}
                          className="whitespace-nowrap border-b border-border px-4 py-3 text-xs text-foreground-secondary"
                        >
                          {csvHeader ? (
                            displayValue(row[csvHeader])
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}

/* -------------------------------------------------------------- Result step */

function ResultStep({
  result,
  onReset,
}: {
  result: ImportResult;
  onReset: () => void;
}) {
  return (
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
          <div className="overflow-hidden rounded-lg bg-background">
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="text-[11px] font-semibold uppercase tracking-wider text-foreground-secondary">
                    <th className="whitespace-nowrap border-b border-border bg-section px-5 py-3.5">Row</th>
                    <th className="whitespace-nowrap border-b border-border bg-section px-5 py-3.5">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((err, i) => (
                    <tr key={i} className="border-b border-border last:border-b-0">
                      <td className="whitespace-nowrap border-b border-border px-5 py-3.5 text-sm font-medium text-foreground-secondary">
                        {err.row}
                      </td>
                      <td className="flex items-center gap-2 border-b border-border px-5 py-3.5 text-sm text-rose-600">
                        <AlertCircle className="h-4 w-4 shrink-0" /> {err.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> All rows imported successfully.
          </p>
        )}

        <div className="flex justify-end">
          <Button onClick={onReset}>
            <UploadCloud className="h-4 w-4" /> Import another file
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
