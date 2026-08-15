"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Building2, Check, Loader2, X } from "lucide-react";
import { propertiesService, type PropertySummary } from "@/services/properties/properties.service";
import { cn } from "@/lib/utils";

export function PropertyPicker({
  selected,
  onSelect,
}: {
  selected: PropertySummary | null;
  onSelect: (property: PropertySummary | null) => void;
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<PropertySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!search.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await propertiesService.list({
          search: search.trim(),
          perPage: 10,
          orderBy: "-createdAt",
        });
        setResults(res.data);
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // If a property is already selected, show it
  if (selected) {
    return (
      <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50/50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {selected.mainImage ? (
              <img
                src={selected.mainImage}
                alt={selected.title}
                className="h-16 w-16 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-emerald-100">
                <Building2 className="h-7 w-7 text-emerald-600" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-600" />
                <p className="font-medium text-slate-900">{selected.title}</p>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Ref: {selected.reference}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-600">
                <span>{selected.type}</span>
                {selected.bedrooms && <span>· {selected.bedrooms} BR</span>}
                {selected.bathrooms && <span>· {selected.bathrooms} Bath</span>}
                <span>· {selected.size} sqft</span>
                {selected.price != null && (
                  <span>· AED {selected.price.toLocaleString()}</span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-slate-400">
                {selected.emirate}
                {selected.community ? ` · ${selected.community}` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setSearch("");
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-rose-600 transition-colors"
            title="Remove selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!e.target.value) setShowResults(false);
          }}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Search properties listed in the Properties module…"
          className="h-10 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-9 text-sm text-neutral-900 shadow-2xs placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-all duration-150"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-neutral-400" />
        )}
      </div>

      {showResults && !loading && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-slate-400">
                {search.trim()
                  ? "No properties found. Try a different search."
                  : "Start typing to search listed properties."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {results.map((prop) => (
                <button
                  key={prop.id}
                  type="button"
                  onClick={() => {
                    onSelect(prop);
                    setShowResults(false);
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-neutral-50 transition-colors"
                >
                  {prop.mainImage ? (
                    <img
                      src={prop.mainImage}
                      alt={prop.title}
                      className="h-12 w-12 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 shrink-0">
                      <Building2 className="h-5 w-5 text-slate-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {prop.title}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      Ref: {prop.reference} · {prop.type}
                      {prop.bedrooms ? ` · ${prop.bedrooms}BR` : ""}
                      {prop.price != null
                        ? ` · AED ${prop.price.toLocaleString()}`
                        : ""}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {prop.emirate}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
