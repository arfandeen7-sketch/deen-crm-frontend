import { describe, expect, it } from "vitest";
import { assignmentLeadIds, assignmentNotificationHref } from "../assignmentNotification";
import { idsForSelectAll, pruneLeadSelection } from "../leadSelection";

function uuid(n: number): string {
  return `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
}

describe("assignment notification navigation", () => {
  it("opens one assigned lead directly", () => {
    const id = uuid(1);
    expect(assignmentNotificationHref(id)).toBe(`/leads/${id}`);
  });

  it("opens all 100 leads from a bulk assignment notification", () => {
    const leads = Array.from({ length: 100 }, (_, index) => ({ id: uuid(index + 1) }));
    const href = assignmentNotificationHref(null, leads);
    expect(href?.startsWith("/leads?leadIds=")).toBe(true);
    const ids = assignmentLeadIds(leads);
    expect(ids).toHaveLength(100);
    for (const id of ids) {
      expect(href).toContain(id);
    }
  });

  it("keeps a chip click on that lead when the batch also has a list", () => {
    const leads = Array.from({ length: 100 }, (_, index) => ({ id: uuid(index + 1) }));
    expect(assignmentNotificationHref(leads[4].id, leads)).toBe(`/leads/${leads[4].id}`);
  });
});

describe("bulk assign selection", () => {
  const page = Array.from({ length: 100 }, (_, index) => uuid(index + 1));

  it("does not select leads that were just assigned", () => {
    const locked = new Set(page);
    expect(idsForSelectAll(page, locked)).toEqual([]);
  });

  it("selects only the leads that were not part of the last assignment", () => {
    const locked = new Set(page.slice(0, 40));
    expect(idsForSelectAll(page, locked)).toEqual(page.slice(40));
  });

  it("drops a stale selection after the table refreshes to a new page", () => {
    const nextPage = Array.from({ length: 25 }, (_, index) => uuid(index + 200));
    expect(pruneLeadSelection(page, nextPage)).toEqual([]);
    expect(pruneLeadSelection(nextPage.slice(0, 3), nextPage)).toEqual(nextPage.slice(0, 3));
  });
});
