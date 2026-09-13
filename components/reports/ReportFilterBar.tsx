"use client";

import { useReportOptions } from "@/hooks/useReports";
import type { ReportFilterSpec } from "@/types/reports";
import type { ReportDocumentParams } from "@/services/reports/reports.service";

export function ReportFilterBar({
  filterSpec,
  params,
  onChange,
}: {
  filterSpec: ReportFilterSpec[];
  params: ReportDocumentParams;
  onChange: (key: string, value: string) => void;
}) {
  if (filterSpec.length === 0) return null;

  return (
    <div className="flex flex-wrap items-end gap-3" data-print="hide">
      {filterSpec.map((spec) => (
        <FilterControl key={spec.key} spec={spec} params={params} onChange={onChange} />
      ))}
    </div>
  );
}

function FilterControl({
  spec,
  params,
  onChange,
}: {
  spec: ReportFilterSpec;
  params: ReportDocumentParams;
  onChange: (key: string, value: string) => void;
}) {
  const optionsQuery = useReportOptions(spec.optionsSource);

  const options = spec.options ?? optionsQuery.data ?? [];
  const currentValue = (params[spec.key] as string) ?? "";

  if (spec.type === "toggle") {
    return (
      <label className="flex items-center gap-2 text-xs font-medium text-neutral-600">
        <input
          type="checkbox"
          checked={currentValue === "true"}
          onChange={(e) => onChange(spec.key, e.target.checked ? "true" : "false")}
          className="h-4 w-4 rounded border-neutral-300"
        />
        {spec.label}
      </label>
    );
  }

  if (spec.type === "text") {
    return (
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
          {spec.label}
        </label>
        <input
          type="text"
          value={currentValue}
          onChange={(e) => onChange(spec.key, e.target.value)}
          placeholder={spec.placeholder ?? spec.label}
          className="h-8 w-40 rounded-md border border-neutral-200 px-2 text-xs outline-none focus:border-neutral-400"
        />
      </div>
    );
  }

  if (spec.type === "date" || spec.type === "month") {
    return (
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
          {spec.label}
        </label>
        <input
          type={spec.type === "month" ? "month" : "date"}
          value={currentValue}
          onChange={(e) => onChange(spec.key, e.target.value)}
          className="h-8 w-36 rounded-md border border-neutral-200 px-2 text-xs outline-none focus:border-neutral-400"
        />
      </div>
    );
  }

  // select / multiselect
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
        {spec.label}
      </label>
      <select
        value={currentValue}
        onChange={(e) => onChange(spec.key, e.target.value)}
        className="h-8 w-40 rounded-md border border-neutral-200 px-2 text-xs outline-none focus:border-neutral-400"
      >
        <option value="">All</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
