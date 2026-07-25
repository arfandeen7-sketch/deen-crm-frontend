"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Phone, Building2 } from "lucide-react";
import { useUnreadCount, useNotifications, useNotificationMutations } from "@/hooks/useNotifications";
import { timeAgo } from "@/lib/utils";
import type { AppNotification, AssignmentNotificationLead } from "@/types";

function LeadChip({
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
      className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-left hover:border-zinc-300 hover:bg-zinc-50 transition-colors"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-semibold text-zinc-900">{lead.leadName}</p>
        <span className="shrink-0 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
          {lead.serviceType}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-3 text-[10px] text-zinc-400">
        <span className="flex items-center gap-0.5">
          <Phone className="h-2.5 w-2.5" /> {lead.mobileNumber}
        </span>
        <span className="truncate">{lead.source}</span>
        {lead.projectName && (
          <span className="flex items-center gap-0.5 truncate">
            <Building2 className="h-2.5 w-2.5" /> {lead.projectName}
          </span>
        )}
      </div>
    </button>
  );
}

function NotificationRow({
  n,
  onRead,
}: {
  n: AppNotification;
  onRead: (id: string, leadId?: string | null) => void;
}) {
  const showLeads = n.type === "assignment" && n.leads && n.leads.length > 0;

  return (
    <div
      onClick={() => onRead(n.id, n.leadId)}
      className={`w-full cursor-pointer px-4 py-3 text-left hover:bg-zinc-50 transition-colors ${!n.isRead ? "bg-amber-50/50" : ""}`}
    >
      <div className="flex items-start gap-2.5">
        {!n.isRead && (
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
        )}
        <div className={`min-w-0 flex-1 ${n.isRead ? "pl-4" : ""}`}>
          <p className="truncate text-sm font-semibold text-zinc-900">{n.title}</p>
          {n.body && (
            <p className="mt-0.5 text-xs text-zinc-500 line-clamp-2">{n.body}</p>
          )}

          {showLeads && (
            <div className="mt-2 space-y-1.5">
              {n.leads!.map((lead) => (
                <LeadChip
                  key={lead.id}
                  lead={lead}
                  onClick={(leadId) => onRead(n.id, leadId)}
                />
              ))}
            </div>
          )}

          <p className="mt-1 text-[11px] font-medium text-zinc-400">{timeAgo(n.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const badgeCount = useUnreadCount();
  const { data: notifications, isLoading, error } = useNotifications();
  const { markRead, markAllRead } = useNotificationMutations();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleRead(id: string, leadId?: string | null) {
    await markRead.mutateAsync(id);
    setOpen(false);
    if (leadId) router.push(`/leads/${leadId}`);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-2xl border border-zinc-200 bg-white p-3.5 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 transition-colors shadow-sm cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="h-5.5 w-5.5" />
        {badgeCount > 0 && (
          <span className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg shadow-zinc-200/50">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-900">Notifications</h3>
              {badgeCount > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  {badgeCount} unread
                </span>
              )}
            </div>
            {badgeCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-zinc-900 transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="h-3.5 w-3.5" /> All read
              </button>
            )}
          </div>

          <div className="max-h-[420px] divide-y divide-zinc-100 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200">
            {isLoading && (
              <p className="px-4 py-6 text-center text-sm text-zinc-500">Loading…</p>
            )}
            {error && (
              <p className="px-4 py-6 text-center text-sm font-medium text-rose-500">
                Failed to load notifications
              </p>
            )}
            {!isLoading && !error && (!notifications || notifications.length === 0) && (
              <p className="px-4 py-6 text-center text-sm text-zinc-500">
                No notifications yet 🎉
              </p>
            )}
            {notifications?.map((n) => (
              <NotificationRow key={n.id} n={n} onRead={handleRead} />
            ))}
          </div>

          <div className="border-t border-zinc-100 px-4 py-2.5">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
