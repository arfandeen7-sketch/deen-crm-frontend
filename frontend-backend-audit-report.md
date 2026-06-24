# DEEN CRM — Frontend ↔ Backend Audit Report

**Date:** 2026-06-15 | **Backend source:** `backend.md` | **Frontend source:** `frontend.md` + actual service/type/schema files

---

## Overall Statistics

| Metric | Count |
|---|---|
| Backend API endpoints (excl. server-to-server ingestion) | 77 |
| Fully & correctly implemented | 35 |
| Partially implemented (UI exists, path/data wrong) | 28 |
| Missing entirely | 14 |
| Frontend calling non-existent backend endpoints | 18 |

---

## Overall Scores

| Score | Value |
|---|---|
| **Backend Coverage %** | **45%** — 35/77 endpoints correctly reached |
| **Frontend Completion %** | **68%** — pages exist but HRMS integrations broken |
| **Production Readiness %** | **32%** — CRM core deployable; entire HRMS module returns 404 |
| **Implementation Accuracy %** | **45%** — all CRM-legacy services accurate; all HRMS services wrong |

---

## Phase-wise Coverage Report

### Phase 1 — Auth & Session

**Status: ⚠️ Partial — 70%**

| Requirement | Status |
|---|---|
| POST /auth/login | ✅ Correct path |
| POST /auth/logout | ✅ Correct path |
| PUT /auth/change-password | ⚠️ Frontend sends `{currentPassword, newPassword}`; backend only accepts `{newPassword}` |
| POST /login-activity/login (after auth) | ❌ Never called — no session records created |
| POST /login-activity/logout (on logout) | ❌ Never called — sessions never closed |
| Auth response envelope | ⚠️ Backend returns `{data:{token,user}}`; frontend expects `{token,user}` directly — potential production auth break |
| JWT token refresh | ❌ Not implemented — tokens expire silently |

---

### Phase 2 — Dashboard

**Status: ✅ Complete — 100%**

`/dashboard/summary` and `/dashboard/status-analytics` — paths correct, types match, envelope unwrapped correctly.

---

### Phase 3 — Lead Management

**Status: ⚠️ Partial — 72%**

| Requirement | Status |
|---|---|
| GET/POST/PUT/DELETE /leads, GET /leads/:id | ✅ All correct |
| POST /leads/bulk-assign | ⚠️ Backend returns `{updated}`, frontend expects `{count}` |
| POST /leads/bulk-status | ⚠️ Same field mismatch |
| Import/export/template | ✅ Correct |
| GET /leads/report?groupBy=user\|source | ❌ Frontend calls `/leads/reports/source`, `/leads/reports/status`, `/leads/reports/user-performance`, `/leads/reports/time-series` — none exist |
| GET /leads/report/export | ❌ Frontend calls `/leads/reports/export` — wrong path |

---

### Phase 4 — Follow-ups

**Status: ✅ Complete — 100%**

`/followup/today|missed|upcoming` — all correct.

---

### Phase 5 — Brokers

**Status: ⚠️ Partial — 86%**

All CRUD + export correct. `POST /brokers/import` — **not implemented** in frontend.

---

### Phase 6 — User Management

**Status: ✅ Complete — 100%**

All 5 endpoints correct including `PATCH /users/:id/toggle-active`.

---

### Phase 7 — Employee Management

**Status: ❌ Broken — 0%**

All calls use `/hrms/employees/*` — backend mounts at `/employees/*`. Every call returns 404.

Additional issues:
- `PATCH /employees/:id/status` — not wired in service at all
- Employee create form has no `password` field — backend requires it for Supabase auth user creation
- `DELETE /employees/:id` — does not exist in backend (no delete endpoint)
- `profilePhoto` field — not in backend User model
- Missing `bankIban` field

---

### Phase 8 — Attendance

**Status: ❌ Broken — 0%**

All calls use `/hrms/attendance/*` — backend mounts at `/attendance/*`.

Additional issues:
- `attendanceService.myList()` → `/hrms/my/attendance`; backend is `/me/attendance`
- `attendanceService.summary()` → `/hrms/attendance/summary?userId=`; backend is `/attendance/user/:userId/summary`
- Manual HR override form deleted, no replacement — `POST /attendance` and `PUT /attendance/:id` have no UI
- `DELETE /attendance/:id` — not wired
- `AttendanceStatus` missing `weekend` and `holiday` values
- `AttendanceRecord` type: `workingHours` (frontend) vs `totalWorkingHours` (backend); missing `isManualOverride`, `overrideReason`, `recordedBy`

---

### Phase 9 — Leave Management

**Status: ❌ Broken — 0%**

All calls use `/hrms/leave/*` — backend mounts at `/leave/*`.

Additional issues:
- Leave apply sends `{startDate, endDate}` — backend Zod requires `{dateFrom, dateTo}` → every apply call returns 400
- `leaveService.approve()` → `PUT /hrms/leave/:id/approve` — does not exist; backend is `PUT /leave/:id/review` with `{status:"approved"}`
- `leaveService.reject()` → `PUT /hrms/leave/:id/reject` — same; backend is `PUT /leave/:id/review`
- `leaveService.apply()` → `POST /hrms/my/leave/apply` — wrong; backend is `POST /leave`
- `DELETE /leave/:id` (cancel own) — not wired
- `GET /leave/:id` — no detail page
- `LeaveStatus` missing `cancelled`

---

### Phase 10 — Payroll

**Status: ❌ Architecturally Wrong — 0%**

Backend has only 2 endpoints: `GET /payroll/preview` and `POST /payroll/calculate`. No list, no detail, no process, no dashboard, no export.

Frontend invented: `payrollService.list()`, `.get()`, `.generate()`, `.process()`, `.dashboard()`, `.export()` — all calling `/hrms/payroll/*` — **none exist**.

`PayrollRecord` entity in frontend has no backend equivalent. Backend only has `Payslip`. Frontend's `PayrollStatus = "pending"|"processed"|"paid"` does not match backend's `PayslipStatus = "draft"|"generated"|"sent"`.

---

### Phase 11 — Payslips

**Status: ❌ Broken — 0%**

All calls use `/hrms/payslips/*` — backend mounts at `/payslips/*`.

Additional issues:
- `downloadPdf(id)` → `/hrms/payslips/:id/pdf`; backend is `/payslips/:id/download`
- `sendEmail(id)` → `/hrms/payslips/:id/send-email`; backend is `/payslips/:id/send`
- `sendBulkEmails(ids)` sends `{ids}`; backend `POST /payslips/send-bulk` expects `{month, year}`
- `POST /payslips/:id/generate` — never called (no generate PDF flow in UI)
- `Payslip.emailSent` (boolean) — backend has `status`/`sentAt`; no `emailSent` field
- `payslipService.myList()` → `/hrms/my/payslips`; backend is `/me/payslips`

---

### Phase 12 — Login Activity

**Status: ❌ Broken — 0%**

- `loginActivityService.list()` → `/hrms/login-activity`; backend is `/login-activity`
- `POST /login-activity/login` — never called anywhere
- `POST /login-activity/logout` — never called anywhere
- `GET /login-activity/active` — no page or service method
- `LoginActivity.role` in frontend type — not a stored field on backend model

---

### Phase 13 — Self-Service (/api/me)

**Status: ❌ Broken — 0%**

| Frontend calls | Backend path |
|---|---|
| /hrms/my/attendance | /me/attendance |
| /hrms/my/leave | /me/leaves |
| /hrms/my/payslips | /me/payslips |
| /hrms/my/dashboard | Does not exist |

`GET /me/profile` — never called; My Profile reads from auth store only.
`PUT /me/profile` — never called; page is read-only. Missing IBAN self-update.

---

### Phase 14 — Dynamic Fields

**Status: ✅ Complete — 100%**

All 5 endpoints correct. Categories updated correctly for HRMS.

---

### Phase 15 — Email Configuration

**Status: ❌ Does Not Exist in Backend — 0%**

SMTP on backend is configured via environment variables only. There is no `/api/hrms/email/*` route. All 9 email service calls return 404.

---

### Phase 16 — HR Dashboard / Employee Dashboard

**Status: ❌ Does Not Exist in Backend — 0%**

No `/api/hrms/dashboard` and no `/api/me/dashboard` endpoint exists. Pages render but are permanently empty.

---

### Phase 17 — HR Reports

**Status: ❌ Does Not Exist in Backend as Implemented — 0%**

`GET /hrms/reports/{type}` does not exist. Backend only has `GET /attendance/report` and `GET /leads/report`. Neither is called by the HR Reports service.

---

## API Coverage

### Correctly Implemented (35 endpoints)

Auth (2), Dashboard (2), Leads CRUD+bulk+import/export (11), Follow-ups (3), Brokers CRUD+export (6), Users CRUD+toggle (5), Dynamic Fields CRUD (5), Leads list+get (counted above).

### Missing APIs (never called)

`POST /login-activity/login`, `POST /login-activity/logout`, `GET /login-activity/active`, `DELETE /attendance/:id`, `PUT /attendance/:id`, `POST /attendance` (manual), `GET /attendance/:id`, `GET /attendance/report`, `PATCH /employees/:id/status`, `DELETE /leave/:id`, `GET /leave/:id`, `POST /brokers/import`, `GET /me/profile` (refresh), `PUT /me/profile`, `GET /payroll/preview`, `POST /payslips/:id/generate`

### Non-Existent Backend Endpoints Called (18)

`GET /hrms/dashboard`, `GET /hrms/my/dashboard`, `GET|POST|PUT /hrms/email/smtp`, `POST /hrms/email/smtp/test`, `GET|POST|PUT|DELETE /hrms/email/templates`, `GET|GET|POST|PUT|GET|GET /hrms/payroll/*`, `GET /hrms/reports/{type}`, `GET /hrms/reports/{type}/export`

### Partially Implemented (wrong path/data)

All 28 HRMS endpoint calls — see Phase 7–13 above. All have `/hrms/` prefix issues or wrong sub-paths.

### Incorrect Integrations

| Issue | Severity |
|---|---|
| `bulkAssign/bulkStatus` response: `{count}` vs backend `{updated}` | Medium |
| Auth login envelope assumption vs backend `{data:{token,user}}` | Critical |
| Leave apply fields `startDate/endDate` vs backend `dateFrom/dateTo` | Critical |
| Payslip send-bulk body `{ids}` vs backend `{month,year}` | High |
| Decimal salary returned as strings; typed as `number` in frontend | High |

---

## Entity Coverage

| Entity | Backend | Frontend | Coverage % | Status |
|---|---|---|---|---|
| User | Full model | Missing `bankIban`; extra `profilePhoto` | 85% | Partial |
| DynamicField | Full model | Full match | 100% | Complete |
| Broker | Full model | Full match | 95% | Complete |
| Lead | Full model | Full match including `isTouched` | 98% | Complete |
| LeadStatusHistory | Full model | Match | 100% | Complete |
| AttendanceRecord | Full model | Wrong field names; missing 4 fields; extra 2 fields | 45% | Broken |
| LeaveRequest | Full model | `dateFrom→startDate` rename; missing `reviewedAt`/`reviewNote`; missing `cancelled` | 50% | Broken |
| Payslip (backend) | Full model | Not modelled — frontend has separate invented `PayrollRecord` + mismatched `Payslip` | 10% | Broken |
| LoginActivity | Full model | Extra `role` field; missing `userAgent` | 70% | Partial |
| SmtpConfig | Does not exist | Fully typed | 0% | Invented |
| EmailTemplate | Does not exist | Fully typed | 0% | Invented |
| HrDashboardSummary | Does not exist | Fully typed | 0% | Invented |
| EmployeeDashboard | Does not exist | Fully typed | 0% | Invented |
| PayrollRecord | Does not exist | Fully typed | 0% | Invented |

---

## Workflow Coverage

| Workflow | Coverage % | Status | Missing Steps |
|---|---|---|---|
| Login | 65% | Partial | `POST /login-activity/login` not called |
| Logout | 65% | Partial | `POST /login-activity/logout` not called |
| Employee check-in | 0% | Broken | Camera UI exists; API path wrong |
| Employee check-out | 0% | Broken | Same |
| Leave apply → approve → attendance backfill | 0% | Broken | Wrong field names + wrong endpoints |
| Payroll calculate → PDF → email | 0% | Broken | Entire payroll model is wrong |
| Lead import | 95% | Complete | Minor envelope edge case |
| Lead bulk assign | 85% | Partial | Response field `count` vs `updated` |
| Lead status history | 98% | Complete | |
| Follow-up management | 100% | Complete | |
| User create (with Supabase) | 100% | Complete | |
| Employee create (with Supabase) | 0% | Broken | Wrong path + missing password field |
| Dynamic field CRUD | 100% | Complete | |
| Self-service profile update | 0% | Missing | Page is read-only |
| Active session monitoring | 0% | Missing | No UI, no service call |

---

## RBAC Coverage

| Role | Coverage % | Missing Permissions |
|---|---|---|
| `master` | 90% | Login activity tracking absent; HR endpoints all 404 |
| `hr_manager` | 20% | All HRMS paths wrong; manual attendance UI gone; no active sessions |
| `sales_manager` | 90% | Bulk action response mismatch; lead report endpoints wrong |
| `sales_executive` | 80% | All `/me/*` endpoints at wrong paths; leave field name break |

---

## Validation Coverage

| Module | Missing / Mismatched Validations |
|---|---|
| Employee schema | Missing `bankIban`, `password`; `employmentStatus` enum differs from backend |
| Leave schema | Field names `startDate/endDate` must be `dateFrom/dateTo` |
| Attendance | No Zod schema for HR manual create/edit |
| Employee create | `password` field required by backend, absent from form |
| Self-service profile | No schema or form exists |

---

## UX Coverage

**Missing Pages:** `/hrms/attendance/create` (HR manual override), `/hrms/attendance/:id`, `/hrms/leave/:id`, `/hrms/login-activity/active`, `/my-hr/profile/edit`

**Missing Forms:** Attendance manual HR override form, attendance edit form, self-service profile edit (phone, bank, IBAN), employee create password field, employee IBAN field

**Missing Error Handling:** Backend Zod error `{error, details:[{path,message}]}` — frontend reads only `data?.error`; field-level server validation errors are never shown to users

**Missing Loading/Empty States:** HR Dashboard and My Profile dashboard permanently show empty/error due to non-existent endpoints

---

## Security Coverage

| Feature | Status |
|---|---|
| JWT Bearer token on every request | ✅ |
| 401 → session clear + redirect | ✅ |
| ProtectedRoute on dashboard group | ✅ |
| RoleGuard and can() for UI elements | ✅ |
| Login session tracking (POST /login-activity/login) | ❌ Never called |
| Logout session closing (POST /login-activity/logout) | ❌ Never called |
| JWT token refresh | ❌ Not implemented — silent expiry |
| Page-level role guard on HRMS pages | ⚠️ Not confirmed — sales_executive can navigate to /hrms/employees |
| Server Zod error details surfaced | ❌ `details[]` array silently dropped |

---

## Critical Gaps Table

| Priority | Module | Missing Item | Impact |
|---|---|---|---|
| Critical | All HRMS | `/hrms/*` prefix wrong — backend at `/employees`, `/attendance`, `/leave`, `/payroll`, `/payslips`, `/login-activity`, `/me` | 100% of HRMS API calls return 404 |
| Critical | Leave | `startDate`/`endDate` → backend needs `dateFrom`/`dateTo` | Every leave apply returns 400 |
| Critical | Leave | `PUT /leave/:id/approve|reject` don't exist → `PUT /leave/:id/review` | Every approve/reject returns 404 |
| Critical | Auth | `POST /login-activity/login` never called after auth | Zero session records ever created |
| Critical | Auth | `POST /login-activity/logout` never called | Sessions never closed |
| Critical | Employee | `password` field missing from create form | Employee creation fails with 400 |
| Critical | Payroll | `PayrollRecord` entity doesn't exist in backend; entire module invented | Payroll module non-functional |
| Critical | Auth | No JWT token refresh logic | Silent session expiry in production |
| Critical | Auth | Login response envelope assumption may be wrong | Auth may fail in production |
| High | Payslip | `downloadPdf` → wrong path `/payslips/:id/pdf` vs `/payslips/:id/download` | PDF download broken |
| High | Payslip | `sendBulkEmails({ids})` → backend needs `{month, year}` | Bulk email always fails |
| High | Payslip | `POST /payslips/:id/generate` never called | No way to generate PDF |
| High | Attendance | All attendance paths wrong | Check-in/out, history, summary all broken |
| High | Self-Service | All `/me/*` at wrong `/hrms/my/*` base | My Attendance/Leaves/Payslips broken |
| High | Leads | Bulk assign/status response: `{count}` vs `{updated}` | Success count always undefined |
| High | Salary | Decimal fields returned as strings, typed as `number` | Salary values show NaN |
| High | HR Dashboard | `/hrms/dashboard` doesn't exist | Dashboard permanently empty |
| High | Employee | `PATCH /employees/:id/status` not wired | Status-only updates impossible |
| Medium | Employee | Missing `bankIban` field | IBAN not collectible |
| Medium | Employee | `profilePhoto` field not in backend model | Silently ignored |
| Medium | EmploymentStatus | `probation`/`on_notice` not in backend; `on_leave`/`suspended` not in frontend | Status display/filter incorrect |
| Medium | Broker | `POST /brokers/import` not implemented | No bulk broker import |
| Medium | My Profile | `PUT /me/profile` never called | Employees cannot update own contact info |
| Low | Lead Reports | 3 of 4 report sub-paths don't exist in backend | 3 charts permanently broken |
| Low | Error Handling | `details[]` from backend Zod not surfaced | Field errors invisible to user |

---

## Final Verdict

| Metric | Score |
|---|---|
| **Backend Coverage %** | **45%** |
| **Frontend Accuracy %** | **45%** |
| **Production Readiness %** | **32%** |
| **Estimated Remaining Work %** | **55%** |

### Critical Blockers for Production

1. **All HRMS service base paths are wrong** — fix `/hrms/` → correct root in all 8 HRMS service files
2. **Leave field names** — rename `startDate`→`dateFrom`, `endDate`→`dateTo` in schema, type, and all callers
3. **Leave approve/reject endpoint** — rewrite to `PUT /leave/:id/review` with `{status, reviewNote}` body
4. **Login activity integration** — call `POST /login-activity/login` after auth and `POST /login-activity/logout` on logout
5. **Employee create missing password** — add password field to `EmployeeForm` and `EmployeeInput`
6. **Payroll module must be rewritten** — replace invented `PayrollRecord` entity with backend's `Payslip` model; replace fake CRUD with `GET /payroll/preview` + `POST /payroll/calculate`
7. **Payslip endpoints** — fix download path, send-email path, send-bulk body (`{month,year}` not `{ids}`)
8. **Email configuration module** — either remove entirely or backend must add SMTP management API (does not currently exist)
9. **JWT refresh** — implement token refresh or Supabase session renewal to prevent silent logouts
10. **Auth login response** — verify and fix envelope handling (`{data:{token,user}}` vs assumed direct `{token,user}`)
