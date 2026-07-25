import { describe, it, expect } from "vitest";
import {
  QUERY_REQUIREMENTS,
  SELF_SERVICE_QUERIES,
  resolveRouteRequirement,
} from "@/lib/auth-manifest";

describe("auth-manifest — QUERY_REQUIREMENTS", () => {
  it("contains entries for all core modules", () => {
    const keys = Object.keys(QUERY_REQUIREMENTS);
    expect(keys.some((k) => k.startsWith("leads:"))).toBe(true);
    expect(keys.some((k) => k.startsWith("hrms:"))).toBe(true);
    expect(keys.some((k) => k.startsWith("brokers:"))).toBe(true);
    expect(keys.some((k) => k.startsWith("users:"))).toBe(true);
    expect(keys.some((k) => k.startsWith("integrations:"))).toBe(true);
    expect(keys.some((k) => k.startsWith("dynamic-fields:"))).toBe(true);
    expect(keys.some((k) => k.startsWith("teams:"))).toBe(true);
    expect(keys.some((k) => k.startsWith("lead-reports:"))).toBe(true);
  });

  it("has view action for all list queries", () => {
    const listKeys = Object.keys(QUERY_REQUIREMENTS).filter((k) =>
      k.endsWith(":list") || k.endsWith(":detail"),
    );
    for (const key of listKeys) {
      expect(QUERY_REQUIREMENTS[key].action).toBe("view");
    }
  });
});

describe("auth-manifest — SELF_SERVICE_QUERIES", () => {
  it("includes notification queries", () => {
    expect(SELF_SERVICE_QUERIES.has("notifications:list")).toBe(true);
    expect(SELF_SERVICE_QUERIES.has("notifications:unread-count")).toBe(true);
  });

  it("includes self-service HRMS queries", () => {
    expect(SELF_SERVICE_QUERIES.has("hrms:my-attendance")).toBe(true);
    expect(SELF_SERVICE_QUERIES.has("hrms:my-leaves")).toBe(true);
    expect(SELF_SERVICE_QUERIES.has("hrms:my-payslips")).toBe(true);
  });

  it("includes my-team query", () => {
    expect(SELF_SERVICE_QUERIES.has("teams:my-team")).toBe(true);
  });
});

describe("auth-manifest — resolveRouteRequirement", () => {
  it("resolves static routes directly", () => {
    const req = resolveRouteRequirement("/leads");
    expect(req.type).toBe("permission");
  });

  it("resolves dynamic routes by pattern", () => {
    const req = resolveRouteRequirement("/leads/123");
    expect(req.type).toBe("permission");
  });

  it("resolves dynamic edit routes by pattern", () => {
    const req = resolveRouteRequirement("/leads/123/edit");
    expect(req.type).toBe("permission");
  });

  it("falls back to authenticated for unknown routes", () => {
    const req = resolveRouteRequirement("/unknown-route");
    expect(req.type).toBe("authenticated");
  });

  it("resolves self-service routes as authenticated", () => {
    expect(resolveRouteRequirement("/my-hr/attendance").type).toBe("authenticated");
    expect(resolveRouteRequirement("/settings/profile").type).toBe("authenticated");
    expect(resolveRouteRequirement("/dashboard/overview").type).toBe("authenticated");
  });
});
