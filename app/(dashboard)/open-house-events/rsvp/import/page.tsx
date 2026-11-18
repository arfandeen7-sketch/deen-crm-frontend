"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle2, FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Input";
import { AccessGuard, CanAccess } from "@/components/shared/Guards";
import { EventFormModal } from "@/components/openHouse/EventFormModal";
import { getErrorMessage } from "@/services/api/client";
import {
  openHouseRsvpsService,
  type RsvpImportAgentOption,
  type RsvpImportParseResult,
  type RsvpImportPreview,
  type RsvpImportRequest,
} from "@/services/openHouse/openHouse.service";
import { useInvalidateOpenHouse, useOpenHouseEventOptions } from "@/hooks/useOpenHouse";
import { autoMatchColumns, dedupeMapping } from "@/lib/import-mapping";
import { downloadBlob } from "@/lib/utils";
import {
  OPEN_HOUSE_EVENTS_PAGE,
  OPEN_HOUSE_MODULE,
  OPEN_HOUSE_RSVP_PAGE,
  RSVP_ARRIVAL_SLOTS,
  RSVP_BUDGET_OPTIONS,
  RSVP_INTEREST_OPTIONS,
  RSVP_STATUS_OPTIONS,
  labelFor,
} from "@/constants/openHouse";
import type { ImportMapping, OpenHouseEvent } from "@/types";

type Step = "upload" | "map" | "assign" | "result";

const EMPTY_MAPS = { status: {}, expectedArrival: {}, interestedIn: {}, budget: {} };

function suggestAgent(name: string, users: RsvpImportAgentOption[]): string {
  if (name.trim().toLowerCase() !== "arslan") return "";
  const byCode = users.find((user) => (user.employeeId ?? "").toLowerCase() === "arza6228");
  const byName = users.find((user) => user.fullName.trim().toLowerCase() === "arslan");
  return byCode?.id ?? byName?.id ?? "";
}

function issuesCsv(preview: RsvpImportPreview): string {
  const lines = ["Row,Outcome,Guest,Mobile,Agent,Reason"];
  for (const issue of preview.issues) {
    const cells = [issue.row, issue.outcome, issue.guestName, issue.mobile, issue.agentName, issue.reason]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`);
    lines.push(cells.join(","));
  }
  return lines.join("\n");
}

export default function ImportRsvpPage() {
  return (
    <AccessGuard module={OPEN_HOUSE_MODULE} page={OPEN_HOUSE_RSVP_PAGE} action="import">
      <ImportRsvpContent />
    </AccessGuard>
  );
}

function ImportRsvpContent() {
  const router = useRouter();
  const invalidate = useInvalidateOpenHouse();
  const eventsQuery = useOpenHouseEventOptions();
  const inputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<RsvpImportParseResult | null>(null);
  const [mapping, setMapping] = useState<ImportMapping>({});
  const [eventId, setEventId] = useState("");
  const [createdEvents, setCreatedEvents] = useState<OpenHouseEvent[]>([]);
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [agents, setAgents] = useState<RsvpImportAgentOption[]>([]);
  const [agentMap, setAgentMap] = useState<Record<string, string>>({});
  const [valueMaps, setValueMaps] = useState(EMPTY_MAPS);
  const [preview, setPreview] = useState<RsvpImportPreview | null>(null);
  const [stale, setStale] = useState(true);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState<number | null>(null);

  const events = [
    ...createdEvents.map((event) => ({
      id: event.id,
      eventName: event.eventName,
      eventDate: event.eventDate,
      status: event.status,
      developerName: event.developerName,
    })),
    ...(eventsQuery.data ?? []).filter((event) => !createdEvents.some((created) => created.id === event.id)),
  ];

  function requestBody(): RsvpImportRequest {
    return {
      eventId: eventId || undefined,
      mapping: dedupeMapping(mapping),
      agentMap,
      valueMaps,
    };
  }

  function touch() {
    setStale(true);
    setImported(null);
  }

  async function handleParse() {
    if (!file) return toast.error("Choose a file first");
    setParsing(true);
    try {
      const result = await openHouseRsvpsService.parseImport(file);
      if (result.totalRows === 0) {
        toast.error("The RSVPs sheet has no data rows");
        return;
      }
      setParsed(result);
      setMapping(autoMatchColumns(result.headers, result.systemFields));
      setPreview(null);
      setStale(true);
      setStep("map");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setParsing(false);
    }
  }

  async function loadAgents() {
    if (agents.length > 0) return agents;
    const rows = await openHouseRsvpsService.importAgents();
    setAgents(rows);
    return rows;
  }

  async function handleValidate() {
    if (!file) return;
    setValidating(true);
    try {
      const users = await loadAgents();
      const result = await openHouseRsvpsService.previewImport(file, requestBody());
      const nextMap = { ...agentMap };
      let suggested = false;
      for (const agent of result.agents) {
        if (!(agent.name in nextMap)) {
          nextMap[agent.name] = suggestAgent(agent.name, users);
          if (nextMap[agent.name]) suggested = true;
        }
      }
      setAgentMap(nextMap);
      setPreview(result);
      setStale(suggested);
      setStep("assign");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setValidating(false);
    }
  }

  async function handleImport() {
    if (!file || !preview || stale || preview.valid === 0 || !eventId) return;
    setImporting(true);
    try {
      const result = await openHouseRsvpsService.importFile(file, requestBody());
      setImported(result.imported);
      setPreview({
        ...preview,
        valid: result.imported,
        invalid: result.failed,
        duplicate: result.duplicate,
        ready: result.imported,
        issues: result.errors,
      });
      invalidate();
      setStep("result");
      toast.success(`${result.imported} RSVP${result.imported === 1 ? "" : "s"} imported`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Import RSVP"
        subtitle="Upload an Excel file, map columns and agents, then save every valid guest on one Open House event."
        actions={
          <Button variant="outline" onClick={() => router.push("/open-house-events/rsvp")}>
            <ArrowLeft className="h-4 w-4" /> RSVP list
          </Button>
        }
      />

      {step === "upload" && (
        <Card>
          <CardBody>
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const next = event.dataTransfer.files?.[0];
                if (next) setFile(next);
              }}
              className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center hover:border-neutral-400"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-200 text-neutral-800">
                <UploadCloud className="h-6 w-6" />
              </span>
              {file ? (
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <FileSpreadsheet className="h-4 w-4" />
                  {file.name}
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-700">Drop the Excel file here, or click to browse</p>
                  <p className="text-xs text-slate-400">.xlsx or .csv, up to 5 MB. The RSVPs sheet is read.</p>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleParse} loading={parsing} disabled={!file}>
                {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                Continue
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {step === "map" && parsed && (
        <Card>
          <CardHeader
            title="Map columns"
            subtitle={`${parsed.totalRows} records. Map Guest Name or Mobile so each row can be identified. A blank cell stays empty.`}
          />
          <CardBody className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="py-2 pr-3 font-medium">RSVP field</th>
                    <th className="py-2 font-medium">Excel column</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.systemFields.map((field) => {
                    const selected = Object.entries(mapping).find(([, key]) => key === field.key)?.[0] ?? "";
                    return (
                      <tr key={field.key} className="border-b border-slate-100">
                        <td className="py-2 pr-3">
                          {field.label}
                          {field.required ? <span className="text-rose-600"> *</span> : null}
                        </td>
                        <td className="py-2">
                          <Select
                            value={selected}
                            onChange={(event) => {
                              const header = event.target.value;
                              const next = { ...mapping };
                              for (const [name, key] of Object.entries(next)) {
                                if (key === field.key) next[name] = "";
                              }
                              if (header) next[header] = field.key;
                              setMapping(next);
                              touch();
                            }}
                          >
                            <option value="">Do not import</option>
                            {parsed.headers.map((header) => (
                              <option key={header} value={header}>{header}</option>
                            ))}
                          </Select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("upload")}>Back</Button>
              <Button onClick={handleValidate} loading={validating}>
                Continue
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {step === "assign" && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Event"
              subtitle="Every valid row in this file is saved on this one event."
            />
            <CardBody className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <Field label="Open House event" required>
                <Select
                  value={eventId}
                  onChange={(event) => {
                    setEventId(event.target.value);
                    touch();
                  }}
                >
                  <option value="">Select an event</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.eventName} — {String(event.eventDate).slice(0, 10)}
                    </option>
                  ))}
                </Select>
              </Field>
              <CanAccess module={OPEN_HOUSE_MODULE} page={OPEN_HOUSE_EVENTS_PAGE} action="create">
                <Button variant="outline" onClick={() => setEventFormOpen(true)}>Create event</Button>
              </CanAccess>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Agent and Created By"
              subtitle="Choose the CRM user for each Excel agent. That user is stored as Created By, so the guest appears in their RSVP list. The account you are logged in with is not used unless you select it."
            />
            <CardBody className="space-y-3">
              <p className="text-xs text-slate-500">
                Arslan is the existing user with employee id arza6228. Select that user only when the Excel agent name is Arslan. No new user is created.
              </p>
              {(preview?.agents ?? []).length === 0 ? (
                <p className="text-sm text-slate-500">Validate the file to list the agent names.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-400">
                        <th className="py-2 pr-3 font-medium">Excel agent</th>
                        <th className="py-2 pr-3 font-medium">Rows</th>
                        <th className="py-2 font-medium">Created By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview?.agents.map((agent) => (
                        <tr key={agent.name} className="border-b border-slate-100">
                          <td className="py-2 pr-3">{agent.name}</td>
                          <td className="py-2 pr-3">{agent.count}</td>
                          <td className="py-2">
                            <Select
                              value={agentMap[agent.name] ?? ""}
                              onChange={(event) => {
                                setAgentMap((current) => ({ ...current, [agent.name]: event.target.value }));
                                touch();
                              }}
                            >
                              <option value="">Select a CRM user</option>
                              {agents.map((user) => (
                                <option key={user.id} value={user.id}>
                                  {user.fullName}
                                  {user.employeeId ? ` (${user.employeeId})` : ""}
                                  {user.isActive ? "" : " — inactive"}
                                </option>
                              ))}
                            </Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Blank cells"
              subtitle="A blank Excel cell is saved empty. Nothing is filled in for a missing arrival, interest, budget, status, party size, or agent."
            />
            <CardBody className="space-y-4">
              {preview && (
                <p className="text-sm text-slate-600">
                  Empty arrival: {preview.blankCounts.expectedArrival}. Empty interest: {preview.blankCounts.interestedIn}. Empty budget: {preview.blankCounts.budget}. These rows can still be imported.
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-3">
              <ValueMap
                title="Status values"
                values={preview?.unmappedValues.status ?? []}
                options={RSVP_STATUS_OPTIONS}
                selected={valueMaps.status}
                onChange={(excelValue, crmValue) => { setValueMaps((current) => ({ ...current, status: { ...current.status, [excelValue]: crmValue } })); touch(); }}
              />
              <ValueMap
                title="Arrival values"
                values={preview?.unmappedValues.expectedArrival ?? []}
                options={RSVP_ARRIVAL_SLOTS}
                selected={valueMaps.expectedArrival}
                onChange={(excelValue, crmValue) => { setValueMaps((current) => ({ ...current, expectedArrival: { ...current.expectedArrival, [excelValue]: crmValue } })); touch(); }}
              />
              <ValueMap
                title="Interest values"
                values={preview?.unmappedValues.interestedIn ?? []}
                options={RSVP_INTEREST_OPTIONS}
                selected={valueMaps.interestedIn}
                onChange={(excelValue, crmValue) => { setValueMaps((current) => ({ ...current, interestedIn: { ...current.interestedIn, [excelValue]: crmValue } })); touch(); }}
              />
              <ValueMap
                title="Budget values"
                values={preview?.unmappedValues.budget ?? []}
                options={RSVP_BUDGET_OPTIONS}
                selected={valueMaps.budget}
                onChange={(excelValue, crmValue) => { setValueMaps((current) => ({ ...current, budget: { ...current.budget, [excelValue]: crmValue } })); touch(); }}
              />
              </div>
            </CardBody>
          </Card>

          {preview && !stale && <PreviewSummary preview={preview} />}

          <div className="flex flex-wrap justify-between gap-2">
            <Button variant="outline" onClick={() => setStep("map")}>Back</Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleValidate} loading={validating}>
                {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Validate
              </Button>
              <Button
                onClick={handleImport}
                loading={importing}
                disabled={!preview || stale || preview.valid === 0 || !eventId}
              >
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Import {preview && !stale ? preview.valid : ""} valid records
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === "result" && preview && (
        <Card>
          <CardHeader title="Import complete" subtitle="Valid rows were saved on the selected event. Skipped and failed rows were not written." />
          <CardBody className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              {imported ?? preview.valid} imported
            </div>
            <PreviewSummary preview={preview} />
            <div className="flex gap-2">
              <Button onClick={() => router.push(`/open-house-events/rsvp?eventId=${eventId}`)}>
                View event RSVPs
              </Button>
              <Link href="/open-house-events/rsvp" className="inline-flex h-9 items-center rounded-lg border border-neutral-300 px-4 text-xs font-medium">
                All RSVPs
              </Link>
            </div>
          </CardBody>
        </Card>
      )}

      {eventFormOpen && (
        <EventFormModal
          open
          onClose={() => setEventFormOpen(false)}
          onSaved={(event) => {
            setCreatedEvents((current) => [event, ...current]);
            setEventId(event.id);
            touch();
            eventsQuery.refetch();
          }}
        />
      )}
    </div>
  );
}

function ValueMap({
  title,
  values,
  options,
  selected,
  onChange,
}: {
  title: string;
  values: string[];
  options: { value: string; label: string }[];
  selected: Record<string, string>;
  onChange: (excelValue: string, crmValue: string) => void;
}) {
  if (values.length === 0) return null;
  return (
    <div className="space-y-2 sm:col-span-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      {values.map((value) => (
        <div key={value} className="grid items-center gap-2 sm:grid-cols-2">
          <span className="text-sm text-slate-700">{value}</span>
          <Select value={selected[value] ?? ""} onChange={(event) => onChange(value, event.target.value)}>
            <option value="">Choose a CRM value</option>
            {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
        </div>
      ))}
    </div>
  );
}

function PreviewSummary({ preview }: { preview: RsvpImportPreview }) {
  const counts = [
    ["Total", preview.total],
    ["Valid", preview.valid],
    ["Invalid", preview.invalid],
    ["Duplicate", preview.duplicate],
    ["Unmatched agents", preview.unmatchedAgents.length],
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {counts.map(([label, value]) => (
          <div key={String(label)} className="rounded-lg border border-slate-200 px-3 py-2">
            <p className="text-xs text-slate-400">{label}</p>
            <p className="text-lg font-semibold text-slate-900">{value}</p>
          </div>
        ))}
      </div>
      {preview.validSample.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Records that will be imported</p>
          <div className="max-h-64 overflow-auto rounded-lg border border-slate-200">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50 text-left text-slate-400">
                <tr>
                  <th className="px-2 py-1.5 font-medium">Guest</th>
                  <th className="px-2 py-1.5 font-medium">Mobile</th>
                  <th className="px-2 py-1.5 font-medium">Agent</th>
                  <th className="px-2 py-1.5 font-medium">Status</th>
                  <th className="px-2 py-1.5 font-medium">People coming with</th>
                  <th className="px-2 py-1.5 font-medium">Arrival</th>
                </tr>
              </thead>
              <tbody>
                {preview.validSample.map((row) => (
                  <tr key={row.row} className="border-t border-slate-100">
                    <td className="px-2 py-1.5">{row.guestName}</td>
                    <td className="px-2 py-1.5">{row.mobile}</td>
                    <td className="px-2 py-1.5">{row.agentName}</td>
                    <td className="px-2 py-1.5">{row.status ? labelFor(RSVP_STATUS_OPTIONS, row.status) : ""}</td>
                    <td className="px-2 py-1.5">{row.peopleComingWith == null ? "" : row.peopleComingWith}</td>
                    <td className="px-2 py-1.5">{row.expectedArrival ? labelFor(RSVP_ARRIVAL_SLOTS, row.expectedArrival) : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {preview.issues.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">Rows that will not be imported</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadBlob(new Blob([issuesCsv(preview)], { type: "text/csv" }), "rsvp-import-errors.csv")}
            >
              Download errors
            </Button>
          </div>
          <div className="max-h-64 overflow-auto rounded-lg border border-slate-200">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50 text-left text-slate-400">
                <tr>
                  <th className="px-2 py-1.5 font-medium">Row</th>
                  <th className="px-2 py-1.5 font-medium">Guest</th>
                  <th className="px-2 py-1.5 font-medium">Agent</th>
                  <th className="px-2 py-1.5 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {preview.issues.slice(0, 100).map((issue) => (
                  <tr key={`${issue.row}-${issue.reason}`} className="border-t border-slate-100">
                    <td className="px-2 py-1.5">{issue.row}</td>
                    <td className="px-2 py-1.5">{issue.guestName || "—"}</td>
                    <td className="px-2 py-1.5">{issue.agentName || "—"}</td>
                    <td className="px-2 py-1.5">{issue.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
