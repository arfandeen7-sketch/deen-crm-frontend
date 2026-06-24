# DEEN CRM — Testing Report Fix Plan

> Scope: this is the **frontend** repo (`deen-crm-frontend`, Next.js). The backend is a separate, already-deployed service (`https://deen-crm-backend-production.up.railway.app`, see `BACKEND_CONTEXT.md`).
> Several requested features cannot be completed in the frontend alone — they need new backend fields, endpoints, or behaviour. Each item below is tagged:
>
> - **[FE]** — fully fixable in this repo.
> - **[FE+BE]** — frontend work depends on a backend change.
> - **[BE]** — primarily a backend change; frontend only consumes it.

---

## 0. Cross-cutting root cause: role-only RBAC, no per-user permissions

The whole app gates UI off a static **role → permission** matrix in `@/lib/rbac.ts:24-41` (`MATRIX`), consumed via `useAuth().can()` (`@/hooks/useAuth.ts:41`) and `<RoleGuard>`. There is:

- No concept of **per-user module access** (Lead item 1).
- No general **activity/audit log** — only `LeadStatusHistory` (Lead items 7).
- No **notifications** model/endpoint anywhere in `services/` (Follow-up items 1–2).
- A **reports API mismatch**: `@/services/leads/reports.service.ts:11-26` calls `/leads/reports/source|status|user-performance|time-series`, but `BACKEND_CONTEXT.md:477-512` only documents `GET /api/leads/report?groupBy=user|source`. The reports page (`@/app/(dashboard)/leads/reports/page.tsx`) is likely running against endpoints that differ from the deployed backend. **This must be reconciled before extending reports.**

These gaps mean items 1, 7, 8 (Lead) and 1, 2 (Follow-up) are **[FE+BE]/[BE]** and need backend coordination.

---

# LEAD MODULE

## 1. User Module Access Control (Custom Module Access) — [FE+BE]

**Current state**
- `POST /api/users` accepts only `fullName, email, password, phone, role` (`BACKEND_CONTEXT.md:622-637`); mirrored in `@/services/users/users.service.ts:4-16` and `@/schemas/user.schema.ts:10-22`.
- Module visibility is derived purely from `role` via `NAV_GROUPS[].items[].permission` (`@/components/layout/nav.config.ts`) + `MATRIX` (`@/lib/rbac.ts`).
- There is **no field** to store which modules a user can access.

**Root cause:** access is role-based only; there is no per-user permission storage or UI.

**Plan**
1. **[BE]** Add `moduleAccess: string[]` (or a permissions JSON) to the User model; accept it in `POST/PUT /api/users`; return it in `GET /api/users/:id` and in the login `user` payload.
2. **[FE]** Define a canonical module list (derive from `NAV_GROUPS` ids/labels) in a new `constants/modules.ts`.
3. **[FE]** Add a **Custom Module Access** section to `@/components/forms/UserForm.tsx` (checkbox grid of all modules). Extend `@/schemas/user.schema.ts` with `moduleAccess: z.array(z.string()).optional()` and `CreateUserInput/UpdateUserInput` in `users.service.ts`.
4. **[FE]** Extend `User` type (`@/types/index.ts:41-63`) with `moduleAccess?: string[] | null`.
5. **[FE]** Update gating: extend `can()`/add `canAccessModule()` in `@/lib/rbac.ts` and the `Sidebar`/`RoleGuard` to also honour `user.moduleAccess` (intersection of role default + assigned modules). Keep role as the coarse gate, module access as the fine gate.

---

## 2. Lead Visibility Based on Assignment — [FE+BE]

**Current state**
- Backend already scopes `sales_executive` to `assignedTo = req.user.id` automatically (`BACKEND_CONTEXT.md:46-47, 398`). So sales executives already only see their own leads — verify this is actually happening in testing.
- `sales_manager` and `master` see **all** leads by design.

**Root cause:** if a non-admin still sees all leads, either (a) the test user's role is not `sales_executive`, or (b) the requirement is that **Sales Managers** should also be scoped to a team subset — which the backend does not currently support.

**Plan**
1. **[FE] verify:** confirm the failing user's `role` (login response). If they are `sales_executive`, the list is already scoped server-side and no FE change is needed.
2. **[BE]** If Sales Managers must be limited to "their team's" leads, add a team/manager relationship and scope `GET /api/leads` accordingly. The frontend needs no change beyond consuming the narrowed list.
3. **[FE]** Defensive: the All-Leads page (`@/app/(dashboard)/leads/page.tsx`) and `LeadFilters` should hide the "assigned to" filter for non-privileged users (gate with `can("leads.view.all")`).

---

## 3. Sales Manager Lead Assignment Rights — [FE+BE]

**Current state**
- `leads.assign` is granted to `["master","sales_manager"]` (`@/lib/rbac.ts:28`) and bulk-assign is allowed for both roles (`BACKEND_CONTEXT.md:516-524`). So the *permission* exists.
- **Bug:** the assignee dropdown is populated by `useAssignableUsers()` → `usersService.list()` → `GET /api/users` (`@/hooks/useUsers.ts:22-35`, `@/services/users/users.service.ts:19-21`). But `GET /api/users` is **`master` only** (`BACKEND_CONTEXT.md:612`). So a Sales Manager gets `403` and sees an **empty assignee list** → cannot assign.

**Root cause:** no master-independent way to fetch assignable users; the dropdown depends on a master-only endpoint.

**Plan**
1. **[BE]** Provide a lightweight, non-master endpoint for assignable users, e.g. `GET /api/users/assignable` (returns `id, fullName, role` for `sales_executive`/`sales_manager`), accessible to `master` + `sales_manager`.
2. **[FE]** Point `useAssignableUsers()` at the new endpoint (add `usersService.assignable()`); keep `useUsers()` (full list) master-only.
3. **[FE]** This automatically fixes the empty dropdowns in `@/components/forms/LeadForm.tsx:116-123` and `@/components/leads/BulkActions.tsx:86-93`.
4. **[FE]** Optionally restrict the assignee list shown to a Sales Manager to `sales_executive`s only, reflecting the Admin → Sales Manager → Sales Executive hierarchy.

---

## 4. Additional Lead Fields (Price, Size, Type, Configuration) — [FE+BE]

**Current state**
- Backend `Lead` already has `price` and `propertySize` (`BACKEND_CONTEXT.md:150-151`) but the frontend **omits them**: not in the `Lead` type (`@/types/index.ts:98-127`), the schema (`@/schemas/lead.schema.ts`), the form (`@/components/forms/LeadForm.tsx`), or the table (`@/app/(dashboard)/leads/page.tsx:71-125`).
- **Project Type** (Residential/Commercial/Retail) has **no backend field**.
- **Configuration** is a known dynamic-field category (`BACKEND_CONTEXT.md:284`, `@/types/index.ts:31`) but the lead has no column storing the chosen configuration value.
- The "latest comment" column needs `comments` (exists) but the table shows none.

**Root cause:** existing backend fields not surfaced; two new attributes (project type, configuration-on-lead) not modelled.

**Plan**
1. **[BE]** Add to the Lead model + create/update validation + list/detail responses: `projectType` (enum `residential|commercial|retail`) and `configuration` (string, validated against `dynamic_fields(configuration)`). Confirm `price`/`propertySize` are returned in list responses.
2. **[FE] types:** add `price?`, `propertySize?`, `projectType?`, `configuration?` to `Lead` (`@/types/index.ts:98-127`).
3. **[FE] schema:** add the fields to `@/schemas/lead.schema.ts` (`price` numeric-as-string, `propertySize` optional, `projectType` enum, `configuration` optional string).
4. **[FE] form:** add inputs in `@/components/forms/LeadForm.tsx` — `price` (Input number), `propertySize` (Input), `projectType` (Select: Residential/Commercial/Retail), `configuration` (Select fed by `useFieldOptions("configuration")`, values Studio/1BR/2BR/3BR/Villa/Townhouse seeded as dynamic fields).
5. **[FE] table columns:** add Price, Size, Type, Configuration, and a **Comment** column (latest comment) to the columns array in `@/app/(dashboard)/leads/page.tsx:71-125`. For "latest comment", display `lead.comments` truncated (or the latest activity comment once item 7 lands).

---

## 5. Default Lead Status "None" & Untouched Highlighting — [FE+BE]

**Current state**
- Backend default `leadStatus` is `"Fresh"` (`BACKEND_CONTEXT.md:154`); the form defaults to `"Fresh"` (`@/components/forms/LeadForm.tsx:46`).
- `isTouched` exists on the backend (`BACKEND_CONTEXT.md:161`) but is **missing from the frontend `Lead` type**, so the UI can't highlight untouched leads. There is already an `/leads/untouched` route + `category=untouched` filter.
- `DataTable` (`@/components/tables/DataTable.tsx:86-93`) applies row classes but has no per-row color hook.

**Root cause:** default status hardcoded to "Fresh"; `isTouched` not exposed; no row-highlight mechanism.

**Plan**
1. **[BE]** Add a `"None"` value to `dynamic_fields(lead_status)` and change the create default to `"None"` (or accept the FE-sent value). Ensure `isTouched` is in list responses.
2. **[FE]** Add `isTouched: boolean` to `Lead` (`@/types/index.ts`). Default the form's `leadStatus` to `"None"` (`LeadForm.tsx:46`).
3. **[FE]** Add an optional `rowClassName?: (row: T) => string` prop to `DataTable` and apply it on the `<tr>` (`DataTable.tsx:86-93`). On the leads page, set a blue/pink tint when `!lead.isTouched`.

---

## 6. Created By column (username + date + time) — [FE]

**Current state**
- Backend stores `createdBy` and `createdAt`; detail page already shows `lead.creator?.fullName` (`@/app/(dashboard)/leads/[id]/page.tsx:173`). The `Lead` type has `creator` (`@/types/index.ts:124`).
- The **list table has no Created By column**, and the detail "Created By" row shows only the name, not date/time.

**Root cause:** display gap (and need to confirm `creator` is included in the **list** response, not just detail).

**Plan**
1. **[FE] verify** `GET /api/leads` includes `creator` + `createdAt` (it should per type; confirm in network). If list omits `creator`, request **[BE]** to include it.
2. **[FE]** Add a **Created By** column to the leads table (`@/app/(dashboard)/leads/page.tsx`) rendering `creator?.fullName` plus `formatDateTime(createdAt)`.
3. **[FE]** On the detail page, change the Created By row to show name + `formatDateTime(lead.createdAt)`.

---

## 7. Activity Timeline Tracking (all actions) — [BE-heavy / FE]

**Current state**
- The only timeline is `statusHistory` (`LeadStatusHistory`), rendered in `@/app/(dashboard)/leads/[id]/page.tsx:127-157`. It records **status changes only** (`BACKEND_CONTEXT.md:455`).
- There is no record for comments added, follow-ups scheduled, assignments, or general edits.

**Root cause:** no generic activity/audit log; only status transitions are persisted.

**Plan**
1. **[BE]** Add a `LeadActivity` log (fields: `leadId, userId, action, detail, createdAt`) written on every mutating lead action (status update, comment added, follow-up scheduled, assigned, modified). Expose it via `GET /api/leads/:id` (e.g. `activities[]`) or `GET /api/leads/:id/activities`.
2. **[FE]** Add `LeadActivity` type + `activities?: LeadActivity[]` on `Lead` (`@/types/index.ts`).
3. **[FE]** Replace/augment the "Status History Timeline" card with a unified **Activity Timeline** showing `username · action · date · time` for every entry. Until the backend ships, keep `statusHistory` as the data source.

---

## 8. User Performance Report Enhancement — [FE+BE]

**Current state**
- **Endpoint mismatch (see §0):** `@/services/leads/reports.service.ts` targets `/leads/reports/*` while the backend documents `GET /api/leads/report?groupBy=user|source` (`BACKEND_CONTEXT.md:477-507`).
- The current report row only has `totalAssigned, touched, untouched, followedUp, missedFollowUps, statusBreakdown, lastActivityAt` — it lacks **deals converted, total status updates, total comments added**, and a per-lead detailed table.
- Frontend table shows only assigned/converted/follow-ups (`@/app/(dashboard)/leads/reports/page.tsx:337-379`).

**Root cause:** wrong/limited report contract; missing aggregate metrics and detail rows.

**Plan**
1. **[FE] reconcile API first:** align `reports.service.ts` with the actual deployed endpoint(s). Either update the service to call `GET /api/leads/report?groupBy=user` and map fields, or confirm the `/leads/reports/*` endpoints exist. This is a prerequisite.
2. **[BE]** Extend the user report to include: `dealsConverted`, `statusUpdates`, `commentsAdded`, `followUpsCompleted`, `lastActivityAt`, `assignedDate`, and a **detailed per-lead** breakdown (user, lead name, current status, conversion status, comments count, follow-up count, last activity, assigned date) — this depends on the activity log from §7.
3. **[FE] types:** expand `UserPerformanceItem` (`@/types/index.ts:412-418`) and add a `UserPerformanceDetailRow` type.
4. **[FE] UI:** add a **Summary Metrics** card row (Total Assigned, Worked On, Deals Converted, Status Updates, Follow-Ups Completed, Comments Added) and a **Detailed Report Table** on `@/app/(dashboard)/leads/reports/page.tsx`.
5. Note: `/api/leads/report` is **`master` only** — gate the page and consider opening it to `sales_manager` if managers need it (**[BE]**).

---

## 9. Quick Action Column — [FE] (mostly)

**Current state**
- The actions column only has View/Edit/Delete (`@/app/(dashboard)/leads/page.tsx:101-124`). Status update / comment / follow-up / assign exist only as **bulk** modals (`@/components/leads/BulkActions.tsx`).

**Root cause:** no per-row quick-action menu; single-lead inline actions not built.

**Plan**
1. **[FE]** Build a reusable `LeadQuickActions` component (a dropdown menu) with:
   - **Update Status** — modal → `leadsService.update(id, { leadStatus })`.
   - **Add Comment** — modal → `update(id, { comments })` (appends; ideally posts an activity once §7 lands).
   - **Schedule Follow-Up** — modal (date + time, see Follow-up §1) → `update(id, { followUpDate })`.
   - **Assign Lead** — modal reusing assignable users (depends on §3 fix), gated by `can("leads.assign")` → `bulkAssign([id], userId)` or `update`.
   - **View Details** — link to `/leads/:id`.
   - **Call Lead** — `tel:${mobileNumber}` link.
   - **WhatsApp Lead** — `https://wa.me/${normalizedNumber}` link.
2. **[FE]** Add it as the trailing column in the leads table (and optionally the follow-up table). Reuse `useLeadMutations()` and existing modal primitives.

---

# FOLLOW-UP MODULE

## 1. Follow-Up Time + Notification Center — [FE+BE]

**Current state**
- `followUpDate` is an **ISO date only** (no time): backend type (`BACKEND_CONTEXT.md:157`), form uses `<Input type="date">` (`@/components/forms/LeadForm.tsx:113-115`), display uses `formatDate` (`@/components/followup/FollowupView.tsx:62`).
- Follow-up data comes from `GET /api/followup/today|missed|upcoming` via `followupService` (`@/services/leads/leads.service.ts:74-87`) + `useFollowup`.
- **No notification center** exists in `@/components/layout/Header.tsx` — it only has the profile menu.

**Root cause:** follow-up stored as date-only; no header notification surface.

**Plan**
1. **[BE]** Change `followUpDate` storage/validation to a full datetime; ensure today/missed/upcoming comparisons use datetime.
2. **[FE]** Switch the follow-up input to `<input type="datetime-local">` in `LeadForm.tsx` and the §9 Schedule Follow-Up modal; render with `formatDateTime`.
3. **[FE]** Build a **Notification Center** in the header:
   - New `components/layout/NotificationCenter.tsx` (bell icon + dropdown badge) added to `Header.tsx`.
   - New `hooks/useNotifications.ts` aggregating `followupService.today/missed/upcoming` (already available) into three sections: **Today's**, **Missed**, **Upcoming** follow-ups, with counts on the bell.
   - Poll with React Query `refetchInterval` for near-real-time feel (true real-time needs backend push).

---

## 2. Lead Assignment Notifications — [BE-heavy / FE]

**Current state**
- No notifications model, endpoint, or service exists. Assignment happens via `bulk-assign`/`update` with no notification side-effect.

**Root cause:** backend has no notification persistence or delivery; frontend has no consumer.

**Plan**
1. **[BE]** Add a `Notification` model (`userId, type, title, body, leadId, isRead, createdAt`). On lead assignment (by master or sales manager), create a notification for the assignee containing **lead name, assigned-by username, assignment date/time**. Expose `GET /api/notifications` (+ unread count) and `PATCH /api/notifications/:id/read`. Real-time delivery via SSE/WebSocket or client polling.
2. **[FE]** Add `services/notifications/notifications.service.ts` + `hooks/useNotifications.ts` (merge with Follow-up §1's hook). Show assignment notifications in the Notification Center with the required fields and a link to the lead.
3. **[FE]** Mark-as-read on open; show unread badge count on the header bell.

---

# Suggested Sequencing

1. **Reconcile reports API mismatch (§0/§8.1)** and **fix assignable-users endpoint (§3)** — these unblock other work and are low-risk.
2. **FE-only wins:** Quick Action column (§9, except Assign), Created By column (§6), untouched highlighting + `isTouched`/`DataTable.rowClassName` (§5), surface existing `price`/`propertySize` (§4 partial), Notification Center fed by existing follow-up endpoints (Follow-up §1 FE part).
3. **Backend-dependent:** module access (§1), project type/configuration fields (§4), activity log (§7) → enhanced reports (§8), follow-up datetime (Follow-up §1), assignment notifications (Follow-up §2).

# Backend Change Checklist (for the backend team)

- `User.moduleAccess` field + create/update/login payload (§1).
- Optional team scoping for Sales Managers' lead lists (§2).
- `GET /api/users/assignable` for non-master roles (§3).
- `Lead.projectType` + `Lead.configuration`; expose `price`/`propertySize`/`isTouched`/`creator` in **list** responses (§4, §5, §6).
- `"None"` lead status + default change (§5).
- `LeadActivity` audit log + endpoint (§7).
- Enhanced user report metrics + per-lead detail rows; consider opening report to `sales_manager` (§8).
- `followUpDate` as datetime (Follow-up §1).
- `Notification` model + endpoints + assignment hook (Follow-up §2).
