import { describe, expect, it } from "vitest";
import { canMutateDealClosedLead, isDealClosedStatus } from "../dealClosedLock";

describe("Deal Closed unlock rules", () => {
  it("recognises the closed status", () => {
    expect(isDealClosedStatus("Deal Closed")).toBe(true);
    expect(isDealClosedStatus(" deal closed ")).toBe(true);
    expect(isDealClosedStatus("Fresh")).toBe(false);
  });

  it("allows only Master to change a closed lead", () => {
    expect(canMutateDealClosedLead("master", "Deal Closed")).toBe(true);
    expect(canMutateDealClosedLead("sales_manager", "Deal Closed")).toBe(false);
    expect(canMutateDealClosedLead("sales_executive", "Deal Closed")).toBe(false);
    expect(canMutateDealClosedLead("hr_manager", "Deal Closed")).toBe(false);
  });

  it("leaves open leads editable for every role", () => {
    expect(canMutateDealClosedLead("sales_executive", "Follow Up")).toBe(true);
    expect(canMutateDealClosedLead("sales_manager", "Fresh")).toBe(true);
  });
});
