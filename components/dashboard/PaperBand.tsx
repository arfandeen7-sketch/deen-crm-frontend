"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/States";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** Tweens from the previous value to the next one (0 on first mount). */
export function CountUp({
  value,
  pad = 0,
  duration = 900,
  format,
}: {
  value: number;
  pad?: number;
  duration?: number;
  format?: (n: number) => string;
}) {
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      from.current = value;
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      const next = origin + (value - origin) * eased;
      setDisplay(next);
      from.current = next;
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduced]);

  const n = Math.round(display);
  return (
    <span className="tabular-nums">
      {format ? format(n) : pad ? n.toString().padStart(pad, "0") : n.toLocaleString()}
    </span>
  );
}

export function PaperBand({
  children,
  className,
  cols = 5,
}: {
  children: React.ReactNode;
  className?: string;
  cols?: 4 | 5;
}) {
  return (
    <section className={cn("rounded-2xl bg-paper px-6 py-7 sm:px-8", className)}>
      <div
        className={cn(
          "grid grid-cols-1 gap-8 sm:grid-cols-2 lg:gap-10",
          cols === 5 ? "lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]" : "lg:grid-cols-4",
        )}
      >
        {children}
      </div>
    </section>
  );
}

export function BandModule({
  index = 0,
  className,
  children,
}: {
  index?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("enter min-w-0", className)} style={{ "--i": index } as React.CSSProperties}>
      {children}
    </div>
  );
}

/** Large regular-weight number, muted caption and a thin arrow that links to the filtered list. */
export function StatArrow({
  label,
  caption,
  value,
  pad,
  prefix,
  loading,
  href,
  index = 0,
}: {
  label: string;
  caption?: string;
  value: number;
  pad?: number;
  prefix?: string;
  loading?: boolean;
  href?: string;
  index?: number;
}) {
  const body = (
    <div className="flex h-full flex-col justify-between gap-6">
      <p className="text-[13px] text-ink-2">{label}</p>
      <div>
        {loading ? (
          <Skeleton className="h-10 w-24" />
        ) : (
          <p className="display-num text-ink">
            {prefix && <span className="mr-1 text-[18px] text-ink-3">{prefix}</span>}
            <CountUp value={value} pad={pad} />
          </p>
        )}
        <div className="mt-3 flex items-end justify-between gap-3">
          <p className="max-w-[16ch] text-[12.5px] leading-snug text-[#6f6f6a]">{caption}</p>
          {href && <ArrowRight className="arrow h-5 w-5 shrink-0 text-ink" strokeWidth={1.25} />}
        </div>
      </div>
    </div>
  );
  return (
    <BandModule index={index}>
      {href ? (
        <Link
          href={href}
          className="arrow-link block h-full rounded-xl outline-offset-4 transition-transform duration-[120ms] active:scale-[0.985]"
        >
          {body}
        </Link>
      ) : (
        body
      )}
    </BandModule>
  );
}

/** Semi-circle of radiating tick marks with the percentage in the centre. */
export function TickGauge({
  label,
  percent,
  caption,
  loading,
  index = 0,
}: {
  label: string;
  percent: number;
  caption?: string;
  loading?: boolean;
  index?: number;
}) {
  const TICKS = 64;
  const pct = Math.max(0, Math.min(100, percent));
  const filled = Math.round((pct / 100) * TICKS);
  const cx = 100;
  const cy = 100;
  const r = 86;
  return (
    <BandModule index={index}>
      <p className="text-[13px] text-ink-2">{label}</p>
      <div className="relative mx-auto mt-4 w-full max-w-[220px]">
        <svg viewBox="0 0 200 108" className="w-full" role="img" aria-label={`${label}: ${pct}%`}>
          {Array.from({ length: TICKS }).map((_, i) => {
            const t = i / (TICKS - 1);
            const angle = Math.PI * (1 - t);
            const on = i < filled;
            const len = on ? 10 + (i / TICKS) * 6 : 7;
            const x1 = cx + Math.cos(angle) * r;
            const y1 = cy - Math.sin(angle) * r;
            const x2 = cx + Math.cos(angle) * (r - len);
            const y2 = cy - Math.sin(angle) * (r - len);
            return (
              <line
                key={i}
                className={on ? "tick" : undefined}
                style={on ? ({ "--i": i } as React.CSSProperties) : undefined}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#1a1a1a"
                strokeOpacity={on ? 1 : 0.25}
                strokeWidth={1.6}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          {loading ? (
            <Skeleton className="mx-auto h-9 w-16" />
          ) : (
            <p className="display-num text-ink">
              <CountUp value={pct} format={(n) => `${n}%`} />
            </p>
          )}
        </div>
      </div>
      {caption && <p className="mt-3 text-center text-[12.5px] text-[#6f6f6a]">{caption}</p>}
    </BandModule>
  );
}

/** Solid ink primary bar, hatched secondary bars, rounded tops, no gridlines. */
export function HatchBars({
  label,
  data,
  loading,
  index = 0,
}: {
  label: string;
  data: { label: string; value: number }[];
  loading?: boolean;
  index?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const top = data.reduce((best, d, i) => (d.value > (data[best]?.value ?? -1) ? i : best), 0);
  const ticks = [max, Math.round(max / 2), 0];
  return (
    <BandModule index={index}>
      <p className="text-[13px] text-ink-2">{label}</p>
      {loading ? (
        <Skeleton className="mt-4 h-32 w-full" />
      ) : data.length === 0 ? (
        <p className="mt-6 text-[12.5px] text-[#6f6f6a]">No data yet</p>
      ) : (
        <div className="mt-4 flex gap-3">
          <div className="flex h-32 flex-col justify-between text-[11px] tabular-nums text-[#6f6f6a]">
            {ticks.map((t, i) => (
              <span key={i}>{t}</span>
            ))}
          </div>
          <div className="flex-1">
            <div className="flex h-32 items-end gap-2">
              {data.map((d, i) => (
                <div
                  key={d.label}
                  className="relative flex h-full flex-1 items-end"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                >
                  {hover === i && (
                    <span className="pop-in absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-[11px] text-on-ink">
                      {d.label}: {d.value.toLocaleString()}
                    </span>
                  )}
                  <div
                    className={cn(
                      "bar w-full rounded-t-[4px] transition-opacity duration-[220ms]",
                      i === top ? "bg-ink" : "hatch",
                      hover !== null && hover !== i && "opacity-40",
                    )}
                    style={{ height: `${Math.max((d.value / max) * 100, 3)}%`, "--i": i } as React.CSSProperties}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              {data.map((d) => (
                <span key={d.label} className="flex-1 truncate text-center text-[11px] text-[#6f6f6a]" title={d.label}>
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </BandModule>
  );
}

export interface BandSummary {
  totalLeads?: number;
  dealsClosed?: number;
  salesAmount?: number;
  sourceCounts?: { source?: string; label?: string; count: number }[];
}

/** Standard CRM metrics band built from real dashboard data. */
export function LeadMetricsBand({
  summary,
  summaryLoading,
  untouched,
  untouchedLoading,
  unassigned,
  unassignedLoading,
}: {
  summary?: BandSummary;
  summaryLoading?: boolean;
  untouched?: number;
  untouchedLoading?: boolean;
  unassigned?: number;
  unassignedLoading?: boolean;
}) {
  const total = summary?.totalLeads ?? 0;
  const closed = summary?.dealsClosed ?? 0;
  const rate = total > 0 ? Math.round((closed / total) * 100) : 0;
  const bars = (summary?.sourceCounts ?? [])
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((s) => ({ label: s.source ?? s.label ?? "Other", value: s.count }));

  return (
    <PaperBand>
      <HatchBars label="Leads by source" data={bars} loading={summaryLoading} index={0} />
      <TickGauge
        label="Deal close rate"
        percent={rate}
        caption={`${closed.toLocaleString()} of ${total.toLocaleString()} leads closed`}
        loading={summaryLoading}
        index={1}
      />
      <StatArrow
        label="Untouched leads"
        caption="Waiting for a first contact"
        value={untouched ?? 0}
        pad={2}
        loading={untouchedLoading}
        href="/leads/untouched"
        index={2}
      />
      <StatArrow
        label="Unassigned leads"
        caption="Not yet given to an owner"
        value={unassigned ?? 0}
        pad={2}
        loading={unassignedLoading}
        href="/leads/unassigned"
        index={3}
      />
      <StatArrow
        label="Deals closed"
        caption="Total sales value in AED"
        value={Math.round(summary?.salesAmount ?? 0)}
        prefix="AED"
        loading={summaryLoading}
        href="/leads/deal-closed"
        index={4}
      />
    </PaperBand>
  );
}
