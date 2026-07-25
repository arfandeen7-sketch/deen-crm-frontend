# Fine-Grained RBAC UI Adaptation Plan

## Objective

Make the frontend adapt to each signed-in user's explicit permission grants so that unauthorized UI is not rendered, protected API requests are not sent without access, and unexpected authorization failures recover silently instead of producing repeated toast errors.

## Confirmed Authorization Contract

- The authoritative access map comes from `GET /api/me/profile` (or `GET /api/permissions/me`) after login and during session refresh.
- The access map is computed from current database grants and is not embedded in the JWT.
- Non-master users receive access only from explicit grants; roles do not provide default permissions.
- A protected read requires the full module, page, and `view` action grant.
- `GET /api/permissions/registry` defines permission entities only. It does not map frontend routes or API operations to permissions.
- Authenticated self-service APIs remain available without matrix grants.
- Unauthorized direct or stale URLs must redirect silently to `/dashboard/overview`.
- `403.required` is helpful when present but is not guaranteed for every backend authorization denial.

## Phase 1: Permission Lifecycle and Readiness

### Goal

Separate authentication hydration from permission readiness so protected content and requests cannot start before the current access map is known.

### Work

1. Extend the permission context with explicit states:
   - `loading`: an authenticated user has no resolved access map yet.
   - `ready`: the current access map is available.
   - `error`: access loading failed after the controlled retry policy.
2. Keep the access map out of persisted client storage; fetch it from the server whenever the app starts an authenticated session.
3. Centralize permission refresh in one deduplicated function.
4. Refresh the access map:
   - Immediately after login.
   - On authenticated app bootstrap.
   - On browser focus.
   - On route navigation.
   - On a periodic timer while the browser tab is visible.
5. Avoid overlapping profile/access requests when several refresh triggers fire at once.
6. Detect meaningful access-map changes and clear or invalidate protected React Query cache entries.
7. Stop periodic refreshes when the user is unauthenticated or the browser tab is hidden.

### Acceptance Criteria

- Authenticated pages do not infer denial while permissions are still loading.
- Only one permission refresh runs at a time.
- Revoked access is reflected after the next client refresh trigger.
- Cached protected data is removed when the user loses the relevant access.

## Phase 2: Typed Frontend Authorization Manifest

### Goal

Create one maintainable frontend source of truth for permission requirements without assuming the backend registry defines route or API mappings.

### Work

1. Add a typed authorization manifest that defines:
   - Dashboard route requirements.
   - Page route requirements.
   - Dynamic detail/edit route requirements.
   - Dashboard-widget requirements.
   - Query/read requirements.
   - Mutation, export, import, and other action requirements.
   - Authenticated-only self-service capabilities.
2. Model protected reads with `view` actions, not module/page access alone.
3. Use the manifest from route guards, navigation, queries, and feature controls.
4. Remove the legacy role-based matrix from active authorization decisions for non-master users.
5. Add a developer checklist for adding a route, query, or action so each new capability is registered before use.

### Acceptance Criteria

- One permission requirement is reused consistently by the route, UI, and API query that implement a capability.
- Non-master role values never independently grant access in the frontend.
- Every protected screen and reusable feature has a defined requirement.

## Phase 3: Route-Level Authorization Boundaries

### Goal

Prevent an unauthorized page's hooks from mounting and starting requests.

### Work

1. Refactor current page guard usage into two layers:
   - An outer route authorization boundary that waits for permission readiness and validates access.
   - An inner page-content component that contains data hooks and mounts only after access is authorized.
2. Require the route's `view` action for data-driven pages.
3. For create/import/action-only routes, require the exact required action.
4. Redirect an unauthorized direct, bookmarked, or stale URL silently to `/dashboard/overview`.
5. Keep the dashboard layout responsible only for authentication; apply authorization at individual route boundaries.
6. Audit all dashboard routes, including nested detail, edit, import, reports, HRMS, users, brokers, teams, notifications, integrations, and dynamic-field routes.

### Acceptance Criteria

- Opening an unauthorized URL sends no protected page requests.
- An authorized route mounts normally after permissions become ready.
- An unauthorized or revoked route redirects without a toast.

## Phase 4: Permission-Gated React Query and Polling

### Goal

Ensure the server never receives a protected request the frontend already knows the user cannot make.

### Work

1. Update protected query hooks to accept authorization state or an explicit `enabled` input.
2. Set `enabled` only when all conditions are true:
   - Permission state is `ready`.
   - Required route/entity parameters are valid.
   - The access map grants the exact required `view` action.
3. Apply equivalent authorization checks to dependent lookup/dropdown requests.
4. Disable query retries for authorization denials.
5. Ensure polling queries do not start without access and stop immediately when access is removed.
6. Gate dashboard widgets independently so one inaccessible widget cannot request data or affect the rest of the dashboard.
7. Retain authenticated-only self-service queries outside matrix-grant gating.

### Acceptance Criteria

- A missing `view` action produces zero initial fetches, retries, refetches, and polls for the protected resource.
- Hidden assignment/import/export UI does not trigger its supporting lookup requests.
- Revoking access stops future polls and removes stale data.

## Phase 5: Permission-Adaptive Navigation and UI

### Goal

Render only features the user can access, producing a coherent UI instead of a sequence of denied actions.

### Work

1. Update navigation configuration so protected destinations require their actual `view` or action requirement.
2. Hide navigation items and groups with no accessible child destinations.
3. Keep the dashboard as the reliable safe destination.
4. Apply manifest-driven checks to:
   - Tabs and sub-navigation.
   - Dashboard cards, metrics, charts, and quick actions.
   - Page headers and toolbar buttons.
   - Table columns/actions, bulk actions, and context menus.
   - Detail-page sections and controls.
   - Forms, import/export entry points, and integration controls.
5. Guard action handlers in addition to hiding their controls, protecting against stale UI after access changes.
6. Provide an intentional minimal dashboard for users with zero grants.

### Acceptance Criteria

- Navigation, widgets, buttons, actions, and data sections match the current access map.
- No page exposes an affordance that is known to require an absent permission.
- A zero-grant user has a stable, usable landing experience without protected data calls.

## Phase 6: Silent `403` Recovery

### Goal

Treat `403` as an exceptional stale-state or backend-mapping recovery case, not normal UI feedback.

### Work

1. Remove global permission-denied toast behavior from the Axios response interceptor.
2. On unexpected `403`:
   - Deduplicate a single access-map refresh.
   - Identify and cancel/remove affected protected queries.
   - Prevent authorization retries.
   - Re-evaluate current route access.
   - Redirect silently to `/dashboard/overview` if the route is no longer permitted.
3. Handle `403` responses with and without `required` uniformly; never depend on `required` being present.
4. Preserve normal error handling for non-authorization failures.
5. Preserve the existing `401` session-clear and login-redirect behavior.
6. For user-initiated mutations that receive an unexpected `403`, refresh the UI and use non-repeating contextual feedback only if needed; do not use a global toast storm.

### Acceptance Criteria

- Repeated `403` responses never cause repeated permission-refresh calls or toast messages.
- A permission change detected by a `403` converges the UI to the refreshed access map.
- `401` remains distinct from authorization handling.

## Phase 7: User Creation and Permission Matrix Reliability

### Goal

Ensure the master's matrix selections result in the intended user access without ambiguous partial success.

### Work

1. Preserve the existing module/page/action selection model and parent-grant generation.
2. Treat user creation and grant persistence as a coordinated workflow.
3. If user creation succeeds but saving grants fails:
   - Clearly state that the user was created with no confirmed permissions.
   - Provide an immediate retry path to save the intended grants.
   - Do not report the workflow as fully successful.
4. When the currently signed-in user's grants are edited, invoke the centralized permission refresh path.
5. Verify the matrix supports zero-grant users intentionally.

### Acceptance Criteria

- The master can distinguish full success from user-created/grants-failed partial success.
- A user receives exactly the explicit grants chosen in the matrix.
- Editing the current user's grants updates the live UI after refresh.

## Phase 8: Backend Alignment

### Goal

Close backend gaps that prevent the frontend from enforcing a consistent access model.

### Required Work

1. Protect integration routes with the relevant permission middleware.
2. Define exact integration permissions for:
   - Viewing integrations.
   - Connecting providers.
   - Editing configuration.
   - Triggering sync/health actions.
   - Destructive operations.
3. Return the established authorization response format when the route uses module/page/action middleware.
4. Confirm every new protected endpoint has a corresponding frontend authorization-manifest entry.

### Recommended Future Work

1. Expose a versioned backend capability contract that maps route/capability identifiers to required permissions.
2. Include an authorization version or ETag so clients can refresh only when permissions change.
3. Consider push invalidation if immediate open-session permission changes become a product requirement.

### Acceptance Criteria

- Integration access follows the same permission matrix as the rest of the product.
- New protected backend functionality cannot silently bypass the frontend authorization model.

## Phase 9: Test and Rollout Strategy

### Automated Tests

1. Permission provider state transitions and refresh deduplication.
2. Unauthorized routes redirect without mounting their query components.
3. Missing `view` action results in zero protected requests.
4. Polling stops after permission removal.
5. Navigation and UI affordances match representative partial-grant maps.
6. A page grant without `view` does not authorize its protected data query.
7. Multiple simultaneous `403` responses trigger one refresh and no toast storm.
8. `403` responses without `required` recover safely.
9. User creation/grant-save partial failures are visible and recoverable.
10. Integration authorization coverage after backend middleware is added.

### Manual Smoke-Test Matrix

Test at minimum:

- Master user.
- Zero-grant non-master user.
- User with one module/page/`view` grant.
- User with `view` plus selected actions only.
- User whose permission is revoked while the app is open.
- User whose permissions are granted while the app is open.
- User navigating directly to an unauthorized route.
- User with notification access absent while notification polling is configured.

### Rollout Order

1. Phase 1 and Phase 2 foundations.
2. Phase 3 route boundaries.
3. Phase 4 query/polling gating.
4. Phase 5 UI adaptation.
5. Phase 6 `403` recovery.
6. Phase 7 creation/matrix reliability.
7. Phase 8 backend integration protection.
8. Phase 9 full regression testing and staged release.

## Definition of Done

The work is complete when:

- The UI renders only capabilities granted by the current access map.
- Unauthorized routes redirect silently.
- The frontend does not make protected API requests without the matching action permission.
- Polling, retries, and dependent requests are disabled for inaccessible features.
- Permission changes converge in open sessions through refresh triggers and unexpected-denial recovery.
- `403` responses do not spam the user with toast errors.
- Integration endpoints follow the same RBAC enforcement model as the rest of the backend.
