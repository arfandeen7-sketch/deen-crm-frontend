import type { Column } from "@/components/tables/DataTable";

export const LOCKED_COLUMN_KEYS = new Set(["actions"]);

export function columnLabel<T>(col: Column<T>): string {
  if (typeof col.header === "string" && col.header.trim()) return col.header;
  if (col.key === "actions") return "Actions";
  return col.key.replace(/^custom:/, "").replace(/_/g, " ");
}

export function mergeColumnOrder(storedOrder: string[], availableKeys: string[]): string[] {
  const available = new Set(availableKeys);
  const merged = storedOrder.filter((key) => available.has(key));
  for (const key of availableKeys) {
    if (!merged.includes(key)) merged.push(key);
  }
  return merged;
}

export function applyColumnPrefs<T>(
  columns: Column<T>[],
  storedOrder: string[],
  hidden: string[],
): Column<T>[] {
  const byKey = new Map(columns.map((c) => [c.key, c]));
  const locked = columns.filter((c) => LOCKED_COLUMN_KEYS.has(c.key));
  const configurable = columns.filter((c) => !LOCKED_COLUMN_KEYS.has(c.key));
  const orderedKeys = mergeColumnOrder(
    storedOrder,
    configurable.map((c) => c.key),
  );
  const hiddenSet = new Set(hidden);

  const visible = orderedKeys
    .filter((key) => !hiddenSet.has(key))
    .map((key) => byKey.get(key))
    .filter((col): col is Column<T> => Boolean(col));

  if (visible.length === 0 && configurable[0]) {
    visible.push(configurable[0]);
  }

  return [...visible, ...locked];
}
