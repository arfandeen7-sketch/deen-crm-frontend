# DEEN CRM — Backend Context

> **Purpose**: Machine-readable reference for the frontend. Contains the base URL, auth model, RBAC matrix, every API route with its request/response shape, data models, pagination envelope, and error contract.

---

## 1. System Overview

| Property | Value |
|---|---|
| **Base URL** | `https://deen-crm-backend-production.up.railway.app` |
| **Runtime** | Node.js + TypeScript (Express 4) |
| **ORM** | Prisma (PostgreSQL on Supabase) |
| **Auth Provider** | Supabase Auth (JWT, asymmetric RS256) |
| **Upload limit** | 10 MB JSON body; 5 MB file uploads |
| **Timezone** | UAE (Asia/Dubai, UTC+4, no DST) for attendance logic |

---

## 2. Authentication

All protected endpoints require a `Bearer` token in the `Authorization` header. The token is the `access_token` returned by `POST /api/auth/login`.

```
Authorization: Bearer <supabase_access_token>
```

- Tokens are issued by Supabase Auth and verified locally via JWKS.
- A deactivated account returns `403`.
- A missing or invalid token returns `401`.

---

## 3. RBAC — Roles & Permissions Matrix

There are four roles. Higher roles inherit the permissions of lower roles unless stated otherwise.

| Role | Code | Notes |
|---|---|---|
| Master | `master` | Full access to everything |
| HR Manager | `hr_manager` | HRMS access (attendance, leave, payroll, employees) |
| Sales Manager | `sales_manager` | Lead & broker management |
| Sales Executive | `sales_executive` | Own assigned leads only; no HR/admin access |

**Scope rules applied automatically by the backend:**
- `sales_executive`: lead queries are always scoped to `assignedTo = req.user.id`. This cannot be overridden by query params.
- `hr_manager` / `master`: can pass `?userId=` to filter by any employee.
- Non-privileged users cannot access other users' attendance, leave, or payslips.

---

## 4. Common Conventions

### 4.1 Response Envelopes

**Single resource:**
```json
{ "data": { ...resource } }
```

**Paginated list:**
```json
{
  "data": [ ...items ],
  "meta": { "total": 120, "page": 1, "pageSize": 25, "totalPages": 5 },
  "total": 120,
  "page": 1,
  "pageSize": 25,
  "totalPages": 5
}
```
> Prefer reading `meta`. Top-level pagination fields are kept for backward compatibility.

**Success (delete/toggle):**
```json
{ "data": { "success": true } }
```

### 4.2 Pagination Query Params

| Param | Default | Allowed values |
|---|---|---|
| `page` | `1` | Any positive integer |
| `pageSize` | `25` | `10`, `25`, `50`, `100` |

### 4.3 Error Responses

| Scenario | Status | Body |
|---|---|---|
| Validation failure (Zod) | `400` | `{ "error": "Validation failed", "details": [{ "path": "field", "message": "..." }] }` |
| Auth missing/invalid | `401` | `{ "error": "..." }` |
| Forbidden (RBAC) | `403` | `{ "error": "Insufficient permissions" }` |
| Not found | `404` | `{ "error": "..." }` |
| Duplicate / constraint | `409` | `{ "error": "..." }` |
| Server error | `500` | `{ "error": "Internal Server Error" }` |

### 4.4 Date Format

All dates sent TO the API should be ISO 8601 strings (e.g. `"2025-06-01"` or `"2025-06-01T00:00:00.000Z"`). All dates returned FROM the API are ISO 8601 strings.

---

## 5. Data Models

### User (also serves as Employee)

```ts
{
  id: string            // UUID — matches Supabase auth.users UUID
  fullName: string
  email: string
  phone: string | null
  role: "master" | "hr_manager" | "sales_manager" | "sales_executive"
  isActive: boolean

  // HRMS fields (null when not configured)
  employeeId: string | null
  department: string | null
  designation: string | null
  joiningDate: string | null   // ISO date
  basicSalary: string | null   // Decimal as string
  allowances: string | null    // Decimal as string
  leaveBalance: Record<string, number> | null  // e.g. { annual: 28, sick: 15, emergency: 5 }
  bankName: string | null
  bankAccountNumber: string | null
  bankIban: string | null
  employmentStatus: "active" | "on_leave" | "suspended" | "resigned" | "terminated"

  createdAt: string  // ISO datetime
  updatedAt: string
}
```

### Lead

```ts
{
  id: string
  leadName: string
  lastName: string | null
  mobileNumber: string
  alternateMobile: string | null
  email: string | null
  source: string           // must exist in dynamic_fields(category=source)
  serviceType: string
  projectName: string | null
  city: string | null
  locality: string | null
  unitNumber: string | null
  price: string | null
  propertySize: string | null
  comments: string | null
  fbFormName: string | null
  leadStatus: string       // default "Fresh", must exist in dynamic_fields(category=lead_status)
  leadPriority: string | null  // must exist in dynamic_fields(category=lead_priority)
  leadDate: string         // ISO date
  followUpDate: string | null  // ISO date
  assignedTo: string | null    // User UUID
  brokerId: string | null      // Broker UUID
  isImported: boolean
  isTouched: boolean
  ingestionSource: "facebook" | "instagram" | "google" | "property_finder" | "manual" | "import"
  externalLeadId: string | null
  createdBy: string        // User UUID
  createdAt: string
  updatedAt: string

  // Included in detail + list responses:
  assignedUser: { id: string; fullName: string } | null
  broker: Broker | null
  // Included in getById only:
  statusHistory: LeadStatusHistory[]
}
```

### Broker

```ts
{
  id: string
  brokerName: string
  companyName: string | null
  mobileNumber: string
  status: "active" | "inactive" | "suspended"
  postedBy: string   // User UUID
  createdAt: string
  updatedAt: string
}
```

### Attendance

```ts
{
  id: string
  userId: string
  date: string                 // ISO date (UAE calendar day)
  checkInTime: string | null   // ISO datetime
  checkOutTime: string | null
  checkInPhoto: string | null  // Storage path (not a public URL)
  checkOutPhoto: string | null
  checkInPhotoUrl: string | null   // Signed URL (included in responses)
  checkOutPhotoUrl: string | null  // Signed URL (included in responses)
  status: "present" | "late" | "half_day" | "absent" | "leave" | "weekend" | "holiday"
  totalWorkingHours: string | null  // Decimal as string
  isManualOverride: boolean
  overrideReason: string | null
  leaveType: "annual" | "sick" | "emergency" | "unpaid" | null
  notes: string | null
  recordedBy: string | null    // User UUID
  createdAt: string
  updatedAt: string
}
```

**Status determination (check-in time, UAE):**
- Before 09:45 AM → `present`
- 09:45 AM – 10:30 AM → `late`
- After 10:30 AM → `half_day`

### LeaveRequest

```ts
{
  id: string
  userId: string
  leaveType: "annual" | "sick" | "emergency" | "unpaid"
  dateFrom: string   // ISO date
  dateTo: string
  totalDays: number  // working days only (Sundays excluded)
  reason: string | null
  status: "pending" | "approved" | "rejected" | "cancelled"
  reviewedBy: string | null
  reviewedAt: string | null
  reviewNote: string | null
  createdAt: string
  updatedAt: string
  user: { id: string; fullName: string }  // included in list
}
```

### Payslip

```ts
{
  id: string
  userId: string
  month: number       // 1–12
  year: number
  basicSalary: string
  allowances: string
  presentDays: number
  halfDays: number
  approvedLeaveDays: number
  unpaidLeaveDays: number
  overtimeAmount: string
  deductions: string
  netSalary: string
  status: "draft" | "generated" | "sent"
  pdfUrl: string | null
  generatedBy: string | null
  sentAt: string | null
  createdAt: string
  updatedAt: string
  user: { id: string; fullName: string }  // included in list/detail
}
```

### DynamicField

```ts
{
  id: string
  category: string   // see valid categories below
  value: string
  meta: Record<string, unknown> | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}
```

**Valid categories:**
`source` | `project_name` | `payment_plan` | `configuration` | `location` | `handover_year` | `lead_priority` | `lead_status` | `department` | `designation` | `bank_name`

### LoginActivity

```ts
{
  id: string
  userId: string
  loginTime: string
  logoutTime: string | null
  sessionDuration: number | null  // seconds
  deviceInfo: string | null       // parsed UA string e.g. "Chrome on Windows (desktop)"
  userAgent: string | null
  ipAddress: string | null
  createdAt: string
  user: { id: string; fullName: string }  // included in list
}
```

---

## 6. API Routes

### 6.1 System / Health

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | None | Welcome message |
| `GET` | `/health` | None | Returns `{ status: "OK", timestamp }` |

---

### 6.2 Auth — `/api/auth`

#### `POST /api/auth/login`
**Auth:** None · **Rate-limited**

Request body:
```json
{ "email": "user@example.com", "password": "password123" }
```

Success `200`:
```json
{
  "data": {
    "token": "<supabase_access_token>",
    "user": { "id": "uuid", "fullName": "John Doe", "email": "...", "role": "sales_executive" }
  }
}
```

**Workflow:** After login, immediately call `POST /api/login-activity/login` to record the session.

---

#### `POST /api/auth/logout`
**Auth:** Required

Request: no body. Invalidates the Supabase session.

**Workflow:** Before calling this, call `POST /api/login-activity/logout` to close the session record.

---

#### `PUT /api/auth/change-password`
**Auth:** Required

Request body:
```json
{ "newPassword": "newPassword123" }
```

---

### 6.3 Dashboard — `/api/dashboard`

**Auth:** Required (all roles)

#### `GET /api/dashboard/summary`
Returns lead counts grouped by source. `sales_executive` sees only their assigned leads.

Response:
```json
{
  "data": {
    "sourceCounts": [{ "source": "facebook", "count": 45 }],
    "totalLeads": 120
  }
}
```

---

#### `GET /api/dashboard/status-analytics`
Returns current lead counts and 24-hour update counts per status.

Response:
```json
{
  "data": {
    "analytics": [{ "status": "Fresh", "leadCount": 80, "updateCount": 12 }],
    "windowHours": 24
  }
}
```

---

### 6.4 Leads — `/api/leads`

**Auth:** Required (all roles)

#### `GET /api/leads`
Paginated list. `sales_executive` is always scoped to own leads.

Query params:
| Param | Type | Description |
|---|---|---|
| `page` | number | |
| `pageSize` | number | 10/25/50/100 |
| `assignedTo` | UUID | Filter by user (ignored for `sales_executive`) |
| `source` | string | Exact match |
| `status` | string | Exact match on `leadStatus` |
| `serviceType` | string | Exact match |
| `projectName` | string | Exact match |
| `city` | string | Exact match |
| `locality` | string | Exact match |
| `dateFrom` | ISO date | `leadDate >= dateFrom` |
| `dateTo` | ISO date | `leadDate <= dateTo` |
| `search` | string | Searches `leadName`, `mobileNumber` (case-insensitive) |
| `category` | `fresh\|imported\|assigned\|unassigned\|untouched` | Category filter |

---

#### `GET /api/leads/:id`
Returns lead with `assignedUser`, `broker`, and full `statusHistory`.

---

#### `POST /api/leads`
**All roles.** `source`, `leadStatus`, `leadPriority` must exist in `dynamic_fields`.

Request body:
```json
{
  "leadName": "John Doe",        // required
  "mobileNumber": "+971501234567", // required
  "source": "facebook",           // required — must exist in dynamic_fields
  "serviceType": "Apartment",     // required
  "alternateMobile": "",
  "projectName": "Creek Views",
  "email": "john@example.com",
  "city": "Dubai",
  "locality": "Downtown",
  "comments": "Interested in 2BHK",
  "leadStatus": "Fresh",          // must exist in dynamic_fields
  "leadPriority": "High",         // must exist in dynamic_fields
  "followUpDate": "2025-07-01",
  "assignedTo": "uuid",
  "brokerId": "uuid"
}
```

Response `201`: `{ "data": Lead }`

---

#### `PUT /api/leads/:id`
All fields optional (partial update). `sales_executive` can only update own assigned leads.

Status changes are automatically recorded in `LeadStatusHistory`. Setting `followUpDate`, `assignedTo`, `comments`, or changing status flips `isTouched = true`.

---

#### `DELETE /api/leads/:id`
**Roles:** `master` only.

---

#### `GET /api/leads/export`
Downloads `.xlsx` file. Accepts same query params as `GET /api/leads`.

Response: `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
`Content-Disposition: attachment; filename="leads_export_YYYY-MM-DD.xlsx"`

---

#### `GET /api/leads/template`
Downloads blank import template `.xlsx`.

---

#### `GET /api/leads/report`
**Roles:** `master` only.

Query params:
| Param | Type | Default | Description |
|---|---|---|---|
| `groupBy` | `user\|source` | `user` | Aggregate dimension |
| `dateFrom` | ISO date | — | Filter by createdAt |
| `dateTo` | ISO date | — | |
| `userId` | UUID | — | Filter to one user |
| `source` | string | — | Filter to one source |

Response:
```json
{
  "data": {
    "groupBy": "user",
    "rows": [{
      "groupKey": "uuid",
      "groupLabel": "John Doe",
      "totalAssigned": 50,
      "touched": 30,
      "untouched": 20,
      "followedUp": 15,
      "missedFollowUps": 5,
      "statusBreakdown": { "Fresh": 10, "Interested": 20 },
      "lastActivityAt": "2025-06-01T10:00:00.000Z"
    }]
  }
}
```

---

#### `GET /api/leads/report/export`
**Roles:** `master` only. Same params as `/report`. Returns `.xlsx`.

---

#### `POST /api/leads/bulk-assign`
**Roles:** `master`, `sales_manager`

Request body:
```json
{ "leadIds": ["uuid1", "uuid2"], "assignedTo": "user-uuid" }
```

Response: `{ "data": { "updated": 2 } }`

---

#### `POST /api/leads/bulk-status`
**Roles:** `master`, `sales_manager`

Request body:
```json
{ "leadIds": ["uuid1", "uuid2"], "status": "Interested" }
```

Response: `{ "data": { "matched": 2, "updated": 1 } }`

---

#### `POST /api/leads/import`
**Roles:** `master`, `sales_manager` · **Content-Type:** `multipart/form-data`

Form field: `file` (`.xlsx` or `.csv`, max 5 MB)

Required columns: `lead_name`, `phone`, `lead_source`, `property_type`
Optional columns: `last_name`, `unit_number`, `project_name`, `location`, `price`, `property_size`, `lead_status`, `lead_owner` (matched by fullName), `created_time`

Response:
```json
{ "data": { "imported": 45, "skipped": 2, "errors": [{ "row": 3, "reason": "Duplicate phone: ..." }] } }
```

---

### 6.5 Follow-ups — `/api/followup`

**Auth:** Required. `sales_executive` sees only assigned leads.

All three endpoints return a paginated `Lead` list. Supports `page`/`pageSize`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/followup/today` | Leads with `followUpDate` = today |
| `GET` | `/api/followup/missed` | Leads with `followUpDate` < today |
| `GET` | `/api/followup/upcoming` | Leads with `followUpDate` > today (sorted asc) |

---

### 6.6 Brokers — `/api/brokers`

**Auth:** Required

#### `GET /api/brokers`
Query params: `page`, `pageSize`, `search` (name/mobile), `status` (`active|inactive|suspended`)

#### `GET /api/brokers/:id`

#### `GET /api/brokers/:id/leads`
Returns paginated leads for this broker. `sales_executive` scoped to own.

#### `POST /api/brokers`
**Roles:** `master`, `sales_manager`

Request body:
```json
{
  "brokerName": "Acme Realty",  // required
  "mobileNumber": "+97150123456", // required
  "companyName": "Acme Corp",
  "status": "active"
}
```

#### `PUT /api/brokers/:id`
**Roles:** `master`, `sales_manager` · All fields optional.

#### `DELETE /api/brokers/:id`
**Roles:** `master` only.

#### `GET /api/brokers/export`
**Roles:** `master`, `sales_manager` · Returns `.xlsx`.

#### `POST /api/brokers/import`
**Roles:** `master` · **Content-Type:** `multipart/form-data`

Form field: `file`. Required columns: `broker_name`, `mobile_number`. Optional: `company_name`, `status`.

---

### 6.7 Users — `/api/users`

**Auth:** Required · **All routes: `master` only**

#### `GET /api/users`
Response includes `users[]` array AND `roleCounts` map:
```json
{ "data": { "users": [...], "roleCounts": { "master": 1, "sales_executive": 12 } } }
```

#### `GET /api/users/:id`

#### `POST /api/users`
Creates Supabase auth user + CRM profile. Password is set in Supabase.

Request body:
```json
{
  "fullName": "Jane Smith",     // required
  "email": "jane@example.com",  // required
  "password": "SecurePass123",  // required, min 8 chars
  "phone": "+97150...",
  "role": "sales_executive"
}
```

#### `PUT /api/users/:id`
Updatable fields: `fullName`, `phone`, `role`. Cannot demote the last active master.

#### `PATCH /api/users/:id/toggle-active`
No body. Toggles `isActive`. Cannot deactivate self or the last active master.

---

### 6.8 Employees — `/api/employees`

**Auth:** Required · **All routes: `master`, `hr_manager`**

Employees and Users are the same database table (`users`). `/api/employees` exposes the HRMS-specific view with additional fields.

#### `GET /api/employees`
Query params: `page`, `pageSize`, `department`, `designation`, `status` (employment), `role`, `search`

#### `GET /api/employees/:id`

#### `GET /api/employees/export`
Returns `.xlsx` with all employee fields.

#### `POST /api/employees`
Creates Supabase auth user + full HR profile. `department`, `designation`, `bankName` must exist in `dynamic_fields`.

Request body:
```json
{
  "fullName": "Ahmed Ali",       // required
  "email": "ahmed@deen.ae",      // required
  "password": "SecurePass123",   // required, min 8 chars
  "phone": "+97150...",
  "role": "sales_executive",
  "employeeId": "EMP-001",
  "department": "Sales",         // must exist in dynamic_fields(department)
  "designation": "Executive",    // must exist in dynamic_fields(designation)
  "joiningDate": "2024-01-15",
  "basicSalary": 8000,
  "allowances": 2000,
  "leaveBalance": { "annual": 30, "sick": 15, "emergency": 5 },
  "bankName": "Emirates NBD",    // must exist in dynamic_fields(bank_name)
  "bankAccountNumber": "1234567890",
  "bankIban": "AE070331234567890123456",
  "employmentStatus": "active"
}
```

Default `leaveBalance` if omitted: `{ annual: 30, sick: 15, emergency: 5 }`

#### `PUT /api/employees/:id`
All fields optional except `email`/`password` (not updatable here). Same dynamic field validation.

#### `PATCH /api/employees/:id/status`
Request body: `{ "status": "active" | "on_leave" | "suspended" | "resigned" | "terminated" }`

---

### 6.9 Attendance — `/api/attendance`

**Auth:** Required

#### `POST /api/attendance/check-in`
**All roles.** Creates today's attendance record. Photo required.

**Content-Type:** `multipart/form-data` OR `application/json` with base64 photo.

- Multipart: field `photo` (JPEG/PNG/WebP, max 5 MB)
- JSON: `{ "photo": "data:image/jpeg;base64,..." }`

Response `201`: Attendance record with `checkInPhotoUrl` (signed URL).

Errors: `409` if already checked in today.

---

#### `POST /api/attendance/check-out`
Same format as check-in. Must have checked in first.

Response: Attendance record with both `checkInPhotoUrl` and `checkOutPhotoUrl`.

---

#### `GET /api/attendance/today`
Own record for today (UAE date). Returns `{ "data": null }` if not checked in.

---

#### `GET /api/attendance`
Paginated. Non-privileged users see only own records.

Query params: `page`, `pageSize`, `userId` (privileged only), `dateFrom`, `dateTo`

---

#### `GET /api/attendance/:id`
Includes signed photo URLs.

---

#### `POST /api/attendance`
**Roles:** `master`, `hr_manager` · Manual create/override.

Request body:
```json
{
  "userId": "uuid",              // required
  "date": "2025-06-01",          // required
  "status": "present",           // required
  "checkInTime": "2025-06-01T05:30:00.000Z",
  "checkOutTime": "2025-06-01T14:30:00.000Z",
  "notes": "System corrected",
  "overrideReason": "Clock-in device failed"
}
```

Upserts (update-or-create) by `userId + date`.

---

#### `PUT /api/attendance/:id`
**Roles:** `master`, `hr_manager` · `overrideReason` is **required**.

Request body: same fields as POST except `userId`/`date`, all optional.

---

#### `DELETE /api/attendance/:id`
**Roles:** `master` only.

---

#### `GET /api/attendance/report`
**Roles:** `master`, `hr_manager`

Query params: `month` (1–12), `year`

Response:
```json
{
  "data": {
    "month": 6,
    "year": 2025,
    "rows": [{ "userId": "uuid", "fullName": "John", "present": 20, "late": 2, "absent": 1 }]
  }
}
```

---

#### `GET /api/attendance/user/:userId/summary`
**Roles:** `master`, `hr_manager`

Query params: `month`, `year`

Response:
```json
{
  "data": {
    "userId": "uuid", "month": 6, "year": 2025,
    "total": 26, "present": 20, "late": 2, "half_day": 1,
    "absent": 1, "leave": 2, "weekend": 4, "holiday": 0
  }
}
```

---

#### `GET /api/attendance/export`
**Roles:** `master`, `hr_manager` · Accepts same query params as list. Returns `.xlsx`.

---

### 6.10 Leave — `/api/leave`

**Auth:** Required

#### `GET /api/leave`
Paginated. Non-privileged users see only own requests.

Query params: `page`, `pageSize`, `userId` (privileged), `status` (`pending|approved|rejected|cancelled`), `leaveType` (`annual|sick|emergency|unpaid`)

---

#### `GET /api/leave/balance`
Own balance, or `?userId=uuid` for `master`/`hr_manager`.

Response:
```json
{ "data": { "userId": "uuid", "fullName": "John", "leaveBalance": { "annual": 28, "sick": 15, "emergency": 5 } } }
```

---

#### `GET /api/leave/:id`

---

#### `POST /api/leave`
**All roles.** Apply for leave for self.

Request body:
```json
{
  "leaveType": "annual",         // required
  "dateFrom": "2025-07-01",      // required
  "dateTo": "2025-07-05",        // required
  "reason": "Family vacation"
}
```

- `totalDays` is computed server-side (Sundays excluded).
- Overlapping pending/approved requests return `409`.

---

#### `PUT /api/leave/:id/review`
**Roles:** `master`, `hr_manager`

Request body:
```json
{ "status": "approved", "reviewNote": "Approved by HR" }
```

On approval:
- Attendance records for the leave range are backfilled as `leave` (only if `absent` or missing).
- Leave balance is decremented for paid types (`annual`, `sick`, `emergency`).

---

#### `DELETE /api/leave/:id`
Cancels own pending request. Only `pending` status can be cancelled.

---

### 6.11 Payroll — `/api/payroll`

**Auth:** Required · **All routes: `master`, `hr_manager`**

#### `GET /api/payroll/preview`
Compute payroll figures without saving.

Query params:
| Param | Type | Required | Description |
|---|---|---|---|
| `month` | number | Yes | 1–12 |
| `year` | number | Yes | ≥ 2020 |
| `userId` | UUID | No | Omit to preview all active employees |
| `overtimeAmount` | number | No | Additional overtime in AED |

Response: single payroll figure object or array of all employees.

---

#### `POST /api/payroll/calculate`
Compute + upsert draft `Payslip` records.

Request body: same fields as preview (`month`, `year`, `userId?`, `overtimeAmount?`)

Response `201`: single `Payslip` or array.

---

### 6.12 Payslips — `/api/payslips`

**Auth:** Required

#### `GET /api/payslips`
Paginated. Employees see own; `master`/`hr_manager` see all.

Query params: `page`, `pageSize`, `userId` (privileged), `month`, `year`

---

#### `GET /api/payslips/:id`

---

#### `POST /api/payslips/:id/generate`
**Roles:** `master`, `hr_manager`

Generates PDF, uploads to Supabase Storage, updates status to `generated`.

Response: updated `Payslip`.

---

#### `GET /api/payslips/:id/download`
Streams the PDF. Employees can download own; `master`/`hr_manager` can download any.

Response: `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="payslip_YYYY_MM.pdf"`

---

#### `POST /api/payslips/:id/send`
**Roles:** `master`, `hr_manager`

Emails the PDF to the employee. Updates status to `sent`.

---

#### `POST /api/payslips/send-bulk`
**Roles:** `master`, `hr_manager`

Sends all unsent payslips for a month.

Request body: `{ "month": 6, "year": 2025 }`

Response:
```json
{ "data": { "sent": 10, "total": 12, "errors": ["user@email.com: SMTP error"] } }
```

---

### 6.13 Login Activity — `/api/login-activity`

**Auth:** Required

#### `POST /api/login-activity/login`
Call this immediately after a successful `POST /api/auth/login`. Records the session with device/IP info automatically from headers.

Response `201`: `LoginActivity` record.

---

#### `POST /api/login-activity/logout`
Call this before `POST /api/auth/logout`. Closes the current user's most recent active session and records `sessionDuration`.

---

#### `GET /api/login-activity`
Paginated. Non-privileged users see own; `master`/`hr_manager` can pass `?userId=`.

---

#### `GET /api/login-activity/active`
**Roles:** `master`, `hr_manager`

Sessions with no `logoutTime`. Supports `?userId=`.

---

### 6.14 Self-Service — `/api/me`

**Auth:** Required · All routes are scoped to `req.user.id`. No `userId` parameter accepted.

#### `GET /api/me/profile`
Returns current user's profile including HRMS fields.

#### `PUT /api/me/profile`
Employees can only update `phone`, `bankName`, `bankAccountNumber`, `bankIban`.

Request body:
```json
{
  "phone": "+97150...",
  "bankName": "Emirates NBD",    // must exist in dynamic_fields(bank_name)
  "bankAccountNumber": "...",
  "bankIban": "AE..."
}
```

#### `GET /api/me/attendance`
Paginated own attendance. Query params: `page`, `pageSize`, `dateFrom`, `dateTo`

#### `GET /api/me/leaves`
Paginated own leave requests. Query params: `page`, `pageSize`

#### `GET /api/me/payslips`
Paginated own payslips. Query params: `page`, `pageSize`

#### `GET /api/me/payslips/:id/download`
Stream own payslip PDF. Returns `403` if payslip belongs to another user.

---

### 6.15 Dynamic Fields — `/api/dynamic-fields`

**Auth:** Required. Read by all roles; write restricted to `master`.

#### `GET /api/dynamic-fields`
Returns all fields. Optional: `?category=source` to filter.

#### `GET /api/dynamic-fields/:category`
Returns all fields for a specific category, sorted by `sortOrder` then `value`.

#### `POST /api/dynamic-fields`
**Roles:** `master`

Request body:
```json
{
  "category": "source",   // required
  "value": "Whatsapp",    // required
  "meta": {},
  "sortOrder": 10
}
```

Returns `409` if `(category, value)` already exists.

#### `PUT /api/dynamic-fields/:id`
**Roles:** `master`

Request body: `{ "value"?: string, "meta"?: object, "sortOrder"?: number }`

#### `DELETE /api/dynamic-fields/:id`
**Roles:** `master`

---

### 6.16 Ingestion Webhooks — `/api/ingestion`

**Auth:** None · **Rate-limited**

These are server-to-server webhooks for auto-ingesting leads. The frontend does not call these directly.

| Method | Path | Platform |
|---|---|---|
| `GET` | `/api/ingestion/facebook/webhook` | Facebook verification handshake |
| `POST` | `/api/ingestion/facebook/webhook` | Facebook/Instagram lead ads (`X-Hub-Signature-256` verified) |
| `POST` | `/api/ingestion/google/webhook` | Google Ads lead form (`google_key` in body verified) |
| `POST` | `/api/ingestion/property-finder/webhook` | Property Finder (`X-Signature` verified) |

---

## 7. Frontend Integration Checklist

1. **Store the JWT token** from `POST /api/auth/login` in memory or a secure cookie. Do not store in `localStorage`.
2. **Attach the token** to every protected request: `Authorization: Bearer <token>`.
3. **Session tracking**: After login, call `POST /api/login-activity/login`. Before logout, call `POST /api/login-activity/logout`, then `POST /api/auth/logout`.
4. **Populate dropdowns** from `GET /api/dynamic-fields/:category` for: `source`, `lead_status`, `lead_priority`, `project_name`, `department`, `designation`, `bank_name`.
5. **Attendance photo**: send as `multipart/form-data` with field name `photo`, or as a base64 data URI in JSON body field `photo`.
6. **Export endpoints** respond with a binary file — use `window.location` or `<a download>` with a `blob:` URL.
7. **Pagination**: read from `response.meta` (`total`, `page`, `pageSize`, `totalPages`).
8. **Role-based UI**: use `user.role` from the login response to conditionally render admin controls. Mirror the server-side RBAC checks in the UI for a better UX (the server will still enforce them).
9. **CORS**: the backend allows requests only from the origin set in `FRONTEND_URL` on the server. Credentials (`credentials: true`) are enabled.
10. **Payslip download**: use `GET /api/me/payslips/:id/download` for employees or `GET /api/payslips/:id/download` for HR. Set `responseType: 'blob'` in your HTTP client.
