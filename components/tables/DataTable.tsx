"use client";

import { cn } from "@/lib/utils";
import { TableSkeleton, EmptyState, ErrorState } from "@/components/ui/States";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  /** Render cell content. */
  render: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  /** Pin this column to the right side of a horizontally scrolling table. */
  stickyRight?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  onRowClick?: (row: T) => void;
  // Selection
  selectable?: boolean;
  selectedIds?: string[];
  onToggleRow?: (id: string) => void;
  onToggleAll?: (checked: boolean) => void;
  /** Optional per-row additional CSS classes. */
  rowClassName?: (row: T) => string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  error,
  onRetry,
  emptyTitle,
  emptyMessage,
  emptyAction,
  onRowClick,
  selectable,
  selectedIds = [],
  onToggleRow,
  onToggleAll,
  rowClassName,
}: DataTableProps<T>) {
  const allChecked = rows.length > 0 && selectedIds.length === rows.length;

  if (loading) return <TableSkeleton cols={columns.length + (selectable ? 1 : 0)} />;
  if (error) return <ErrorState onRetry={onRetry} />;
  if (rows.length === 0)
    return <EmptyState title={emptyTitle} message={emptyMessage} action={emptyAction} />;

  return (
    <div className="overflow-hidden rounded-lg bg-background">
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="text-[11px] font-semibold uppercase tracking-wider text-foreground-secondary">
              {selectable && (
                <th className="w-12 whitespace-nowrap bg-section px-5 py-3.5 rounded-l-lg">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={(e) => onToggleAll?.(e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-background accent-foreground focus:ring-foreground"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "whitespace-nowrap bg-section px-5 py-3.5 first:rounded-l-lg last:rounded-r-lg",
                    col.stickyRight &&
                      "sticky right-0 z-10 bg-section",
                    col.headerClassName,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const id = rowKey(row);
              const selected = selectedIds.includes(id);
              const isLast = index === rows.length - 1;
              return (
                <tr
                  key={id}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "group bg-background transition-colors",
                    onRowClick && "cursor-pointer hover:bg-zinc-50",
                    selected && "bg-zinc-50",
                    rowClassName?.(row),
                  )}
                >
                  {selectable && (
                    <td
                      className={cn(
                        "bg-inherit whitespace-nowrap border-b border-border px-5 py-3.5",
                        isLast && "border-b-0",
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onToggleRow?.(id)}
                        className="h-4 w-4 rounded border-border bg-background accent-foreground focus:ring-foreground"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "bg-inherit whitespace-nowrap border-b border-border px-5 py-3.5 text-sm text-foreground-secondary",
                        isLast && "border-b-0",
                        col.stickyRight && "sticky right-0 z-10 bg-inherit",
                        col.className,
                      )}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
