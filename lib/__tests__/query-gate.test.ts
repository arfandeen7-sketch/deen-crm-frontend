import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { retrySkipAuth } from "@/lib/query-gate";
import type { AccessMap } from "@/types";

// Mock useAuth and usePermissions to avoid React hook context issues
const mockPermissionStatus = { current: "ready" as string };
const mockAccess = { current: null as AccessMap | null };

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    permissionStatus: mockPermissionStatus.current,
    access: mockAccess.current,
  }),
}));

vi.mock("@/contexts/PermissionContext", () => ({
  usePermissions: () => ({
    canModule: (m: string) =>
      mockAccess.current?.modules.includes(m) ?? false,
    canPage: (m: string, p: string) =>
      mockAccess.current?.pages[m]?.[p] ?? false,
    canAction: (m: string, p: string, a: string) =>
      mockAccess.current?.actions[m]?.[p]?.[a] ?? false,
  }),
}));

// Import useQueryEnabled lazily so mocks are registered first
let useQueryEnabled: (req: import("@/lib/auth-manifest").PermissionRequirement | string | undefined) => boolean;

const GRANTED_ACCESS: AccessMap = {
  isMaster: false,
  modules: ["leads"],
  pages: { leads: { all_leads: true } },
  actions: { leads: { all_leads: { view: true } } },
};

describe("useQueryEnabled", () => {
  beforeAll(async () => {
    const mod = await import("@/lib/query-gate");
    useQueryEnabled = mod.useQueryEnabled;
  });

  beforeEach(() => {
    mockPermissionStatus.current = "ready";
    mockAccess.current = GRANTED_ACCESS;
  });

  it("returns true when user has the required permission", () => {
    const result = useQueryEnabled({ module: "leads", page: "all_leads", action: "view" });
    expect(result).toBe(true);
  });

  it("returns false when user lacks the required permission", () => {
    const result = useQueryEnabled({ module: "hrms", page: "employees", action: "view" });
    expect(result).toBe(false);
  });

  it("returns true for self-service queries when authenticated", () => {
    const result = useQueryEnabled("notifications:unread-count");
    expect(result).toBe(true);
  });

  it("returns false when permission status is not ready", () => {
    mockPermissionStatus.current = "loading";
    const result = useQueryEnabled({ module: "leads", page: "all_leads", action: "view" });
    expect(result).toBe(false);
  });

  it("returns true when requirement is undefined (authenticated-only)", () => {
    const result = useQueryEnabled(undefined);
    expect(result).toBe(true);
  });
});

describe("retrySkipAuth", () => {
  it("returns false on 401 errors", () => {
    const error = { response: { status: 401 } };
    expect(retrySkipAuth(0, error)).toBe(false);
  });

  it("returns false on 403 errors", () => {
    const error = { response: { status: 403 } };
    expect(retrySkipAuth(0, error)).toBe(false);
  });

  it("returns true for other errors under retry limit", () => {
    const error = { response: { status: 500 } };
    expect(retrySkipAuth(0, error)).toBe(true);
    expect(retrySkipAuth(1, error)).toBe(true);
  });

  it("returns false after max retries (2)", () => {
    const error = { response: { status: 500 } };
    expect(retrySkipAuth(2, error)).toBe(false);
  });

  it("returns true for generic errors under retry limit", () => {
    const error = new Error("network failure");
    expect(retrySkipAuth(0, error)).toBe(true);
    expect(retrySkipAuth(1, error)).toBe(true);
  });

  it("returns false for generic errors after max retries", () => {
    const error = new Error("network failure");
    expect(retrySkipAuth(2, error)).toBe(false);
  });
});
