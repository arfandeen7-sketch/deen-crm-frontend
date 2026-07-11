# Frontend Permission System — Handoff Document

**Backend Version:** Enterprise 3-Level Permission Matrix  
**Status:** ✅ Fully Implemented & Live  
**Compiled:** Zero TypeScript errors, server starts cleanly

---

## 1. Architecture Overview

The new permission system uses a **three-level hierarchy**:

```
Module → Page → Action
```

**Key principles:**
- **Zero access by default** — new users have NO permissions until a Master explicitly grants them
- **Master users bypass all checks** — they always have full access, no DB lookup needed
- **Database-driven** — no hardcoded role defaults anywhere
- **Backend is the single source of truth** — frontend must use the access map for UI, but the backend always re-validates every API call

---

## 2. Permission Registry (What exists)

The full registry is 9 modules / 21 pages / 62 actions. Fetch it once at login:

```
GET /api/permissions/registry
```

**Response structure:**
```json
{
  "data": {
    "registry": [
      {
        "key": "leads",
        "label": "Leads",
        "icon": "Users",
        "sortOrder": 1,
        "pages": [
          {
            "key": "all_leads",
            "label": "All Leads",
            "sortOrder": 0,
            "actions": [
              { "key": "view",         "label": "View",              "sortOrder": 0 },
              { "key": "create",       "label": "Create",            "sortOrder": 1 },
              { "key": "edit",         "label": "Edit",              "sortOrder": 2 },
              { "key": "delete",       "label": "Delete",            "sortOrder": 3 },
              { "key": "assign",       "label": "Assign",            "sortOrder": 4 },
              { "key": "bulk_assign",  "label": "Bulk Assign",       "sortOrder": 5 },
              { "key": "bulk_status",  "label": "Bulk Status Change","sortOrder": 6 },
              { "key": "export",       "label": "Export",            "sortOrder": 7 },
              { "key": "import",       "label": "Import",            "sortOrder": 8 }
            ]
          }
        ]
      }
    ]
  }
}
```

### Complete Module / Page / Action Map

| Module (`moduleKey`) | Page (`pageKey`) | Actions (`actionKey`) |
|---|---|---|
| `dashboard` | `dashboard_home` | `view` |
| `dashboard` | `analytics` | `view`, `export` |
| `leads` | `all_leads` | `view`, `create`, `edit`, `delete`, `assign`, `bulk_assign`, `bulk_status`, `export`, `import` |
| `leads` | `assigned_leads` | `view` |
| `leads` | `untouched_leads` | `view` |
| `followup` | `todays_followup` | `view` |
| `followup` | `missed_followup` | `view` |
| `followup` | `upcoming_followup` | `view` |
| `lead_reports` | `user_report` | `view`, `export` |
| `lead_reports` | `source_report` | `view`, `export` |
| `brokers` | `all_brokers` | `view`, `create`, `edit`, `delete`, `export`, `import` |
| `users` | `all_users` | `view`, `create`, `edit`, `deactivate`, `manage_permissions` |
| `users` | `teams` | `view`, `assign`, `reassign` |
| `hrms` | `employees` | `view`, `create`, `edit` |
| `hrms` | `attendance` | `view`, `create`, `edit`, `delete`, `export` |
| `hrms` | `leave` | `view`, `apply`, `approve`, `cancel` |
| `hrms` | `payroll` | `view`, `generate`, `edit`, `delete` |
| `hrms` | `payslips` | `view`, `generate`, `download`, `send` |
| `hrms` | `login_activity` | `view` |
| `dynamic_fields` | `manage_fields` | `view`, `create`, `edit`, `delete` |
| `notifications` | `all_notifications` | `view`, `mark_read` |

---

## 3. API Endpoints Reference

All endpoints require the `Authorization: Bearer <supabase_token>` header.

### Authentication / Profile

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/me/profile` | Returns user profile + `access` map (modules/pages/actions) |
| `GET` | `/api/permissions/me` | Returns the flat access map only |
| `GET` | `/api/permissions/registry` | Returns full Module→Page→Action registry |

### Permission Management (Master only)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/permissions/user/:userId` | Get a user's current grants + registry |
| `PUT` | `/api/permissions/user/:userId` | Bulk-replace all grants for a user |
| `DELETE` | `/api/permissions/user/:userId` | Revoke ALL permissions (zero access) |

---

## 4. Access Map Structure (what to store in frontend state)

After login, call `GET /api/me/profile` or `GET /api/permissions/me`. Store the `access` object in your auth/user store.

### For non-master users:
```json
{
  "isMaster": false,
  "modules": ["leads", "followup", "brokers"],
  "pages": {
    "leads": ["all_leads", "assigned_leads"],
    "followup": ["todays_followup", "missed_followup"],
    "brokers": ["all_brokers"]
  },
  "actions": {
    "leads:all_leads": ["view", "create", "edit"],
    "leads:assigned_leads": ["view"],
    "followup:todays_followup": ["view"],
    "followup:missed_followup": ["view"],
    "brokers:all_brokers": ["view", "create"]
  }
}
```

### For master users:
```json
{
  "isMaster": true,
  "modules": ["dashboard", "leads", "followup", "lead_reports", "brokers", "users", "hrms", "dynamic_fields", "notifications"],
  "pages": { "leads": ["all_leads", "assigned_leads", "untouched_leads"], "..." : "..." },
  "actions": { "leads:all_leads": ["view", "create", "edit", "delete", "assign", "bulk_assign", "bulk_status", "export", "import"], "...": "..." }
}
```

---

## 5. Frontend Permission Helpers (Recommended)

Create a `usePermissions()` hook or a `permissions.ts` utility:

```typescript
// utils/permissions.ts

interface AccessMap {
  isMaster: boolean;
  modules: string[];
  pages: Record<string, string[]>;
  actions: Record<string, string[]>;
}

export function canAccessModule(access: AccessMap, moduleKey: string): boolean {
  if (access.isMaster) return true;
  return access.modules.includes(moduleKey);
}

export function canAccessPage(access: AccessMap, moduleKey: string, pageKey: string): boolean {
  if (access.isMaster) return true;
  return access.pages[moduleKey]?.includes(pageKey) ?? false;
}

export function canDoAction(
  access: AccessMap,
  moduleKey: string,
  pageKey: string,
  actionKey: string
): boolean {
  if (access.isMaster) return true;
  return access.actions[`${moduleKey}:${pageKey}`]?.includes(actionKey) ?? false;
}
```

### Usage in components:

```tsx
// Show sidebar item only if module is accessible
{canAccessModule(access, 'leads') && <SidebarItem label="Leads" />}

// Show page only if user can access it
{canAccessPage(access, 'leads', 'all_leads') && <AllLeadsPage />}

// Show button only if action is permitted
{canDoAction(access, 'leads', 'all_leads', 'create') && (
  <Button onClick={openCreateModal}>+ Add Lead</Button>
)}

// Show delete button
{canDoAction(access, 'leads', 'all_leads', 'delete') && (
  <Button variant="destructive" onClick={deleteLead}>Delete</Button>
)}
```

---

## 6. Permission Matrix UI (Create/Edit User Page)

The permission matrix must be rendered on the **Create User** and **Edit User** pages only. Do NOT create a separate Permission Management page.

### Step 1 — Fetch data for the matrix

When opening Create/Edit User (Master only):

```
GET /api/permissions/registry       → full registry (for structure)
GET /api/permissions/user/:userId   → user's current grants (for pre-filling checkboxes)
```

`GET /api/permissions/user/:userId` returns:
```json
{
  "data": {
    "userId": "...",
    "fullName": "John Doe",
    "role": "sales_manager",
    "isMasterUser": false,
    "grants": [
      { "moduleKey": "leads",  "pageKey": "",         "actionKey": "",       "granted": true },
      { "moduleKey": "leads",  "pageKey": "all_leads", "actionKey": "",       "granted": true },
      { "moduleKey": "leads",  "pageKey": "all_leads", "actionKey": "view",   "granted": true },
      { "moduleKey": "leads",  "pageKey": "all_leads", "actionKey": "create", "granted": true }
    ],
    "registry": [ "...same as /registry..." ]
  }
}
```

### Step 2 — Render accordion/tree

```
▼ Leads                          [Module toggle ✓]
    ▼ All Leads                  [Page toggle ✓]
        ☑ View
        ☑ Create
        ☐ Edit
        ☐ Delete
        ☐ Bulk Assign
        ...
    ▶ Assigned Leads             [Page toggle ☐]
    ▶ Untouched Leads            [Page toggle ☐]
▶ Follow-up                      [Module toggle ☐]
▶ Lead Reports                   [Module toggle ☐]
...
```

### Step 3 — Grant key rules (IMPORTANT)

The backend enforces a **3-level grant model**. When saving, you must send grants for ALL three levels:

| To grant... | You must include |
|---|---|
| Action `leads:all_leads:view` | `{moduleKey:'leads', pageKey:'', actionKey:''}` + `{moduleKey:'leads', pageKey:'all_leads', actionKey:''}` + `{moduleKey:'leads', pageKey:'all_leads', actionKey:'view'}` |
| Page `leads:all_leads` (all actions) | Module grant + page grant + each action grant |
| Full module `leads` | Module grant + page grants + all action grants |

**Shortcut logic for your UI:**
- When user ticks a **Module** → automatically tick all its pages and actions
- When user ticks a **Page** → automatically tick its parent module and all its actions
- When user ticks an **Action** → automatically tick its parent module and parent page
- When user unticks a **Module** → automatically untick all its pages and actions
- When user unticks a **Page** → automatically untick all its actions (but leave module if other pages are still ticked)

### Step 4 — Save permissions

```
PUT /api/permissions/user/:userId
Content-Type: application/json
Authorization: Bearer <master_token>

{
  "grants": [
    { "moduleKey": "leads",  "pageKey": "",          "actionKey": "",        "granted": true },
    { "moduleKey": "leads",  "pageKey": "all_leads",  "actionKey": "",        "granted": true },
    { "moduleKey": "leads",  "pageKey": "all_leads",  "actionKey": "view",    "granted": true },
    { "moduleKey": "leads",  "pageKey": "all_leads",  "actionKey": "create",  "granted": true },
    { "moduleKey": "followup","pageKey": "",           "actionKey": "",        "granted": true },
    { "moduleKey": "followup","pageKey": "todays_followup","actionKey": "",   "granted": true },
    { "moduleKey": "followup","pageKey": "todays_followup","actionKey": "view","granted": true }
  ]
}
```

This is a **full replace** — send the complete desired state. To revoke all: `DELETE /api/permissions/user/:userId`.

---

## 7. Building the Grants Array (Helper Function)

```typescript
// utils/buildGrants.ts

interface GrantEntry {
  moduleKey: string;
  pageKey: string;
  actionKey: string;
  granted: boolean;
}

interface PermissionSelection {
  // moduleKey → pageKey → Set of actionKeys
  [moduleKey: string]: {
    [pageKey: string]: Set<string>;
  };
}

export function buildGrantsFromSelection(selection: PermissionSelection): GrantEntry[] {
  const grants: GrantEntry[] = [];

  for (const moduleKey of Object.keys(selection)) {
    const pages = selection[moduleKey];
    const hasAnyPage = Object.keys(pages).length > 0;
    if (!hasAnyPage) continue;

    // Module-level grant
    grants.push({ moduleKey, pageKey: '', actionKey: '', granted: true });

    for (const pageKey of Object.keys(pages)) {
      const actions = pages[pageKey];
      if (actions.size === 0) continue;

      // Page-level grant
      grants.push({ moduleKey, pageKey, actionKey: '', granted: true });

      // Action-level grants
      for (const actionKey of actions) {
        grants.push({ moduleKey, pageKey, actionKey, granted: true });
      }
    }
  }

  return grants;
}
```

---

## 8. Reloading Permissions After Save

After `PUT /api/permissions/user/:userId` succeeds, if the edited user is the **currently logged-in user**, call `GET /api/permissions/me` again and update the frontend access map.

> The backend re-validates on every request, so the frontend state only affects UI rendering — stale state only results in incorrect UI, not a security bypass.

---

## 9. Master User Special Handling

- **Never show the permission matrix** for a master user — they have implicit full access
- The `isMasterUser: true` flag in `GET /api/permissions/user/:userId` tells the UI to skip rendering the matrix and show a "Master — Full Access" badge instead
- `PUT /api/permissions/user/:userId` returns `400` if you attempt to modify a master user's permissions

---

## 10. Empty State (New Users)

When creating a new user, all checkboxes should start **unchecked**. The backend creates users with zero grants. The permission matrix is always the source of truth — do not pre-fill defaults based on role.

---

## 11. Error Responses

| HTTP | Meaning | When |
|---|---|---|
| `401` | Not authenticated | No/invalid token |
| `403 "Master access required"` | Not a master | Non-master hit a master-only endpoint |
| `403 "Access denied"` + `required: {module, page?, action?}` | Missing permission grant | User lacks the specific grant |
| `403 "Permissions not loaded"` | `loadPermissions` not in middleware chain | Bug — should not happen in production |
| `400 "Cannot restrict master user permissions"` | Attempted to edit master's grants | Frontend should block this in UI |

---

## 12. Sidebar / Nav Guard Pattern

```tsx
// Recommended approach: compute accessible routes once after login

const accessibleRoutes = useMemo(() => {
  return SIDEBAR_ITEMS.filter(item =>
    canAccessModule(access, item.moduleKey)
  );
}, [access]);

// Then for sub-pages:
const accessiblePages = useMemo(() => {
  return PAGES_FOR_MODULE.filter(page =>
    canAccessPage(access, moduleKey, page.pageKey)
  );
}, [access, moduleKey]);
```

---

*Generated by Cascade — Enterprise Permission System v2.0*
