import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-neutral-900", className)} />;
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-neutral-500">
      <Spinner className="h-6 w-6 text-neutral-900" />
      <p className="text-xs font-medium text-neutral-500">{label}</p>
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
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50">
      <div className="rounded-full border border-neutral-200 bg-white p-3 text-neutral-400 shadow-2xs">
        {icon ?? <Inbox className="h-5 w-5 text-neutral-500" />}
      </div>
      <div>
        <p className="text-xs font-semibold text-neutral-800 uppercase tracking-wider">{title}</p>
        {message && <p className="mt-1 text-xs text-neutral-500 max-w-sm">{message}</p>}
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
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center rounded-xl border border-red-100 bg-red-50/30">
      <div className="rounded-full bg-red-100 p-3 text-red-600">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <p className="max-w-sm text-xs font-medium text-neutral-700">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 text-xs font-semibold text-black underline underline-offset-4 hover:text-neutral-700 cursor-pointer"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-neutral-200/80", className)} />;
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-xs">
          <thead>
            <tr className="bg-neutral-50/90 border-b border-neutral-200/80">
              {Array.from({ length: cols }).map((_, c) => (
                <th
                  key={`h-${c}`}
                  className="border-b border-neutral-200/80 px-4 py-3 text-left"
                >
                  <Skeleton className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: cols }).map((_, c) => (
                  <td
                    key={c}
                    className="px-4 py-3"
                  >
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
