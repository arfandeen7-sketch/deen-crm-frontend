"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BellRing, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import type { AppNotification } from "@/types";

/** How long the popup stays on screen (milliseconds). */
const POPUP_DURATION_MS = 15_000;

/** Only treat notifications created within this window as "fresh" popups,
 * so a page reload doesn't re-trigger a popup for an old reminder. */
const FRESH_WINDOW_MS = 90_000;

interface ActivePopup {
  id: string;
  title: string;
  body: string | null;
}

function isAtTimeTodoReminder(n: AppNotification): boolean {
  if (n.type !== "todo_reminder") return false;
  const meta = n.metadata as { kind?: string } | null;
  return meta?.kind === "at";
}

/**
 * Watches the polled notifications list and shows a prominent popup for
 * "at-time" todo reminders (the one fired exactly at the scheduled reminder
 * time). The 10-minutes-before reminder is delivered as a normal notification
 * only — no popup.
 *
 * Notifications are user-scoped on the backend (filtered by userId), so this
 * popup is only ever shown to the user who set the reminder. The Master only
 * sees popups for tasks in their own To-Do list.
 *
 * Rendered via a portal at document.body so it sits above all other UI.
 */
export function TodoReminderPopup() {
  const { data: notifications = [] } = useNotifications();
  const [active, setActive] = useState<ActivePopup | null>(null);
  const shownIds = useRef<Set<string>>(new Set());
  const seeded = useRef(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Seed the seen set with whatever is already loaded on first non-empty load,
  // so we never pop a notification that existed before this component mounted
  // (e.g. after a page reload).
  useEffect(() => {
    if (seeded.current || notifications.length === 0) return;
    seeded.current = true;
    for (const n of notifications) {
      if (isAtTimeTodoReminder(n)) shownIds.current.add(n.id);
    }
  }, [notifications]);

  // Watch for newly-arrived at-time todo reminders.
  useEffect(() => {
    if (!notifications.length) return;
    const now = Date.now();
    const fresh = notifications.find((n) => {
      if (!isAtTimeTodoReminder(n)) return false;
      if (shownIds.current.has(n.id)) return false;
      const age = now - new Date(n.createdAt).getTime();
      return age >= 0 && age <= FRESH_WINDOW_MS;
    });

    if (fresh) {
      shownIds.current.add(fresh.id);
      setActive({
        id: fresh.id,
        title: fresh.title,
        body: fresh.body,
      });
    }
  }, [notifications]);

  // Auto-dismiss after POPUP_DURATION_MS.
  useEffect(() => {
    if (!active) return;
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(() => {
      setActive(null);
    }, POPUP_DURATION_MS);
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [active]);

  function dismiss() {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setActive(null);
  }

  if (!active || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-x-0 top-4 z-[90] flex justify-center px-4 pointer-events-none">
      <div
        role="alert"
        aria-live="assertive"
        className={cn(
          "pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-2xl",
          "animate-in fade-in slide-in-from-top-4 zoom-in-95 duration-200",
        )}
      >
        {/* Accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />

        <div className="flex items-start gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100">
            <BellRing className="h-5 w-5 text-violet-600" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-zinc-900">{active.title}</p>
            {active.body && (
              <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                {active.body}
              </p>
            )}
            <p className="mt-2 text-[11px] font-medium text-zinc-400">
              Task reminder · auto-dismisses in {POPUP_DURATION_MS / 1000}s
            </p>
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 cursor-pointer"
            aria-label="Dismiss reminder"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Countdown progress bar */}
        <CountdownBar durationMs={POPUP_DURATION_MS} />
      </div>
    </div>,
    document.body,
  );
}

function CountdownBar({ durationMs }: { durationMs: number }) {
  const [remaining, setRemaining] = useState(durationMs);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      setRemaining(Math.max(0, durationMs - elapsed));
    }, 100);
    return () => clearInterval(interval);
  }, [durationMs]);

  const pct = (remaining / durationMs) * 100;
  return (
    <div className="h-0.5 w-full bg-zinc-100">
      <div
        className="h-full bg-violet-500 transition-[width] duration-100 ease-linear"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
