"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Filter, Trash2, Phone, Building2, Handshake } from "lucide-react";
import { useNotifications, useNotificationMutations } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { getErrorMessage } from "@/services/api/client";
import { timeAgo } from "@/lib/utils";
import type { AppNotification, AssignmentNotificationLead } from "@/types";

function LeadCard({
  lead,
  onClick,
}: {
  lead: AssignmentNotificationLead;
  onClick: (leadId: string) => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(lead.id);
      }}
      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-left hover:border-zinc-300 hover:bg-zinc-50 transition-colors"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-semibold text-zinc-900">{lead.leadName}</p>
        <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
          {lead.serviceType}
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-4 text-xs text-zinc-400">
        <span className="flex items-center gap-1">
          <Phone className="h-3 w-3" /> {lead.mobileNumber}
        </span>
        <span className="truncate">{lead.source}</span>
        {lead.projectName && (
          <span className="flex items-center gap-1 truncate">
            <Building2 className="h-3 w-3" /> {lead.projectName}
          </span>
        )}
      </div>
    </button>
  );
}

function NotificationCard({
  notification,
  onRead,
}: {
  notification: AppNotification;
  onRead: (id: string, leadId?: string | null) => void;
}) {
  const showLeads =
    notification.type === "assignment" &&
    notification.leads &&
    notification.leads.length > 0;

  return (
    <div
      onClick={() => onRead(notification.id, notification.leadId)}
      className={`group relative border-b border-zinc-100 px-6 py-4 transition-colors cursor-pointer hover:bg-zinc-50 ${
        !notification.isRead ? "bg-amber-50/30" : "bg-white"
      }`}
    >
      <div className="flex items-start gap-4">
        {!notification.isRead && (
          <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500" />
        )}
        <div className={`flex-1 min-w-0 ${notification.isRead ? "pl-6" : ""}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-zinc-900 mb-1 flex items-center gap-1.5">
                {notification.type === "deal_closed" && (
                  <Handshake className="h-4 w-4 shrink-0 text-teal-600" />
                )}
                {notification.title}
              </h3>
              {notification.body && (
                <p className="text-sm text-zinc-600 leading-relaxed">
                  {notification.body}
                </p>
              )}

              {showLeads && (
                <div className="mt-3 space-y-2">
                  {notification.leads!.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onClick={(leadId) => onRead(notification.id, leadId)}
                    />
                  ))}
                </div>
              )}

              <p className="mt-2 text-xs font-medium text-zinc-400">
                {timeAgo(notification.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {notification.leadId && (
                <span className="text-xs font-medium text-zinc-400 bg-zinc-100 px-2 py-1 rounded">
                  Lead
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const { data: notifications, isLoading, error } = useNotifications(filter === "unread");
  const { markRead, markAllRead } = useNotificationMutations();

  async function handleRead(id: string, leadId?: string | null) {
    try {
      await markRead.mutateAsync(id);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
    if (leadId) {
      router.push(`/leads/${leadId}`);
    }
  }

  function handleMarkAllRead() {
    markAllRead.mutate(undefined, {
      onSuccess: () => toast.success("All notifications marked as read"),
      onError: (e) => toast.error(getErrorMessage(e)),
    });
  }

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-zinc-100 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
                <Bell className="h-6 w-6 text-zinc-700" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-zinc-900">Notifications</h1>
                <p className="mt-1 text-sm text-zinc-500">
                  {unreadCount > 0
                    ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                    : "All caught up!"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleMarkAllRead} loading={markAllRead.isPending}>
                  <CheckCheck className="h-4 w-4" />
                  Mark all as read
                </Button>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                filter === "all"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                filter === "unread"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
              <p className="mt-4 text-sm text-zinc-500">Loading notifications...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mx-auto rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-600">
                  Failed to load notifications
                </p>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && (!notifications || notifications.length === 0) && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mx-auto p-6">
                <Bell className="mx-auto h-12 w-12 text-zinc-300" />
                <p className="mt-4 text-sm font-semibold text-zinc-900">
                  {filter === "unread" ? "No unread notifications" : "No notifications yet"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {filter === "unread"
                    ? "You're all caught up!"
                    : "We'll notify you when something important happens"}
                </p>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && notifications && notifications.length > 0 && (
          <div className="border-x border-zinc-100">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onRead={handleRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
