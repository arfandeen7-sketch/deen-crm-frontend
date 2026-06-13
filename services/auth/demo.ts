import type { AuthResponse, User } from "@/types";

/**
 * Demo / sample login support.
 *
 * Lets you sign in to the CRM UI without a running backend using a fixed
 * sample credential. Enabled by default; disable by setting
 * `NEXT_PUBLIC_DEMO_AUTH=false` in `.env.local` for real-backend-only auth.
 */
export const DEMO_AUTH_ENABLED = process.env.NEXT_PUBLIC_DEMO_AUTH !== "false";

export const DEMO_CREDENTIALS = {
  email: "admin@gmail.com",
  password: "Admin@123",
};

/** Sentinel token used to recognise a demo session. */
export const DEMO_TOKEN = "demo-session-token";

const timestamp = new Date().toISOString();

export const DEMO_USER: User = {
  id: "demo-master-user",
  fullName: "Demo Admin",
  email: DEMO_CREDENTIALS.email,
  phone: null,
  role: "master",
  isActive: true,
  createdAt: timestamp,
  updatedAt: timestamp,
};

/** Returns true when the stored token belongs to a demo session. */
export function isDemoToken(token: string | null | undefined): boolean {
  return token === DEMO_TOKEN;
}

/**
 * Attempts a demo login. Returns a mock auth response when demo mode is on and
 * the sample credentials match, otherwise `null` so the real API is used.
 */
export function tryDemoLogin(email: string, password: string): AuthResponse | null {
  if (!DEMO_AUTH_ENABLED) return null;
  const matches =
    email.trim().toLowerCase() === DEMO_CREDENTIALS.email &&
    password === DEMO_CREDENTIALS.password;
  return matches ? { token: DEMO_TOKEN, user: DEMO_USER } : null;
}
