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
    // Backend returns { data, total, page, pageSize, totalPages, meta } — which
    // already matches our Paginated<T> shape (see utils/pagination.paginatedResponse).
    return api
      .get<Paginated<AppNotification>>(`/notifications${buildQuery(params)}`)
      .then((res) => res.data);
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
