import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios";
import { getStoredRefreshToken, getStoredToken, useAuthStore } from "@/store/auth.store";
import { isDemoToken } from "@/services/auth/demo";
import type { ApiError } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const api: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
});

// Attach Bearer token from the auth store on every request.
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear session and bounce to login (client-side only).
// On 403, silently refetch permissions, cancel queries, and redirect if needed.
let isRefreshingPermissions = false;
let refreshPromise: Promise<string | null> | null = null;

type RetryableAxiosRequestConfig = AxiosRequestConfig & { _retry?: boolean };

function clearSessionAndRedirect(): void {
  useAuthStore.getState().clear();
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();
  const user = useAuthStore.getState().user;
  if (!refreshToken || !user) return null;

  try {
    // Use the base axios client to avoid recursive interceptor loops.
    const res = await axios.post<{ data: { token: string; refreshToken?: string } }>(
      `${BASE_URL}/api/auth/refresh`,
      { refreshToken },
    );
    const nextToken = res.data.data.token;
    const nextRefreshToken = res.data.data.refreshToken ?? refreshToken;
    useAuthStore.getState().setAuth(nextToken, user, nextRefreshToken);
    return nextToken;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiError>) => {
    const status = error.response?.status;
    const currentToken = getStoredToken();
    const originalRequest = error.config as RetryableAxiosRequestConfig | undefined;
    const requestUrl = String(originalRequest?.url ?? "");

    if (status === 401 && typeof window !== "undefined" && !isDemoToken(currentToken)) {
      // Never retry login/refresh endpoints and never re-retry the same request.
      if (requestUrl.includes("/auth/login") || requestUrl.includes("/auth/refresh") || originalRequest?._retry) {
        clearSessionAndRedirect();
        return Promise.reject(error);
      }

      if (originalRequest) originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const nextToken = await refreshPromise;
      if (nextToken && originalRequest) {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${nextToken}`;
        return api(originalRequest);
      }

      clearSessionAndRedirect();
    }

    if (status === 403 && typeof window !== "undefined") {
      // Cancel all in-flight React Query requests so stale 403s don't cascade.
      window.dispatchEvent(new CustomEvent("query:cancel-all"));

      // Dedup: only one permission refetch at a time.
      if (!isRefreshingPermissions) {
        isRefreshingPermissions = true;
        window.dispatchEvent(new CustomEvent("permissions:refetch"));
        // Reset the flag after a short cooldown to allow future refreshes.
        setTimeout(() => { isRefreshingPermissions = false; }, 3000);
      }

      // Silent redirect: if the user is on a protected page they can no longer
      // access, send them to the dashboard overview instead of showing an error.
      const pathname = window.location.pathname;
      const isProtectedRoute =
        pathname.startsWith("/leads") ||
        pathname.startsWith("/brokers") ||
        pathname.startsWith("/clients") ||
        pathname.startsWith("/users") ||
        pathname.startsWith("/hrms") ||
        pathname.startsWith("/teams") ||
        pathname.startsWith("/integrations") ||
        pathname.startsWith("/dynamic-fields") ||
        pathname.startsWith("/followup") ||
        pathname.startsWith("/activity") ||
        pathname.startsWith("/properties") ||
        pathname.startsWith("/property-submissions") ||
        pathname.startsWith("/owners") ||
        pathname.startsWith("/bellaviu-clients");

      if (isProtectedRoute) {
        window.location.href = "/dashboard/overview";
      }
    }

    return Promise.reject(error);
  },
);

/** Normalise an axios error into a human-readable message. */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    return data?.error ?? data?.message ?? error.message ?? "Request failed";
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

// Helpers that unwrap the backend `{ data }` envelope.
export async function getData<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await api.get<{ data: T }>(url, config);
  return res.data.data;
}

export async function postData<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await api.post<{ data: T }>(url, body, config);
  return res.data.data;
}

export async function putData<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await api.put<{ data: T }>(url, body, config);
  return res.data.data;
}

export async function patchData<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await api.patch<{ data: T }>(url, body, config);
  return res.data.data;
}

export async function deleteData<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await api.delete<{ data: T }>(url, config);
  return res.data.data;
}

/**
 * Appends the current bearer token as a query param for browser-opened links
 * (e.g. `<a target="_blank">`) where custom Authorization headers are not
 * available. Used only for authenticated file-serving endpoints.
 */
export function withAccessToken(url: string): string {
  const token = getStoredToken();
  if (!token) return url;
  try {
    const parsed = new URL(url, BASE_URL);
    parsed.searchParams.set('access_token', token);
    return parsed.toString();
  } catch {
    return url;
  }
}
