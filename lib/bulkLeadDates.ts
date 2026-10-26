export type SavedLeadDates = {
  id: string;
  leadDate: string;
  createdAt: string;
};

type DatedRow = {
  id?: string;
  leadDate?: string;
  createdAt?: string;
  lead?: { id: string; leadDate?: string; createdAt?: string };
};

function rowId(row: unknown): string | undefined {
  if (!row || typeof row !== "object") return undefined;
  const record = row as DatedRow;
  return record.lead?.id ?? record.id;
}

export function applySavedLeadDates<T>(row: T, savedById: ReadonlyMap<string, SavedLeadDates>): T {
  if (!row || typeof row !== "object") return row;
  const record = row as DatedRow;
  if (record.lead && savedById.has(record.lead.id)) {
    const saved = savedById.get(record.lead.id)!;
    return {
      ...record,
      lead: { ...record.lead, leadDate: saved.leadDate, createdAt: saved.createdAt },
    } as T;
  }
  if (record.id && savedById.has(record.id)) {
    const saved = savedById.get(record.id)!;
    return { ...record, leadDate: saved.leadDate, createdAt: saved.createdAt } as T;
  }
  return row;
}

type Page<T> = { data: T[] };

/** Paint saved dates onto the rows currently shown. */
export function overlaySavedLeadDates<T>(page: Page<T>, saved: readonly SavedLeadDates[]): Page<T> {
  const byId = new Map(saved.map((row) => [row.id, row]));
  return { ...page, data: page.data.map((row) => applySavedLeadDates(row, byId)) };
}

/**
 * Keep the rows that were on screen, refresh them from the new list when they
 * are still there, and apply the dates read back from the database.
 */
export function keepVisibleRowsWithSavedDates<T>(
  previous: Page<T>,
  fresh: Page<T>,
  saved: readonly SavedLeadDates[],
): Page<T> {
  const byId = new Map(saved.map((row) => [row.id, row]));
  const freshById = new Map(fresh.data.map((row) => [rowId(row), row]));
  const data = previous.data.map((row) => {
    const id = rowId(row);
    const base = (id && freshById.get(id)) || row;
    return applySavedLeadDates(base, byId);
  });
  return { ...fresh, data };
}
