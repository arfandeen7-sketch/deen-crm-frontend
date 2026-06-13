# DEEN CRM Frontend Development Progress

> Single source of truth for the project lifecycle. This file is append-only:
> never overwrite prior entries. Add a new dated session for each unit of work
> and update the inventories + change log to stay synchronized with the codebase.

## Project Overview

- **Purpose:** Enterprise lead-management CRM for DEEN Properties. Frontend that consumes the companion `deen-crm-backend` Express API (deployment target: Vercel; backend on Railway). Covers leads, follow-ups, brokers, HR candidates, attendance, users, and configurable dynamic fields, with role-based access control (`master`, `sales_manager`, `sales_executive`).
- **Technology stack:**
  - Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
  - TanStack Query (server state) + Zustand (client/auth state, persisted)
  - React Hook Form + Zod (forms & validation)
  - Tailwind CSS v4, Lucide icons, `sonner` (toasts), `clsx` + `tailwind-merge`
  - Axios (API client with JWT interceptor)
- **Architecture summary:**
  - `app/` — App Router routes split into `(auth)` and `(dashboard)` route groups, each with its own layout. Global `error.tsx`, `not-found.tsx`, and dashboard `loading.tsx` boundaries.
  - `components/` — `ui/`, `layout/`, `tables/`, `charts/`, `forms/`, `shared/`, `leads/`, `followup/`, `dashboard/`.
  - `services/` — Axios client + per-module API services (each maps to backend endpoints).
  - `hooks/` — TanStack Query hooks per module + `useAuth`.
  - `store/` — Zustand stores (auth persisted, lead filters).
  - `schemas/` — Zod validation schemas.
  - `lib/` — `utils`, `rbac`. `constants/`, `types/`, `providers/` for shared config.
  - **Auth:** JWT + user persisted in a Zustand store; axios attaches `Authorization: Bearer <token>` and redirects to `/login` on `401`. `ProtectedRoute`/`RoleGuard` mirror the backend role matrix. A gated demo-login mode allows signing in without a backend.
  - **Next.js 16 specifics:** route `params`/`searchParams` are Promises (client pages use `useParams()`); middleware is `proxy.ts` (unused — auth is client-side).

---

## Development Timeline

### Session 5

**Date:** 2026-06-08

**Completed:**

- **Major HRMS Architecture Refactor** — Replaced HR Candidate Management and Attendance Management modules with a complete Human Resource Management System (HRMS) integrated into the existing CRM.
- **New Role:** Added `hr_manager` role to `UserRole`, RBAC, constants, schemas.
- **User Model Extended:** Added employee fields: `employeeId`, `department`, `designation`, `joiningDate`, `basicSalary`, `allowances`, `bankName`, `bankAccountNumber`, `leaveBalance`, `employmentStatus`, `profilePhoto`.
- **RBAC Updated:** 7 new HR permissions (`hrms.employees`, `hrms.attendance.manage`, `hrms.leave.manage`, `hrms.payroll`, `hrms.payslip`, `hrms.email`, `hrms.reports`). Old `hr.view`, `hr.manage`, `attendance.view.all`, `attendance.manage` removed.
- **Employee Management:** Full CRUD at `/hrms/employees` with list, detail, create, edit pages. `EmployeeForm` with employment details, salary, and bank info fieldsets.
- **Attendance (Camera-based Check-In/Out):** `CameraCapture` component captures live photo via `getUserMedia`. `AttendanceCheckInOut` widget manages check-in/check-out flow with photo requirement. Shift timing: 09:30–18:30 Asia/Dubai. Auto-calculates status (present/late/half_day/absent), working hours, overtime, late minutes.
- **Leave Management:** Employee can apply for leave (`/my-hr/leaves`). HR can approve/reject (`/hrms/leave`). Types: annual, sick, emergency, unpaid. Leave balance tracking.
- **Payroll Management:** Generate monthly payroll, process individual records. Dashboard cards (total employees, pending, processed, salary). Calculates gross, deductions, leave deductions, late penalties, overtime, net salary.
- **Payslip Management:** List, download PDF, send individual/bulk email. Shows salary breakdown per month.
- **Email Configuration:** SMTP settings form with test email. Supports TLS/SSL/None encryption.
- **Login Activity Tracking:** Records login/logout time, session duration, device info, IP. HR-accessible report with filters.
- **HR Reports:** 6 report types (attendance, leave, payroll, salary, employee, login-activity). Export to Excel/CSV/PDF.
- **HR Dashboard:** 8 stat cards: total employees, present/absent/late today, logged-in users, pending leaves, payroll pending/processed.
- **My HR (all users):** `/my-hr/attendance` (check-in/out + monthly summary), `/my-hr/leaves` (apply + history + balance), `/my-hr/payslips` (view + download), `/my-hr/profile` (employee dashboard).
- **Sidebar Updated:** 9 groups including "Human Resource Management" (HR-only) and "My HR" (all users). Old "HR Management" and "Attendance Management" groups removed.
- **Dynamic Fields:** Replaced `candidate_source`, `candidate_status`, `candidate_post` categories with `department`, `designation`.
- **Constants Added:** `LEAVE_STATUS_COLORS`, `PAYROLL_STATUS_COLORS`, `EMPLOYMENT_STATUS_COLORS`, `SHIFT_CONFIG`.
- **Removed:** Old modules — `app/(dashboard)/hr/candidates/*`, `app/(dashboard)/attendance/*`, `hooks/useCandidates.ts`, `hooks/useAttendance.ts`, `components/forms/CandidateForm.tsx`, `components/forms/AttendanceForm.tsx`, `schemas/candidate.schema.ts`, `schemas/attendance.schema.ts`, `Candidate` type, old `Attendance` type.

**New Files Created:**
- `services/hrms/leave.service.ts`
- `services/hrms/payroll.service.ts`
- `services/hrms/payslip.service.ts`
- `services/hrms/email.service.ts`
- `services/hrms/login-activity.service.ts`
- `services/hrms/hr-reports.service.ts`
- `hooks/useHrms.ts`
- `schemas/employee.schema.ts`
- `schemas/leave.schema.ts`
- `schemas/email.schema.ts`
- `components/hrms/CameraCapture.tsx`
- `components/hrms/EmployeeForm.tsx`
- `components/hrms/AttendanceCheckInOut.tsx`
- `app/(dashboard)/hrms/dashboard/page.tsx`
- `app/(dashboard)/hrms/employees/page.tsx`
- `app/(dashboard)/hrms/employees/create/page.tsx`
- `app/(dashboard)/hrms/employees/[id]/page.tsx`
- `app/(dashboard)/hrms/employees/[id]/edit/page.tsx`
- `app/(dashboard)/hrms/attendance/page.tsx`
- `app/(dashboard)/hrms/leave/page.tsx`
- `app/(dashboard)/hrms/payroll/page.tsx`
- `app/(dashboard)/hrms/payslips/page.tsx`
- `app/(dashboard)/hrms/email-config/page.tsx`
- `app/(dashboard)/hrms/login-activity/page.tsx`
- `app/(dashboard)/hrms/reports/page.tsx`
- `app/(dashboard)/my-hr/attendance/page.tsx`
- `app/(dashboard)/my-hr/leaves/page.tsx`
- `app/(dashboard)/my-hr/payslips/page.tsx`
- `app/(dashboard)/my-hr/profile/page.tsx`

**Files Modified:**
- `types/index.ts` — removed Candidate, old Attendance; added HRMS types
- `lib/rbac.ts` — new HR permissions, hr_manager role
- `constants/index.ts` — new status colors, SHIFT_CONFIG, MANAGED_DYNAMIC_CATEGORIES updated
- `schemas/user.schema.ts` — hr_manager role added
- `services/hr/hr.service.ts` — rewritten as employee service
- `services/attendance/attendance.service.ts` — rewritten for camera check-in/out
- `components/layout/nav.config.ts` — HRMS + My HR groups, old groups removed
- `components/layout/Sidebar.tsx` — PARENT_EXCLUSIONS updated

**Files Removed:**
- `app/(dashboard)/hr/candidates/**`
- `app/(dashboard)/attendance/**`
- `hooks/useCandidates.ts`, `hooks/useAttendance.ts`
- `components/forms/CandidateForm.tsx`, `components/forms/AttendanceForm.tsx`
- `schemas/candidate.schema.ts`, `schemas/attendance.schema.ts`

**Build Status:** Passed (44 routes)

**TypeScript Status:** Passed

---

### Session 4

**Date:** 2026-06-08

**Completed:**

- **Sidebar Navigation Refactor** — replaced the flat labelled-section sidebar with a fully hierarchical, collapsible enterprise-style menu (HubSpot / Zoho / Salesforce pattern).
- New `NavGroup` interface (`id`, `title`, `icon`, `items[]`) replaces the old `NavSection` flat list.
- Nine top-level collapsible groups: Dashboard, Lead Management, Follow Up Management, Broker Management, HR Management, Attendance Management, User Management, Dynamic Fields, Settings.
- Each group renders as a button with icon + title + animated chevron (rotates 90° when expanded).
- Active-route logic: group header brightens and icon turns indigo when any child is active; active sub-item gets `bg-indigo-600` highlight.
- `PARENT_EXCLUSIONS` map prevents the parent list route (e.g. "All Leads") from being highlighted when on a named child route (e.g. `/leads/create`, `/leads/untouched`). Covers: leads, brokers, HR candidates, users, attendance.
- Active group auto-expands on every `pathname` change via a `useEffect`.
- Collapse/expand state persisted to `localStorage` key `deen_sidebar_open`; hydrated on mount and merged with current active group.
- All RBAC `permission` guards on individual items are fully preserved.
- Dynamic Fields group generates all 8 sub-items from `MANAGED_DYNAMIC_CATEGORIES` constant (each links to its `/dynamic-fields/[slug]` route), replacing the single "Dynamic Fields" entry.
- Broker Management, HR Management, Attendance Management, User Management each gain a dedicated "Create …" sub-item.
- `nav.config.ts` now exports `NavGroup` interface and `NAV_GROUPS` array; `NavSection` / `NAV_SECTIONS` removed; `FollowUpIcon` re-export preserved.
- Mobile responsiveness unchanged — `AppShell` drawer still passes `onNavigate` to close on link tap.

**Files Modified:**
- `components/layout/nav.config.ts` — full rewrite
- `components/layout/Sidebar.tsx` — full rewrite

**Build Status:** Passed (34 routes)

**TypeScript Status:** Passed

---

### Session 3

**Date:** 2026-06-06

**Completed:**

- **Lead Management Enhancement** — Added five new tabs/pages and a full reporting module to the Leads section.
- Untouched Leads (`/leads/untouched`): leads with no follow-up/status/notes activity. Bulk Assign + Bulk Status Update enabled.
- Imported Leads (`/leads/imported`): leads ingested via Excel/CSV or external source. Shows `ingestionSource` and import date columns.
- Assigned Leads (`/leads/assigned`): leads with an assigned user. Shows assigned-to user + assignment date; manager-level assigned-user filter.
- Non Assigned Leads (`/leads/unassigned`): leads with no assigned user. Bulk Assign enabled.
- Lead Reports (`/leads/reports`): full reporting module — Source Distribution donut chart, Status Distribution donut chart, User Performance Analytics bar chart, Conversion Analytics time-series bar chart (daily/weekly/monthly period switch), Status Report table, Source Report table, User Performance table, date-range filter, Export Excel, Export CSV, Print.
- `LeadTabs` nav component added to all lead pages (All Leads / Untouched / Imported / Assigned / Non Assigned / Reports).
- `TypedLeadsView` reusable component for the four category-filtered list pages (search, status/source/user filters, date range, export, pagination, bulk actions).
- Extended `LeadQueryParams.category` with `"untouched"` value; added report type interfaces (`LeadReportParams`, `LeadSourceReportItem`, `LeadStatusReportItem`, `UserPerformanceItem`, `LeadTimeSeriesItem`).
- New `reportsService` (`services/leads/reports.service.ts`) calling `/leads/reports/{source,status,user-performance,time-series,export}`.
- New `useLeadReports.ts` hooks: `useSourceReport`, `useStatusReport`, `useUserPerformance`, `useLeadTimeSeries`.
- `useLeadCategoryCount` hook added to `useDashboard.ts` for per-category total counts.
- Dashboard overview updated: second stat-card row (Untouched / Imported / Assigned / Unassigned) with click-through links; Lead Reports added to Quick Actions.
- `StatCard` component updated to optionally accept `href` and render as a `<Link>` with hover shadow.
- Sidebar nav (`nav.config.ts`) updated with five new Lead Management items (Untouched Leads, Imported Leads, Assigned Leads, Non Assigned Leads, Lead Reports).
- `LeadFilters` category dropdown updated with `untouched` option.

**Files Created:**
- `services/leads/reports.service.ts`
- `hooks/useLeadReports.ts`
- `components/leads/LeadTabs.tsx`
- `components/leads/TypedLeadsView.tsx`
- `app/(dashboard)/leads/untouched/page.tsx`
- `app/(dashboard)/leads/imported/page.tsx`
- `app/(dashboard)/leads/assigned/page.tsx`
- `app/(dashboard)/leads/unassigned/page.tsx`
- `app/(dashboard)/leads/reports/page.tsx`

**Files Modified:**
- `types/index.ts`
- `hooks/useDashboard.ts`
- `components/leads/LeadFilters.tsx`
- `components/layout/nav.config.ts`
- `components/dashboard/StatCard.tsx`
- `app/(dashboard)/leads/page.tsx`
- `app/(dashboard)/dashboard/overview/page.tsx`
- `DEVELOPMENT_PROGRESS.md`

**Modules Completed:** Lead Management (enhanced)

**Build Status:** Passed (34 routes)

**TypeScript Status:** Passed

**Notes:**
- Report endpoints (`/leads/reports/*`) are new backend requirements. The UI shows loading/error states gracefully when the backend does not yet implement them.
- Category count queries reuse the existing `/leads` list endpoint with `?category=` parameter — no new backend endpoints required for counts.

---

### Session 1

**Date:** 2026-06-06

**Completed:**

- Full greenfield build of the CRM frontend across 11 planned phases.
- Phase 1 — Foundation: domain types mirroring the backend Prisma schema, axios client with JWT request interceptor and `401` redirect, per-module API services, TanStack Query + Zustand providers, `lib/rbac.ts` role matrix, `ProtectedRoute`/`RoleGuard` guards, constants and utilities.
- Phase 2 — Layout: `AppShell`, `Sidebar` (role-filtered nav from `nav.config.ts`), `Header`, `(auth)` and `(dashboard)` layouts, login page.
- Phase 3 — Dashboard: stat cards, leads-by-source donut chart, 24h activity bar chart, recent leads list, quick actions.
- Phase 4 — Lead Management: list with filters/search/pagination, row selection, bulk assign + bulk status, export, import (with structured result report + template download), create/edit/detail pages with status-history timeline; `LeadForm`, `LeadFilters`, `BulkActions`.
- Phase 5 — Follow-Ups: shared `FollowupView` with today/missed/upcoming tabs, table + calendar views.
- Phase 6 — Brokers: list/create/edit/detail (with broker→lead mapping) + export; `BrokerForm`.
- Phase 7 — HR: candidates list/create/edit/detail; `CandidateForm`.
- Phase 8 — Attendance: list with user/date filters, record/edit entries with time→ISO conversion; `AttendanceForm`.
- Phase 9 — Users + Settings: users list with role counts, create/edit/detail, activate/deactivate; profile + change-password pages; `UserForm`.
- Phase 10 — Dynamic Fields: category-tabbed CRUD over 8 managed categories via `[category]` dynamic route.
- Phase 11 — Hardening: global `error`/`not-found`/`loading` boundaries, responsive layout, consistent loading/empty/error states; production build verification.

**Files Created (high level — see inventories below for full list):**

- `types/index.ts`, `constants/index.ts`, `lib/utils.ts`, `lib/rbac.ts`
- `services/api/client.ts` + all per-module services under `services/*`
- `store/auth.store.ts`, `store/filter.store.ts`
- `providers/index.tsx`, `providers/query-provider.tsx`
- All `hooks/*`, `schemas/*`, `components/*`, and `app/*` routes listed in the inventories.

**Files Modified:**

- `README.md` — replaced the default create-next-app content with project documentation.

**Modules Completed:**

- Authentication, Dashboard, Leads, Follow-Ups, Brokers, HR, Attendance, Users, Dynamic Fields, Settings.

**Build Status:** Passed (`npm run build` — all routes compiled & generated).

**TypeScript Status:** Passed (`npx tsc --noEmit`).

**Notes:**

- Read the backend `development_guide.md` end-to-end first; all API contracts, roles, and modules follow it.
- Honored the `AGENTS.md` rule to read the Next.js 16 docs before coding (Promise-based `params`, `proxy.ts` middleware rename).
- UI hides actions the current role cannot perform; the backend remains the source of truth for enforcement.

---

### Session 2

**Date:** 2026-06-06

**Completed:**

1. **Build failure fix (root cause):** `npm run build` failed with `.next/dev/types/routes.d.ts:86 — Declaration or statement expected` (garbled `actNode` fragment). Diagnosed as a concurrency corruption: a background `npm run dev` server was rewriting `.next/dev/types` while a separate `next build` ran, so the build's TypeScript pass read the file mid-write. No source defect. Fix: stopped the dev server / freed port 3000, deleted `.next`, regenerated types with `npx next typegen`, then re-ran `tsc` and `build`. Audited route groups/layouts/slots — all clean.
2. **Sample/demo login:** Added a gated demo-auth mode so the CRM can be accessed without a backend using `admin@gmail.com` / `Admin@123` (mock `master` user).

**Files Created:**

- `services/auth/demo.ts` — demo flag, credentials, mock user/token, `tryDemoLogin`, `isDemoToken`.
- `DEVELOPMENT_PROGRESS.md` — this document.

**Files Modified:**

- `services/auth/auth.service.ts` — `login` short-circuits on demo credentials; `logout`/`changePassword` handle demo sessions locally.
- `services/api/client.ts` — `401` interceptor skips eviction for demo sessions.
- `app/(auth)/login/page.tsx` — demo-credentials hint card with one-click "Use these credentials" fill.
- `README.md` — (Session 1) project documentation.

**Modules Completed:**

- Authentication (extended with demo login).

**Build Status:** Passed (`npm run build` — 29 routes; re-verified after `.next` regeneration).

**TypeScript Status:** Passed (`npx tsc --noEmit`).

**Notes:**

- Demo auth is **on by default**; disable with `NEXT_PUBLIC_DEMO_AUTH=false` in `.env.local`.
- Demo login authenticates the UI only; data lists require a real backend (otherwise they show empty/error states).
- Operational reminder: do not run `next dev` and `next build` against the same workspace simultaneously — both write to `.next`.

---

## Completed Modules

### Authentication

Status: Complete
Implemented Features:

- JWT login against `POST /api/auth/login`; token + user persisted via Zustand.
- Logout (server + local clear) and change-password flows.
- Axios request interceptor (Bearer token) and response interceptor (`401` → clear + redirect).
- `ProtectedRoute` route-group guard and `RoleGuard` permission gate backed by `lib/rbac.ts`.
- Demo login mode (gated by `NEXT_PUBLIC_DEMO_AUTH`) with sample `master` credentials.

### Dashboard

Status: Complete
Implemented Features:

- Stat cards (`StatCard`), leads-by-source donut (`DonutChart`), 24h activity bar chart (`BarChart`).
- Recent leads list and quick-action shortcuts.

### Leads

Status: Complete
Implemented Features:

- Paginated list with search, filters (`LeadFilters`), and row selection.
- Bulk assign and bulk status update (`BulkActions`); export to file.
- Import flow with template download and structured success/skipped/errors report.
- Create / edit / detail pages; detail includes a status-history timeline.
- **Enhanced (Session 3):** Five new sub-pages via `LeadTabs` navigation: Untouched, Imported, Assigned, Non Assigned, Reports.
- `TypedLeadsView` reusable component handles all four category-filtered list pages.
- Full reporting module: Source Distribution, Status Distribution, User Performance, Conversion Analytics (time-series), three data tables with date-range filter, Export Excel, Export CSV, Print.
- `LeadQueryParams.category` extended with `"untouched"`.

### Lead Reports

Status: Complete
Implemented Features:

- Lead Source Report (donut chart + table with count/percentage/bar).
- Lead Status Report (donut chart + table with count/percentage/bar).
- User Performance Report (bar chart + table: Leads Assigned / Leads Converted / Follow Ups Completed).
- Conversion Analytics — daily / weekly / monthly time-series bar chart with period switcher.
- Date-range filter applied to all reports simultaneously.
- Export Excel, Export CSV, Print (window.print).
- Graceful loading/error states for each chart independently.

### Follow Ups

Status: Complete
Implemented Features:

- Shared `FollowupView` driving Today / Missed / Upcoming tabs.
- Table view and grouped calendar view; search + pagination.

### Brokers

Status: Complete
Implemented Features:

- List with status filter and export; create / edit / detail.
- Broker→lead mapping shown on the detail page.

### HR

Status: Complete
Implemented Features:

- Candidates list with status filter and export; create / edit / detail.
- Source/status/post values sourced from dynamic fields.

### Attendance

Status: Complete
Implemented Features:

- List with user and date-range filters; export.
- Record / edit entries with check-in/out time → ISO conversion.

### Users

Status: Complete
Implemented Features:

- List with per-role counts; create / edit / detail.
- Activate / deactivate (toggle) with confirmation.

### Dynamic Fields

Status: Complete
Implemented Features:

- Category-tabbed CRUD over 8 managed categories via the `[category]` route.
- Add / edit / delete values with confirmation; feeds dropdowns app-wide.

---

## Route Inventory

Public / auth:

- `/` (`app/page.tsx`) — entry redirect
- `/login` (`app/(auth)/login/page.tsx`)

Dashboard (protected, under `(dashboard)`):

- `/dashboard/overview`
- `/leads`, `/leads/create`, `/leads/import`, `/leads/[id]`, `/leads/[id]/edit`
- `/leads/untouched`, `/leads/imported`, `/leads/assigned`, `/leads/unassigned`, `/leads/reports`
- `/followup/today`, `/followup/missed`, `/followup/upcoming`
- `/brokers`, `/brokers/create`, `/brokers/[id]`, `/brokers/[id]/edit`
- `/users`, `/users/create`, `/users/[id]`, `/users/[id]/edit`
- `/dynamic-fields/[category]`
- `/settings/profile`, `/settings/change-password`
- `/hrms/dashboard`, `/hrms/employees`, `/hrms/employees/create`, `/hrms/employees/[id]`, `/hrms/employees/[id]/edit`
- `/hrms/attendance`, `/hrms/leave`, `/hrms/payroll`, `/hrms/payslips`
- `/hrms/email-config`, `/hrms/login-activity`, `/hrms/reports`
- `/my-hr/attendance`, `/my-hr/leaves`, `/my-hr/payslips`, `/my-hr/profile`

System boundaries:

- `app/layout.tsx` (root), `app/(auth)/layout.tsx`, `app/(dashboard)/layout.tsx`
- `app/error.tsx`, `app/not-found.tsx`, `app/(dashboard)/loading.tsx`

---

## Component Inventory

UI primitives (`components/ui/`): `Avatar`, `Badge`, `Button`, `Card`, `Input`, `Modal`, `PageHeader`, `Pagination`, `SearchInput`, `States`.

Layout (`components/layout/`): `AppShell`, `Header`, `Sidebar` (hierarchical collapsible groups), `nav.config.ts` (`NavGroup` structure with 9 groups).

Tables (`components/tables/`): `DataTable`.

Charts (`components/charts/`): `BarChart`, `DonutChart`.

Dashboard (`components/dashboard/`): `StatCard`.

Forms (`components/forms/`): `LeadForm`, `BrokerForm`, `UserForm`.

HRMS (`components/hrms/`): `CameraCapture`, `EmployeeForm`, `AttendanceCheckInOut`.

Leads (`components/leads/`): `LeadFilters`, `BulkActions`, `LeadTabs`, `TypedLeadsView`.

Follow-up (`components/followup/`): `FollowupView`.

Shared (`components/shared/`): `Guards` (`ProtectedRoute`, `RoleGuard`).

---

## API Service Inventory

- `services/api/client.ts` — axios instance, interceptors, `getData/postData/putData/patchData/deleteData`, `getErrorMessage`.
- `services/auth/auth.service.ts` — `login`, `logout`, `changePassword`.
- `services/auth/demo.ts` — demo auth helpers (not a network service).
- `services/dashboard/dashboard.service.ts` — dashboard stats / charts / recent leads.
- `services/leads/leads.service.ts` — leads CRUD, list, bulk assign/status, export, import, template; follow-up endpoints (today/missed/upcoming).
- `services/leads/reports.service.ts` — `sourceReport`, `statusReport`, `userPerformance`, `timeSeries`, `exportReport` (calling `/leads/reports/*` backend endpoints).
- `services/brokers/brokers.service.ts` — brokers CRUD, list, export, broker leads.
- `services/hr/hr.service.ts` — employee CRUD, list, export, HR dashboard, employee dashboard.
- `services/attendance/attendance.service.ts` — attendance list, my-list, today, check-in/check-out (photo), summary, export.
- `services/hrms/leave.service.ts` — leave CRUD, apply, approve/reject, balance, export.
- `services/hrms/payroll.service.ts` — payroll list, get, generate, process, dashboard, export.
- `services/hrms/payslip.service.ts` — payslips list, my-list, get, download PDF, send email, send bulk, export.
- `services/hrms/email.service.ts` — SMTP config CRUD, test, email templates CRUD.
- `services/hrms/login-activity.service.ts` — login activity list, get, export.
- `services/hrms/hr-reports.service.ts` — 6 report types with export (Excel/CSV/PDF).
- `services/users/users.service.ts` — users list (with role counts), get, create, update, toggle active.
- `services/dynamic-fields/dynamicFields.service.ts` — list by category, create, update, remove.

---

## Store Inventory

- `store/auth.store.ts` — `useAuthStore` (token, user, hydrated; `setAuth/setUser/clear/setHydrated`; persisted; `getStoredToken`).
- `store/filter.store.ts` — lead filter/query state.

---

## Hooks Inventory

- `hooks/useAuth.ts` — auth actions + `can()` permission helper.
- `hooks/useDashboard.ts` — dashboard data; `useLeadCategoryCount` for per-category totals.
- `hooks/useLeads.ts` — leads list/detail + mutations.
- `hooks/useFollowup.ts` — follow-up variants (today/missed/upcoming).
- `hooks/useBrokers.ts` — brokers list/detail/leads + mutations.
- `hooks/useHrms.ts` — employees (list/detail/mutations/dashboard), attendance (list/my/today/summary/check-in/out), leave (list/my/balance/apply/approve/reject), payroll (list/detail/dashboard/generate/process), payslips (list/my/detail/send-email/send-bulk), email config (smtp/templates/test), login activity, HR reports.
- `hooks/useUsers.ts` — users list/detail + mutations (incl. assignable users).
- `hooks/useDynamicFields.ts` — dynamic field values, `useFieldOptions`, mutations.
- `hooks/useLeadReports.ts` — `useSourceReport`, `useStatusReport`, `useUserPerformance`, `useLeadTimeSeries`.

---

## Validation Schemas

- `schemas/auth.schema.ts` — login, change-password.
- `schemas/lead.schema.ts` — lead create/edit.
- `schemas/broker.schema.ts` — broker create/edit.
- `schemas/employee.schema.ts` — employee create/edit (personal, employment, salary/bank).
- `schemas/leave.schema.ts` — leave apply, leave balance.
- `schemas/email.schema.ts` — SMTP config, email template.
- `schemas/user.schema.ts` — create-user and update-user (with hr_manager role).

---

## Build & Validation History

| Date | Command | Result |
|---|---|---|
| 2026-06-06 (Session 1) | `npx tsc --noEmit` | Passed |
| 2026-06-06 (Session 1) | `npm run build` | Passed (29 routes) |
| 2026-06-06 (Session 2) | `npx next typegen` | Passed (types regenerated after `.next` wipe) |
| 2026-06-06 (Session 2) | `npx tsc --noEmit` | Passed |
| 2026-06-06 (Session 2) | `npm run build` | Passed (29 routes) |
| 2026-06-08 (Session 3) | `npx tsc --noEmit` | Passed |
| 2026-06-08 (Session 3) | `npm run build` | Passed (34 routes) |
| 2026-06-08 (Session 4) | `npx tsc --noEmit` | Passed |
| 2026-06-08 (Session 4) | `npm run build` | Passed (34 routes) |
| 2026-06-08 (Session 5) | `npx tsc --noEmit` | Passed |
| 2026-06-08 (Session 5) | `npm run build` | Passed (44 routes) |

---

## Pending Tasks

- Connect to a live backend (set `NEXT_PUBLIC_API_URL`) and validate every module end-to-end with real data.
- Implement HRMS backend endpoints: `/hrms/employees`, `/hrms/attendance` (check-in/out with photo upload), `/hrms/leave`, `/hrms/payroll`, `/hrms/payslips`, `/hrms/email/*`, `/hrms/login-activity`, `/hrms/reports/*`, `/hrms/my/*`.
- Implement backend endpoints for the leads reports module.
- Implement backend support for `?category=untouched|imported|assigned|unassigned` query on `/leads`.
- Implement payslip PDF generation (backend).
- Implement SMTP email sending (backend) with template rendering.
- Implement attendance auto-status calculation based on check-in time (backend).
- Implement login/logout activity tracking (backend middleware).
- Optionally seed a real `master` + `hr_manager` user in the backend.
- Add automated tests (unit + Playwright e2e) — none exist yet.

---

## Future Improvements

- Mock data layer for demo mode so lists render without a backend.
- Optimistic updates and finer cache invalidation for mutations.
- Server-side pagination params persisted to the URL for shareable filtered views.
- Accessibility pass (focus traps in modals, ARIA on tables/charts).
- Dark mode and theme tokens.
- CI pipeline running `tsc`, lint, build, and tests on every push.

---

## Change Log

- **2026-06-06 — Session 1:** Initial full build of the CRM frontend (Phases 1–11): foundation, layout, dashboard, leads, follow-ups, brokers, HR, attendance, users, settings, dynamic fields, and global boundaries. `tsc` + `build` passing. Updated `README.md`.
- **2026-06-06 — Session 2:** Fixed `next build` failure caused by concurrent `next dev`/`next build` corrupting `.next/dev/types/routes.d.ts` (deleted `.next`, regenerated types). Added gated demo login (`services/auth/demo.ts`) with sample credentials `admin@gmail.com` / `Admin@123`; updated `auth.service.ts`, `api/client.ts`, and the login page. Created `DEVELOPMENT_PROGRESS.md`.
- **2026-06-08 — Session 5:** Major HRMS Architecture Refactor — replaced HR Candidate Management and old Attendance modules with full HRMS (Employee Management, Camera Check-In/Out Attendance, Leave Management, Payroll, Payslips, Email Config, Login Activity, HR Reports, HR Dashboard, My HR self-service). Added `hr_manager` role. Extended User model with employee fields. 29 new files, 8 modified, 8 removed. `tsc --noEmit` and `npm run build` (44 routes) pass.
- **2026-06-08 — Session 4:** Refactored sidebar navigation from flat sections to hierarchical collapsible groups (`NavGroup` interface, 9 groups, chevron expand/collapse, `localStorage` persistence, active-route auto-expand, `PARENT_EXCLUSIONS` map for correct item highlighting, 8 Dynamic Fields sub-items). `tsc --noEmit` and `npm run build` (34 routes) pass.
- **2026-06-08 — Session 3:** Enhanced Lead Management module — added Untouched, Imported, Assigned, Non Assigned, and Reports sub-pages under `/leads/*`; `LeadTabs` navigation component; `TypedLeadsView` reusable component; `reportsService` + `useLeadReports` hooks; `useLeadCategoryCount` in dashboard hooks; four new dashboard stat cards (Untouched / Imported / Assigned / Unassigned) with link navigation; Lead Reports quick action in dashboard; `StatCard` extended with optional `href`; sidebar expanded with five new Lead Management items; `LeadFilters` updated with `untouched` category; `LeadQueryParams.category` extended; new report types added to `types/index.ts`. `tsc --noEmit` and `npm run build` (34 routes) both pass.
