import { describe, it, expect } from "vitest";
import { shouldHardRedirectOn403 } from "@/lib/forbidden-redirect";

describe("shouldHardRedirectOn403", () => {
  it("does not redirect on a notifications 403 while on Bellaviu", () => {
    expect(
      shouldHardRedirectOn403("/bellaviu-clients", {
        module: "notifications",
        page: "all_notifications",
        action: "view",
      }),
    ).toBe(false);
  });

  it("does not redirect when the 403 has no required payload", () => {
    expect(shouldHardRedirectOn403("/bellaviu-clients", undefined)).toBe(false);
    expect(shouldHardRedirectOn403("/leads", null)).toBe(false);
  });

  it("does not redirect on dashboard even if a module is denied", () => {
    expect(
      shouldHardRedirectOn403("/dashboard/overview", {
        module: "leads",
        page: "all_leads",
        action: "view",
      }),
    ).toBe(false);
  });

  it("does not redirect on authenticated self-service routes", () => {
    expect(
      shouldHardRedirectOn403("/notifications", {
        module: "notifications",
        page: "all_notifications",
        action: "view",
      }),
    ).toBe(false);
  });

  it("redirects when the 403 matches the current page module", () => {
    expect(
      shouldHardRedirectOn403("/bellaviu-clients", {
        module: "bellaviu_client_data",
        page: "all_bellaviu_clients",
        action: "view",
      }),
    ).toBe(true);
  });

  it("redirects on /leads when leads view is denied", () => {
    expect(
      shouldHardRedirectOn403("/leads", {
        module: "leads",
        page: "all_leads",
        action: "view",
      }),
    ).toBe(true);
  });

  it("does not redirect on /leads when a different module is denied", () => {
    expect(
      shouldHardRedirectOn403("/leads", {
        module: "hrms",
        page: "attendance",
        action: "view",
      }),
    ).toBe(false);
  });
});
