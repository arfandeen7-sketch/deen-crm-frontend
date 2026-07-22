"use client";

import { useState } from "react";
import { Check, X, Eye, Trash2 } from "lucide-react";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Badge } from "@/components/ui/Badge";
import { useDeleteLeaveType, useToggleLeaveType } from "@/hooks/useHrms";
import { ConfirmModal } from "@/components/ui/Modal";
import { toast } from "sonner";
import { cn, getErrorMessage } from "@/lib/utils";
import type { LeaveTypeConfig } from "@/types";

interface LeaveTypeListProps {
  types: LeaveTypeConfig[];
  loading?: boolean;
  onEdit: (type: LeaveTypeConfig) => void;
}

export function LeaveTypeList({ types, loading, onEdit }: LeaveTypeListProps) {
  const toggle = useToggleLeaveType();
  const remove = useDeleteLeaveType();
  const [deleteTarget, setDeleteTarget] = useState<LeaveTypeConfig | null>(null);

  const handleToggle = (code: string) => {
    toggle.mutate(code, {
      onSuccess: () => toast.success("Leave type toggled"),
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    remove.mutate(deleteTarget.code, {
      onSuccess: () => {
        toast.success("Leave type deleted");
        setDeleteTarget(null);
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  const columns: Column<LeaveTypeConfig>[] = [
    {
      key: "code",
      header: "Code",
      render: (t) => (
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
          {t.code}
        </span>
      ),
    },
    {
      key: "name",
      header: "Name",
      render: (t) => <span className="font-medium">{t.name}</span>,
    },
    {
      key: "isPaid",
      header: "Paid",
      render: (t) =>
        t.isPaid ? (
          <Badge className="bg-emerald-100 text-emerald-700">Paid</Badge>
        ) : (
          <Badge className="bg-slate-100 text-slate-500">Unpaid</Badge>
        ),
    },
    {
      key: "annualAllocation",
      header: "Allocation",
      render: (t) => `${t.annualAllocation} days`,
    },
    {
      key: "isActive",
      header: "Status",
      render: (t) =>
        t.isActive ? (
          <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
        ) : (
          <Badge className="bg-slate-100 text-slate-500">Inactive</Badge>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      stickyRight: true,
      render: (t) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(t)}
            className="rounded p-1 text-slate-500 hover:bg-slate-100"
            title="Edit"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleToggle(t.code)}
            className={cn("rounded p-1", t.isActive ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50")}
            title={t.isActive ? "Deactivate" : "Activate"}
          >
            {t.isActive ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setDeleteTarget(t)}
            className="rounded p-1 text-rose-500 hover:bg-rose-50"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable<LeaveTypeConfig>
        columns={columns}
        rows={types}
        rowKey={(t) => t.code}
        loading={loading}
        emptyTitle="No leave types"
        emptyMessage="Create your first leave type to get started."
      />
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Leave Type?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={remove.isPending}
        danger
      />
    </>
  );
}

