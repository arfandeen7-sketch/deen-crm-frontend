"use client";

import { forwardRef } from "react";
import { Loader2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "default" | "ghost" | "danger" | "success" | "warning" | "info";

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "title"> {
  /** Icon component to render (e.g. Download, Trash2). */
  icon: LucideIcon;
  /** Tooltip + accessible label. Required for discoverability of icon-only buttons. */
  title: string;
  /** When true, swaps the icon for a spinner and disables the button. */
  loading?: boolean;
  variant?: Variant;
  /** Icon size in pixels. Defaults to 16 (h-4 w-4). */
  iconSize?: number;
}

const variants: Record<Variant, string> = {
  default: "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
  ghost: "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900",
  danger: "text-rose-600 hover:bg-rose-50",
  success: "text-emerald-600 hover:bg-emerald-50",
  warning: "text-amber-600 hover:bg-amber-50",
  info: "text-sky-600 hover:bg-sky-50",
};

/**
 * Icon-only button for table row actions and other compact async triggers.
 *
 * - Enforces a `title` (tooltip + aria-label) so icon-only buttons are accessible.
 * - `loading` swaps the icon for a spinner and auto-disables, preventing
 *   double-clicks on async row actions (download, send, delete, approve, etc.).
 * - Visual style matches the existing inline icon buttons used across the app.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { icon: Icon, title, loading, variant = "ghost", iconSize = 16, className, disabled, onClick, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        title={title}
        aria-label={title}
        disabled={disabled || loading}
        onClick={loading ? undefined : onClick}
        className={cn(
          "inline-flex items-center justify-center rounded p-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="animate-spin shrink-0" style={{ width: iconSize, height: iconSize }} />
        ) : (
          <Icon style={{ width: iconSize, height: iconSize }} />
        )}
      </button>
    );
  },
);
IconButton.displayName = "IconButton";
