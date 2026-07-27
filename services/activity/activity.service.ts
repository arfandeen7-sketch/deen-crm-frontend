import { api, getData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type {
  ActivityEvent,
  ActivityListParams,
  ActivityListResponse,
  ActivityFilterMeta,
} from "@/types";

export const activityService = {
  async list(params: ActivityListParams = {}): Promise<ActivityListResponse> {
    const res = await api.get<ActivityListResponse>(
      `/activity${buildQuery(params)}`,
    );
    return res.data;
  },

  getById(id: string): Promise<ActivityEvent> {
    return getData<ActivityEvent>(`/activity/${id}`);
  },

  filterMeta(): Promise<ActivityFilterMeta> {
    return getData<ActivityFilterMeta>("/activity/filters/meta");
  },

  exportCsvUrl(params: ActivityListParams): string {
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    return `${BASE_URL}/api/activity/export${buildQuery(params)}`;
  },
};
