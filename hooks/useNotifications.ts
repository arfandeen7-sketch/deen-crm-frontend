"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsService } from "@/services/notifications/notifications.service";
import type { AppNotification } from "@/types";
import { POLL_FAST } from "@/constants";

/** Badge count — polls on POLL_FAST interval. */
export function useUnreadCount(): number {
  const { data } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => notificationsService.unreadCount(),
    refetchInterval: POLL_FAST,
    staleTime: POLL_FAST,
  });
  return data?.count ?? 0;
}

/** Paginated notifications list — used inside the NotificationCenter panel. */
export function useNotifications(unreadOnly = false) {
  return useQuery<AppNotification[]>({
    queryKey: ["notifications", "list", { unreadOnly }],
    queryFn: async () => {
      const res = await notificationsService.list({ pageSize: 20, unread: unreadOnly || undefined });
      return res.data;
    },
    staleTime: POLL_FAST,
    refetchInterval: POLL_FAST,
    retry: 1,
  });
}

/** Mutations: mark one or all as read. */
export function useNotificationMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: invalidate,
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: invalidate,
  });

  return { markRead, markAllRead };
}
