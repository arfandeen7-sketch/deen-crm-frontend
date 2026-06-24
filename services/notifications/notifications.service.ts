import { getData, patchData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type { AppNotification, Paginated } from "@/types";

export interface NotificationQuery {
  page?: number;
  pageSize?: number;
  unread?: boolean;
}

export const notificationsService = {
  list(params: NotificationQuery = {}): Promise<Paginated<AppNotification>> {
    return getData<Paginated<AppNotification>>(`/notifications${buildQuery(params)}`);
  },

  unreadCount(): Promise<{ count: number }> {
    return getData<{ count: number }>("/notifications/unread-count");
  },

  markRead(id: string): Promise<AppNotification> {
    return patchData<AppNotification>(`/notifications/${id}/read`);
  },

  markAllRead(): Promise<{ updated: number }> {
    return patchData<{ updated: number }>("/notifications/read-all");
  },
};
