"use client";

import { cn } from "@/lib/utils";
import { SERIES, formatPercent } from "./theme";

/**
 * Target-vs-actual gauge with a pace marker.
 *
 * The marker is the point of the component: 60% of target is good news on day 25
 * and bad news on day 5, so the ring is always read against elapsed time.
 */
export function RadialProgress({
  progress,
  pace,
  size = 132,
  thickness = 10,
  primaryLabel,
  secondaryLabel,
  className,
}: {
  /** Achievement as a percentage of target. May exceed 100. */
  progress: number;
  /** Percentage of the period elapsed, drawn as a tick on the ring. */
  pace?: number | null;
  size?: number;
  thickness?: number;
  primaryLabel: string;
  secondaryLabel?: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, progress));
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;

  const onTrack = pace == null || progress >= pace;
  const strokeColor = onTrack ? SERIES.revenue : SERIES.risk;

  const paceAngle = pace == null ? null : (Math.max(0, Math.min(100, pace)) / 100) * 360;

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={SERIES.hairline}
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          className="transition-all duration-700"
        />
        {paceAngle != null && (
          <line
            x1={size / 2 + (radius - thickness / 2 - 2) * Math.cos((paceAngle * Math.PI) / 180)}
            y1={size / 2 + (radius - thickness / 2 - 2) * Math.sin((paceAngle * Math.PI) / 180)}
            x2={size / 2 + (radius + thickness / 2 + 2) * Math.cos((paceAngle * Math.PI) / 180)}
            y2={size / 2 + (radius + thickness / 2 + 2) * Math.sin((paceAngle * Math.PI) / 180)}
            stroke={SERIES.ink}
            strokeWidth={2}
            strokeLinecap="round"
          />
        )}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-secondary text-xl font-extrabold tracking-tight text-zinc-900">
          {formatPercent(progress, 0)}
        </span>
        <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
          {primaryLabel}
        </span>
        {secondaryLabel && (
          <span className="mt-0.5 px-2 text-[10px] font-medium text-zinc-400">
            {secondaryLabel}
          </span>
        )}
      </div>
    </div>
  );
}
