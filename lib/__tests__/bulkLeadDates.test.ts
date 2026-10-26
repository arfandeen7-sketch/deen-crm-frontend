import { describe, expect, it } from "vitest";
import { keepVisibleRowsWithSavedDates, overlaySavedLeadDates } from "../bulkLeadDates";

const saved = [
  { id: "a", leadDate: "2026-01-02T00:00:00.000Z", createdAt: "2026-01-01T20:00:00.000Z" },
  { id: "b", leadDate: "2026-03-04T00:00:00.000Z", createdAt: "2026-03-03T20:00:00.000Z" },
];

describe("saved lead dates", () => {
  it("updates inquiry and created dates on the rows that were saved", () => {
    const page = overlaySavedLeadDates(
      {
        data: [
          { id: "a", leadDate: "2020-01-01T00:00:00.000Z", createdAt: "2020-01-01T00:00:00.000Z", leadName: "A" },
          { id: "c", leadDate: "2020-05-05T00:00:00.000Z", createdAt: "2020-05-05T00:00:00.000Z", leadName: "C" },
        ],
      },
      saved,
    );
    expect(page.data[0]).toMatchObject({ leadDate: saved[0].leadDate, createdAt: saved[0].createdAt, leadName: "A" });
    expect(page.data[1].leadName).toBe("C");
  });

  it("updates a deal row through its nested lead", () => {
    const page = overlaySavedLeadDates(
      { data: [{ lead: { id: "b", leadDate: "old", createdAt: "old" } }] },
      saved,
    );
    expect(page.data[0].lead).toMatchObject({ leadDate: saved[1].leadDate, createdAt: saved[1].createdAt });
  });

  it("keeps the visible rows selected after the list refreshes", () => {
    const previous = {
      data: [
        { id: "a", leadDate: "old", createdAt: "old" },
        { id: "b", leadDate: "old", createdAt: "old" },
      ],
    };
    const fresh = {
      data: [{ id: "b", leadDate: saved[1].leadDate, createdAt: saved[1].createdAt, leadStatus: "Fresh" }],
      total: 1,
    };
    const page = keepVisibleRowsWithSavedDates(previous, fresh, saved);
    expect(page.data.map((row) => row.id)).toEqual(["a", "b"]);
    expect(page.data[0]).toMatchObject({ leadDate: saved[0].leadDate, createdAt: saved[0].createdAt });
    expect(page.data[1]).toMatchObject({ leadStatus: "Fresh", leadDate: saved[1].leadDate });
  });
});
