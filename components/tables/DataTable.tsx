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
    <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-left text-xs">
          <thead>
            <tr className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 bg-neutral-50/90 border-b border-neutral-200/80">
              {selectable && (
                <th className="w-10 whitespace-nowrap px-4 py-3 border-b border-neutral-200/80">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={(e) => onToggleAll?.(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 bg-white text-black focus:ring-black accent-black"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "whitespace-nowrap px-4 py-3 border-b border-neutral-200/80 font-semibold",
                    col.stickyRight &&
                      "sticky right-0 z-10 bg-neutral-50/90 border-l border-neutral-200/60 shadow-xs",
                    col.headerClassName,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {rows.map((row, index) => {
              const id = rowKey(row);
              const selected = selectedIds.includes(id);
              const isLast = index === rows.length - 1;
              return (
                <tr
                  key={id}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "group bg-white transition-colors duration-100",
                    onRowClick && "cursor-pointer hover:bg-neutral-50/80",
                    selected && "bg-neutral-100/60",
                    rowClassName?.(row),
                  )}
                >
                  {selectable && (
                    <td
                      className={cn(
                        "whitespace-nowrap px-4 py-3 border-b border-neutral-100 bg-inherit",
                        isLast && "border-b-0",
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onToggleRow?.(id)}
                        className="h-4 w-4 rounded border-neutral-300 bg-white text-black focus:ring-black accent-black"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "whitespace-nowrap px-4 py-3 text-neutral-700 border-b border-neutral-100 bg-inherit",
                        isLast && "border-b-0",
                        col.stickyRight && "sticky right-0 z-10 bg-inherit border-l border-neutral-100 shadow-2xs",
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
