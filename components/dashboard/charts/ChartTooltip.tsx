"use client";

import type { TooltipContentProps } from "recharts";

export interface TooltipRow {
  label: string;
  value: string;
  color?: string;
}

type RechartsTooltipProps = TooltipContentProps<number, string>;

export type TooltipPayload = NonNullable<RechartsTooltipProps["payload"]>;

/**
 * Brand-styled tooltip card. Charts pass a `rows` builder so each one controls
 * its own formatting (AED vs count vs percent) while the shell stays identical.
 *
 * Recharts injects `active`/`payload`/`label` at render time when this is passed
 * as `content={<ChartTooltip … />}`, so those props are optional here — only the
 * `rows` builder is supplied by the caller.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  titleFormatter,
  rows,
}: Partial<RechartsTooltipProps> & {
  titleFormatter?: (label: unknown) => string;
  rows: (payload: TooltipPayload) => TooltipRow[];
}) {
  if (!active || !payload || payload.length === 0) return null;

  const items = rows(payload).filter(Boolean);
  if (items.length === 0) return null;

  const title = titleFormatter ? titleFormatter(label) : String(label ?? "");

  return (
    <div className="pointer-events-none min-w-40 rounded-xl border border-border bg-white px-3 py-2.5 shadow-xl">
      {title && (
        <p className="font-secondary text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          {title}
        </p>
      )}
      <ul className={title ? "mt-1.5 space-y-1" : "space-y-1"}>
        {items.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              {row.color && (
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: row.color }}
                />
              )}
              <span className="text-xs text-zinc-500">{row.label}</span>
            </span>
            <span className="text-xs font-bold tabular-nums text-zinc-900">
              {row.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
