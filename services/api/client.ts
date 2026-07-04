import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios";
import { getStoredToken, useAuthStore } from "@/store/auth.store";
import { isDemoToken } from "@/services/auth/demo";
import type { ApiError } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const api: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { "Content-Type": "application/json" },
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
// On 403, refetch permissions and show toast.
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiError>) => {
    const status = error.response?.status;
    
    if (status === 401 && typeof window !== "undefined" && !isDemoToken(getStoredToken())) {
      useAuthStore.getState().clear();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    
    if (status === 403 && typeof window !== "undefined") {
      const { toast } = await import("sonner");
      window.dispatchEvent(new CustomEvent("permissions:refetch"));
      toast.error("You do not have permission to perform this action");
    }
    
    return Promise.reject(error);
  },
);

/** Normalise an axios error into a human-readable message. */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    return data?.error ?? error.message ?? "Request failed";
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
