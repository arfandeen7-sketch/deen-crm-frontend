# DEEN CRM — Backend ↔ Frontend Merge Plan

> **Purpose:** A complete, actionable plan to merge the live backend (`BACKEND_CONTEXT.md`) with this Next.js frontend. The body (§1–§13) is the **integration plan** for every module that already exists on both sides and is meant to be wired up. **Mismatches and gaps are listed separately at the very end (§14–§16).**
>
> **Status:** Planning only — no code changed yet.

---

## 1. Global Foundations (do these first)

These cross-cutting pieces are shared by every module below.

### 1.1 API client — `services/api/client.ts`
Already in good shape. Confirm/adjust:
- **Base URL:** set `NEXT_PUBLIC_API_URL=https://deen-crm-backend-production.up.railway.app`. The client appends `/api`, producing `…/api/...`. ✔ matches backend.
- **Auth header:** request interceptor already injects `Authorization: Bearer <token>` from the auth store. ✔
- **401 handling:** response interceptor already clears the session and redirects to `/login`. ✔
- **Envelope helpers:** `getData/postData/putData/patchData/deleteData` already unwrap `{ data }`. ✔ Use these everywhere instead of reading `res.data` directly.
- **CORS:** backend allows only its `FRONTEND_URL` origin with `credentials: true`. Whitelist the deployed FE origin on the backend; add `withCredentials: true` only if cookie auth is adopted.

### 1.2 Response envelopes (backend §4.1) — standardize unwrapping
- **Single resource:** `{ data: T }` → use `getData<T>()` etc.
- **Paginated list:** `{ data: T[], meta: { total, page, pageSize, totalPages }, ...top-level mirror }`. The FE `Paginated<T>` type maps to the **top-level** mirror fields, so `res.data` works for lists. Prefer reading from `meta` going forward.
- **Success toggle/delete:** `{ data: { success: true } }`.

### 1.3 Auth store & RBAC (`store/auth.store.ts`, `lib/rbac.ts`, `hooks/useAuth.ts`)
- Store holds `{ token, user }`; `getStoredToken()` feeds the axios interceptor. ✔
- `lib/rbac.ts` mirrors the backend role matrix (master / hr_manager / sales_manager / sales_executive). Use `can(role, permission)` to gate UI. The server remains the source of truth. ✔
- Pagination constants (`PAGE_SIZES = [10,25,50,100]`, `DEFAULT_PAGE_SIZE = 25`) match backend allowed values. ✔

### 1.4 Conventions to apply across all modules
- **Dates:** send ISO 8601 strings; render with `formatDate`/`formatDateTime` from `lib/utils.ts`.
- **Query building:** `buildQuery()` already skips empty params. ✔
- **File downloads:** `downloadBlob()` + `responseType: "blob"` for all `/export` and PDF endpoints. ✔
- **Dropdowns:** populate from `GET /dynamic-fields/:category` (see §12).

---

## 2. Auth — `/api/auth` + `/api/login-activity`

**FE:** `services/auth/auth.service.ts`, `hooks/useAuth.ts`, `app/(auth)/login`.
**Backend:** `POST /auth/login`, `POST /auth/logout`, `PUT /auth/change-password`; `POST /login-activity/login`, `POST /login-activity/logout`.

**Merge steps:**
1. **Login:** `authService.login` already calls `POST /auth/login` and unwraps `{ data: { token, user } }`. Store via `setAuth(token, user)`. ✔
2. **Session start:** immediately after a successful login, call `POST /login-activity/login` (device/IP captured server-side from headers). Add `loginActivityService.recordLogin()` and call it in `useAuth.login`.
3. **Session end:** in `useAuth.logout`, call `POST /login-activity/logout` **before** `POST /auth/logout`, then clear the store and React Query cache.
4. **Change password:** `authService.changePassword` should send **only** `{ newPassword }` (backend ignores current password).
5. Login page consumes `useAuth.login`; on success route by role. ✔

---

## 3. Dashboard — `/api/dashboard`

**FE:** `services/dashboard/dashboard.service.ts`, `hooks/useDashboard.ts`, `app/(dashboard)/dashboard`.
**Backend:** `GET /dashboard/summary`, `GET /dashboard/status-analytics`.

**Merge steps:**
1. **Summary:** returns `{ sourceCounts: [{source,count}], totalLeads }`. `sales_executive` is auto-scoped to own leads server-side. Use `getData<DashboardSummary>("/dashboard/summary")` (switch from `res.data` to the unwrap helper).
2. **Status analytics:** returns `{ analytics: [{status, leadCount, updateCount}], windowHours }`. Same unwrap fix.
3. Render source-count cards + status analytics table; both endpoints are role-agnostic (all roles). ✔

---

## 4. Leads — `/api/leads` + `/api/followup`

**FE:** `services/leads/leads.service.ts` (incl. `followupService`), `hooks/useLeads.ts`, `hooks/useFollowup.ts`, `app/(dashboard)/leads/*`, `app/(dashboard)/followup/*`, `schemas/lead.schema.ts`.
**Backend:** full CRUD, export/template/import, bulk ops, follow-ups.

**Merge steps:**
1. **List:** `GET /leads` with query params `page, pageSize, assignedTo, source, status, serviceType, projectName, city, locality, dateFrom, dateTo, search, category`. `sales_executive` is always scoped to own leads (server-enforced; do not send `assignedTo` for them). FE `LeadQueryParams` matches. ✔ The category sub-pages (`assigned`, `unassigned`, `imported`, `untouched`) map to `?category=`.
2. **Detail:** `GET /leads/:id` returns lead + `assignedUser`, `broker`, `statusHistory`. ✔
3. **Create:** `POST /leads` — required `leadName`, `mobileNumber`, `source`, `serviceType`. `source`/`leadStatus`/`leadPriority` values must come from dynamic fields (wire the create form selects to §12).
4. **Update:** `PUT /leads/:id` (partial). `sales_executive` may update only own leads. Status changes auto-record history; setting `followUpDate`/`assignedTo`/`comments` flips `isTouched`.
5. **Delete:** `DELETE /leads/:id` (master only) → returns `{ success: true }`.
6. **Bulk assign/status:** `POST /leads/bulk-assign` body `{ leadIds, assignedTo }`; `POST /leads/bulk-status` body `{ leadIds, status }` (master, sales_manager). Align FE payload keys and read `{ updated }` / `{ matched, updated }`.
7. **Import:** `POST /leads/import` (multipart `file`) → `{ imported, skipped, errors[] }`. ✔ Wire the `leads/import` page. Provide template via `GET /leads/template`. ✔
8. **Export:** `GET /leads/export` (same filters, returns `.xlsx`). ✔
9. **Follow-ups:** `GET /followup/today | /missed | /upcoming` (paginated lead lists, exec-scoped). FE `followupService` paths match. ✔

---

## 5. Brokers — `/api/brokers`

**FE:** `services/brokers/brokers.service.ts`, `hooks/useBrokers.ts`, `app/(dashboard)/brokers/*`, `schemas/broker.schema.ts`.
**Backend:** CRUD + `:id/leads` + export + import.

**Merge steps:**
1. **List:** `GET /brokers` with `page, pageSize, search, status`. ✔
2. **Detail / leads:** `GET /brokers/:id`; `GET /brokers/:id/leads` (paginated, exec-scoped). Keep pagination instead of flattening.
3. **Create/Update:** `POST /brokers`, `PUT /brokers/:id` (master, sales_manager). Required `brokerName`, `mobileNumber`. ✔
4. **Delete:** `DELETE /brokers/:id` (master).
5. **Export:** `GET /brokers/export` (master, sales_manager). ✔
6. **Import:** `POST /brokers/import` (master, multipart `file`; columns `broker_name`, `mobile_number`, optional `company_name`, `status`). Add a service method + UI (currently unwired).

---

## 6. Users — `/api/users`  *(master only)*

**FE:** `services/users/users.service.ts`, `hooks/useUsers.ts`, `app/(dashboard)/users/*`, `schemas/user.schema.ts`.
**Backend:** list (+roleCounts), detail, create, update, toggle-active.

**Merge steps:**
1. **List:** `GET /users` → `{ users[], roleCounts }`. Fix unwrap to read `res.data.data` (use `getData<UsersListResponse>`).
2. **Create:** `POST /users` — `fullName`, `email`, `password` (min 8), `phone?`, `role`. Creates Supabase auth user + CRM profile. ✔
3. **Update:** `PUT /users/:id` — `fullName`, `phone`, `role` only. Cannot demote the last active master. ✔
4. **Toggle active:** `PATCH /users/:id/toggle-active` (no body). Cannot deactivate self or last active master. ✔ This is also the canonical way to "deactivate" an employee.

---

## 7. Employees — `/api/employees`  *(master, hr_manager)*

**FE:** `services/hr/hr.service.ts` (`employeeService`), `hooks/useHrms.ts`, `app/(dashboard)/hrms/employees/*`, `schemas/employee.schema.ts`.
**Backend:** list/detail/create/update + status PATCH + export. Employees and Users share the `users` table; this is the HRMS view.

**Merge steps:**
1. **List:** `GET /employees` with `page, pageSize, department, designation, status, role, search`. ✔ (rename FE `employmentStatus` filter to `status`).
2. **Detail:** `GET /employees/:id`. ✔
3. **Create:** `POST /employees` — HR profile fields incl. `department`, `designation`, `bankName` (must exist in dynamic fields), `basicSalary`, `allowances`, `bankIban`, `leaveBalance` (defaults `{annual:30, sick:15, emergency:5}`). Wire selects to §12.
4. **Update:** `PUT /employees/:id` (email/password not updatable here).
5. **Employment status:** `PATCH /employees/:id/status` with `{ status: active|on_leave|suspended|resigned|terminated }`. Add dedicated FE method (don't fold into generic update).
6. **Export:** `GET /employees/export` (`.xlsx`). ✔
7. **Deactivation:** there is no employee DELETE — deactivate via `PATCH /users/:id/toggle-active` (§6).

---

## 8. Attendance — `/api/attendance` + self `/api/me/attendance`

**FE:** `services/attendance/attendance.service.ts`, `hooks/useHrms.ts`, `app/(dashboard)/hrms/attendance`, `app/(dashboard)/my-hr/attendance`.
**Backend:** check-in/out, today, list, detail, manual create/override, delete, report, per-user summary, export.

**Merge steps:**
1. **Check-in / check-out:** `POST /attendance/check-in` and `/check-out`. Photo **required** — support multipart (`photo` field) and/or JSON base64 (`{ photo: "data:image/...;base64,..." }`). Responses include signed `checkInPhotoUrl` / `checkOutPhotoUrl`; render these.
2. **Today:** `GET /attendance/today` → record or `{ data: null }`. ✔
3. **List:** `GET /attendance` with `page, pageSize, userId (privileged), dateFrom, dateTo`. Non-privileged see only own. ✔
4. **Self list:** `GET /me/attendance` (`page, pageSize, dateFrom, dateTo`).
5. **Detail:** `GET /attendance/:id` (with signed photo URLs).
6. **Manual create/override:** `POST /attendance` (upsert by userId+date) and `PUT /attendance/:id` (`overrideReason` required) — master/hr. Add FE methods + override UI.
7. **Delete:** `DELETE /attendance/:id` (master).
8. **Reporting:** `GET /attendance/report?month&year` and `GET /attendance/user/:userId/summary?month&year` (master/hr). Use these to build the attendance summary widgets.
9. **Export:** `GET /attendance/export` (master/hr). ✔
10. **Status rules** (display only): present <09:45, late 09:45–10:30, half_day >10:30 (UAE). Include `weekend`/`holiday` states.

---

## 9. Leave — `/api/leave` + self `/api/me/leaves`

**FE:** `services/hrms/leave.service.ts`, `hooks/useHrms.ts`, `app/(dashboard)/hrms/leave`, `app/(dashboard)/my-hr/leaves`, `schemas/leave.schema.ts`.
**Backend:** list, balance, detail, apply, review, cancel.

**Merge steps:**
1. **List:** `GET /leave` with `page, pageSize, userId (privileged), status, leaveType`. Non-privileged see own. ✔
2. **Self list:** `GET /me/leaves` (`page, pageSize`).
3. **Apply:** `POST /leave` with `{ leaveType, dateFrom, dateTo, reason }`. `totalDays` computed server-side (Sundays excluded); overlapping requests → 409.
4. **Review (approve/reject):** single `PUT /leave/:id/review` with `{ status: approved|rejected, reviewNote }` (master/hr). On approval the server backfills attendance as `leave` and decrements paid-leave balance. Replace FE's separate approve/reject calls with this one.
5. **Cancel:** `DELETE /leave/:id` (own, pending only).
6. **Balance:** `GET /leave/balance` (own) or `?userId=` (master/hr) → `{ userId, fullName, leaveBalance }`. Unwrap to the nested `leaveBalance`.

---

## 10. Payroll & Payslips — `/api/payroll` + `/api/payslips` + self `/api/me/payslips`

**FE:** `services/hrms/payroll.service.ts`, `services/hrms/payslip.service.ts`, `hooks/useHrms.ts`, `app/(dashboard)/hrms/payroll`, `app/(dashboard)/hrms/payslips`, `app/(dashboard)/my-hr/payslips`.
**Backend:** payroll is computed on demand and persisted directly as **Payslip** records (no separate persistent payroll table).

**Backend Payslip model:** `{ id, userId, month, year, basicSalary, allowances, presentDays, halfDays, approvedLeaveDays, unpaidLeaveDays, overtimeAmount, deductions, netSalary, status: draft|generated|sent, pdfUrl, generatedBy, sentAt, user }`.

**Merge steps:**
1. **Preview:** `GET /payroll/preview?month&year&userId?&overtimeAmount?` (master/hr) — compute without saving.
2. **Calculate:** `POST /payroll/calculate` (same body) — compute + upsert draft `Payslip`(s).
3. **List payslips:** `GET /payslips` with `page, pageSize, userId (privileged), month, year`. Employees see own. ✔ path after de-prefixing.
4. **Self list:** `GET /me/payslips`.
5. **Detail:** `GET /payslips/:id`.
6. **Generate PDF:** `POST /payslips/:id/generate` (master/hr) → status `generated`, sets `pdfUrl`.
7. **Send email:** `POST /payslips/:id/send` (master/hr) → status `sent`. Bulk: `POST /payslips/send-bulk` with `{ month, year }` → `{ sent, total, errors }`.
8. **Download PDF:** `GET /payslips/:id/download` (HR) or `GET /me/payslips/:id/download` (employee), `responseType: "blob"`.

> Align the FE Payslip/Payroll types and the payroll/payslips pages to this single-model workflow (preview → calculate → generate → send → download).

---

## 11. Login Activity — `/api/login-activity`  *(recording + monitoring)*

**FE:** `services/hrms/login-activity.service.ts`, `app/(dashboard)/hrms/login-activity`.
**Backend:** record login/logout (see §2), list, active sessions.

**Merge steps:**
1. **Record:** `POST /login-activity/login` (after auth login) and `POST /login-activity/logout` (before auth logout) — wired in `useAuth` (§2).
2. **List:** `GET /login-activity` with `page, pageSize`; master/hr can pass `?userId=`. Non-privileged see own. Use `getData`/paginated unwrap.
3. **Active sessions:** `GET /login-activity/active` (master/hr; supports `?userId=`) — sessions with no `logoutTime`. Add to the monitoring page.

---

## 12. Self-Service — `/api/me`

**FE:** `app/(dashboard)/my-hr/*` (profile, attendance, leaves, payslips).
**Backend:** `GET/PUT /me/profile`, `GET /me/attendance`, `GET /me/leaves`, `GET /me/payslips`, `GET /me/payslips/:id/download`. All auto-scoped to the logged-in user.

**Merge steps:**
1. **Add a `meService`** (new file) for `/me/profile`:
   - `GET /me/profile` → current user incl. HRMS fields.
   - `PUT /me/profile` → employees may update only `phone`, `bankName`, `bankAccountNumber`, `bankIban` (`bankName` must exist in dynamic fields).
2. Point the `my-hr` attendance/leaves/payslips pages at `/me/attendance`, `/me/leaves`, `/me/payslips`, `/me/payslips/:id/download` (currently they use `/hrms/my/*`).

---

## 13. Dynamic Fields — `/api/dynamic-fields`

**FE:** `services/dynamic-fields/dynamicFields.service.ts`, `hooks/useDynamicFields.ts`, `app/(dashboard)/dynamic-fields`, `constants.MANAGED_DYNAMIC_CATEGORIES`.
**Backend:** read (all roles), write (master). Paths match. ✔

**Merge steps:**
1. **Read:** `GET /dynamic-fields?category=` (all) and `GET /dynamic-fields/:category` (sorted). Use these to populate every dropdown: `source`, `lead_status`, `lead_priority`, `project_name`, `department`, `designation`, `bank_name` (+ optionally `payment_plan`, `configuration`, `location`, `handover_year`).
2. **Write (master):** `POST /dynamic-fields` (`{ category, value, meta?, sortOrder? }`, 409 on duplicate), `PUT /dynamic-fields/:id`, `DELETE /dynamic-fields/:id`. ✔
3. Cache dynamic fields via React Query and reuse across lead/employee forms.

---

## Phased Rollout

1. **Phase A — Foundations (§1–§2):** env/base URL, envelope-unwrap fixes, login-activity recording in `useAuth`, change-password payload.
2. **Phase B — Sales modules (§3–§6, §13):** dashboard, leads + follow-ups, brokers, users, dynamic fields. Highest-value, fewest model changes.
3. **Phase C — HRMS core (§7–§9):** employees, attendance (incl. photo + signed URLs), leave (single review endpoint).
4. **Phase D — Payroll & self-service (§10–§12):** payslip lifecycle, login-activity monitoring, `/me/*` pages.
5. **Phase E — Verification:** smoke-test each role against the live Railway backend; confirm RBAC-gated UI matches server enforcement.

---

# Appendix — Mismatches & Gaps to Resolve

*The sections above describe the target integration. The items below are the deltas that must be reconciled during implementation.*

## 14. Route & contract mismatches (re-point during merge)
- **`/hrms/*` prefix:** strip across all HRMS services → flat backend routes (`/attendance`, `/leave`, `/payslips`, `/employees`, `/login-activity`). Self-service `/hrms/my/*` → `/me/*`.
- **Field renames — Leave:** `startDate→dateFrom`, `endDate→dateTo`, `approvedBy→reviewedBy`, `approvedAt→reviewedAt`, `rejectionReason→reviewNote`; add status `cancelled`; `reason` nullable; drop client-set `totalDays`.
- **Leave review:** replace separate `/approve` + `/reject` with single `PUT /leave/:id/review`.
- **Attendance:** `workingHours→totalWorkingHours`; drop `lateMinutes`/`overtime`; add `checkInPhotoUrl`/`checkOutPhotoUrl`/`isManualOverride`/`overrideReason`/`leaveType`/`recordedBy`; add `weekend`/`holiday` statuses.
- **Payslip/Payroll model:** collapse FE's `PayrollRecord` + status workflow into the backend's single `Payslip` model; `/payslips/:id/pdf→/download`, `/send-email→/send`, `/send-bulk-email→/send-bulk` (body `{month,year}`).
- **Employee:** `EmploymentStatus` enum → `active|on_leave|suspended|resigned|terminated`; `basicSalary`/`allowances` are strings; add `bankIban`; status via `PATCH /employees/:id/status`.
- **Lead bulk ops:** payload keys `ids→leadIds`, `leadStatus→status`; responses `{updated}` / `{matched,updated}`; delete returns `{success:true}`.
- **Envelope bugs:** `dashboardService.summary/statusAnalytics` and `usersService.list` read `res.data` (the envelope) instead of unwrapping — fix to `getData`/`res.data.data`.
- **LoginActivity:** model has `userAgent`, not `role`; no `GET /:id` and no `/export`.
- **Auth change-password:** send only `{ newPassword }`.
- **Demo auth:** `services/auth/demo.ts` bypasses the backend — disable/remove for production.
- **Token storage:** persisted to `localStorage` via zustand; backend checklist advises against it — decide memory vs HTTP-only cookie.

## 15. Exists in FRONTEND, missing in BACKEND  *(build BE later or remove FE)*
1. **Email / SMTP config & templates** — `services/hrms/email.service.ts`, `SmtpConfig`/`EmailTemplate` types, `hrms/email-config` page. No `/email/*` routes.
2. **HR Reports module** — `services/hrms/hr-reports.service.ts` (`/hrms/reports/*`). Backend has only `/attendance/report`.
3. **Lead analytics reports** — `services/leads/reports.service.ts` (source/status/user-performance/time-series). Backend has only one aggregate `GET /leads/report` (master, `groupBy=user|source`).
4. **HR/employee dashboard summaries** — `/hrms/dashboard`, `/hrms/my/dashboard`, `HrDashboardSummary`, `EmployeeDashboard`, `PayrollDashboard`. No equivalents.
5. **Payroll-as-records workflow** — `/payroll/generate`, `/payroll/:id/process`, `/payroll/dashboard`, `processedBy`, `latePenalty`, `leaveDeductions`.
6. **Leave balance manual update** — `PUT /hrms/leave/balance/:userId`. No route.
7. **Employee delete** — `DELETE /hrms/employees/:id`. No route (deactivate via `/users/:id/toggle-active`).
8. **Employee `profilePhoto`** — not in backend model.
9. **Login-activity `:id` detail + export** — not in backend.

## 16. Exists in BACKEND, missing in FRONTEND  *(wire up during merge — covered in body)*
1. **Login-activity recording + active sessions** — `/login-activity/login`, `/logout`, `/active` (§2, §11).
2. **Self-service profile** — `GET/PUT /me/profile` (§12).
3. **Attendance report & per-user summary** — `/attendance/report`, `/attendance/user/:userId/summary` (§8).
4. **Attendance manual override/delete** — `POST /attendance`, `PUT /attendance/:id`, `DELETE /attendance/:id` (§8).
5. **Single leave review + cancel** — `PUT /leave/:id/review`, `DELETE /leave/:id` (§9).
6. **Payroll preview/calculate + payslip lifecycle** — (§10).
7. **Employee status PATCH** — `PATCH /employees/:id/status` (§7).
8. **Broker import** — `POST /brokers/import` (§5).
9. **Lead aggregate report + export** — `GET /leads/report`, `/leads/report/export` (master).
10. **Dynamic field categories** `payment_plan`, `configuration`, `location`, `handover_year` not yet surfaced in FE management UI (§13).
11. **Ingestion webhooks** — server-to-server only; FE intentionally does not call. No action.

## 17. Open questions for product/backend
1. Build Email/SMTP config, HR reports, and the richer lead-analytics reports on the backend, or remove from the FE?
2. Token storage: accept `localStorage`, or move to HTTP-only cookie (affects CORS/`withCredentials`)?
3. Surface dynamic-field categories `payment_plan`, `configuration`, `location`, `handover_year` in the Lead form / settings?
4. Is the single `groupBy` lead report sufficient, or are the FE's source/status/time-series breakdowns required?
