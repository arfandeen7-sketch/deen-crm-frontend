# Backend Alignment — RBAC Integration Requirements

This document describes the backend work required to close gaps that prevent
the frontend from enforcing a consistent access model.

## 1. Integration Route Protection

All integration endpoints must be protected with the same module/page/action
permission middleware used across the rest of the backend.

### Required Permission Mapping

| Endpoint | Module | Page | Action |
|---|---|---|---|
| `GET /integrations` | `integrations` | `all_integrations` | `view` |
| `GET /integrations/:id` | `integrations` | `all_integrations` | `view` |
| `GET /integrations/dashboard` | `integrations` | `all_integrations` | `view` |
| `POST /integrations/connect` | `integrations` | `all_integrations` | `connect` |
| `POST /integrations/:id/discover-accounts` | `integrations` | `all_integrations` | `edit` |
| `POST /integrations/:id/select-accounts` | `integrations` | `all_integrations` | `edit` |
| `POST /integrations/:id/discover-forms` | `integrations` | `all_integrations` | `edit` |
| `POST /integrations/:id/sync` | `integrations` | `all_integrations` | `sync` |
| `POST /integrations/:id/health-report` | `integrations` | `all_integrations` | `health` |
| `POST /integrations/:id/replay-webhook` | `integrations` | `all_integrations` | `edit` |
| `DELETE /integrations/:id` | `integrations` | `all_integrations` | `disconnect` |

### Authorization Response Format

All protected endpoints must return the standard 403 response:

```json
{
  "error": "Forbidden",
  "required": {
    "module": "integrations",
    "page": "all_integrations",
    "action": "view"
  }
}
```

## 2. Frontend Manifest Coverage

Every new protected backend endpoint must have a corresponding entry in:
- `lib/auth-manifest.ts` → `QUERY_REQUIREMENTS` (for read operations)
- `lib/auth-manifest.ts` → `ACTION_REQUIREMENTS` (for mutations)
- `lib/auth-manifest.ts` → `ROUTE_REQUIREMENTS` (for page routes)

The current manifest already covers all integration endpoints listed above.

## 3. Recommended Future Work

1. **Versioned capability contract**: Expose a backend endpoint that maps
   route/capability identifiers to required permissions, so the frontend can
   validate its manifest against the backend at build time.

2. **Authorization ETag**: Include an authorization version or ETag in the
   `/me/profile` response so clients only refetch permissions when they change.

3. **Push invalidation**: Consider WebSocket or SSE push for immediate
   permission invalidation in open sessions if real-time revocation becomes a
   product requirement.

## 4. Verification Checklist

- [ ] All integration routes return 403 with `required` field when unauthorized
- [ ] Integration permissions appear in the `/permissions/registry` response
- [ ] Integration permissions can be assigned via the permission matrix
- [ ] A user with `integrations:all_integrations:view` only cannot trigger sync
- [ ] A user with `integrations:all_integrations:sync` can trigger sync
- [ ] Master users bypass all integration permission checks
