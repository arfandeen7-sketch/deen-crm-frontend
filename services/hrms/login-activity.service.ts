import { api, getData, postData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type { LoginActivity, Paginated } from "@/types";

export interface LoginActivityQuery {
  page?: number;
  pageSize?: number;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const loginActivityService = {
  recordLogin(): Promise<LoginActivity> {
    return postData<LoginActivity>("/login-activity/login", {});
  },
  recordLogout(): Promise<void> {
    return postData<void>("/login-activity/logout", {});
  },
  async list(params: LoginActivityQuery = {}): Promise<Paginated<LoginActivity>> {
    const res = await api.get<Paginated<LoginActivity>>(
      `/login-activity${buildQuery(params)}`,
    );
    return res.data;
  },
  activeSessions(userId?: string): Promise<LoginActivity[]> {
    const q = userId ? `?userId=${userId}` : "";
    return getData<LoginActivity[]>(`/login-activity/active${q}`);
  },
};
