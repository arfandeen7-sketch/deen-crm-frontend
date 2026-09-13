"use client";

import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { formatValue } from "../format";
import type { TableSection, ReportMeta } from "@/types/reports";

export function TableView({ section, meta }: { section: TableSection; meta: ReportMeta }) {
  const [sortKey, setSortKey] = useState<string | undefined>(section.defaultSort?.key);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(section.defaultSort?.direction ?? "desc");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const columns = section.columns.filter((c) => !c.compact);

  const filtered = useMemo(() => {
    if (!search) return section.rows;
    const q = search.toLowerCase();
    return section.rows.filter((row) =>
      columns.some((c) => String(row[c.key] ?? "").toLowerCase().includes(q)),
    );
  }, [section.rows, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      const an = Number(av);
      const bn = Number(bv);
      if (!isNaN(an) && !isNaN(bn)) return (an - bn) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const pageRows = sorted.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const totals = useMemo(() => {
    const t: Record<string, number> = {};
    for (const col of columns) {
      if (col.total === "sum" || col.total === "avg") {
        const values = section.rows
          .map((r) => Number(r[col.key]))
          .filter((v) => Number.isFinite(v));
        t[col.key] =
          col.total === "sum"
            ? values.reduce((s, v) => s + v, 0)
            : values.length > 0
              ? values.reduce((s, v) => s + v, 0) / values.length
              : 0;
      }
    }
    return t;
  }, [section.rows, columns]);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function downloadCsv() {
    const headers = columns.map((c) => c.label);
    const lines = [headers.join(",")];
    for (const row of section.rows) {
      const cells = columns.map((c) => {
        const v = row[c.key];
        const s = v === null || v === undefined ? "" : String(v);
        return /[,\"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      });
      lines.push(cells.join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${section.sheetName ?? section.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-3" data-print="block">
      <div className="flex items-center justify-between gap-3" data-print="hide">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">{section.title}</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search…"
              className="h-8 w-40 rounded-md border border-neutral-200 pl-7 pr-2 text-xs outline-none focus:border-neutral-400"
            />
          </div>
          <button
            onClick={downloadCsv}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-neutral-200 px-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200/80">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-neutral-50/95 backdrop-blur">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className={`cursor-pointer select-none whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-neutral-900 ${
                    col.align === "right" ? "text-right" : "text-left"
                  }`}
                  style={{ minWidth: col.width ? `${col.width * 6}px` : undefined }}
                >
                  {col.label}
                  {sortKey === col.key && (sortDir === "asc" ? " ▲" : " ▼")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-sm text-neutral-400">
                  No records found.
                </td>
              </tr>
            ) : (
              pageRows.map((row, i) => {
                const severity = section.severityKey ? String(row[section.severityKey] ?? "") : "";
                const tint =
                  severity === "critical"
                    ? "bg-red-50/40"
                    : severity === "warning"
                      ? "bg-amber-50/40"
                      : severity === "positive"
                        ? "bg-teal-50/40"
                        : i % 2 === 1
                          ? "bg-neutral-50/40"
                          : "";
                return (
                  <tr key={i} className={`border-t border-neutral-100 ${tint}`}>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`whitespace-nowrap px-3 py-2 tabular-nums ${
                          col.align === "right" ? "text-right" : "text-left"
                        } text-neutral-700`}
                      >
                        {formatValue(row[col.key], col.format, { currency: meta.currency })}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
          {Object.keys(totals).length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-neutral-300 bg-neutral-50">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-3 py-2 text-xs font-bold tabular-nums text-neutral-900 ${
                      col.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    {totals[col.key] !== undefined
                      ? formatValue(totals[col.key], col.format, { currency: meta.currency })
                      : ""}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {sorted.length > pageSize && (
        <div className="flex items-center justify-between text-xs text-neutral-500" data-print="hide">
          <span>
            {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="rounded-md border border-neutral-200 px-2 py-1 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              className="rounded-md border border-neutral-200 px-2 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
