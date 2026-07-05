"use client";

import { forwardRef, useState, useEffect, useRef, useImperativeHandle } from "react";
import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const baseField =
  "w-full rounded-[6px] border border-border bg-background px-4 py-2 text-sm text-foreground shadow-none placeholder:text-foreground-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-panel disabled:text-foreground-disabled";

export interface FieldWrapProps {
  label?: string;
  error?: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, error, required, hint, className, children }: FieldWrapProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="text-[11px] font-bold uppercase tracking-wider text-foreground-secondary">
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-foreground-muted">{hint}</p>}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(baseField, invalid && "border-rose-400 focus:ring-rose-500/30", className)}
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
    className={cn(baseField, "min-h-[88px] resize-y", invalid && "border-rose-400", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, children, value, defaultValue, onChange, placeholder, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const nativeSelectRef = useRef<HTMLSelectElement>(null);

    // Expose the native select ref so external libraries like react-hook-form work perfectly
    useImperativeHandle(ref, () => nativeSelectRef.current as HTMLSelectElement);

    // Support controlled and uncontrolled state
    const [internalValue, setInternalValue] = useState<string>(
      String(value !== undefined ? value : (defaultValue !== undefined ? defaultValue : ""))
    );

    useEffect(() => {
      if (value !== undefined) {
        setInternalValue(String(value));
      }
    }, [value]);

    // Click outside listener to close the dropdown
    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
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

    // Determine active display label
    const selectedOption = options.find((opt) => opt.value === internalValue);
    const displayLabel = selectedOption ? selectedOption.label : (options[0]?.label || placeholder || "");

    const handleSelectOption = (optValue: string) => {
      setInternalValue(optValue);
      setIsOpen(false);

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
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex w-full items-center justify-between rounded-lg border-0 bg-slate-100/50 hover:bg-slate-100 px-4 py-2 text-sm text-foreground shadow-none focus:outline-none focus:ring-1 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-panel disabled:text-foreground-disabled transition-all duration-150 cursor-pointer h-10 text-left",
            invalid && "ring-1 ring-rose-400 focus:ring-rose-500/30"
          )}
        >
          <span className="truncate pr-2">{displayLabel}</span>
          <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0", isOpen && "rotate-180")} />
        </button>

        {/* Custom Options List Popover */}
        {isOpen && !props.disabled && (
          <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-100 bg-white p-1 shadow-lg shadow-black/5 animate-in fade-in slide-in-from-top-1 duration-150">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400 text-center">No options available</div>
            ) : (
              options.map((opt) => {
                const isSelected = opt.value === internalValue;
                return (
                  <button
                    key={opt.value}
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
        )}
      </div>
    );
});
Select.displayName = "Select";
