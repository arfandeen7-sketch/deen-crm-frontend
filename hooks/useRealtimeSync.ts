"use client";

/**
 * useRealtimeSync — Server-Sent Events (SSE) hook for instant cross-user updates.
 *
 * HOW IT WORKS
 * ─────────────
 * The server opens a persistent HTTP stream to the browser. When any user
 * performs an action (assign lead, update status, etc.), the backend emits a
 * typed event on that stream. This hook listens for those events and immediately
 * invalidates the relevant TanStack Query caches — no polling delay.
 *
 * BACKEND REQUIREMENT
 * ─────────────────────
 * A new endpoint must be added to the Express backend:
 *
 *   GET /api/events
 *   Auth: Bearer token passed as ?token=<jwt> query param (EventSource doesn't
 *         support custom headers, so the token must be a query param or cookie).
 *   Response: text/event-stream, keep-alive
 *
 * Minimal event shape:
 *   data: {"type":"lead_updated","payload":{"leadId":"..."}}
 *   data: {"type":"lead_assigned","payload":{"leadId":"..."}}
 *   data: {"type":"lead_status_changed","payload":{"leadId":"..."}}
 *   data: {"type":"followup_updated","payload":{}}
 *   data: {"type":"dashboard_changed","payload":{}}
 *   data: {"type":"notification","payload":{}}
 *   data: {"type":"attendance_updated","payload":{}}
 *   data: {"type":"leave_updated","payload":{}}
 *   data: {"type":"user_updated","payload":{}}
 *   data: {"type":"broker_updated","payload":{}}
 *
 * HOW TO ACTIVATE
 * ─────────────────
 * Once the backend is ready, mount this hook in providers/index.tsx:
 *
 *   import { useRealtimeSync } from "@/hooks/useRealtimeSync";
 *   // Inside <Providers>:
 *   function RealtimeSyncMount() { useRealtimeSync(); return null; }
 *   // Then add <RealtimeSyncMount /> inside the provider tree.
 *
 * Until then, the hook is a no-op when NEXT_PUBLIC_SSE_ENABLED is not "true".
 */

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";

type SseEventType =
  | "lead_updated"
  | "lead_assigned"
  | "lead_status_changed"
  | "lead_created"
  | "lead_deleted"
  | "followup_updated"
  | "dashboard_changed"
  | "notification"
  | "attendance_updated"
  | "leave_updated"
  | "user_updated"
  | "broker_updated"
  | "team_updated"
  | "employee_updated";

interface SseEvent {
  type: SseEventType;
  payload?: Record<string, unknown>;
}

const SSE_ENABLED = process.env.NEXT_PUBLIC_SSE_ENABLED === "true";
const SSE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/events`
  : "/api/events";

const RECONNECT_DELAY_MS = 5_000;

export function useRealtimeSync() {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!SSE_ENABLED || !token) return;

    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let destroyed = false;

    function connect() {
      if (destroyed) return;

      es = new EventSource(`${SSE_URL}?token=${encodeURIComponent(token as string)}`);

      es.onmessage = (e: MessageEvent) => {
        try {
          const event: SseEvent = JSON.parse(e.data as string);
          handleEvent(event);
        } catch {
          // ignore malformed frames
        }
      };

      es.onerror = () => {
        es?.close();
        es = null;
        if (!destroyed) {
          reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
        }
      };
    }

    function handleEvent(event: SseEvent) {
      switch (event.type) {
        case "lead_updated":
        case "lead_assigned":
        case "lead_status_changed":
        case "lead_created":
        case "lead_deleted":
          qc.invalidateQueries({ queryKey: ["leads"] });
          qc.invalidateQueries({ queryKey: ["dashboard"] });
          qc.invalidateQueries({ queryKey: ["followup"] });
          break;

        case "followup_updated":
          qc.invalidateQueries({ queryKey: ["followup"] });
          qc.invalidateQueries({ queryKey: ["dashboard"] });
          break;

        case "dashboard_changed":
          qc.invalidateQueries({ queryKey: ["dashboard"] });
          break;

        case "notification":
          qc.invalidateQueries({ queryKey: ["notifications"] });
          break;

        case "attendance_updated":
          qc.invalidateQueries({ queryKey: ["attendance"] });
          break;

        case "leave_updated":
          qc.invalidateQueries({ queryKey: ["leave"] });
          break;

        case "user_updated":
          qc.invalidateQueries({ queryKey: ["users"] });
          qc.invalidateQueries({ queryKey: ["teams"] });
          break;

        case "broker_updated":
          qc.invalidateQueries({ queryKey: ["brokers"] });
          break;

        case "team_updated":
          qc.invalidateQueries({ queryKey: ["teams"] });
          qc.invalidateQueries({ queryKey: ["users"] });
          break;

        case "employee_updated":
          qc.invalidateQueries({ queryKey: ["employees"] });
          break;

        default:
          break;
      }
    }

    connect();

    return () => {
      destroyed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      es?.close();
    };
  }, [token, qc]);
}
