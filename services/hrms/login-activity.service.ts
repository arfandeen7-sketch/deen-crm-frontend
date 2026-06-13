import { api, getData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type { LoginActivity, Paginated } from "@/types";

export interface LoginActivityQuery {
  page?: number;
  pageSize?: number;
  userId?: string;
  role?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const loginActivityService = {
  async list(params: LoginActivityQuery = {}): Promise<Paginated<LoginActivity>> {
    const res = await api.get<Paginated<LoginActivity>>(
      `/hrms/login-activity${buildQuery(params)}`,
    );
    return res.data;
  },
  get(id: string): Promise<LoginActivity> {
    return getData<LoginActivity>(`/hrms/login-activity/${id}`);
  },
  async export(params: LoginActivityQuery = {}): Promise<Blob> {
    const res = await api.get(`/hrms/login-activity/export${buildQuery(params)}`, {
      responseType: "blob",
    });
    return res.data as Blob;
  },
};
