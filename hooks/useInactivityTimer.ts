"use client";

import { useCallback, useEffect, useRef } from "react";

/** Default: 30 minutes of inactivity before the warning popup appears. */
const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Events that count as user activity and reset the inactivity countdown.
 * `passive: true` is used for all listeners so scroll performance is unaffected.
 */
const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "click",
  "keydown",
  "touchstart",
  "touchmove",
  "scroll",
  "wheel",
] as const;

/**
 * Calls `onTimeout` after `timeoutMs` of no user activity.
 *
 * The timer resets on any mouse, keyboard, touch, or scroll event.
 * The hook is a no-op while `enabled` is false (i.e. user is not authenticated).
 *
 * Returns `resetTimer` so the caller can manually restart the countdown —
 * e.g. when the user clicks "Stay" on the inactivity modal.
 */
export function useInactivityTimer(
  onTimeout: () => void,
  enabled: boolean,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): { resetTimer: () => void } {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep a stable ref to onTimeout so resetTimer never needs to change identity
  // when the parent component re-renders with a new inline callback.
  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onTimeoutRef.current(), timeoutMs);
  }, [timeoutMs]);

  useEffect(() => {
    if (!enabled) {
      // Clear any running timer when the user logs out.
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, resetTimer, { passive: true }),
    );

    // Start the clock immediately.
    resetTimer();

    return () => {
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, resetTimer),
      );
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, resetTimer]);

  return { resetTimer };
}
