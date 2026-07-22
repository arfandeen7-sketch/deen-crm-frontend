# Leave Management Module — Complete Frontend Implementation Prompt

> Build the entire Leave Management module using this document as your sole specification. You do NOT need to read the backend source code.

---

## 1. Tech Stack

- **React** + **TypeScript** (strict)
- **React Router v6**
- **TanStack React Query v5**
- **Tailwind CSS** + **shadcn/ui** (Button, Dialog, Input, Select, Table, Card, Badge, Tabs, Popover, Tooltip, Toast)
- **Lucide React** (icons)
- **Zod** (validation) + **React Hook Form**
- **date-fns** (dates)
- **Axios** or **fetch**

---

## 2. Folder Structure

```
src/
├── types/leave.ts
├── services/leave.service.ts
├── hooks/leave/
│   ├── useLeaveTypes.ts          useLeavePolicy.ts
│   ├── useLeaveRequests.ts       useLeaveRequest.ts
│   ├── useLeaveBalance.ts        useLeaveBalanceAll.ts
│   ├── useLeaveCalendar.ts       useLeaveReports.ts
│   ├── useLeaveDashboard.ts      useLeaveHrDashboard.ts
│   ├── useLeaveAudits.ts
│   ├── useApplyLeave.ts          useReviewLeave.ts       useCancelLeave.ts
│   ├── useCreateLeaveType.ts     useUpdateLeaveType.ts   useDeleteLeaveType.ts
│   ├── useToggleLeaveType.ts     useUpdateLeavePolicy.ts useAdjustBalance.ts
├── pages/
│   ├── my-hr/leave/
│   │   ├── LeaveDashboardPage.tsx       LeaveApplyPage.tsx
│   │   ├── LeaveHistoryPage.tsx         LeaveCalendarPage.tsx
│   │   └── LeaveRequestDetailPage.tsx
│   └── hrms/leave/
│       ├── HrLeaveDashboardPage.tsx     HrLeaveRequestsPage.tsx
│       ├── HrLeaveCalendarPage.tsx      HrLeaveBalancePage.tsx
│       ├── HrLeaveReportsPage.tsx       HrLeaveSettingsPage.tsx
│       └── HrLeavePolicyPage.tsx
├── components/leave/
│   ├── LeaveApplyForm.tsx               LeaveBalanceCard.tsx
│   ├── LeaveBalanceTable.tsx            LeaveRequestTable.tsx
│   ├── LeaveRequestStatusBadge.tsx      LeaveReviewDialog.tsx
│   ├── LeaveCancelDialog.tsx            LeaveCalendar.tsx
│   ├── LeaveCalendarDayPopover.tsx      LeaveTypeConfigForm.tsx
│   ├── LeaveTypeList.tsx                LeavePolicyForm.tsx
│   ├── LeaveBalanceAdjustDialog.tsx     LeaveReportTable.tsx
│   ├── LeaveAuditTrail.tsx              LeaveAttachmentUpload.tsx
│   ├── LeaveAttachmentViewer.tsx        EmployeeLeaveDashboard.tsx
│   ├── HrLeaveSummaryWidget.tsx         LeaveTypeSelect.tsx
└── lib/
    ├── leaveUtils.ts                    leaveValidation.ts
```

---

## 3. API Base & Auth

```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
// All requests need: Authorization: Bearer <token>
// List endpoints return: { data: [...], meta: { total, page, pageSize, totalPages } }
// Single endpoints return: { data: {...} }
// Errors return: { error: "message" }
// Pagination: ?page=1&pageSize=25 (allowed: 10, 25, 50, 100)
```

---

## 4. Permission System

### 4.1 Access Map

From `GET /api/permissions/me`:
```typescript
interface AccessMap {
  [moduleKey: string]: {
    [pageKey: string]: { [actionKey: string]: boolean };
  };
}
```
Master users (role='master') bypass all checks.

### 4.2 Helper

```typescript
function hasPermission(accessMap, module, page, action, isMaster): boolean {
  if (isMaster) return true;
  return accessMap?.[module]?.[page]?.[action] === true;
}
```

### 4.3 Permission Keys

**Employee (my_hr):** `my_hr:my_leave:view|apply|cancel`
**HR (hrms):** `hrms:leave:view|apply|approve|reject|cancel|manage_types`, `hrms:leave_policy:view|edit`, `hrms:leave_settings:view|create|edit|delete|toggle_active`, `hrms:leave_balance:view|adjust`, `hrms:leave_reports:view|export`

### 4.4 Guard Component

```tsx
function PermissionGuard({ module, page, action, children, fallback = null }) {
  const { accessMap, isMaster } = useAuth();
  if (hasPermission(accessMap, module, page, action, isMaster)) return <>{children}</>;
  return <>{fallback}</>;
}
```

---

## 5. TypeScript Types

```typescript
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type LeaveHalfDayPeriod = 'first_half' | 'second_half';
export type LeaveTransactionType = 'allocation' | 'monthly_accrual' | 'carry_forward' | 'adjustment' | 'consumed' | 'reversed' | 'encashed';

export interface LeaveTypeConfig {
  id: string; name: string; code: string; description: string | null;
  isActive: boolean; sortOrder: number;
  isPaid: boolean; applicableRoles: string | null; genderRestriction: string | null; probationAllowed: boolean;
  requiresMedicalCertificate: boolean; requiresAttachment: boolean;
  annualAllocation: number; maxDaysPerRequest: number | null; maximumConsecutiveDays: number | null;
  maximumRequestsPerMonth: number | null; minimumNoticeDays: number | null;
  halfDayAllowed: boolean; futureDateAllowed: boolean; backDateAllowed: boolean; backDateLimitDays: number | null;
  weekendCounted: boolean; holidayCounted: boolean; canCombineWith: string | null;
  negativeBalanceAllowed: boolean; resetEveryYear: boolean; monthlyAccrual: boolean;
  carryForwardEnabled: boolean; carryForwardPercentage: number; carryForwardExpiryMonths: number | null;
  maxCarryForward: number | null; encashmentEnabled: boolean; encashmentPercentage: number; manualAllocationAllowed: boolean;
  approvalRequired: boolean; approvalLevels: number; autoApprove: boolean;
  notifyHR: boolean; notifyMaster: boolean; notifyManager: boolean;
  createdBy: string; createdAt: string; updatedAt: string;
}

export interface LeavePolicy {
  id: number; financialYearStartMonth: number; financialYearStartDay: number;
  minimumNoticeDays: number; maximumFutureLeaveDays: number | null; maximumBackdatedLeaveDays: number | null;
  defaultCarryForwardPercentage: number; defaultCarryForwardExpiryMonths: number | null;
  attendanceIntegrationEnabled: boolean; payrollIntegrationEnabled: boolean;
  holidayCountedInLeave: boolean; weekendCountedInLeave: boolean; updatedAt: string;
}

export interface LeaveRequest {
  id: string; userId: string; leaveTypeCode: string; leaveType?: LeaveTypeConfig;
  dateFrom: string; dateTo: string; totalDays: string; isHalfDay: boolean; halfDayPeriod: LeaveHalfDayPeriod | null;
  reason: string | null; attachmentUrl: string | null; attachmentSignedUrl?: string | null;
  status: LeaveStatus; reviewedBy: string | null; reviewedAt: string | null; reviewNote: string | null;
  cancelledAt: string | null; cancellationReason: string | null;
  createdAt: string; updatedAt: string;
  user?: { id: string; fullName: string }; reviewer?: { id: string; fullName: string } | null;
}

export interface LeaveBalance {
  leaveTypeCode: string; leaveTypeName: string;
  allocated: number; carryForward: number; adjustment: number; consumed: number; reversed: number;
  available: number; isPaid: boolean; negativeBalanceAllowed: boolean;
}

export interface LeaveAudit {
  id: string; leaveRequestId: string; action: string; changedBy: string;
  oldStatus: string | null; newStatus: string | null; reason: string | null;
  meta: Record<string, unknown> | null; createdAt: string;
  changer?: { id: string; fullName: string };
}

export interface LeaveCalendarDay {
  date: string; type: 'present' | 'late' | 'half_day' | 'absent' | 'leave' | 'weekend' | 'holiday';
  leaveRequestId?: string; leaveTypeCode?: string; leaveTypeName?: string; leaveStatus?: LeaveStatus;
}

export interface EmployeeLeaveDashboard {
  balances: LeaveBalance[]; pendingCount: number; approvedCount: number; rejectedCount: number;
  upcomingLeaves: LeaveRequest[]; calendar: { month: number; year: number; days: LeaveCalendarDay[] };
}

export interface HrLeaveDashboard {
  pendingCount: number; approvedToday: number; rejectedToday: number; onLeaveToday: number;
  upcomingLeaves: Array<{ userId: string; fullName: string; employeeId: string | null; department: string | null;
    leaveTypeCode: string; leaveTypeName: string; dateFrom: string; dateTo: string; totalDays: string; }>;
}

export interface LeaveReportRow {
  userId: string; fullName: string; employeeId: string | null; department: string | null;
  totalLeaveDays: number; paidLeaveDays: number; unpaidLeaveDays: number;
  pendingCount: number; approvedCount: number; rejectedCount: number; byType: Record<string, number>;
}

export interface PaginatedResponse<T> { data: T[]; meta: { total: number; page: number; pageSize: number; totalPages: number; }; }
```

---

## 6. API Service Layer

```typescript
// services/leave.service.ts
export const leaveService = {
  // Leave Types
  getLeaveTypes: (activeOnly = true) => api.get('/leave-settings', { params: { activeOnly } }).then(r => r.data.data),
  getLeaveType: (code: string) => api.get(`/leave-settings/${code}`).then(r => r.data.data),
  createLeaveType: (data) => api.post('/leave-settings', data).then(r => r.data.data),
  updateLeaveType: (code, data) => api.put(`/leave-settings/${code}`, data).then(r => r.data.data),
  deleteLeaveType: (code) => api.delete(`/leave-settings/${code}`).then(r => r.data.data),
  toggleLeaveType: (code) => api.patch(`/leave-settings/${code}/toggle`).then(r => r.data.data),

  // Leave Policy
  getLeavePolicy: () => api.get('/leave-policy').then(r => r.data.data),
  updateLeavePolicy: (data) => api.put('/leave-policy', data).then(r => r.data.data),

  // Leave Requests
  getLeaveRequests: (params) => api.get('/leave', { params }).then(r => r.data),
  getLeaveRequest: (id) => api.get(`/leave/${id}`).then(r => r.data.data),
  applyLeave: (formData: FormData) => api.post('/leave', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data.data),
  reviewLeave: (id, status, reviewNote) => api.put(`/leave/${id}/review`, { status, reviewNote }).then(r => r.data.data),
  cancelLeave: (id, cancellationReason) => api.delete(`/leave/${id}`, { data: { cancellationReason } }).then(r => r.data.data),

  // Balance
  getLeaveBalance: (userId, year) => api.get('/leave/balance', { params: { userId, year } }).then(r => r.data.data),
  getLeaveBalanceAll: (year) => api.get('/leave/balance/all', { params: { year } }).then(r => r.data.data),
  adjustBalance: (params) => api.post('/leave/balance/adjust', params).then(r => r.data.data),

  // Calendar
  getLeaveCalendar: (month, year, userId) => api.get('/leave/calendar', { params: { month, year, userId } }).then(r => r.data.data),

  // Reports
  getLeaveReports: (month, year) => api.get('/leave/reports', { params: { month, year } }).then(r => r.data.data),
  exportLeaveReports: (month, year) => api.get('/leave/reports/export', { params: { month, year }, responseType: 'blob' }).then(r => { /* create download link */ }),

  // Dashboards
  getEmployeeDashboard: () => api.get('/leave/dashboard').then(r => r.data.data),
  getHrDashboard: () => api.get('/leave/hr-dashboard').then(r => r.data.data),

  // Audits
  getLeaveAudits: (requestId) => api.get(`/leave/${requestId}/audits`).then(r => r.data.data),
};
```

---

## 7. React Query Hooks — Key Patterns

```typescript
// Query: leave types
export function useLeaveTypes(activeOnly = true) {
  return useQuery({ queryKey: ['leave-types', { activeOnly }], queryFn: () => leaveService.getLeaveTypes(activeOnly) });
}

// Query: leave requests (paginated)
export function useLeaveRequests(params) {
  return useQuery({ queryKey: ['leave-requests', params], queryFn: () => leaveService.getLeaveRequests(params), keepPreviousData: true });
}

// Query: employee dashboard
export function useLeaveDashboard() {
  return useQuery({ queryKey: ['leave-dashboard'], queryFn: () => leaveService.getEmployeeDashboard() });
}

// Mutation: apply leave (invalidates requests, balance, dashboard)
export function useApplyLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => leaveService.applyLeave(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave-requests'] });
      qc.invalidateQueries({ queryKey: ['leave-balance'] });
      qc.invalidateQueries({ queryKey: ['leave-dashboard'] });
      qc.invalidateQueries({ queryKey: ['leave-hr-dashboard'] });
    },
  });
}

// Mutation: review leave
export function useReviewLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; status: 'approved'|'rejected'; reviewNote?: string }) => leaveService.reviewLeave(p.id, p.status, p.reviewNote),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave-requests'] });
      qc.invalidateQueries({ queryKey: ['leave-request'] });
      qc.invalidateQueries({ queryKey: ['leave-balance'] });
      qc.invalidateQueries({ queryKey: ['leave-dashboard'] });
      qc.invalidateQueries({ queryKey: ['leave-hr-dashboard'] });
    },
  });
}

// Mutation: cancel leave
export function useCancelLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; cancellationReason?: string }) => leaveService.cancelLeave(p.id, p.cancellationReason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave-requests'] });
      qc.invalidateQueries({ queryKey: ['leave-dashboard'] });
      qc.invalidateQueries({ queryKey: ['leave-hr-dashboard'] });
    },
  });
}
```

**All other hooks follow the same pattern.** Query keys: `['leave-policy']`, `['leave-balance', userId, year]`, `['leave-balance-all', year]`, `['leave-calendar', month, year, userId]`, `['leave-reports', month, year]`, `['leave-hr-dashboard']`, `['leave-audits', requestId]`, `['leave-types']`, `['leave-settings']`.

Mutations invalidate: `['leave-types']` for type CRUD, `['leave-policy']` for policy update, `['leave-balance']` + `['leave-balance-all']` for adjust.

---

## 8. Sidebar & Routes

### My HR Sidebar
```
My HR → My Leave (show if my_hr:my_leave:view OR hrms:leave:view)
  ├── Dashboard     → /my-hr/leave
  ├── Apply Leave   → /my-hr/leave/apply
  ├── Leave History → /my-hr/leave/history
  └── Leave Calendar→ /my-hr/leave/calendar
```

### HRMS Sidebar
```
HRMS → Leave Management (show if hrms:leave:view)
  ├── Dashboard     → /hrms/leave
  ├── Requests      → /hrms/leave/requests
  ├── Calendar      → /hrms/leave/calendar
  ├── Balance       → /hrms/leave/balance    (hrms:leave_balance:view)
  ├── Reports       → /hrms/leave/reports     (hrms:leave_reports:view)
  ├── Settings      → /hrms/leave/settings    (hrms:leave_settings:view)
  └── Policy        → /hrms/leave/policy      (hrms:leave_policy:view)
```

### Routes
```tsx
<Route path="/my-hr/leave" element={<LeaveDashboardPage />} />
<Route path="/my-hr/leave/apply" element={<LeaveApplyPage />} />
<Route path="/my-hr/leave/history" element={<LeaveHistoryPage />} />
<Route path="/my-hr/leave/calendar" element={<LeaveCalendarPage />} />
<Route path="/my-hr/leave/:id" element={<LeaveRequestDetailPage />} />
<Route path="/hrms/leave" element={<HrLeaveDashboardPage />} />
<Route path="/hrms/leave/requests" element={<HrLeaveRequestsPage />} />
<Route path="/hrms/leave/calendar" element={<HrLeaveCalendarPage />} />
<Route path="/hrms/leave/balance" element={<HrLeaveBalancePage />} />
<Route path="/hrms/leave/reports" element={<HrLeaveReportsPage />} />
<Route path="/hrms/leave/settings" element={<HrLeaveSettingsPage />} />
<Route path="/hrms/leave/policy" element={<HrLeavePolicyPage />} />
<Route path="/hrms/leave/:id" element={<LeaveRequestDetailPage />} />
```

---

## 9. Pages

### 9.1 Employee Dashboard (`/my-hr/leave`)
- **Data:** `useLeaveDashboard()`
- **Layout:** 4 stat cards (Pending, Approved, Rejected, Upcoming) → balance cards row → mini calendar → upcoming leaves list → action buttons (Apply, History)

### 9.2 Apply Leave (`/my-hr/leave/apply`)
- **Data:** `useLeaveTypes()`, `useApplyLeave()`
- **Component:** `LeaveApplyForm`

### 9.3 Leave History (`/my-hr/leave/history`)
- **Data:** `useLeaveRequests({ page, pageSize, status, leaveTypeCode, dateFrom, dateTo })`
- **Layout:** Filter bar (status, type, date range) → `LeaveRequestTable` → pagination

### 9.4 Leave Calendar (`/my-hr/leave/calendar`)
- **Data:** `useLeaveCalendar(month, year)`
- **Component:** `LeaveCalendar` (full mode)

### 9.5 Request Detail (`/my-hr/leave/:id` or `/hrms/leave/:id`)
- **Data:** `useLeaveRequest(id)`, `useLeaveAudits(id)`
- **Layout:** Request info card → attachment viewer → audit trail → action buttons (Cancel if pending+own; Approve/Reject if HR+pending)

### 9.6 HR Dashboard (`/hrms/leave`)
- **Data:** `useLeaveHrDashboard()`
- **Layout:** `HrLeaveSummaryWidget` (4 clickable cards) → upcoming leaves table → quick action buttons

### 9.7 HR Requests (`/hrms/leave/requests`)
- Same as history but all employees, with userId filter, approve/reject actions

### 9.8 HR Calendar (`/hrms/leave/calendar`)
- Company-wide calendar with employee filter

### 9.9 HR Balance (`/hrms/leave/balance`)
- **Data:** `useLeaveBalanceAll(year)`
- **Layout:** Year selector → balance table → adjust dialog

### 9.10 HR Reports (`/hrms/leave/reports`)
- **Data:** `useLeaveReports(month, year)`
- **Layout:** Month/year selectors → `LeaveReportTable` → Export button

### 9.11 HR Settings (`/hrms/leave/settings`)
- **Data:** `useLeaveTypes(false)`
- **Layout:** Create button → `LeaveTypeList` table → `LeaveTypeConfigForm` in dialog

### 9.12 HR Policy (`/hrms/leave/policy`)
- **Data:** `useLeavePolicy()`, `useUpdateLeavePolicy()`
- **Component:** `LeavePolicyForm`

---

## 10. Key Components

### LeaveApplyForm
- Leave type dropdown (active types only)
- Date From / Date To pickers
- Half-day checkbox (if type.halfDayAllowed) + period radio
- Reason textarea
- File upload (if requiresMedicalCertificate or requiresAttachment)
- Dynamic summary card: allocation, available balance, paid/unpaid
- Working days calculation display
- Submit as FormData (multipart)

### LeaveBalanceCard
- Shows: type name, available days, allocated, consumed, carry forward
- Color: green >5, yellow 1-5, red 0 or negative

### LeaveRequestTable
- Columns: Employee (HR mode), Type, DateFrom, DateTo, Days, Status badge, Actions
- Row click → detail page
- Actions: Approve/Reject (HR+pending), View

### LeaveRequestStatusBadge
- pending: secondary/gray, approved: success/green, rejected: destructive/red, cancelled: outline

### LeaveReviewDialog
- Shows request summary + review note textarea + confirm (green approve / red reject)

### LeaveCalendar
- Month grid, 7 columns, color-coded days
- Colors: present=green, late=yellow, half_day=orange, absent=red, leave=blue, holiday=purple, weekend=gray, pending_leave=light blue striped
- Prev/Next month navigation
- `mini` prop for dashboard compact mode
- Day click → `LeaveCalendarDayPopover`

### LeaveTypeConfigForm
- 8 sections: Basic, Eligibility, Attachments, Duration, Date Rules, Counting, Balance, Approval
- Code field disabled in edit mode (immutable)
- Use Tabs or collapsible sections

### LeavePolicyForm
- Sections: Financial Year, Global Limits, Carry Forward Defaults, Integration, Counting Defaults
- Toggle switches for booleans, number inputs for numbers

### LeaveAuditTrail
- Vertical timeline: dot color per action (blue=created, green=approved, red=rejected, gray=cancelled)
- Shows: action, changer name, timestamp, reason, meta

### HrLeaveSummaryWidget
- 4 cards: Pending (yellow), Approved Today (green), Rejected Today (red), On Leave Today (blue)
- Each card clickable → navigates to requests or calendar

### LeaveAttachmentUpload
- Drag-and-drop zone, file preview, validation (PDF/JPEG/PNG/WebP, 5MB max)
- Shows file name + size after selection

### LeaveAttachmentViewer
- Opens signed URL in new tab

---

## 11. Forms & Validation

### Apply Leave (Zod)
```typescript
const applyLeaveSchema = z.object({
  leaveTypeCode: z.string().min(1, 'Leave type is required'),
  dateFrom: z.string().min(1, 'Start date is required'),
  dateTo: z.string().min(1, 'End date is required'),
  isHalfDay: z.boolean().default(false),
  halfDayPeriod: z.enum(['first_half', 'second_half']).optional(),
  reason: z.string().optional(),
}).refine(d => !d.isHalfDay || d.halfDayPeriod !== undefined, {
  message: 'Half day period required', path: ['halfDayPeriod'],
});
```

### Leave Type Config (Zod)
```typescript
const leaveTypeSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(2).max(10).regex(/^[A-Z][A-Z0-9]*$/, 'Uppercase alphanumeric'),
  description: z.string().optional(),
  isPaid: z.boolean(),
  annualAllocation: z.number().int().min(0),
  maxDaysPerRequest: z.number().int().positive().nullable(),
  maximumConsecutiveDays: z.number().int().positive().nullable(),
  maximumRequestsPerMonth: z.number().int().positive().nullable(),
  minimumNoticeDays: z.number().int().min(0).nullable(),
  halfDayAllowed: z.boolean(),
  futureDateAllowed: z.boolean(),
  backDateAllowed: z.boolean(),
  backDateLimitDays: z.number().int().positive().nullable(),
  weekendCounted: z.boolean(),
  holidayCounted: z.boolean(),
  canCombineWith: z.string().nullable(),
  negativeBalanceAllowed: z.boolean(),
  carryForwardEnabled: z.boolean(),
  carryForwardPercentage: z.number().int().min(0).max(100),
  carryForwardExpiryMonths: z.number().int().positive().nullable(),
  maxCarryForward: z.number().int().positive().nullable(),
  encashmentEnabled: z.boolean(),
  encashmentPercentage: z.number().int().min(0).max(100),
  manualAllocationAllowed: z.boolean(),
  approvalRequired: z.boolean(),
  approvalLevels: z.number().int().min(1),
  autoApprove: z.boolean(),
  notifyHR: z.boolean(),
  notifyMaster: z.boolean(),
  notifyManager: z.boolean(),
  probationAllowed: z.boolean(),
  genderRestriction: z.enum(['male', 'female']).nullable(),
  applicableRoles: z.string().nullable(),
  requiresMedicalCertificate: z.boolean(),
  requiresAttachment: z.boolean(),
  resetEveryYear: z.boolean(),
  monthlyAccrual: z.boolean(),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
});
```

### Leave Policy (Zod)
```typescript
const leavePolicySchema = z.object({
  financialYearStartMonth: z.number().int().min(1).max(12),
  financialYearStartDay: z.number().int().min(1).max(31),
  minimumNoticeDays: z.number().int().min(0),
  maximumFutureLeaveDays: z.number().int().positive().nullable(),
  maximumBackdatedLeaveDays: z.number().int().positive().nullable(),
  defaultCarryForwardPercentage: z.number().int().min(0).max(100),
  defaultCarryForwardExpiryMonths: z.number().int().positive().nullable(),
  attendanceIntegrationEnabled: z.boolean(),
  payrollIntegrationEnabled: z.boolean(),
  holidayCountedInLeave: z.boolean(),
  weekendCountedInLeave: z.boolean(),
});
```

### Balance Adjust (Zod)
```typescript
const adjustBalanceSchema = z.object({
  userId: z.string().uuid(),
  leaveTypeCode: z.string().min(1),
  year: z.number().int().min(2020),
  adjustmentDays: z.number().refine(v => v !== 0, 'Must be non-zero'),
  reason: z.string().min(1, 'Reason is required'),
});
```

---

## 12. Calendar Implementation

```tsx
// lib/leaveUtils.ts
export const calendarDayColors = {
  present: 'bg-green-100 text-green-800',
  late: 'bg-yellow-100 text-yellow-800',
  half_day: 'bg-orange-100 text-orange-800',
  absent: 'bg-red-100 text-red-800',
  leave: 'bg-blue-100 text-blue-800',
  holiday: 'bg-purple-100 text-purple-800',
  weekend: 'bg-gray-100 text-gray-500',
};

export const leaveStatusConfig = {
  pending: { label: 'Pending', variant: 'secondary', icon: Clock },
  approved: { label: 'Approved', variant: 'success', icon: Check },
  rejected: { label: 'Rejected', variant: 'destructive', icon: X },
  cancelled: { label: 'Cancelled', variant: 'outline', icon: Ban },
};

// Working days calculation (client-side preview)
export function calculateWorkingDays(from: Date, to: Date, weekendDays: number[], holidays: string[]): number {
  let count = 0;
  const cur = new Date(from);
  while (cur <= to) {
    const dayStr = cur.toISOString().split('T')[0];
    if (!weekendDays.includes(cur.getDay()) && !holidays.includes(dayStr)) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}
```

**Calendar component:** Render a 7-column grid. For each day in the month, find matching `LeaveCalendarDay` from data. Apply color class. If leave, show type code in cell. Click → popover.

---

## 13. Employee Dashboard

**Endpoint:** `GET /api/leave/dashboard`
**Hook:** `useLeaveDashboard()`

**Layout:**
1. **Stat cards row:** Pending (yellow), Approved (green), Rejected (red), Upcoming (blue) — 4 cards
2. **Balance cards row:** One `LeaveBalanceCard` per leave type with available > 0
3. **Mini calendar:** Current month, color-coded, compact
4. **Upcoming leaves list:** Next 3 approved upcoming leaves with type, dates, days, view button
5. **Action buttons:** "Apply for Leave" (if apply permission), "View History"

---

## 14. HR Dashboard

**Endpoint:** `GET /api/leave/hr-dashboard`
**Hook:** `useLeaveHrDashboard()`

**Layout:**
1. **Summary widget:** 4 clickable cards:
   - Pending Requests (yellow, Clock icon) → `/hrms/leave/requests?status=pending`
   - Approved Today (green, Check icon) → `/hrms/leave/requests`
   - Rejected Today (red, X icon) → `/hrms/leave/requests`
   - On Leave Today (blue, Calendar icon) → `/hrms/leave/calendar`
2. **Upcoming leaves table:** Employee name, type, dates, days
3. **Quick actions:** View All Requests, View Calendar, View Reports, Settings

---

## 15. Leave History

**Endpoint:** `GET /api/leave?page=1&pageSize=25&status=...&leaveTypeCode=...&dateFrom=...&dateTo=...&userId=...`
**Hook:** `useLeaveRequests(params)`

**Filters:**
- Status dropdown: All / Pending / Approved / Rejected / Cancelled
- Leave type dropdown: All + active types
- Date range: dateFrom + dateTo pickers
- Employee (HR mode only): search/select

**Table columns:** Type (name + code badge), Date From, Date To, Total Days, Status badge, Applied Date, Actions

**Row click** → detail page. **Actions** (HR + pending): Approve (green), Reject (red) buttons.

---

## 16. Leave Balance

### Employee Balance
**Endpoint:** `GET /api/leave/balance?year=2026`
**Hook:** `useLeaveBalance()`
**Display:** Grid of `LeaveBalanceCard` components.

### HR Balance (All Employees)
**Endpoint:** `GET /api/leave/balance/all?year=2026`
**Hook:** `useLeaveBalanceAll(year)`
**Table:** Employee, Type, Allocated, Carry Fwd, Adjustment, Consumed, Available, Actions
**Actions:** Adjust button → `LeaveBalanceAdjustDialog`

### Balance Adjust Dialog
- Shows current available (read-only)
- Adjustment days input (positive or negative)
- New balance preview (live calculation)
- Reason textarea (required)
- Confirm → `useAdjustBalance()` mutation

---

## 17. Leave Settings

**Endpoint:** `GET /api/leave-settings` (all), `POST/PUT/DELETE/PATCH` for CRUD
**Hooks:** `useLeaveTypes(false)`, `useCreateLeaveType()`, `useUpdateLeaveType()`, `useDeleteLeaveType()`, `useToggleLeaveType()`

**List table:** Code, Name, Paid badge, Active badge, Actions (Edit, Toggle, Delete)
- Edit → opens `LeaveTypeConfigForm` in dialog
- Toggle → calls toggle mutation
- Delete → confirmation dialog (blocked if dependent records exist — show error toast)

**Create button** → opens `LeaveTypeConfigForm` in dialog

**LeaveTypeConfigForm sections (Tabs):**
1. Basic: name, code (disabled in edit), description, isActive, sortOrder
2. Eligibility: isPaid, applicableRoles, genderRestriction, probationAllowed
3. Attachments: requiresMedicalCertificate, requiresAttachment
4. Duration: annualAllocation, maxDaysPerRequest, maximumConsecutiveDays, maximumRequestsPerMonth, minimumNoticeDays
5. Date Rules: halfDayAllowed, futureDateAllowed, backDateAllowed, backDateLimitDays
6. Counting: weekendCounted, holidayCounted, canCombineWith
7. Balance: negativeBalanceAllowed, resetEveryYear, monthlyAccrual, carryForwardEnabled, carryForwardPercentage, carryForwardExpiryMonths, maxCarryForward, encashmentEnabled, encashmentPercentage, manualAllocationAllowed
8. Approval: approvalRequired, approvalLevels, autoApprove, notifyHR, notifyMaster, notifyManager

**Conditional fields:**
- carryForwardPercentage/maxCarryForward/carryForwardExpiryMonths only if carryForwardEnabled
- encashmentPercentage only if encashmentEnabled
- backDateLimitDays only if backDateAllowed
- halfDayPeriod only if halfDayAllowed

---

## 18. Leave Policy

**Endpoint:** `GET /api/leave-policy`, `PUT /api/leave-policy`
**Hooks:** `useLeavePolicy()`, `useUpdateLeavePolicy()`

**Form sections:**
1. Financial Year: startMonth (1-12 dropdown), startDay (1-31 dropdown)
2. Global Limits: minimumNoticeDays, maximumFutureLeaveDays, maximumBackdatedLeaveDays
3. Carry Forward Defaults: defaultCarryForwardPercentage, defaultCarryForwardExpiryMonths
4. Integration: attendanceIntegrationEnabled (toggle), payrollIntegrationEnabled (toggle)
5. Counting Defaults: holidayCountedInLeave (toggle), weekendCountedInLeave (toggle)

**Save button** → `useUpdateLeavePolicy()` mutation. Show success toast.

---

## 19. Notifications

The backend sends notifications with `type: 'leave'`. The existing notification system handles listing, unread counts, and marking as read.

**Frontend changes needed:**
1. Add `leave` to the notification type icon/color mapping:
   ```typescript
   const notificationTypeConfig = {
     assignment: { icon: UserPlus, color: 'blue' },
     followup: { icon: CalendarClock, color: 'orange' },
     system: { icon: Settings, color: 'gray' },
     regularization: { icon: Clock, color: 'yellow' },
     leave: { icon: CalendarOff, color: 'purple' },  // NEW
   };
   ```
2. Notification bell badge count includes leave notifications automatically
3. Notification list shows leave notifications with title + body text from backend
4. No special handling needed — backend handles all notification logic

**Notification examples from backend:**
- Title: "New leave request from John Doe" / Body: "Sick Leave, Jul 25 - Jul 27, 3 days"
- Title: "Your leave request has been approved" / Body: "Annual Leave, Aug 1 - Aug 5"
- Title: "Your leave request has been rejected" / Body: "Casual Leave, Jul 15. Reason: Insufficient balance"

---

## 20. Responsive Design

### Breakpoints (Tailwind defaults)
- **Mobile (< 640px):** Single column. Cards stack vertically. Calendar shows 1 week view or simplified. Tables become card lists. Forms single column. Sidebar collapses to hamburger.
- **Tablet (640-1024px):** 2-column for balance cards. Calendar full month. Tables scroll horizontally. Forms 2-column for short fields.
- **Desktop (> 1024px):** Full multi-column. 4 stat cards in row. 3-4 balance cards in row. Full sidebar. Tables with all columns.

### Key responsive rules:
- Stat cards: `grid-cols-2 sm:grid-cols-2 lg:grid-cols-4`
- Balance cards: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- Calendar: full month on tablet+, week view on mobile (or horizontal scroll)
- Tables: `overflow-x-auto` wrapper, hide non-essential columns on mobile
- Forms: `grid-cols-1 md:grid-cols-2` for paired fields
- Dialogs: full-screen on mobile, centered on desktop
- Sidebar: collapsible drawer on mobile, fixed on desktop

---

## 21. Testing Checklist

### Employee Module
- [ ] Dashboard loads with balances, stats, mini calendar, upcoming leaves
- [ ] Apply form shows correct leave types (active only)
- [ ] Apply form shows attachment field only when required
- [ ] Apply form shows half-day option only when allowed
- [ ] Half-day selection disables dateTo and shows period radio
- [ ] Date range validation: dateTo >= dateFrom
- [ ] Overlapping leave shows error toast
- [ ] Insufficient balance shows error toast (when negativeBalanceAllowed=false)
- [ ] Successful application shows success toast and redirects
- [ ] Leave history loads with pagination
- [ ] Filters work: status, type, date range
- [ ] Row click navigates to detail page
- [ ] Cancel button only shows for pending own requests
- [ ] Cancel confirmation dialog works
- [ ] Calendar shows correct colors for each day type
- [ ] Calendar month navigation works
- [ ] Calendar day popover shows correct info

### HR Module
- [ ] HR dashboard shows 4 stat cards with correct counts
- [ ] Clicking stat card navigates to correct page
- [ ] HR requests page shows all employees' requests
- [ ] Approve button only shows for pending requests + has permission
- [ ] Reject button only shows for pending requests + has permission
- [ ] Approve dialog shows request summary + review note field
- [ ] Reject dialog shows request summary + review note field
- [ ] Successful approval/rejection updates table and dashboard
- [ ] HR calendar shows all employees with filter
- [ ] HR balance page shows all employees with year selector
- [ ] Adjust dialog shows current balance and calculates new preview
- [ ] Adjust requires non-zero days and reason
- [ ] Reports page loads with month/year selectors
- [ ] Export button downloads Excel file
- [ ] Settings page lists all leave types (including inactive)
- [ ] Create leave type form validates all fields
- [ ] Code field is disabled in edit mode
- [ ] Toggle active/inactive works
- [ ] Delete shows confirmation and handles error if dependencies exist
- [ ] Leave policy form loads and saves correctly

### Permissions
- [ ] Employee without hrms access cannot see HR pages
- [ ] Employee without apply permission cannot see Apply button
- [ ] HR without approve permission cannot see Approve button
- [ ] HR without leave_settings access cannot see Settings page
- [ ] HR without leave_policy:edit sees read-only policy form
- [ ] Master user can access everything

### Notifications
- [ ] Leave notifications appear in notification bell
- [ ] Leave notification has correct icon (CalendarOff)
- [ ] Unread count includes leave notifications
- [ ] Mark as read works for leave notifications

### Responsive
- [ ] Mobile: all pages render correctly in single column
- [ ] Tablet: 2-column layouts work
- [ ] Desktop: full multi-column layouts
- [ ] Calendar is usable on mobile (scroll or week view)
- [ ] Tables scroll horizontally on mobile
- [ ] Dialogs are full-screen on mobile
- [ ] Forms are single column on mobile

### Edge Cases
- [ ] Empty states: no leave requests, no balances, no upcoming leaves
- [ ] Error states: API failure shows error message
- [ ] Loading states: skeletons or spinners while fetching
- [ ] Pagination: correct page count, disabled buttons at boundaries
- [ ] Date formatting: consistent YYYY-MM-DD display
- [ ] Decimal display: 0.5 days shown correctly
- [ ] Attachment: PDF opens in new tab, images show preview
