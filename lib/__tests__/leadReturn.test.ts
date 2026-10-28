import { describe, expect, it } from "vitest";
import {
  ALL_LEADS_LIST_KEY,
  FOLLOWUP_LIST_FIELDS,
  LEAD_LIST_FIELDS,
  buildLeadDetailHref,
  buildLeadEditHref,
  readListState,
  resolveLeadBackLink,
  sanitizeReturnTo,
  writeListState,
  type KeyValueStore,
} from "../leadReturn";

const LEAD_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";

function memory(): KeyValueStore {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

describe("sanitizeReturnTo", () => {
  it("keeps lead and follow-up list paths", () => {
    expect(sanitizeReturnTo("/leads/untouched")).toBe("/leads/untouched");
    expect(sanitizeReturnTo("/followup/missed")).toBe("/followup/missed");
    expect(sanitizeReturnTo("/leads/deal-closed/")).toBe("/leads/deal-closed");
  });

  it("keeps safe All Leads query params and drops the rest", () => {
    expect(sanitizeReturnTo(`/leads?leadIds=${LEAD_ID}&assignedTo=${USER_ID}&search=drop`)).toBe(
      `/leads?leadIds=${LEAD_ID}&assignedTo=${USER_ID}`,
    );
    expect(sanitizeReturnTo("/leads?leadIds=not-an-id")).toBe("/leads");
    expect(sanitizeReturnTo("/followup/missed?page=3")).toBe("/followup/missed");
  });

  it("rejects other destinations", () => {
    expect(sanitizeReturnTo("https://evil.example/leads")).toBeNull();
    expect(sanitizeReturnTo("//evil.example")).toBeNull();
    expect(sanitizeReturnTo("/\\evil.example")).toBeNull();
    expect(sanitizeReturnTo(`/leads/${LEAD_ID}`)).toBeNull();
    expect(sanitizeReturnTo(`/leads/${LEAD_ID}/edit`)).toBeNull();
    expect(sanitizeReturnTo("/dashboard")).toBeNull();
    expect(sanitizeReturnTo("")).toBeNull();
  });
});

describe("lead back links", () => {
  it("points the detail page at the list the user came from", () => {
    expect(buildLeadDetailHref(LEAD_ID, "/followup/missed")).toBe(
      `/leads/${LEAD_ID}?from=${encodeURIComponent("/followup/missed")}`,
    );
    expect(buildLeadEditHref(LEAD_ID, "/leads/untouched")).toBe(
      `/leads/${LEAD_ID}/edit?from=${encodeURIComponent("/leads/untouched")}`,
    );
  });

  it("labels the return link for that list", () => {
    expect(resolveLeadBackLink("/followup/missed")).toEqual({
      href: "/followup/missed",
      label: "Back to Missed follow-ups",
    });
    expect(resolveLeadBackLink("/leads/untouched")).toEqual({
      href: "/leads/untouched",
      label: "Back to Untouched leads",
    });
    expect(resolveLeadBackLink(null, true)).toEqual({
      href: "/leads/deal-closed",
      label: "Back to Deal Closed",
    });
    expect(resolveLeadBackLink("https://evil.example")).toEqual({
      href: "/leads",
      label: "Back to leads",
    });
  });
});

describe("list state", () => {
  it("round-trips filters and drops unknown values", () => {
    const store = memory();
    writeListState(
      ALL_LEADS_LIST_KEY,
      {
        page: 3,
        pageSize: 50,
        search: "  marina ",
        status: "Follow Up",
        dateFrom: "2026-01-02",
        dateField: "manual",
        category: "untouched",
        assignedTo: USER_ID.toUpperCase(),
        leadIds: LEAD_ID,
        pageSizeBad: 15,
        evil: "<script>",
      },
      LEAD_LIST_FIELDS,
      store,
    );

    expect(readListState(ALL_LEADS_LIST_KEY, LEAD_LIST_FIELDS, store)).toEqual({
      page: 3,
      pageSize: 50,
      search: "marina",
      status: "Follow Up",
      dateFrom: "2026-01-02",
      dateField: "manual",
      category: "untouched",
      assignedTo: USER_ID,
    });
  });

  it("keeps the follow-up view mode", () => {
    const store = memory();
    writeListState("followup", { page: 2, pageSize: 25, search: "ali", view: "calendar", tab: "missed" }, FOLLOWUP_LIST_FIELDS, store);
    expect(readListState("followup", FOLLOWUP_LIST_FIELDS, store)).toEqual({
      page: 2,
      pageSize: 25,
      search: "ali",
      view: "calendar",
    });
  });
});
