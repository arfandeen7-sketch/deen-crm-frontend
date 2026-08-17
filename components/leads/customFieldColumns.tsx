"use client";

import { displayValue, isEmptyDisplayValue } from "@/lib/utils";
import type { Column } from "@/components/tables/DataTable";
import type { CustomFieldDefinition, Lead } from "@/types";

export function buildCustomFieldColumns(
  fields: CustomFieldDefinition[] | undefined,
): Column<Lead>[] {
  if (!fields?.length) return [];
  return fields.map((f) => ({
    key: `custom:${f.key}`,
    header: f.label,
    render: (l: Lead) => {
      const value = l.customFields?.[f.key];
      if (isEmptyDisplayValue(value)) {
        return <span className="text-sm text-slate-400">—</span>;
      }
      return (
        <span className="text-sm text-slate-700" title={value}>
          {displayValue(value)}
        </span>
      );
    },
  }));
}
