"use client";

import { forwardRef, useState, useEffect, useRef, useImperativeHandle, useLayoutEffect } from "react";
import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const baseField =
  "w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-900 shadow-2xs placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400 transition-all duration-150";

export interface FieldWrapProps {
  label?: string;
  error?: string;
  success?: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, error, success, required, hint, className, children }: FieldWrapProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      {success && !error && <p className="text-xs font-medium text-emerald-600">{success}</p>}
      {hint && !error && !success && <p className="text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean; valid?: boolean }
>(({ className, invalid, valid, ...props }, ref) => (
  <input
    ref={ref}
    aria-invalid={invalid || undefined}
    className={cn(
      baseField,
      invalid && "border-red-400 focus:border-red-600 focus:ring-red-600",
      valid && !invalid && "border-emerald-400 focus:border-emerald-600 focus:ring-emerald-600",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(baseField, "min-h-[90px] resize-y", invalid && "border-red-400 focus:border-red-600 focus:ring-red-600", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
  placeholder?: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, children, value, defaultValue, onChange, placeholder, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const nativeSelectRef = useRef<HTMLSelectElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);

    // Expose the native select ref so external libraries like react-hook-form work perfectly
    useImperativeHandle(ref, () => nativeSelectRef.current as HTMLSelectElement);

    const closeDropdown = () => {
      setIsOpen(false);
      setSearchQuery("");
    };

    // Calculate dropdown position when opened (uses fixed positioning via portal to escape overflow clipping)
    useLayoutEffect(() => {
      if (!isOpen || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const spaceAbove = rect.top - 8;
      const maxH = 280;
      const flip = spaceBelow < Math.min(maxH, 160) && spaceAbove > spaceBelow;
      setDropdownPos({
        top: flip ? Math.max(8, rect.top - Math.min(maxH, spaceAbove) - 4) : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        maxHeight: flip ? Math.min(maxH, spaceAbove) : Math.min(maxH, spaceBelow),
      });
    }, [isOpen]);

    // Reposition on scroll or resize while open
    useEffect(() => {
      if (!isOpen) return;
      function update() {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom - 8;
        const spaceAbove = rect.top - 8;
        const maxH = 280;
        const flip = spaceBelow < Math.min(maxH, 160) && spaceAbove > spaceBelow;
        setDropdownPos({
          top: flip ? Math.max(8, rect.top - Math.min(maxH, spaceAbove) - 4) : rect.bottom + 4,
          left: rect.left,
          width: rect.width,
          maxHeight: flip ? Math.min(maxH, spaceAbove) : Math.min(maxH, spaceBelow),
        });
      }
      window.addEventListener("scroll", update, true);
      window.addEventListener("resize", update);
      return () => {
        window.removeEventListener("scroll", update, true);
        window.removeEventListener("resize", update);
      };
    }, [isOpen]);

    // Support controlled and uncontrolled state
    const [internalValue, setInternalValue] = useState<string>(
      String(value !== undefined ? value : (defaultValue !== undefined ? defaultValue : ""))
    );

    useEffect(() => {
      if (value !== undefined) {
        setInternalValue(String(value));
      }
    }, [value]);

    // Focus search when opened; clear query when closed
    useEffect(() => {
      if (isOpen) {
        // Defer so the portal has mounted
        const id = requestAnimationFrame(() => searchInputRef.current?.focus());
        return () => cancelAnimationFrame(id);
      }
      setSearchQuery("");
    }, [isOpen]);

    // Click outside listener to close the dropdown
    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        const target = event.target as Node;
        if (
          containerRef.current && !containerRef.current.contains(target) &&
          dropdownRef.current && !dropdownRef.current.contains(target)
        ) {
          closeDropdown();
        }
      }
      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen]);

    // Escape closes the dropdown
    useEffect(() => {
      if (!isOpen) return;
      function handleKeyDown(event: KeyboardEvent) {
        if (event.key === "Escape") {
          event.stopPropagation();
          closeDropdown();
        }
      }
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    // Extract option elements and their values/labels
    const options: { value: string; label: string; disabled?: boolean }[] = [];
    
    const parseChildren = (childrenNode: React.ReactNode) => {
      React.Children.forEach(childrenNode, (child) => {
        if (!child) return;
        if (React.isValidElement(child)) {
          const el = child as React.ReactElement<any>;
          if (el.type === "option") {
            options.push({
              value: String(el.props.value ?? ""),
              label: String(el.props.children ?? el.props.label ?? ""),
              disabled: el.props.disabled,
            });
          } else if (el.type === React.Fragment || el.props.children) {
            parseChildren(el.props.children);
          }
        }
      });
    };
    
    parseChildren(children);

    const searchLower = searchQuery.trim().toLowerCase();
    const filteredOptions = searchLower
      ? options.filter((opt) => opt.label.toLowerCase().includes(searchLower))
      : options;

    // Determine active display label.
    // When internalValue is non-empty but the matching option hasn't loaded yet
    // (e.g. async manager list), fall back to placeholder rather than options[0]
    // so we never show a misleading "first option" label. Showing the raw value
    // is a reasonable fallback for value-is-label selects (status, source), but
    // not when the value is an opaque id such as a user uuid.
    const selectedOption = options.find((opt) => opt.value === internalValue);
    const valueIsOpaqueId = UUID_PATTERN.test(internalValue);
    const displayLabel = selectedOption
      ? selectedOption.label
      : internalValue && !valueIsOpaqueId
        ? internalValue
        : (placeholder || "");

    const handleSelectOption = (optValue: string) => {
      setInternalValue(optValue);
      closeDropdown();

      if (nativeSelectRef.current) {
        nativeSelectRef.current.value = optValue;
        // Trigger native change events so react-hook-form and other libraries hear it
        const event = new Event("change", { bubbles: true });
        nativeSelectRef.current.dispatchEvent(event);
      }

      if (onChange) {
        // Create a fake ChangeEvent for react standard inputs
        const fakeEvent = {
          target: {
            value: optValue,
            name: props.name,
          },
          currentTarget: {
            value: optValue,
            name: props.name,
          },
        } as unknown as React.ChangeEvent<HTMLSelectElement>;
        onChange(fakeEvent);
      }
    };

    return (
      <div ref={containerRef} className={cn("relative w-full", className)}>
        {/* Hidden native select for accessibility and react-hook-form integration */}
        <select
          ref={nativeSelectRef}
          value={internalValue}
          onChange={(e) => {
            setInternalValue(e.target.value);
            if (onChange) onChange(e);
          }}
          className="sr-only"
          {...props}
        >
          {children}
        </select>

        {/* Trigger Button */}
        <button
          type="button"
          disabled={props.disabled}
          onClick={() => (isOpen ? closeDropdown() : setIsOpen(true))}
          className={cn(
            "flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 px-3.5 py-2 text-sm text-neutral-900 shadow-2xs focus:outline-none focus:border-black focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400 transition-all duration-150 cursor-pointer h-10 text-left",
            invalid && "border-red-400 ring-1 ring-red-500/30"
          )}
        >
          <span className="truncate pr-2">{displayLabel}</span>
          <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0", isOpen && "rotate-180")} />
        </button>

        {/* Custom Options List Popover - rendered via portal to escape overflow clipping in modals */}
        {isOpen && !props.disabled && dropdownPos && createPortal(
          <div
            ref={dropdownRef}
            style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, maxHeight: dropdownPos.maxHeight, zIndex: 9999 }}
            className="flex flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-lg shadow-black/5 animate-in fade-in slide-in-from-top-1 duration-150"
          >
            <div className="shrink-0 border-b border-slate-100 p-1.5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    // Prevent form submit / select keyboard handling while typing
                    if (e.key === "Enter") e.preventDefault();
                    e.stopPropagation();
                  }}
                  placeholder="Search…"
                  className="w-full rounded-lg border border-neutral-200 bg-white py-1.5 pl-8 pr-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  aria-label="Search options"
                />
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-1">
              {options.length === 0 ? (
                <div className="px-3 py-2 text-xs text-slate-400 text-center">No options available</div>
              ) : filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-xs text-slate-400 text-center">No results found</div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === internalValue;
                  return (
                    <button
                      key={opt.value === "" ? "__empty__" : opt.value}
                      type="button"
                      disabled={opt.disabled}
                      onClick={() => handleSelectOption(opt.value)}
                      className={cn(
                        "w-full text-left rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors duration-100 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40",
                        isSelected && "bg-slate-100/80 font-medium text-foreground"
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
      </div>
    );
});
Select.displayName = "Select";
