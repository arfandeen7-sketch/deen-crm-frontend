"use client";

import type { NarrativeSection } from "@/types/reports";

export function NarrativeView({ section }: { section: NarrativeSection }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">{section.title}</h2>
      <div className="rounded-lg border border-neutral-200/80 bg-white p-4">
        {section.paragraphs.map((para, i) => (
          <p key={i} className="text-sm leading-relaxed text-neutral-700 [&:not(:first-child)]:mt-3">
            {para}
          </p>
        ))}
      </div>
    </section>
  );
}
