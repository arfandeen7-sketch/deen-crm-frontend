# Frontend Migration Guide — Permission Architecture Refactor

> Self-contained spec for frontend AI. No backend knowledge required.

---

## SECTION 1 — Architecture Overview

Three permission domains plus CRM modules:

```
Administration (system_config)  → System-wide config (Master/Admin only)
HRMS Operations (hrms)          → Manage all employees' HR data
My HR / Self Service (my_hr)    → Employee manages own attendance, leave, profile
```

CRM modules: `dashboard`, `leads`, `followup`, `lead_reports`, `brokers`, `users`, `notifications`.

Every API endpoint is gated by **Module → Page → Action** permission checks. No role-based checks exist. Frontend must follow the same model.

---

## SECTION 2 — Login Response Payload

### `POST /api/auth/login`

Request: `{ "email": "...", "password": "..." }`

Response (200):
```json
{
  "data": {
    "token": "eyJhbG...",
    "user": { "id": "uuid", "fullName": "John Doe", "email": "...", "role": "sales_executive" },
    "access": {
      "isMaster": false,
      "modules": ["dashboard", "leads", "my_hr"],
      "pages": { "dashboard": ["dashboard_home"], "leads": ["all_leads"], "my_hr": ["my_attendance", "my_leave"] },
      "actions": { "leads:all_leads": ["view", "create", "edit"], "my_hr:my_leave": ["view", "apply", "cancel"] },
      "moduleDetails": { "leads": { "label": "Leads", "icon": "Users", "sortOrder": 1 } },
      "pageDetails": { "leads:all_leads": { "label": "All Leads", "classification": "Operational", "route": "/leads", "sortOrder": 0 } },
      "navigation": [
        { "key": "leads", "label": "Leads", "icon": "Users", "sortOrder": 1,
          "pages": [ { "key": "all_leads", "label": "All Leads", "classification": "Operational", "route": "/leads", "sortOrder": 0, "actions": ["view", "create", "edit"] } ] }
      ]
    }
  }
}
```

### Field Reference

| Field | Description |
|-------|-------------|
| `token` | Supabase JWT. Send as `Authorization: Bearer <token>`. |
| `user.id` | UUID. |
| `user.fullName` | Display name. |
| `user.email` | Email. |
| `user.role` | Display only. **Never use for authorization.** |
| `access.isMaster` | True = full access to all modules. Shortcut for showing everything. |
| `access.modules` | string[] of accessible module keys. |
| `access.pages` | `Record<moduleKey, pageKey[]>` — accessible pages per module. |
| `access.actions` | `Record<"module:page", actionKey[]>` — allowed actions per page. |
| `access.moduleDetails` | `Record<moduleKey, {label, icon, sortOrder}>` — module metadata for rendering. |
| `access.pageDetails` | `Record<"module:page", {label, classification, route, sortOrder}>` — page metadata. |
| `access.navigation` | Pre-built sidebar tree (NavigationModule[]). **Use this to render sidebar.** |

### Navigation types:
```typescript
interface NavigationModule { key: string; label: string; icon: string; sortOrder: number; pages: NavigationPage[]; }
interface NavigationPage { key: string; label: string; classification: 'SYSTEM'|'Operational'|'Self Service'; route: string|null; sortOrder: number; actions: string[]; }
```

### Refresh access map:
`GET /api/permissions/me` → `{ data: { userId, role, access: <AccessMap> } }`

---

## SECTION 3 — Navigation

1. **Never hardcode** modules, pages, routes, or icons.
2. **Never check roles** to decide navigation.
3. Render sidebar entirely from `access.navigation`.
4. Sort modules by `sortOrder` asc. Sort pages by `sortOrder` asc.
5. Icons are Lucide icon names. Map dynamically: `import * as Icons from 'lucide-react'; const Icon = Icons[iconName]`.
6. Pages with `route: null` are detail pages — do NOT show as sidebar links.

```typescript
function Sidebar({ navigation }) {
  return navigation.sort((a,b) => a.sortOrder - b.sortOrder).map(mod => (
    <Section key={mod.key} icon={mod.icon} label={mod.label}>
      {mod.pages.filter(p => p.route !== null).sort((a,b) => a.sortOrder - b.sortOrder)
        .map(p => <Link key={p.key} to={p.route} label={p.label} />)}
    </Section>
  ));
}
```

---

## SECTION 4 — Route Guards

1. Every protected route verifies `module:page` permission.
2. **No role checks.**
3. Check `access.pages[moduleKey]?.includes(pageKey)` for page access.
4. Check `access.actions["moduleKey:pageKey"]?.includes(actionKey)` for action access.

```typescript
function ProtectedRoute({ moduleKey, pageKey, children }) {
  const { access } = useAuth();
  if (!access.pages[moduleKey]?.includes(pageKey)) return <Navigate to="/403" />;
  return children;
}
```

Unauthorized route → redirect to `/403`. API returns 403 → show toast "Access denied".

---

## SECTION 5 — Button Permissions

```typescript
function Can({ module, page, action, children }) {
  const { access } = useAuth();
  return access.actions[`${module}:${page}`]?.includes(action) ? children : null;
}
```

### Full Action → Button Mapping

| Module | Page | Action | Button Label |
|--------|------|--------|-------------|
| leads | all_leads | view | View leads list |
| leads | all_leads | create | New Lead |
| leads | all_leads | edit | Edit |
| leads | all_leads | delete | Delete |
| leads | all_leads | assign | Assign |
| leads | all_leads | bulk_assign | Bulk Assign |
| leads | all_leads | bulk_status | Bulk Status Change |
| leads | all_leads | export | Export |
| leads | all_leads | import | Import |
| leads | all_leads | call | Call |
| leads | all_leads | whatsapp | WhatsApp |
| leads | all_leads | email | Email |
| brokers | all_brokers | create | New Broker |
| brokers | all_brokers | edit | Edit |
| brokers | all_brokers | delete | Delete |
| brokers | all_brokers | export | Export |
| brokers | all_brokers | import | Import |
| users | all_users | create | New User |
| users | all_users | edit | Edit User |
| users | all_users | deactivate | Toggle Active |
| users | all_users | manage_permissions | Manage Permissions |
| users | teams | assign | Assign Members |
| users | teams | reassign | Reassign |
| hrms | employees | create | New Employee |
| hrms | employees | edit | Edit |
| hrms | employees | deactivate | Change Status |
| hrms | employees | export | Export |
| hrms | attendance | create | Create/Override |
| hrms | attendance | edit | Edit |
| hrms | attendance | delete | Delete |
| hrms | attendance | export | Export |
| hrms | attendance | audit | View Audit Log |
| hrms | attendance_regularization | approve | Approve |
| hrms | attendance_regularization | reject | Reject |
| hrms | leave | view | View Leave List |
| hrms | leave | apply | Apply Leave |
| hrms | leave | approve | Approve |
| hrms | leave | reject | Reject |
| hrms | leave | cancel | Cancel |
| hrms | leave | manage_types | Manage Leave Types |
| hrms | leave_balance | view | View Balances |
| hrms | leave_balance | adjust | Adjust Balance |
| hrms | leave_reports | view | View Reports |
| hrms | leave_reports | export | Export |
| hrms | payroll | view | View Payroll |
| hrms | payroll | generate | Generate Payroll |
| hrms | payroll | edit | Edit Payroll |
| hrms | payroll | delete | Delete Payroll |
| hrms | payslips | view | View Payslips |
| hrms | payslips | generate | Generate PDF |
| hrms | payslips | download | Download |
| hrms | payslips | print | Print |
| hrms | payslips | send | Send Email |
| system_config | attendance_settings | edit | Edit Settings |
| system_config | leave_policy | edit | Edit Policy |
| system_config | leave_types | create | Create Type |
| system_config | leave_types | edit | Edit |
| system_config | leave_types | delete | Delete |
| system_config | leave_types | toggle_active | Activate/Deactivate |
| system_config | holiday_management | create | Create Holiday |
| system_config | holiday_management | edit | Edit |
| system_config | holiday_management | delete | Delete |
| system_config | dynamic_fields | create | Create Field |
| system_config | dynamic_fields | edit | Edit |
| system_config | dynamic_fields | delete | Delete |
| system_config | notification_templates | edit | Edit Template |
| system_config | storage_settings | edit | Edit Storage |
| system_config | email_settings | edit | Edit Email |
| system_config | payroll_rules | edit | Edit Rules |
| system_config | office_location | edit | Edit Location |
| system_config | working_hours | edit | Edit Hours |
| my_hr | my_attendance | check_in | Check In |
| my_hr | my_attendance | check_out | Check Out |
| my_hr | my_attendance | view_today | View Today |
| my_hr | attendance_regularization | apply | Apply Correction |
| my_hr | my_leave | apply | Apply Leave |
| my_hr | my_leave | cancel | Cancel Leave |
| my_hr | my_payslips | download | Download Payslip |
| my_hr | my_profile | edit | Edit Profile |
| notifications | all_notifications | mark_read | Mark as Read |
| dashboard | analytics | export | Export Analytics |

---

## SECTION 6 — Module Classification

Three classifications on `pageDetails["module:page"].classification`:

| Classification | Meaning | UI Treatment |
|---------------|---------|-------------|
| `SYSTEM` | Admin configuration pages | Group under "Administration" in sidebar. Only visible to users with `system_config` module access. |
| `Operational` | Day-to-day business operations | Main sidebar section. Visible to users with relevant module grants. |
| `Self Service` | Employee self-service pages | Group under "My HR" / "Me" in sidebar. Visible to employees with `my_hr` grants. |

Use classification to optionally group sidebar sections with headers.

---

## SECTION 7 — Administration (system_config module)

All routes prefixed `/admin/`. All require `system_config` module access.

| Page Key | Route | Actions | Purpose |
|----------|-------|---------|---------|
| attendance_settings | /admin/attendance-settings | view, edit | Geofence, office location, check-in rules |
| leave_policy | /admin/leave-policy | view, edit | Global leave policy (carry forward, accrual) |
| leave_types | /admin/leave-types | view, create, edit, delete, toggle_active | CRUD leave types (annual, sick, etc.) |
| holiday_management | /admin/holidays | view, create, edit, delete | Public holidays management |
| dynamic_fields | /admin/dynamic-fields | view, create, edit, delete | Custom fields (lead sources, statuses, etc.) |
| notification_templates | /admin/notification-templates | view, edit | Email/push notification templates |
| storage_settings | /admin/storage-settings | view, edit | File storage configuration |
| email_settings | /admin/email-settings | view, edit | SMTP/email provider settings |
| payroll_rules | /admin/payroll-rules | view, edit | Payroll calculation rules |
| office_location | /admin/office-location | view, edit | Office address & coordinates |
| working_hours | /admin/working-hours | view, edit | Standard working hours config |

### Who sees these:
- Users with `system_config` in `access.modules`.
- Master users (`isMaster: true`) always see these.
- No other users should see Administration in the sidebar.

### Navigation:
- Appears as a sidebar group labeled "Administration" with icon `Settings`.
- Only visible if `access.modules.includes('system_config')`.

---

## SECTION 8 — HRMS (hrms module)

All routes require `hrms` module access. These are operational endpoints for HR/managers to manage all employees.

| Page Key | Route | Actions | Purpose |
|----------|-------|---------|---------|
| employees | /hrms/employees | view, create, edit, deactivate, export | Employee directory CRUD |
| attendance | /hrms/attendance | view, create, edit, delete, export, audit | All-employee attendance management |
| attendance_regularization | /hrms/attendance-regularization | view, approve, reject | Review regularization requests |
| leave | /hrms/leave | view, apply, approve, reject, cancel, manage_types | All-employee leave management |
| leave_balance | /hrms/leave-balance | view, adjust | Leave balance adjustments |
| leave_reports | /hrms/leave-reports | view, export | Leave analytics & reports |
| payroll | /hrms/payroll | view, generate, edit, delete | Payroll calculation & management |
| payslips | /hrms/payslips | view, generate, download, print, send | Payslip generation & distribution |
| login_activity | /hrms/login-activity | view | User login/logout audit trail |

### Navigation:
- Sidebar group labeled "HRMS" with icon `Building2`.
- Only visible if `access.modules.includes('hrms')`.

### Expected UI per page:

**Employees** — Table with columns: name, email, department, designation, status. Buttons: New Employee (create), Edit (edit), Change Status (deactivate), Export (export).

**Attendance** — Table of all employees' attendance. Filters by date, user. Buttons: Create/Override (create), Edit (edit), Delete (delete), Export (export), View Audit Log (audit). Detail view shows audit trail.

**Attendance Regularization** — List of pending regularization requests from all employees. Buttons: Approve (approve), Reject (reject). Detail view shows requested check-in/out times and reason.

**Leave** — List of all leave requests. Filters by status, user, date. Buttons: Apply Leave (apply), Approve (approve), Reject (reject), Cancel (cancel). Detail view shows leave type, dates, reason, attachment, audit trail.

**Leave Balance** — Table of leave balances per employee per type. Button: Adjust (adjust) opens modal to add/remove days.

**Leave Reports** — Analytics page with charts. Button: Export (export).

**Payroll** — Monthly payroll preview and calculation. Buttons: Generate (generate), Edit (edit), Delete (delete).

**Payslips** — List of generated payslips. Buttons: Generate PDF (generate), Download (download), Print (print), Send Email (send).

**Login Activity** — Table of login/logout events. Read-only.

---

## SECTION 9 — My HR (my_hr module — Employee Self Service)

All routes require `my_hr` module access. These are self-service endpoints — each employee manages only their own data. The backend automatically scopes all queries to `req.user.id`.

| Page Key | Route | Actions | Purpose |
|----------|-------|---------|---------|
| my_attendance | /me/attendance | check_in, check_out, view_today | Daily check-in/out + today's status |
| attendance_history | /me/attendance/history | view | Paginated attendance history |
| attendance_calendar | /me/attendance/calendar | view | Monthly calendar view |
| attendance_regularization | /me/attendance/regularization | view, apply | Request correction for past attendance |
| attendance_details | /me/attendance/:id | view | Single attendance record detail (route null — no sidebar link) |
| my_leave | /me/leave | view, apply, cancel | Own leave requests list, apply, cancel |
| my_payslips | /me/payslips | view, download | Own payslips list & PDF download |
| my_profile | /me/profile | view, edit | Own profile (phone, bank details) |

### Navigation:
- Sidebar group labeled "My HR" with icon `UserCircle`.
- Only visible if `access.modules.includes('my_hr')`.
- `attendance_details` has `route: null` — accessed from within attendance history/calendar, not sidebar.

### Employee Flow:
1. Employee logs in → sees "My HR" in sidebar if they have `my_hr` grants.
2. **Check In/Out** — On `/me/attendance` page, show Check In button (if `check_in` action) and Check Out button (if `check_out` action). Show today's attendance status (if `view_today` action).
3. **Leave** — On `/me/leave` page, show leave list, Apply Leave button (if `apply` action), Cancel button on pending requests (if `cancel` action). Dashboard tab shows balances, pending/approved/rejected counts, upcoming leaves. Calendar tab shows month view with attendance + leave overlay.
4. **Regularization** — On `/me/attendance/regularization` page, show own regularization requests list and Apply Correction button (if `apply` action). Form requires: date, requestType, requestedCheckIn/Out, reason (min 10 chars), optional attachment.
5. **Payslips** — On `/me/payslips` page, show own payslips list with Download button (if `download` action).
6. **Profile** — On `/me/profile` page, show own profile info with Edit button (if `edit` action). Editable fields: phone, bankName, bankAccountNumber, bankIban only.

### Important:
- These endpoints NEVER accept a `userId` parameter. The backend uses `req.user.id` internally.
- An employee with only `my_hr` access should NOT see HRMS, Administration, or any operational modules in the sidebar.

---

## SECTION 10 — API Changes

All APIs use base URL `/api`. All protected endpoints require `Authorization: Bearer <token>` header.

### 10.1 — My HR Self-Service APIs (NEW)

These are entirely new endpoints for employee self-service.

#### `POST /api/my/attendance/check-in`
- **Permission:** `my_hr:my_attendance:check_in`
- **Body:** `multipart/form-data` with optional `photo` file field
- **Response:** `{ data: { id, userId, date, checkInTime, checkOutTime, checkInPhoto, checkOutPhoto, status } }`
- **Status 201** on success, **409** if already checked in

#### `POST /api/my/attendance/check-out`
- **Permission:** `my_hr:my_attendance:check_out`
- **Body:** `multipart/form-data` with optional `photo` file field
- **Response:** `{ data: { id, userId, date, checkInTime, checkOutTime, ... } }`
- **Status 200** on success, **400** if not checked in, **409** if already checked out

#### `GET /api/my/attendance/today`
- **Permission:** `my_hr:my_attendance:view_today`
- **Response:** `{ data: { id, date, checkInTime, checkOutTime, status, ... } | null }`

#### `GET /api/my/attendance`
- **Permission:** `my_hr:attendance_history:view`
- **Query:** `page`, `pageSize`, `dateFrom`, `dateTo`
- **Response:** `{ data: [...], total, page, pageSize, totalPages, meta: { total, page, pageSize, totalPages } }`

#### `GET /api/my/attendance/calendar`
- **Permission:** `my_hr:attendance_calendar:view`
- **Query:** `month` (1-12), `year`
- **Response:** `{ data: { year, month, days: { "YYYY-MM-DD": { attendance?: {checkInTime, checkOutTime, status}, isWeekend, isHoliday } } } }`

#### `GET /api/my/attendance/:id`
- **Permission:** `my_hr:attendance_details:view`
- **Response:** `{ data: { id, date, checkInTime, checkOutTime, status, ... } }`
- **Note:** Backend enforces ownership — returns 403 if record doesn't belong to user

#### `GET /api/my/regularization`
- **Permission:** `my_hr:attendance_regularization:view`
- **Query:** `page`, `pageSize`
- **Response:** `{ data: [...], total, page, pageSize, totalPages, meta: {...} }`

#### `GET /api/my/regularization/:id`
- **Permission:** `my_hr:attendance_regularization:view`
- **Response:** `{ data: { id, date, requestType, requestedCheckIn, requestedCheckOut, reason, status, ... } }`

#### `POST /api/my/regularization`
- **Permission:** `my_hr:attendance_regularization:apply`
- **Body:** `multipart/form-data` — `date`, `attendanceId?`, `requestType`, `requestedCheckIn?`, `requestedCheckOut?`, `reason` (min 10 chars), optional `attachment` file
- **requestType values:** `missed_check_in`, `missed_check_out`, `wrong_check_in_time`, `wrong_check_out_time`, `wrong_working_hours`, `wrong_attendance_status`, `other`
- **Response:** `{ data: { id, ... } }` (201)
- **409** if pending request already exists for that date

#### `GET /api/my/leave`
- **Permission:** `my_hr:my_leave:view`
- **Query:** `page`, `pageSize`, `status` (pending|approved|rejected|cancelled)
- **Response:** `{ data: [...], total, page, pageSize, totalPages, meta: {...} }`
- **Each item includes:** `leaveType`, `reviewer: { id, fullName }`

#### `GET /api/my/leave/:id`
- **Permission:** `my_hr:my_leave:view`
- **Response:** `{ data: { ...record, leaveType, reviewer, audits: [...], attachmentSignedUrl } }`

#### `POST /api/my/leave`
- **Permission:** `my_hr:my_leave:apply`
- **Body:** `multipart/form-data` — `leaveTypeCode`, `dateFrom`, `dateTo`, `isHalfDay`, `halfDayPeriod?` (first_half|second_half), `reason?`, optional `attachment` file
- **Response:** `{ data: { id, status, ... } }` (201)
- **Status** is `approved` if leave type has `autoApprove=true`, else `pending`

#### `DELETE /api/my/leave/:id`
- **Permission:** `my_hr:my_leave:cancel`
- **Body:** `{ cancellationReason?: string }`
- **Response:** `{ data: { success: true } }`

#### `GET /api/my/leave/dashboard`
- **Permission:** `my_hr:my_leave:view`
- **Response:** `{ data: { balances: [...], stats: { pending, approved, rejected }, upcomingLeaves: [...] } }`

#### `GET /api/my/leave/calendar`
- **Permission:** `my_hr:my_leave:view`
- **Query:** `month`, `year`
- **Response:** `{ data: { year, month, days: { "YYYY-MM-DD": { attendance?: {...}, leave?: { id, type, status, code }, isWeekend, isHoliday } } } }`

#### `GET /api/my/leave/balance`
- **Permission:** `my_hr:my_leave:view`
- **Query:** `year`
- **Response:** `{ data: { userId, year, balances: [...] } }`

### 10.2 — Self-Service /api/me APIs (EXISTING — permission-gated now)

These endpoints existed before but now require `my_hr` permissions.

#### `GET /api/me/profile`
- **Permission:** `my_hr:my_profile:view`
- **Response:** `{ data: { id, fullName, email, role, employeeId, department, designation, joiningDate, phone, bankName, bankAccountNumber, bankIban, employmentStatus, isActive, access: <AccessMap> } }`
- **Note:** Response includes `access` — same shape as login `access` field. Use to refresh permissions.

#### `PUT /api/me/profile`
- **Permission:** `my_hr:my_profile:edit`
- **Body:** `{ phone?, bankName?, bankAccountNumber?, bankIban? }`
- **Response:** `{ data: { id, fullName, phone, bankName, bankAccountNumber, bankIban } }`

#### `GET /api/me/attendance`
- **Permission:** `my_hr:attendance_history:view`
- **Query:** `page`, `pageSize`, `dateFrom`, `dateTo`
- **Response:** Paginated attendance records

#### `GET /api/me/leaves`
- **Permission:** `my_hr:my_leave:view`
- **Query:** `page`, `pageSize`
- **Response:** Paginated leave requests

#### `GET /api/me/payslips`
- **Permission:** `my_hr:my_payslips:view`
- **Query:** `page`, `pageSize`
- **Response:** Paginated payslips

#### `GET /api/me/payslips/:id/download`
- **Permission:** `my_hr:my_payslips:download`
- **Response:** Binary PDF file (`Content-Type: application/pdf`, `Content-Disposition: attachment`)

### 10.3 — Administration APIs (CHANGED — moved to /api/admin)

These endpoints were previously at different paths. They are now unified under `/api/admin` and require `system_config` module permissions.

#### Attendance Settings
| Method | Old Path | New Path | Permission |
|--------|----------|----------|------------|
| GET | /api/attendance/config | /api/admin/attendance-settings | `system_config:attendance_settings:view` |
| PUT | /api/attendance/config | /api/admin/attendance-settings | `system_config:attendance_settings:edit` |

#### Leave Policy
| Method | Old Path | New Path | Permission |
|--------|----------|----------|------------|
| GET | /api/leave-policy | /api/admin/leave-policy | `system_config:leave_policy:view` |
| PUT | /api/leave-policy | /api/admin/leave-policy | `system_config:leave_policy:edit` |

#### Leave Types (Settings)
| Method | Old Path | New Path | Permission |
|--------|----------|----------|------------|
| GET | /api/leave-settings | /api/admin/leave-types | `system_config:leave_types:view` |
| GET | /api/leave-settings/:code | /api/admin/leave-types/:code | `system_config:leave_types:view` |
| POST | /api/leave-settings | /api/admin/leave-types | `system_config:leave_types:create` |
| PUT | /api/leave-settings/:code | /api/admin/leave-types/:code | `system_config:leave_types:edit` |
| DELETE | /api/leave-settings/:code | /api/admin/leave-types/:code | `system_config:leave_types:delete` |
| PATCH | /api/leave-settings/:code/toggle | /api/admin/leave-types/:code/toggle | `system_config:leave_types:toggle_active` |

**Note:** `/api/leave-settings` still exists as a compatibility route with the same permissions. Prefer `/api/admin/leave-types`.

#### Dynamic Fields
| Method | Old Path | New Path | Permission |
|--------|----------|----------|------------|
| GET | /api/dynamic-fields | /api/admin/dynamic-fields | `system_config:dynamic_fields:view` |
| GET | /api/dynamic-fields/:category | /api/admin/dynamic-fields/:category | `system_config:dynamic_fields:view` |
| POST | /api/dynamic-fields | /api/admin/dynamic-fields | `system_config:dynamic_fields:create` |
| PUT | /api/dynamic-fields/:id | /api/admin/dynamic-fields/:id | `system_config:dynamic_fields:edit` |
| DELETE | /api/dynamic-fields/:id | /api/admin/dynamic-fields/:id | `system_config:dynamic_fields:delete` |

**Note:** `/api/dynamic-fields` still exists as a compatibility route. Prefer `/api/admin/dynamic-fields`.

### 10.4 — HRMS Operational APIs (UNCHANGED paths — permissions added)

These endpoints keep their original paths but now require `hrms` module permissions.

#### Leave (HRMS)
| Method | Path | Permission |
|--------|------|------------|
| GET | /api/leave | `hrms:leave:view` |
| POST | /api/leave | `hrms:leave:apply` |
| GET | /api/leave/:id | `hrms:leave:view` |
| DELETE | /api/leave/:id | `hrms:leave:cancel` |
| PUT | /api/leave/:id/review | `hrms:leave:approve` or `hrms:leave:reject` (based on body.status) |
| GET | /api/leave/dashboard | `hrms:leave:view` |
| GET | /api/leave/hr-dashboard | `hrms:leave:view` |
| GET | /api/leave/calendar | `hrms:leave:view` |
| GET | /api/leave/balance | `hrms:leave_balance:view` |
| GET | /api/leave/balance/all | `hrms:leave_balance:view` |
| POST | /api/leave/balance/adjust | `hrms:leave_balance:adjust` |
| GET | /api/leave/reports | `hrms:leave_reports:view` |
| GET | /api/leave/reports/export | `hrms:leave_reports:export` |

#### Attendance (HRMS)
| Method | Path | Permission |
|--------|------|------------|
| GET | /api/attendance | `hrms:attendance:view` |
| POST | /api/attendance | `hrms:attendance:create` |
| GET | /api/attendance/:id | `hrms:attendance:view` |
| PUT | /api/attendance/:id | `hrms:attendance:edit` |
| DELETE | /api/attendance/:id | `hrms:attendance:delete` |
| GET | /api/attendance/export | `hrms:attendance:export` |
| GET | /api/attendance/report | `hrms:attendance:view` |
| GET | /api/attendance/calendar | `hrms:attendance:view` |
| GET | /api/attendance/user/:userId/summary | `hrms:attendance:view` |
| GET | /api/attendance/:id/audit | `hrms:attendance:audit` |

#### Attendance Regularization (HRMS)
| Method | Path | Permission |
|--------|------|------------|
| GET | /api/attendance-regularization | `hrms:attendance_regularization:view` |
| GET | /api/attendance-regularization/:id | `hrms:attendance_regularization:view` |
| PUT | /api/attendance-regularization/:id/review | `hrms:attendance_regularization:approve` |

#### Employees (HRMS)
| Method | Path | Permission |
|--------|------|------------|
| GET | /api/employees | `hrms:employees:view` |
| GET | /api/employees/:id | `hrms:employees:view` |
| POST | /api/employees | `hrms:employees:create` |
| PUT | /api/employees/:id | `hrms:employees:edit` |
| PATCH | /api/employees/:id/status | `hrms:employees:deactivate` |
| GET | /api/employees/export | `hrms:employees:export` |

#### Payroll (HRMS)
| Method | Path | Permission |
|--------|------|------------|
| GET | /api/payroll/preview | `hrms:payroll:view` |
| POST | /api/payroll/calculate | `hrms:payroll:generate` |

#### Payslips (HRMS)
| Method | Path | Permission |
|--------|------|------------|
| GET | /api/payslips | `hrms:payslips:view` |
| GET | /api/payslips/:id | `hrms:payslips:view` |
| POST | /api/payslips/:id/generate | `hrms:payslips:generate` |
| GET | /api/payslips/:id/download | `hrms:payslips:download` |
| POST | /api/payslips/:id/send | `hrms:payslips:send` |
| POST | /api/payslips/send-bulk | `hrms:payslips:send` |

#### Login Activity (HRMS)
| Method | Path | Permission |
|--------|------|------------|
| GET | /api/login-activity | `hrms:login_activity:view` |
| GET | /api/login-activity/active | `hrms:login_activity:view` |
| POST | /api/login-activity/login | (no permission — called by auth flow) |
| POST | /api/login-activity/logout | (no permission — called by auth flow) |

### 10.5 — Permission Management APIs

#### `GET /api/permissions/registry`
- **Permission:** Any authenticated user
- **Response:** `{ data: { registry: <full PERMISSION_REGISTRY array> } }`
- **Purpose:** Frontend uses this to render the permission matrix UI when editing user permissions.

#### `GET /api/permissions/me`
- **Permission:** Any authenticated user
- **Response:** `{ data: { userId, role, access: <AccessMap> } }`
- **Purpose:** Refresh current user's access map without re-login.

#### `GET /api/permissions/user/:userId`
- **Permission:** `users:all_users:manage_permissions`
- **Response:** `{ data: { userId, fullName, role, isMasterUser, grants: [...], registry: <PERMISSION_REGISTRY> } }`
- **Purpose:** Load a user's permission matrix for editing.

#### `PUT /api/permissions/user/:userId`
- **Permission:** `users:all_users:manage_permissions`
- **Body:** `{ grants: [{ moduleKey, pageKey, actionKey, granted }] }`
- **Response:** `{ data: { userId, ...matrix } }`
- **Purpose:** Bulk-replace all permissions for a user. Pass empty array to revoke all.

#### `DELETE /api/permissions/user/:userId`
- **Permission:** `users:all_users:manage_permissions`
- **Response:** `{ data: { userId, message: "All permissions revoked" } }`
- **Note:** Cannot revoke master user permissions (400 error).

### 10.6 — Notification APIs

| Method | Path | Permission |
|--------|------|------------|
| GET | /api/notifications | `notifications:all_notifications:view` |
| GET | /api/notifications/unread-count | `notifications:all_notifications:view` |
| PATCH | /api/notifications/read-all | `notifications:all_notifications:mark_read` |
| PATCH | /api/notifications/:id/read | `notifications:all_notifications:mark_read` |

### 10.7 — Auth APIs (unchanged)

| Method | Path | Permission |
|--------|------|------------|
| POST | /api/auth/login | Public |
| POST | /api/auth/logout | Authenticated |
| PUT | /api/auth/change-password | Authenticated |

---

## SECTION 11 — Existing API Compatibility

These APIs remain at the same paths with the same response formats. They now require permission checks but the frontend API calls don't need URL changes.

### CRM APIs (unchanged paths, permissions added)
- `/api/dashboard/summary` — `dashboard:dashboard_home:view`
- `/api/dashboard/status-analytics` — `dashboard:analytics:view`
- `/api/leads` — `leads:*` (category-aware: `?category=assigned` → `leads:assigned_leads:view`, etc.)
- `/api/followup/today` — `followup:todays_followup:view`
- `/api/followup/missed` — `followup:missed_followup:view`
- `/api/followup/upcoming` — `followup:upcoming_followup:view`
- `/api/brokers` — `brokers:all_brokers:*`
- `/api/users` — `users:all_users:*`
- `/api/teams` — `users:teams:*`

### Compatibility routes (old paths still work, prefer new paths):
- `/api/leave-settings` → same as `/api/admin/leave-types` (both require `system_config:leave_types:*`)
- `/api/leave-policy` → same as `/api/admin/leave-policy` (both require `system_config:leave_policy:*`)
- `/api/dynamic-fields` → same as `/api/admin/dynamic-fields` (both require `system_config:dynamic_fields:*`)

### Deprecated (do not use in new code):
- `/api/attendance/config` — use `/api/admin/attendance-settings` instead
- Role-based checks (`role === 'hr_manager'`, `role === 'master'`) — use permission checks instead

---

## SECTION 12 — Response Models

### Standard Envelope
All JSON responses use:
```json
{ "data": <payload> }
```
Error responses use:
```json
{ "success": false, "message": "Access denied.", "required": { "module": "...", "page": "...", "action": "..." } }
```

### Paginated Response
```json
{
  "data": [...items],
  "total": 100,
  "page": 1,
  "pageSize": 25,
  "totalPages": 4,
  "meta": { "total": 100, "page": 1, "pageSize": 25, "totalPages": 4 }
}
```
Use `meta` for pagination. Top-level fields are deprecated but still present.

### Attendance Model
```typescript
{
  id: string;          // UUID
  userId: string;
  date: string;        // ISO date
  checkInTime: string | null;   // ISO datetime
  checkOutTime: string | null;  // ISO datetime
  checkInPhoto: string | null;  // base64
  checkOutPhoto: string | null; // base64
  status: 'present' | 'absent' | 'leave' | 'weekend' | 'holiday' | 'remote';
  leaveTypeCode: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### Leave Request Model
```typescript
{
  id: string;
  userId: string;
  leaveTypeCode: string;
  dateFrom: string;     // ISO date
  dateTo: string;       // ISO date
  totalDays: number | string;  // may be decimal string
  isHalfDay: boolean;
  halfDayPeriod: 'first_half' | 'second_half' | null;
  reason: string | null;
  attachmentUrl: string | null;
  attachmentSignedUrl?: string | null;  // only in :id response
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewedBy: string | null;
  reviewedAt: string | null;
  cancellationReason: string | null;
  cancelledAt: string | null;
  leaveType?: { code: string; name: string; isPaid: boolean; ... };
  reviewer?: { id: string; fullName: string };
  audits?: [{ action: string; oldStatus: string; newStatus: string; changedBy: { id, fullName }; createdAt: string }];
}
```

### Leave Balance Model
```typescript
{
  leaveTypeCode: string;
  leaveTypeName: string;
  totalEntitled: number;
  consumed: number;
  remaining: number;
  carriedForward: number;
  isPaid: boolean;
}
```

### Leave Dashboard Model
```typescript
{
  balances: LeaveBalance[];
  stats: { pending: number; approved: number; rejected: number };
  upcomingLeaves: LeaveRequest[];
}
```

### Attendance Calendar Model
```typescript
{
  year: number;
  month: number;
  days: {
    "YYYY-MM-DD": {
      attendance?: { checkInTime: string | null; checkOutTime: string | null; status: string };
      leave?: { id: string; type: string; status: string; code: string };  // leave calendar only
      isWeekend: boolean;
      isHoliday: boolean;
    }
  }
}
```

### Regularization Model
```typescript
{
  id: string;
  attendanceId: string | null;
  userId: string;
  date: string;
  requestType: 'missed_check_in' | 'missed_check_out' | 'wrong_check_in_time' | 'wrong_check_out_time' | 'wrong_working_hours' | 'wrong_attendance_status' | 'other';
  requestedCheckIn: string | null;
  requestedCheckOut: string | null;
  reason: string;
  attachmentUrl: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy: string | null;
  reviewer?: { id: string; fullName: string };
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### Permission Matrix Model
```typescript
{
  isMasterUser: boolean;
  grants: [{ moduleKey: string; pageKey: string; actionKey: string; granted: boolean }];
  registry: ModuleDef[];  // full PERMISSION_REGISTRY
}
```

### Access Map Model
```typescript
{
  isMaster: boolean;
  modules: string[];
  pages: Record<string, string[]>;
  actions: Record<string, string[]>;
  moduleDetails: Record<string, { label: string; icon: string; sortOrder: number }>;
  pageDetails: Record<string, { label: string; classification: string; route: string | null; sortOrder: number }>;
  navigation: NavigationModule[];
}
```

### Notification Model
```typescript
{
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}
```

### User Profile Model
```typescript
{
  id: string;
  fullName: string;
  email: string;
  role: string;
  employeeId: string | null;
  department: string | null;
  designation: string | null;
  joiningDate: string | null;
  phone: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankIban: string | null;
  employmentStatus: string | null;
  isActive: boolean;
  access?: AccessMap;  // only in /api/me/profile
}
```

### Payslip Model
```typescript
{
  id: string;
  userId: string;
  month: number;
  year: number;
  basicSalary: string;      // decimal as string
  allowances: string;
  deductions: string;
  netPay: string;
  overtimeAmount: string;
  pdfUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
```

---

## SECTION 13 — Sidebar Migration

### Old Sidebar (REMOVE):
- Hardcoded menu items based on role checks
- `if (role === 'master') show admin menu`
- `if (role === 'hr_manager') show HRMS menu`
- Static icon imports
- Static route definitions

### New Sidebar (ADD):
- Render entirely from `access.navigation` array
- Dynamic icon mapping from Lucide
- Sort by `sortOrder`
- Filter out pages with `route: null`
- Group by `classification` if desired:
  - `SYSTEM` pages → "Administration" section
  - `Operational` pages → main sections
  - `Self Service` pages → "My HR" section

### What to remove:
- All `role === 'master'` / `role === 'hr_manager'` / `role === 'employee'` checks in sidebar
- Hardcoded module/page lists
- Static icon imports for menu items

### What to add:
- `useAuth()` hook providing `access.navigation`
- Dynamic icon renderer: `Icons[iconName]`
- Permission-aware sidebar sections

### Dynamic rendering flow:
```
1. User logs in → store `access` in auth context
2. Sidebar reads `access.navigation`
3. For each module (sorted by sortOrder):
   a. Render module header with icon + label
   b. For each page (sorted by sortOrder, route !== null):
      - Render NavLink to page.route
4. Done — no hardcoded items
```

---

## SECTION 14 — React Query Migration

### Query Keys

| Query Key | API Endpoint | Purpose |
|-----------|-------------|---------|
| `['auth', 'me']` | GET /api/permissions/me | Current user access map |
| `['permissions', 'registry']` | GET /api/permissions/registry | Full permission registry |
| `['permissions', 'user', userId]` | GET /api/permissions/user/:userId | User permission matrix |
| `['my-attendance', 'today']` | GET /api/my/attendance/today | Today's attendance |
| `['my-attendance', 'list', { page, pageSize, dateFrom, dateTo }]` | GET /api/my/attendance | Attendance history |
| `['my-attendance', 'calendar', { month, year }]` | GET /api/my/attendance/calendar | Attendance calendar |
| `['my-regularization', 'list', { page, pageSize }]` | GET /api/my/regularization | Regularization list |
| `['my-leave', 'list', { page, pageSize, status }]` | GET /api/my/leave | Leave list |
| `['my-leave', 'detail', id]` | GET /api/my/leave/:id | Leave detail |
| `['my-leave', 'dashboard']` | GET /api/my/leave/dashboard | Leave dashboard |
| `['my-leave', 'calendar', { month, year }]` | GET /api/my/leave/calendar | Leave calendar |
| `['my-leave', 'balance', { year }]` | GET /api/my/leave/balance | Leave balance |
| `['me', 'profile']` | GET /api/me/profile | Own profile |
| `['me', 'payslips', { page, pageSize }]` | GET /api/me/payslips | Own payslips |
| `['admin', 'attendance-settings']` | GET /api/admin/attendance-settings | Attendance config |
| `['admin', 'leave-policy']` | GET /api/admin/leave-policy | Leave policy |
| `['admin', 'leave-types']` | GET /api/admin/leave-types | Leave types list |
| `['admin', 'leave-types', code]` | GET /api/admin/leave-types/:code | Single leave type |
| `['admin', 'dynamic-fields']` | GET /api/admin/dynamic-fields | Dynamic fields |
| `['admin', 'dynamic-fields', category]` | GET /api/admin/dynamic-fields/:category | Fields by category |
| `['notifications', 'list']` | GET /api/notifications | Notifications |
| `['notifications', 'unread-count']` | GET /api/notifications/unread-count | Unread count |
| `['hrms', 'leave', 'list', params]` | GET /api/leave | HRMS leave list |
| `['hrms', 'leave', 'detail', id]` | GET /api/leave/:id | HRMS leave detail |
| `['hrms', 'leave', 'hr-dashboard']` | GET /api/leave/hr-dashboard | HR dashboard |
| `['hrms', 'attendance', 'list', params]` | GET /api/attendance | HRMS attendance |
| `['hrms', 'attendance', 'detail', id]` | GET /api/attendance/:id | Attendance detail |
| `['hrms', 'attendance', 'audit', id]` | GET /api/attendance/:id/audit | Audit log |
| `['hrms', 'regularization', 'list', params]` | GET /api/attendance-regularization | Regularization list |
| `['hrms', 'employees', 'list', params]` | GET /api/employees | Employee list |
| `['hrms', 'employees', 'detail', id]` | GET /api/employees/:id | Employee detail |
| `['hrms', 'payroll', 'preview', params]` | GET /api/payroll/preview | Payroll preview |
| `['hrms', 'payslips', 'list', params]` | GET /api/payslips | Payslip list |

### Mutations

| Mutation Key | API Endpoint | Cache to Invalidate |
|-------------|-------------|---------------------|
| `useCheckIn` | POST /api/my/attendance/check-in | `['my-attendance', 'today']`, `['my-attendance', 'list']` |
| `useCheckOut` | POST /api/my/attendance/check-out | `['my-attendance', 'today']`, `['my-attendance', 'list']` |
| `useApplyRegularization` | POST /api/my/regularization | `['my-regularization', 'list']` |
| `useApplyLeave` | POST /api/my/leave | `['my-leave', 'list']`, `['my-leave', 'dashboard']`, `['my-leave', 'balance']` |
| `useCancelLeave` | DELETE /api/my/leave/:id | `['my-leave', 'list']`, `['my-leave', 'dashboard']` |
| `useUpdateProfile` | PUT /api/me/profile | `['me', 'profile']` |
| `useUpdateAttendanceSettings` | PUT /api/admin/attendance-settings | `['admin', 'attendance-settings']` |
| `useUpdateLeavePolicy` | PUT /api/admin/leave-policy | `['admin', 'leave-policy']` |
| `useCreateLeaveType` | POST /api/admin/leave-types | `['admin', 'leave-types']` |
| `useUpdateLeaveType` | PUT /api/admin/leave-types/:code | `['admin', 'leave-types']`, `['admin', 'leave-types', code]` |
| `useDeleteLeaveType` | DELETE /api/admin/leave-types/:code | `['admin', 'leave-types']` |
| `useToggleLeaveType` | PATCH /api/admin/leave-types/:code/toggle | `['admin', 'leave-types']` |
| `useCreateDynamicField` | POST /api/admin/dynamic-fields | `['admin', 'dynamic-fields']` |
| `useUpdateDynamicField` | PUT /api/admin/dynamic-fields/:id | `['admin', 'dynamic-fields']` |
| `useDeleteDynamicField` | DELETE /api/admin/dynamic-fields/:id | `['admin', 'dynamic-fields']` |
| `useMarkNotificationRead` | PATCH /api/notifications/:id/read | `['notifications', 'list']`, `['notifications', 'unread-count']` |
| `useMarkAllNotificationsRead` | PATCH /api/notifications/read-all | `['notifications', 'list']`, `['notifications', 'unread-count']` |
| `useReviewLeave` | PUT /api/leave/:id/review | `['hrms', 'leave', 'list']`, `['hrms', 'leave', 'detail', id]` |
| `useReviewRegularization` | PUT /api/attendance-regularization/:id/review | `['hrms', 'regularization', 'list']` |
| `useUpdateUserPermissions` | PUT /api/permissions/user/:userId | `['permissions', 'user', userId]`, `['auth', 'me']` |
| `useRevokePermissions` | DELETE /api/permissions/user/:userId | `['permissions', 'user', userId]` |

### Cache invalidation after permission changes:
When permissions are updated for the current user, call `GET /api/permissions/me` to refresh the access map, then update the auth context.

---

## SECTION 15 — Component Changes

| Component | Change Required | Details |
|-----------|----------------|---------|
| **AuthContext / useAuth** | MODIFY | Store `access` from login response. Provide `access` to all consumers. Add `hasAction(module, page, action)` helper. |
| **Sidebar** | REWRITE | Remove all hardcoded items. Render from `access.navigation`. Dynamic Lucide icons. |
| **ProtectedRoute** | MODIFY | Accept `moduleKey` + `pageKey` props. Check `access.pages[moduleKey]?.includes(pageKey)`. Remove role checks. |
| **Can / PermissionWrapper** | NEW | Component to conditionally render children based on `access.actions["module:page"]?.includes(action)`. |
| **Layout** | MODIFY | Use `access.navigation` for sidebar. Remove role-based layout switching. |
| **Navigation** | REWRITE | Same as Sidebar — dynamic from navigation payload. |
| **Login** | MODIFY | Store `access` from response in auth context. Redirect to first available page in navigation. |
| **Dashboard** | MODIFY | Remove role-based widget visibility. Use permission checks for each widget. |
| **Notifications** | MODIFY | Use `notifications:all_notifications:*` permissions instead of role checks. |
| **HRMS pages (all)** | MODIFY | Replace role checks with `hrms:*` permission checks. Use `Can` component for buttons. |
| **My HR pages (all)** | NEW | New pages: MyAttendance, MyLeave, MyRegularization, MyPayslips, MyProfile. |
| **Attendance (HRMS)** | MODIFY | Change API from `/api/attendance/config` to `/api/admin/attendance-settings` for settings. |
| **Leave Settings** | MODIFY | Change API from `/api/leave-settings` to `/api/admin/leave-types`. |
| **Leave Policy** | MODIFY | Change API from `/api/leave-policy` to `/api/admin/leave-policy`. |
| **Dynamic Fields** | MODIFY | Change API from `/api/dynamic-fields` to `/api/admin/dynamic-fields`. |
| **User Management** | MODIFY | Add permission matrix UI using `GET /api/permissions/user/:userId` and `PUT /api/permissions/user/:userId`. |
| **403 Page** | NEW | "Access Denied" page for unauthorized route attempts. |

---

## SECTION 16 — Pages to Create / Modify / Remove

### NEW Pages (create from scratch):
| Page | Route | Module:Page | Purpose |
|------|-------|-------------|---------|
| My Attendance | /me/attendance | my_hr:my_attendance | Check in/out, today's status |
| Attendance History | /me/attendance/history | my_hr:attendance_history | Paginated attendance history |
| Attendance Calendar | /me/attendance/calendar | my_hr:attendance_calendar | Monthly calendar |
| Attendance Regularization (self) | /me/attendance/regularization | my_hr:attendance_regularization | Apply for corrections |
| Attendance Detail (self) | /me/attendance/:id | my_hr:attendance_details | Single record (no sidebar link) |
| My Leave | /me/leave | my_hr:my_leave | Leave list, apply, cancel, dashboard, calendar |
| My Payslips | /me/payslips | my_hr:my_payslips | Own payslips + download |
| My Profile | /me/profile | my_hr:my_profile | View/edit own profile |
| 403 Access Denied | /403 | (none) | Shown when unauthorized |
| Permission Matrix | (within User Edit) | users:all_users:manage_permissions | Permission editing UI |

### MODIFIED Pages (update existing):
| Page | Changes |
|------|---------|
| Sidebar | Rewrite to use `access.navigation` |
| Dashboard | Remove role-based widgets, use permissions |
| All HRMS pages | Replace role checks with permission checks |
| Attendance Settings | Move to `/admin/attendance-settings`, use `system_config` perms |
| Leave Types | Move API to `/api/admin/leave-types` |
| Leave Policy | Move API to `/api/admin/leave-policy` |
| Dynamic Fields | Move API to `/api/admin/dynamic-fields` |
| User Management | Add permission matrix tab |
| Login | Store `access` in context |
| ProtectedRoute | Use module:page checks |

### REMOVED Pages (delete or merge):
| Page | Reason |
|------|--------|
| Any page using `role === 'master'` checks | Replace with permission checks |
| Any page using `role === 'hr_manager'` checks | Replace with permission checks |
| Any page using `role === 'employee'` checks | Replace with permission checks |
| Old self-service pages using `/api/me/*` without permission checks | Now permission-gated |

---

## SECTION 17 — Role Removal

### The frontend must NEVER use roles for authorization:

```
❌ if (user.role === 'master') { showAdminMenu() }
❌ if (user.role === 'hr_manager') { showHRMSMenu() }
❌ if (user.role === 'employee') { showMyHRMenu() }
❌ switch (user.role) { case 'master': ... }
❌ const canEdit = user.role === 'master' || user.role === 'hr_manager'
```

### Instead, ALWAYS use the permission payload:

```
✅ if (access.modules.includes('system_config')) { showAdminMenu() }
✅ if (access.modules.includes('hrms')) { showHRMSMenu() }
✅ if (access.modules.includes('my_hr')) { showMyHRMenu() }
✅ const canEdit = access.actions['hrms:leave']?.includes('approve')
✅ <Can module="hrms" page="leave" action="approve"><ApproveButton /></Can>
```

### Role is display information only:
- `user.role` can be shown in the user profile, header, or user list.
- `user.role` can be used for sorting or labeling.
- `user.role` must NEVER control UI visibility, route access, or button visibility.
- `access.isMaster` can be used as a shortcut for "show everything" but should not replace granular checks.

### Why:
- Roles are rigid and don't support granular permissions.
- A user with role `hr_manager` might not have any HRMS permissions granted.
- A user with role `sales_executive` might have `my_hr` permissions.
- The backend enforces permissions, not roles. The frontend must match.

---

## SECTION 18 — Migration Order

### Step 1: Auth Context & Types
**Why first:** Everything depends on the access map being available.
- Update login handler to store `access` from response
- Create TypeScript types for `AccessMap`, `NavigationModule`, `NavigationPage`
- Add `hasAction(module, page, action)` helper to `useAuth()`
- Add `hasModule(module)` and `hasPage(module, page)` helpers

### Step 2: Can Component & ProtectedRoute
**Why second:** All pages need these before they can be migrated.
- Create `<Can>` component for button-level permission checks
- Update `<ProtectedRoute>` to accept `moduleKey` + `pageKey` props
- Create `/403` page

### Step 3: Sidebar Rewrite
**Why third:** Navigation is the most visible change and validates the access map works.
- Rewrite Sidebar to render from `access.navigation`
- Dynamic Lucide icon mapping
- Remove all hardcoded items and role checks

### Step 4: Route Definitions
**Why fourth:** All routes need ProtectedRoute wrappers with correct module:page.
- Wrap every route with `<ProtectedRoute moduleKey="..." pageKey="...">`
- Add new My HR routes (`/me/*`)
- Add Administration routes (`/admin/*`)

### Step 5: My HR Pages (NEW)
**Why fifth:** These are entirely new pages with no existing code to break.
- MyAttendance (check in/out, today, history, calendar)
- MyLeave (list, apply, cancel, dashboard, calendar, balance)
- MyRegularization (list, apply)
- MyPayslips (list, download)
- MyProfile (view, edit)

### Step 6: Administration Pages (API Migration)
**Why sixth:** These are existing pages with API path changes.
- Update Attendance Settings → `/api/admin/attendance-settings`
- Update Leave Types → `/api/admin/leave-types`
- Update Leave Policy → `/api/admin/leave-policy`
- Update Dynamic Fields → `/api/admin/dynamic-fields`

### Step 7: HRMS Pages (Permission Migration)
**Why seventh:** These pages keep their APIs but need permission-based button visibility.
- Replace all role checks with `Can` component
- Add permission-gated buttons on all HRMS pages

### Step 8: Permission Matrix UI
**Why eighth:** This is the admin tool for managing permissions.
- Add permission matrix tab to User Edit page
- Fetch `GET /api/permissions/user/:userId` for matrix data
- Save via `PUT /api/permissions/user/:userId`

### Step 9: Cleanup
**Why last:** Remove deprecated code after everything works.
- Remove all `role ===` checks from the codebase
- Remove old hardcoded sidebar items
- Remove deprecated API calls
- Test all roles and permission scenarios

---

## SECTION 19 — Testing Checklist

### Employee (with my_hr grants only)
- [ ] Login → sidebar shows only "My HR" and "Notifications" (and any CRM modules granted)
- [ ] No "Administration" section in sidebar
- [ ] No "HRMS" section in sidebar
- [ ] `/me/attendance` — Check In button visible (if `check_in` action)
- [ ] `/me/attendance` — Check Out button visible (if `check_out` action)
- [ ] `/me/attendance` — Today's status loads
- [ ] `/me/attendance/history` — Paginated history loads
- [ ] `/me/attendance/calendar` — Calendar renders with attendance + holidays
- [ ] `/me/attendance/regularization` — Can apply for correction
- [ ] `/me/leave` — Leave list loads
- [ ] `/me/leave` — Apply Leave button visible (if `apply` action)
- [ ] `/me/leave` — Cancel button on pending requests (if `cancel` action)
- [ ] `/me/leave/dashboard` — Balances, stats, upcoming leaves show
- [ ] `/me/leave/calendar` — Calendar with leave overlay
- [ ] `/me/leave/balance` — Balance breakdown shows
- [ ] `/me/payslips` — Payslip list loads
- [ ] `/me/payslips/:id/download` — PDF downloads
- [ ] `/me/profile` — Profile shows with Edit button (if `edit` action)
- [ ] `/admin/*` routes → redirect to /403
- [ ] `/hrms/*` routes → redirect to /403
- [ ] API calls to `/api/admin/*` → 403 response
- [ ] API calls to `/api/leave` → 403 response
- [ ] API calls to `/api/attendance` → 403 response

### HR (with hrms grants)
- [ ] Login → sidebar shows "HRMS" section
- [ ] No "Administration" section (unless also granted `system_config`)
- [ ] `/hrms/employees` — Employee list loads
- [ ] `/hrms/attendance` — All-employee attendance loads
- [ ] `/hrms/leave` — All-employee leave list loads
- [ ] Approve/Reject buttons visible (if `approve`/`reject` actions)
- [ ] `/hrms/leave-balance` — Balances load, Adjust button visible (if `adjust` action)
- [ ] `/hrms/payroll` — Payroll preview loads
- [ ] `/hrms/payslips` — Payslip list loads
- [ ] `/admin/*` routes → redirect to /403 (unless `system_config` granted)

### Master (isMaster: true)
- [ ] Login → sidebar shows ALL modules
- [ ] `/admin/*` routes → all accessible
- [ ] `/hrms/*` routes → all accessible
- [ ] `/me/*` routes → all accessible
- [ ] All buttons visible (full grant set)
- [ ] Permission Matrix UI → can edit any user's permissions
- [ ] Cannot revoke own permissions (master protection)

### Permission Removal
- [ ] Remove all `my_hr` grants from a user → My HR section disappears from sidebar
- [ ] Remove all `hrms` grants from a user → HRMS section disappears
- [ ] Remove all `system_config` grants → Administration disappears
- [ ] Remove specific action (e.g., `approve`) → Approve button disappears
- [ ] Grant specific action → button appears
- [ ] Revoke all permissions → user sees only dashboard (if granted) + 403 on everything else

### Sidebar
- [ ] Modules sorted by `sortOrder`
- [ ] Pages sorted by `sortOrder` within each module
- [ ] Pages with `route: null` do NOT appear
- [ ] Icons render correctly (Lucide dynamic mapping)
- [ ] Navigation links work (click → correct route)

### Routes
- [ ] Direct URL access to unauthorized page → /403
- [ ] Authorized route → page loads
- [ ] 403 page has "Go Home" button

### Buttons
- [ ] Create button hidden when no `create` action
- [ ] Edit button hidden when no `edit` action
- [ ] Delete button hidden when no `delete` action
- [ ] Export button hidden when no `export` action
- [ ] Approve/Reject buttons hidden when no respective action

### Notifications
- [ ] Notification bell shows unread count
- [ ] Mark as Read works (if `mark_read` action)
- [ ] Mark All Read works (if `mark_read` action)

### Attendance
- [ ] Check In creates attendance record (201)
- [ ] Check Out updates attendance record (200)
- [ ] Cannot check in twice (409)
- [ ] Cannot check out without check in (400)
- [ ] Calendar shows weekends, holidays, attendance

### Leave
- [ ] Apply leave creates request (201)
- [ ] Auto-approve if leave type has autoApprove=true
- [ ] Cancel leave works on own pending requests
- [ ] Cannot cancel others' requests (403)
- [ ] Dashboard shows correct counts
- [ ] Balance shows correct entitlements

---

## SECTION 20 — Known Breaking Changes

### 1. Login Response Shape Changed
**Before:** Login returned `{ data: { token, user } }`
**After:** Login returns `{ data: { token, user, access } }`
**Fix:** Update login handler to extract and store `access` in auth context.

### 2. `/api/attendance/config` Moved
**Before:** `GET /api/attendance/config` returned attendance settings
**After:** `GET /api/admin/attendance-settings` (requires `system_config:attendance_settings:view`)
**Fix:** Update all API calls from `/api/attendance/config` to `/api/admin/attendance-settings`.

### 3. `/api/leave-settings` Moved (prefer new path)
**Before:** `GET /api/leave-settings` was the primary path
**After:** `GET /api/admin/leave-types` is the preferred path (old path still works as compatibility)
**Fix:** Update API calls to `/api/admin/leave-types`. Old path still works but may be removed.

### 4. `/api/leave-policy` Moved (prefer new path)
**Before:** `GET /api/leave-policy` was the primary path
**After:** `GET /api/admin/leave-policy` is the preferred path (old path still works)
**Fix:** Update API calls to `/api/admin/leave-policy`.

### 5. `/api/dynamic-fields` Moved (prefer new path)
**Before:** `GET /api/dynamic-fields` was the primary path
**After:** `GET /api/admin/dynamic-fields` is the preferred path (old path still works)
**Fix:** Update API calls to `/api/admin/dynamic-fields`.

### 6. Role-Based Authorization Removed
**Before:** Frontend could check `user.role === 'master'` to show/hide UI
**After:** Role checks no longer work for authorization — users with role `hr_manager` may have zero permissions
**Fix:** Replace ALL role checks with permission checks using `access.modules`, `access.pages`, `access.actions`.

### 7. New Self-Service Endpoints
**Before:** Employees used `/api/me/*` endpoints (which still exist but are now permission-gated)
**After:** New dedicated endpoints at `/api/my/attendance/*`, `/api/my/leave/*`, `/api/my/regularization/*`
**Fix:** Use the new `/api/my/*` endpoints for employee self-service features (check-in, leave apply, regularization). The old `/api/me/*` endpoints are simpler read-only views.

### 8. 403 Error Response Shape
**Before:** 403 errors may have had varying shapes
**After:** All 403 errors return `{ success: false, message: "Access denied.", required: { module, page, action } }`
**Fix:** Update error handling to read `required` field for debugging. Show user-friendly "Access denied" toast.

### 9. Paginated Response Has `meta`
**Before:** Paginated responses had `total`, `page`, `pageSize`, `totalPages` at top level
**After:** Same fields still present BUT also nested in `meta: { total, page, pageSize, totalPages }`
**Fix:** Prefer reading from `meta` object. Top-level fields are deprecated.

### 10. Permission Management API
**Before:** No permission management API existed
**After:** `GET/PUT/DELETE /api/permissions/user/:userId` for managing user permissions
**Fix:** Add permission matrix UI to User Management page using these APIs.

### 11. Module `dynamic_fields` Renamed to `system_config`
**Before:** Module key was `dynamic_fields` with page `manage_fields`
**After:** Module key is `system_config` with page `dynamic_fields` (plus other admin pages)
**Fix:** Any frontend code referencing `dynamic_fields` module should reference `system_config` instead.

### 12. Leave Route is `/api/leave` (singular)
**Note:** The HRMS leave route is `/api/leave` (singular), NOT `/api/leaves`. Self-service is `/api/my/leave`.
**Fix:** Ensure all API calls use `/api/leave` not `/api/leaves`.

---

## FINAL NOTES

- **Base URL:** All APIs are prefixed with `/api`.
- **Auth header:** `Authorization: Bearer <token>` on all protected endpoints.
- **Content type:** `application/json` for most, `multipart/form-data` for file uploads.
- **Pagination:** `page` (1-based), `pageSize` (10, 25, 50, 100 — default 25).
- **Dates:** All dates are ISO 8601 strings. Date-only fields use `YYYY-MM-DD`. Datetime fields use full ISO format.
- **Decimals:** Some numeric fields (like `totalDays`, `basicSalary`) may be returned as strings (Prisma decimal serialization).
- **Error handling:** All errors return `{ success: false, message: "..." }`. HTTP status codes are meaningful (400=validation, 401=auth, 403=permission, 404=not found, 409=conflict, 500=server error).
- **File uploads:** Use `multipart/form-data` with field name `photo` (attendance), `attachment` (leave/regularization), `file` (imports).
