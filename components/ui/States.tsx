import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-ink", className)} />;
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-3">
      <Spinner className="h-6 w-6" />
      <p className="text-xs text-ink-3">{label}</p>
    </div>
  );
}

export function EmptyState({
  title = "Nothing here yet",
  message,
  action,
  icon,
}: {
  title?: string;
  message?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line px-4 py-16 text-center">
      <div className="rounded-full border border-line bg-white p-3 text-ink-3">
        {icon ?? <Inbox className="h-5 w-5" strokeWidth={1.5} />}
      </div>
      <div>
        <p className="text-[15px] font-medium text-ink">{title}</p>
        {message && <p className="mt-1 max-w-sm text-[12.5px] text-ink-3">{message}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message = "Something went wrong.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-ink px-4 py-16 text-center text-on-ink">
      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20">
        <AlertTriangle className="h-4 w-4" strokeWidth={1.5} />
      </div>
      <p className="max-w-sm text-[13px] text-on-ink-2">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 cursor-pointer text-[13px] font-medium underline underline-offset-4 hover:text-on-ink-2"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("tw-shimmer rounded-lg bg-fill-soft", className)} />;
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-xs">
          <thead>
            <tr className="border-b border-line">
              {Array.from({ length: cols }).map((_, c) => (
                <th key={`h-${c}`} className="border-b border-line px-4 py-3 text-left">
                  <Skeleton className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c} className="px-4 py-3">
                    <Skeleton className="h-3.5 w-full max-w-28" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
