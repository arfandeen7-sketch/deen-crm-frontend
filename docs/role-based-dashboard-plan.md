# Role-Based Dashboard UX Implementation Plan

## Goal

Replace the single leads-centric `/dashboard/overview` page with role-specific dashboard layouts. Master stays unchanged. Other roles (hr_manager, sales_manager, sales_executive) get purpose-built dashboards with relevant stats, widgets, and quick actions — no more seeing 0s for modules they can't access.

## Current Architecture

### Permission System
- **3-level**: Module → Page → Action (`AccessMap` type in `@/types`)
- Fetched via `GET /me/profile` → `permissionsService.getMyAccess()`
- `PermissionProvider` (`@/contexts/PermissionContext`) caches and exposes `canModule`, `canPage`, `canAction`
- `useAuth()` hook exposes `role`, `isMaster`, `hasModule`, `canPage`, `canAction`
- `AccessGuard` component wraps pages for route-level protection
- `CanAccess` component for inline conditional rendering

### Roles (from `@/types` and `@/lib/rbac`)
| Role | Default Modules |
|---|---|
| `master` | Everything (isMaster: true) |
| `hr_manager` | `hrms` |
| `sales_manager` | `leads`, `followup`, `brokers` |
| `sales_executive` | `leads`, `followup` |

### Current Dashboard (`app/(dashboard)/dashboard/overview/page.tsx`)
- **No permission checks at all** — unconditionally calls leads hooks
- Shows: Total Leads, Untouched, Interested, Unassigned stat strip → Leads by Source donut chart → Missed Follow-ups → Recent Leads → Quick Actions (Create Lead, Import Leads, Lead Reports, Add Broker, Add Candidate)
- All roles see this same page, resulting in 0s for unauthorized roles

### Available Hooks (already exist, reusable)
- **Leads**: `useDashboardSummary`, `useRecentLeads`, `useStatusCount`, `useLeadCategoryCount`
- **Follow-ups**: `useFollowup("missed"|"today"|"upcoming", params)`, `useMissedFollowupCount`, `useTodayFollowupCount`
- **HRMS**: `useEmployeeList`, `useLeaveList`, `useAttendanceList`, `useTodayAttendance`, `useMyAttendance`, `useLeaveBalance`, `usePayslipList`, `useMyPayslips`
- **Teams**: `useMyTeam`
- **Auth**: `useAuth()` → `user`, `role`, `isMaster`

### Backend Behavior (verified)

1. **`GET /leads`**: For `sales_executive`, the `assignedTo` query param is **silently ignored** — the backend hardcodes `where.assignedTo = req.user.id`. The executive always sees only their own leads regardless of what they pass. **We don't need to pass `assignedTo` for sales_executive — the backend auto-scopes.**

2. **`GET /followup/today|missed|upcoming`**: Auto-scope for `sales_executive` and `sales_manager` — no `assignedTo` param accepted. **Important caveat**: `sales_manager` only sees their own follow-ups, NOT their team's. This is a backend inconsistency with the leads controller (where managers see team members' leads), but it doesn't affect the frontend plan — we just don't pass `assignedTo`.

3. **`GET /dashboard/summary`**: For `sales_executive`/`sales_manager`, scoped to own leads. For `master`, returns global. For `hr_manager`: **returns 403** (no dashboard module access by default). The HR dashboard must NOT call this endpoint.

4. **No HR dashboard endpoint exists**: No backend route, no service, no type. The `HrDashboardSummary` type in `@/types/index.ts` is a **frontend-only type with no backend backing**. The HR dashboard must compose from individual hooks (`useEmployeeList`, `useAttendanceList`, `useLeaveList`, `usePayslipList`).

5. **`GET /me/attendance/today` and `/me/attendance`**: Work for all roles (self-service endpoints).

---

## Implementation Plan

### Step 1: Create Role-Specific Dashboard Components

Create a new directory: `components/dashboard/role-specific/`

#### 1a. `MasterDashboard.tsx`
- **Extract** the current `page.tsx` content into this component unchanged
- This is a pure refactor — master sees exactly what they see today
- Props: none (self-contained, uses existing hooks)

#### 1b. `HrManagerDashboard.tsx`
Purpose-built HR dashboard with:

**Stat Strip (4 cards)**:
- Total Employees → `useEmployeeList({ pageSize: 1 })` → `.total`
- Present Today → `useAttendanceList({ dateFrom: today, dateTo: today, pageSize: 1 })` → `.total`
- Pending Leaves → `useLeaveList({ status: "pending", pageSize: 1 })` → `.total`
- Pending Payroll → `usePayslipList({ status: "draft", pageSize: 1 })` → `.total` (or show "Processed This Month")

**Main Section (2-column split)**:
- **Left (2/3): Attendance Overview**
  - Today's attendance breakdown: Present / Late / Absent / Half Day / Leave
  - Use `useAttendanceList({ dateFrom: today, dateTo: today, pageSize: 100 })` and compute counts client-side
  - Display as horizontal bar stat cards (matching the design language of the master dashboard)

- **Right (1/3): Pending Leave Requests**
  - List recent pending leave requests (top 3-4)
  - Use `useLeaveList({ status: "pending", pageSize: 4 })`
  - Show employee name, leave type, date range, and a quick "Review" link → `/hrms/leave`

**Quick Actions (role-specific)**:
- Add Employee → `/hrms/employees/create`
- Review Leaves → `/hrms/leave`
- Generate Payslip → `/hrms/payroll`
- Email Config → `/hrms/email-config`
- HR Reports → `/hrms/reports`

#### 1c. `SalesManagerDashboard.tsx`
Very similar to master dashboard but with sales-manager-specific quick actions:

**Stat Strip (4 cards)** — same as master:
- Total Leads → `useDashboardSummary()` → `.totalLeads`
- Untouched Leads → `useLeadCategoryCount("untouched")`
- Interested → `useStatusCount("Interested")`
- Unassigned Leads → `useLeadCategoryCount("unassigned")`

**Main Section** — same as master:
- Leads by Source donut chart + legend
- Missed Follow-ups list (top 3)
- Recent Leads list (top 4)
- My Team summary card (optional: small widget linking to `/my-team` with team size + total leads)

**Quick Actions (sales-manager-specific)**:
- Create Lead → `/leads/create`
- Import Leads → `/leads/import`
- Lead Reports → `/leads/reports`
- Add Broker → `/brokers/create`
- My Team → `/my-team`

#### 1d. `SalesExecutiveDashboard.tsx`
Personal/self-service focused dashboard:

**Stat Strip (4 cards)**:
- My Leads → `leadsService.list({ page: 1, pageSize: 1 })` → `.total` (backend auto-scopes to executive's leads)
- Today's Follow-ups → `followupService.today({ page: 1, pageSize: 1 })` → `.total` (backend auto-scopes)
- Missed Follow-ups → `followupService.missed({ page: 1, pageSize: 1 })` → `.total` (backend auto-scopes)
- Upcoming Follow-ups → `followupService.upcoming({ page: 1, pageSize: 1 })` → `.total` (backend auto-scopes)

**Main Section (2-column split)**:
- **Left (2/3): My Follow-ups Today**
  - List of today's follow-ups (top 5)
  - Use `useFollowup("today", { page: 1, pageSize: 5 })` (backend auto-scopes to executive's leads)
  - Show lead name, follow-up date, status badge
  - Link to `/followup/today` for full list

- **Right (1/3): Attendance Check-In Widget**
  - Reuse `AttendanceCheckInOut` component (already exists at `@/components/hrms/AttendanceCheckInOut`)
  - Shows check-in/check-out buttons + today's status
  - Compact layout

**Bottom Section**:
- **Missed Follow-ups Alert** (if any)
  - Use `useFollowup("missed", { page: 1, pageSize: 3 })` (backend auto-scopes)
  - Red-themed alert card listing missed follow-ups
  - Link to `/followup/missed`

**Quick Actions (sales-executive-specific)**:
- Create Lead → `/leads/create`
- My Follow-ups → `/followup/today`
- My Attendance → `/my-hr/attendance`
- Apply Leave → `/my-hr/leaves`
- My Payslips → `/my-hr/payslips`

### Step 2: Create a Role Dashboard Router Component

**File**: `components/dashboard/RoleDashboardRouter.tsx`

```tsx
"use client";
import { useAuth } from "@/hooks/useAuth";
import { MasterDashboard } from "./role-specific/MasterDashboard";
import { HrManagerDashboard } from "./role-specific/HrManagerDashboard";
import { SalesManagerDashboard } from "./role-specific/SalesManagerDashboard";
import { SalesExecutiveDashboard } from "./role-specific/SalesExecutiveDashboard";
import { LoadingState } from "@/components/ui/States";

export function RoleDashboardRouter() {
  const { role, hydrated } = useAuth();

  if (!hydrated) {
    return <LoadingState label="Loading dashboard..." />;
  }

  switch (role) {
    case "master":
      return <MasterDashboard />;
    case "hr_manager":
      return <HrManagerDashboard />;
    case "sales_manager":
      return <SalesManagerDashboard />;
    case "sales_executive":
      return <SalesExecutiveDashboard />;
    default:
      return <MasterDashboard />;
  }
}
```

### Step 3: Update the Overview Page

**File**: `app/(dashboard)/dashboard/overview/page.tsx`

Replace the entire page body with:

```tsx
"use client";
import { RoleDashboardRouter } from "@/components/dashboard/RoleDashboardRouter";

export default function DashboardOverviewPage() {
  return <RoleDashboardRouter />;
}
```

This keeps the route `/dashboard/overview` the same for all roles — only the content changes.

### Step 4: Add Role-Specific Quick Actions Config

**File**: `constants/dashboard.ts` (new file)

Define quick action arrays per role so they're easy to maintain:

```ts
import type { UserRole } from "@/types";
import { UserPlus, Upload, BarChart2, Handshake, Briefcase, ... } from "lucide-react";

export const ROLE_QUICK_ACTIONS: Record<UserRole, QuickAction[]> = {
  master: [ /* current QUICK_ACTIONS */ ],
  hr_manager: [ /* HR actions */ ],
  sales_manager: [ /* Sales manager actions */ ],
  sales_executive: [ /* Sales exec actions */ ],
};
```

Each role-specific dashboard component imports its quick actions from here.

### Step 5: Add Custom Hooks for Sales Executive Dashboard

**File**: `hooks/useDashboard.ts` (add to existing file)

The backend auto-scopes leads and follow-ups for `sales_executive`, so we do NOT pass `assignedTo`. The existing `useDashboardSummary`, `useRecentLeads`, `useStatusCount`, and `useLeadCategoryCount` hooks already work correctly for sales_executive (backend returns only their data). We can reuse them directly.

However, for follow-up counts on the sales executive dashboard, we need lightweight count hooks:

```ts
// Follow-up count for a specific bucket (today/missed/upcoming)
// Backend auto-scopes for sales_executive and sales_manager
export function useFollowupCount(bucket: "today" | "missed" | "upcoming") {
  return useQuery({
    queryKey: ["dashboard", "followup-count", bucket],
    queryFn: async () => {
      const { followupService } = await import("@/services/leads/leads.service");
      const fn = bucket === "today" ? followupService.today : bucket === "missed" ? followupService.missed : followupService.upcoming;
      const res = await fn({ page: 1, pageSize: 1 });
      return res.total;
    },
    refetchInterval: POLL_FAST,
  });
}
```

Note: `useTodayFollowupCount` and `useMissedFollowupCount` already exist in `useDashboard.ts` but only cover today/missed. Add `useUpcomingFollowupCount` for the upcoming bucket.

### Step 6: Verify Sidebar "Dashboard" Link

The sidebar's Dashboard group is `isSingular` with `href: "/dashboard/overview"` and no `moduleKey` — it's always visible. This is correct: all roles see the Dashboard link, and it routes to `/dashboard/overview` which now renders role-specific content. **No sidebar changes needed.**

### Step 7: Handle Edge Cases

- **Permission loading state**: The `PermissionProvider` fetches access on mount. The dashboard should wait for `hydrated` before rendering role-specific content (handled by `RoleDashboardRouter`).
- **Fallback for unknown roles**: Default to `MasterDashboard` (shouldn't happen in practice).
- **Demo tokens**: Demo tokens get `MASTER_ACCESS` — they'll see the master dashboard. This is correct.
- **API errors on role-specific hooks**: Each hook should gracefully handle errors (return 0 / empty). Use TanStack Query's `data ?? 0` pattern already in use.

---

## File Changes Summary

| File | Action | Description |
|---|---|---|
| `components/dashboard/role-specific/MasterDashboard.tsx` | **New** | Extracted current dashboard content |
| `components/dashboard/role-specific/HrManagerDashboard.tsx` | **New** | HR-focused dashboard |
| `components/dashboard/role-specific/SalesManagerDashboard.tsx` | **New** | Sales manager dashboard (similar to master) |
| `components/dashboard/role-specific/SalesExecutiveDashboard.tsx` | **New** | Personal/self-service dashboard |
| `components/dashboard/RoleDashboardRouter.tsx` | **New** | Switch component that picks the right dashboard |
| `app/(dashboard)/dashboard/overview/page.tsx` | **Modify** | Replace body with `<RoleDashboardRouter />` |
| `constants/dashboard.ts` | **New** | Role-specific quick action configs |
| `hooks/useDashboard.ts` | **Modify** | Add `useUpcomingFollowupCount` hook (today/missed already exist) |

**Total**: 6 new files, 2 modified files

---

## What Does NOT Change

- **Master dashboard**: Identical to current (just extracted to a component)
- **Sidebar**: Already filters by permissions correctly
- **Route structure**: `/dashboard/overview` stays the same for all roles
- **Page guards**: `AccessGuard` on other pages already works correctly
- **Backend**: No backend changes required (all needed endpoints exist and auto-scope correctly)
- **Auth/permission system**: No changes to `PermissionProvider`, `useAuth`, `rbac.ts`, etc.

---

## Backend Notes (verified)

1. **Leads auto-scoping**: `GET /leads` for `sales_executive` hardcodes `assignedTo = req.user.id` — the `assignedTo` query param is silently ignored. No need to pass it.
2. **Follow-up auto-scoping**: `GET /followup/today|missed|upcoming` auto-scopes for `sales_executive` and `sales_manager`. No `assignedTo` param accepted. **Caveat**: `sales_manager` sees only their own follow-ups, not their team's (backend inconsistency with leads controller — managers see team leads but not team follow-ups).
3. **Dashboard summary 403 for HR**: `GET /dashboard/summary` returns 403 for `hr_manager` (no dashboard module access). The HR dashboard must NOT call leads endpoints — it composes from HRMS hooks only.
4. **No HR dashboard endpoint**: The `HrDashboardSummary` type in `@/types/index.ts` is frontend-only with no backend backing. HR dashboard composes from `useEmployeeList`, `useAttendanceList`, `useLeaveList`, `usePayslipList`.
5. **`HrDashboardSummary` type**: Can be removed from `types/index.ts` in a future cleanup since it's unused and has no backend backing. Not part of this plan to avoid scope creep.
