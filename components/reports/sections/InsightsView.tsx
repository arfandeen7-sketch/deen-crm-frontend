"use client";

import Link from "next/link";
import { severityDotClass } from "../format";
import type { InsightsSection } from "@/types/reports";

export function InsightsView({ section }: { section: InsightsSection }) {
  if (section.items.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
        {section.title}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {section.items.map((ins) => {
          const content = (
            <div className="flex gap-3 rounded-lg border border-neutral-200/80 bg-white p-3">
              <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${severityDotClass(ins.severity)}`} />
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-neutral-900">{ins.title}</p>
                <p className="text-xs leading-relaxed text-neutral-500">{ins.detail}</p>
              </div>
            </div>
          );
          return ins.href ? (
            <Link key={ins.id} href={ins.href} className="block transition-colors hover:bg-neutral-50">
              {content}
            </Link>
          ) : (
            <div key={ins.id}>{content}</div>
          );
        })}
      </div>
    </section>
  );
}
