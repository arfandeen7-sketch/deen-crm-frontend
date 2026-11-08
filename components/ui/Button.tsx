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
    "bg-ink text-on-ink hover:bg-[#2a2a28] hover:-translate-y-px active:translate-y-0 active:scale-[0.97] border border-transparent",
  secondary:
    "border border-line bg-white text-ink hover:bg-fill-soft active:scale-[0.97]",
  outline:
    "border border-line bg-transparent text-ink hover:bg-fill-soft active:scale-[0.97]",
  ghost: "text-ink hover:bg-fill-soft active:scale-[0.97]",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:scale-[0.97] border border-transparent",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3.5 text-xs font-medium gap-1.5 rounded-lg",
  md: "h-10 px-4 text-[13px] font-medium gap-2 rounded-lg",
  lg: "h-11 px-6 text-sm font-medium gap-2.5 rounded-lg",
  icon: "h-10 w-10 p-0 flex items-center justify-center rounded-lg",
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
          "relative inline-flex items-center justify-center font-medium transition-[transform,background-color,border-color,color] duration-[220ms] ease-[var(--ease-out)] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none select-none",
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
