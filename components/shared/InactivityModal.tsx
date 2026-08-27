"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

/** Seconds of grace period shown in the popup before auto-logout. */
const AUTO_LOGOUT_SECONDS = 60;

/** Radius of the SVG countdown ring (must match the SVG attrs below). */
const RING_RADIUS = 22;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface InactivityModalProps {
  open: boolean;
  /** Called when the user clicks "Stay" or presses Enter (auto-focused). */
  onStay: () => void;
  /** Called when the user clicks "Leave" or the countdown reaches zero. */
  onLeave: () => void;
}

/**
 * Shown after 30 minutes of inactivity.
 *
 * Displays a circular countdown ring and auto-logs the user out when it
 * reaches zero, unless they click "Stay logged in" first.
 *
 * Rendered via a portal at document.body so it always sits above all other UI.
 */
export function InactivityModal({ open, onStay, onLeave }: InactivityModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(AUTO_LOGOUT_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset and start the countdown whenever the modal opens.
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (!open) {
      setSecondsLeft(AUTO_LOGOUT_SECONDS);
      return;
    }

    setSecondsLeft(AUTO_LOGOUT_SECONDS);

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          onLeave();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // onLeave is stable (wrapped in useCallback in AppShell) — intentionally omitted
    // from deps to avoid restarting the countdown on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const progress = secondsLeft / AUTO_LOGOUT_SECONDS;
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);
  const isUrgent = secondsLeft <= 15;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-neutral-950/60 backdrop-blur-sm" />

      {/* Dialog card */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="inactivity-title"
        aria-describedby="inactivity-desc"
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-2xl animate-in zoom-in-95 duration-150"
      >
        {/* Body */}
        <div className="flex flex-col items-center px-6 pt-8 pb-6 text-center">
          {/* Circular countdown ring */}
          <div className="relative mb-5 flex h-16 w-16 items-center justify-center">
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              className="-rotate-90"
              aria-hidden="true"
            >
              {/* Track */}
              <circle
                cx="32"
                cy="32"
                r={RING_RADIUS}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="4"
              />
              {/* Animated arc */}
              <circle
                cx="32"
                cy="32"
                r={RING_RADIUS}
                fill="none"
                stroke={isUrgent ? "#ef4444" : "#111827"}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                className="transition-[stroke-dashoffset] duration-1000 ease-linear"
              />
            </svg>
            {/* Seconds label in the centre of the ring */}
            <span
              className={cn(
                "absolute text-sm font-bold tabular-nums transition-colors duration-300",
                isUrgent ? "text-red-600" : "text-neutral-900",
              )}
            >
              {secondsLeft}
            </span>
          </div>

          {/* Icon badge */}
          <div
            className={cn(
              "mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-300",
              isUrgent ? "bg-red-50" : "bg-neutral-100",
            )}
          >
            <AlertTriangle
              className={cn(
                "h-5 w-5 transition-colors duration-300",
                isUrgent ? "text-red-500" : "text-neutral-500",
              )}
            />
          </div>

          <h2
            id="inactivity-title"
            className="text-base font-bold text-neutral-900"
          >
            Are you still there?
          </h2>

          <p
            id="inactivity-desc"
            className="mt-1.5 max-w-[260px] text-sm leading-relaxed text-neutral-500"
          >
            You&apos;ve been inactive for 30 minutes. For your security,
            you&apos;ll be logged out in{" "}
            <span
              className={cn(
                "font-semibold tabular-nums transition-colors duration-300",
                isUrgent ? "text-red-600" : "text-neutral-900",
              )}
            >
              {secondsLeft}s
            </span>
            .
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2.5 border-t border-neutral-100 bg-neutral-50/60 px-6 py-4">
          <Button variant="outline" className="flex-1" onClick={onLeave}>
            Leave
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={onStay}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          >
            Stay logged in
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
