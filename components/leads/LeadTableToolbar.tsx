"use client";

import { useState } from "react";
import { Columns3, SlidersHorizontal } from "lucide-react";
import { SearchInput } from "@/components/ui/SearchInput";
import { cn } from "@/lib/utils";
import { useLeadColumnStore } from "@/store/leadColumns.store";
import {
  LOCKED_COLUMN_KEYS,
  applyColumnPrefs,
  columnLabel,
  mergeColumnOrder,
} from "@/lib/lead-columns";
import { LeadColumnPicker } from "@/components/leads/LeadColumnPicker";
import type { Column } from "@/components/tables/DataTable";

type Panel = "columns" | "filters";

export function LeadTableToolbar<T>({
  search,
  onSearch,
  columns,
  children,
  actions,
  searchPlaceholder = "Search name, mobile, project…",
}: {
  search: string;
  onSearch: (value: string) => void;
  columns: Column<T>[];
  children: React.ReactNode;
  actions?: React.ReactNode;
  searchPlaceholder?: string;
}) {
  const [panel, setPanel] = useState<Panel | null>(null);
  const order = useLeadColumnStore((s) => s.order);
  const hidden = useLeadColumnStore((s) => s.hidden);
  const setOrder = useLeadColumnStore((s) => s.setOrder);
  const toggleHidden = useLeadColumnStore((s) => s.toggleHidden);

  const configurable = columns.filter((c) => !LOCKED_COLUMN_KEYS.has(c.key));
  const mergedOrder = mergeColumnOrder(
    order,
    configurable.map((c) => c.key),
  );
  const byKey = new Map(configurable.map((c) => [c.key, c]));
  const pickerItems = mergedOrder.flatMap((key) => {
    const col = byKey.get(key);
    if (!col) return [];
    return [
      {
        key,
        label: columnLabel(col),
        visible: !hidden.includes(key),
      },
    ];
  });

  function togglePanel(next: Panel) {
    setPanel((current) => (current === next ? null : next));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={onSearch}
          placeholder={searchPlaceholder}
          className="w-full min-w-[12rem] flex-1 sm:max-w-sm"
        />
        <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
          <button
            type="button"
            onClick={() => togglePanel("columns")}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors",
              panel === "columns"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900",
            )}
          >
            <Columns3 className="h-3.5 w-3.5" />
            Columns
          </button>
          <button
            type="button"
            onClick={() => togglePanel("filters")}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors",
              panel === "filters"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900",
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
          </button>
        </div>
        {actions ? <div className="ml-auto">{actions}</div> : null}
      </div>

      {panel === "columns" && (
        <div className="space-y-2">
          <p className="text-xs text-neutral-500">
            Choose which columns to show and drag to change their order.
          </p>
          <LeadColumnPicker
            items={pickerItems}
            onToggle={toggleHidden}
            onReorder={setOrder}
          />
        </div>
      )}

      {panel === "filters" && <div>{children}</div>}
    </div>
  );
}

export function useVisibleLeadColumns<T>(columns: Column<T>[]): Column<T>[] {
  const order = useLeadColumnStore((s) => s.order);
  const hidden = useLeadColumnStore((s) => s.hidden);
  return applyColumnPrefs(columns, order, hidden);
}
