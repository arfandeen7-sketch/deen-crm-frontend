import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-gray-900", className)} />;
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <Spinner className="h-6 w-6" />
      <p className="text-sm">{label}</p>
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
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="rounded-full bg-slate-100 p-3 text-slate-400">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">{title}</p>
        {message && <p className="mt-1 text-sm text-slate-500">{message}</p>}
      </div>
      {action}
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
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="rounded-full bg-rose-100 p-3 text-rose-500">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <p className="max-w-sm text-sm text-slate-600">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-medium text-gray-900 hover:text-indigo-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200", className)} />;
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-6 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
