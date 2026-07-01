import { getData, patchData, api } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type { AppNotification, Paginated } from "@/types";

export interface NotificationQuery {
  page?: number;
  pageSize?: number;
  unread?: boolean;
}

export const notificationsService = {
  list(params: NotificationQuery = {}): Promise<Paginated<AppNotification>> {
    // API returns { data: [...], pagination: { page, pageSize, total, totalPages } }
    // We need to flatten this to match our Paginated<T> type
    return api.get<{ data: AppNotification[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>(
      `/notifications${buildQuery(params)}`
    ).then((res: { data: { data: AppNotification[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } } }) => ({
      data: res.data.data,
      ...res.data.pagination,
    }));
  },

  unreadCount(): Promise<{ count: number }> {
    return getData<{ count: number }>("/notifications/unread-count");
  },

  markRead(id: string): Promise<AppNotification> {
    return patchData<AppNotification>(`/notifications/${id}/read`, {});
  },

  markAllRead(): Promise<{ updated: number }> {
    return patchData<{ updated: number }>("/notifications/read-all", {});
  },
};
