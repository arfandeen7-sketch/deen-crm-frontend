# DEEN Properties CRM — Frontend

Enterprise lead-management CRM for DEEN Properties. Built with **Next.js 16 (App Router)**, **TypeScript**, **TanStack Query**, **Zustand**, **React Hook Form + Zod**, and **Tailwind CSS v4**. It consumes the companion `deen-crm-backend` Express API.

## Prerequisites

- Node.js 20+
- The backend API running (locally on `http://localhost:3001` or a Railway domain)

## Environment

Create `.env.local` (see `.env.example`):

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

The frontend calls `${NEXT_PUBLIC_API_URL}/api/...` and authenticates with the Supabase JWT returned by `POST /api/auth/login`.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated users are redirected to `/login`.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Lint |

## Architecture

```
app/                     # App Router routes
  (auth)/login           # Public login
  (dashboard)/           # Authenticated shell (sidebar + header, ProtectedRoute)
    dashboard/overview   # Dashboard widgets
    leads, followup, brokers, hr, attendance, users, dynamic-fields, settings
components/              # ui/, layout/, tables/, charts/, forms/, shared/, leads/, followup/, dashboard/
services/                # axios client + per-module API services
hooks/                   # TanStack Query hooks per module + useAuth
store/                   # Zustand stores (auth, lead filters)
schemas/                 # Zod validation schemas
lib/                     # utils, rbac
constants/  types/  providers/
```

### Auth & RBAC

- JWT + user profile persisted in a Zustand store; axios attaches `Authorization: Bearer <token>` and redirects to `/login` on `401`.
- `ProtectedRoute` guards the dashboard route group; `RoleGuard` + `lib/rbac.ts` mirror the backend role matrix (`master`, `sales_manager`, `sales_executive`).

### Notes for Next.js 16

- Route `params`/`searchParams` are Promises; client pages read them via `useParams()`.
- Edge middleware is now `proxy.ts` (not used here — auth is client-side since the token lives in the browser).

## Deploy on Vercel

Set `NEXT_PUBLIC_API_URL` to your backend's public domain in the Vercel project environment variables, then deploy. See the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying).
