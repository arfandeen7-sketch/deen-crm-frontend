"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-black text-white hover:bg-neutral-800 active:bg-neutral-900 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 shadow-xs border border-transparent",
  secondary:
    "border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100 hover:text-black active:bg-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 shadow-2xs",
  outline:
    "border border-neutral-300 bg-transparent text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2",
  ghost:
    "text-neutral-700 hover:bg-neutral-100 hover:text-black active:bg-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 shadow-xs border border-transparent",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3.5 text-xs font-medium gap-1.5 rounded-md",
  md: "h-9 px-4 text-xs font-medium gap-2 rounded-lg",
  lg: "h-11 px-6 text-sm font-medium gap-2.5 rounded-lg",
  icon: "h-9 w-9 p-0 flex items-center justify-center rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", loading, children, disabled, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-150 ease-in-out cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none select-none outline-none",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
