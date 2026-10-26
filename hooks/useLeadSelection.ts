"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { idsForSelectAll, pruneLeadSelection, toggleLeadSelection } from "@/lib/leadSelection";

/**
 * Page selection for lead tables.
 * Checkboxes stay selected after assign, status, and field updates so the
 * same leads can be updated again without selecting them a second time.
 * Ids assigned in this visit are skipped by select-all, so checking the
 * header box later does not pick those leads up again. An individual row
 * can still be checked when a reassignment is intentional.
 */
export function useLeadSelection(rowIds: string[]) {
  const [selected, setSelected] = useState<string[]>([]);
  const lockedRef = useRef(new Set<string>());
  const rowKey = rowIds.join("\n");

  useEffect(() => {
    const ids = rowKey === "" ? [] : rowKey.split("\n");
    setSelected((current) => pruneLeadSelection(current, ids));
  }, [rowKey]);

  function toggleRow(id: string) {
    setSelected((current) => toggleLeadSelection(current, id));
  }

  function toggleAll(checked: boolean) {
    if (!checked) {
      setSelected([]);
      return;
    }
    const next = idsForSelectAll(rowIds, lockedRef.current);
    setSelected(next);
    const skipped = rowIds.length - next.length;
    if (skipped > 0) {
      toast.info(
        next.length === 0
          ? `${skipped} lead${skipped === 1 ? "" : "s"} on this page were just assigned, so they stayed unselected.`
          : `${skipped} just-assigned lead${skipped === 1 ? "" : "s"} stayed unselected.`,
      );
    }
  }

  function lockAssigned(ids: string[]) {
    for (const id of ids) lockedRef.current.add(id);
  }

  function clear() {
    setSelected([]);
  }

  return { selected, toggleRow, toggleAll, lockAssigned, clear };
}
