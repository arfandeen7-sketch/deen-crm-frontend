# RBAC Smoke Test Checklist

Manual test matrix for verifying the RBAC UI adaptation across all phases.

## Test Users

- [ ] **Master user** — has all permissions via `isMaster: true`
- [ ] **Zero-grant non-master** — authenticated, no module/page/action grants
- [ ] **Single module view-only** — e.g. `leads:all_leads:view` only
- [ ] **View + selected actions** — e.g. `leads:all_leads:view + create + assign`
- [ ] **HR-only user** — `hrms:*:view` grants, no leads access
- [ ] **Sales executive** — `leads:all_leads:view` + `followup:*:view` only

## Phase 1 — Permission Lifecycle

- [ ] On login, `permissionStatus` transitions: `loading` → `ready`
- [ ] If permissions fail to load, status shows `error` and UI shows safe fallback
- [ ] Permissions refetch on browser focus (tab switch back)
- [ ] Permissions refetch on route navigation
- [ ] Permissions refetch every 5 minutes while tab is visible
- [ ] Demo token users get `isMaster: true` immediately

## Phase 2 — Authorization Manifest

- [ ] All route pages have a matching `ROUTE_REQUIREMENTS` entry
- [ ] All query hooks reference a valid `QUERY_REQUIREMENTS` key
- [ ] Self-service queries (`notifications`, `my-hr`, `my-team`) are in `SELF_SERVICE_QUERIES`
- [ ] `resolveRouteRequirement` correctly matches dynamic routes (e.g. `/leads/123` → `/leads/[id]`)

## Phase 3 — Route-Level Authorization

- [ ] Master user can access all routes
- [ ] Zero-grant user is redirected from protected routes to dashboard
- [ ] User with `leads:all_leads:view` can access `/leads` but not `/users`
- [ ] User with `leads:all_leads:view` but no `create` action is redirected from `/leads/create`
- [ ] Direct URL navigation to unauthorized route redirects silently
- [ ] `AccessGuard` shows loading state while permissions are loading (not a flash of content)

## Phase 4 — Query Gating

- [ ] Zero-grant user: no protected API requests are made (check Network tab)
- [ ] User with `leads:all_leads:view` only: leads list loads, but HRMS queries don't fire
- [ ] Polling stops when permissions are removed (e.g. `refetchInterval` becomes `false`)
- [ ] Polling resumes when permissions are granted
- [ ] 403 responses do not trigger retries (check Network tab — no repeated 403s)
- [ ] Self-service queries (notifications, my-attendance) fire for all authenticated users

## Phase 5 — Navigation & UI

- [ ] Sidebar shows only modules the user has access to
- [ ] Empty nav groups are hidden (e.g. no "HRMS" group for sales-only users)
- [ ] "My Team" link visible for all authenticated users (authenticated-only)
- [ ] "My HR" section visible for all authenticated users
- [ ] Dashboard renders correct variant based on module access (not role)
- [ ] No role-based checks remain in sidebar rendering

## Phase 6 — Silent 403 Recovery

- [ ] No toast notification appears on 403
- [ ] Multiple simultaneous 403s trigger only one permission refetch
- [ ] In-flight queries are cancelled on 403 (no cascading 403s in Network tab)
- [ ] User on `/leads` who loses access is silently redirected to `/dashboard/overview`
- [ ] User on `/my-hr/attendance` who gets a 403 is NOT redirected (self-service route)
- [ ] After 403 recovery, permissions are refreshed and UI updates accordingly

## Phase 7 — User Creation & Permission Matrix

- [ ] Creating a user with grants: both user and grants saved → success toast → redirect to `/users`
- [ ] Creating a user where grant save fails: amber warning banner with "Retry Save Permissions" button
- [ ] Retry button successfully saves grants on second attempt
- [ ] Editing own grants triggers permission refresh (live UI updates)
- [ ] Revoking own grants triggers permission refresh (UI adapts immediately)
- [ ] Zero-grant user can be created intentionally (no grants selected)
- [ ] PermissionMatrix shows "Master — Full Access" for master users

## Phase 8 — Backend Alignment

- [ ] Integration endpoints return 403 with `required` field when unauthorized
- [ ] Integration permissions appear in `/permissions/registry`
- [ ] Integration permissions can be assigned via permission matrix
- [ ] User with `integrations:all_integrations:view` only cannot trigger sync

## Phase 9 — Test Infrastructure

- [ ] `vitest` installed and configured
- [ ] `npm test` runs all test stubs
- [ ] `query-gate.test.ts` passes (useQueryEnabled, retrySkipAuth)
- [ ] `auth-manifest.test.ts` passes (manifest coverage, route resolution)
- [ ] `recovery.test.ts` passes (403 recovery behavior)

## Rollout Order

1. Deploy behind feature flag (if available)
2. Test with master user first
3. Test with zero-grant user
4. Test with partial-grant users (one per role archetype)
5. Test permission revocation while session is open
6. Test permission grant while session is open
7. Enable for all users
