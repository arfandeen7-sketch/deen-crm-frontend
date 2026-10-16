/** Lead ids a "select all" click should check. Just-assigned ids stay unchecked. */
export function idsForSelectAll(rowIds: string[], lockedIds: ReadonlySet<string>): string[] {
  return rowIds.filter((id) => !lockedIds.has(id));
}

export function toggleLeadSelection(selected: string[], id: string): string[] {
  return selected.includes(id) ? selected.filter((current) => current !== id) : [...selected, id];
}

/** Drops ids that are no longer on the current page so a stale selection cannot be submitted. */
export function pruneLeadSelection(selected: string[], rowIds: readonly string[]): string[] {
  if (selected.length === 0) return selected;
  const visible = new Set(rowIds);
  const next = selected.filter((id) => visible.has(id));
  return next.length === selected.length ? selected : next;
}
