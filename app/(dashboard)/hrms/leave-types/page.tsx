"use client";

import { useState } from "react";
import { Plus, Pencil, Power, PowerOff } from "lucide-react";
import { useLeaveTypeList, useLeaveTypeMutations } from "@/hooks/useHrms";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { Field, Input, Textarea, Select } from "@/components/ui/Input";
import { AccessGuard, CanAccess } from "@/components/shared/Guards";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { LeaveTypeConfig } from "@/types";
import { leaveTypeConfigSchema, type LeaveTypeConfigFormValues } from "@/schemas/leave.schema";

const ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "master", label: "Master" },
  { value: "hr_manager", label: "HR Manager" },
  { value: "sales_manager", label: "Sales Manager" },
  { value: "sales_executive", label: "Sales Executive" },
];

export default function LeaveTypeConfigPage() {
  const { data, isLoading } = useLeaveTypeList();
  const { create, update, deactivate, activate } = useLeaveTypeMutations();
  const { canAction } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LeaveTypeConfig | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"activate" | "deactivate">("deactivate");
  const [form, setForm] = useState<Partial<LeaveTypeConfigFormValues>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  function openCreate() {
    setEditing(null);
    setForm({
      isPaid: true,
      annualAllocation: 0,
      halfDayAllowed: false,
      weekendCounted: false,
      holidayCounted: false,
      negativeBalanceAllowed: false,
      resetEveryYear: true,
      carryForwardEnabled: false,
      carryForwardPercentage: 0,
      encashmentEnabled: false,
      encashmentPercentage: 0,
      approvalRequired: true,
      autoApprove: false,
      notifyHR: true,
      notifyMaster: false,
      notifyManager: false,
      sortOrder: 0,
      probationAllowed: true,
      requiresMedicalCertificate: false,
      requiresAttachment: false,
      futureDateAllowed: true,
      backDateAllowed: true,
    });
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(record: LeaveTypeConfig) {
    setEditing(record);
    setForm({
      name: record.name,
      code: record.code,
      description: record.description ?? "",
      isPaid: record.isPaid,
      applicableRoles: record.applicableRoles ?? "",
      probationAllowed: record.probationAllowed,
      requiresMedicalCertificate: record.requiresMedicalCertificate,
      requiresAttachment: record.requiresAttachment,
      annualAllocation: record.annualAllocation,
      maxDaysPerRequest: record.maxDaysPerRequest ?? undefined,
      maximumConsecutiveDays: record.maximumConsecutiveDays ?? undefined,
      maximumRequestsPerMonth: record.maximumRequestsPerMonth ?? undefined,
      minimumNoticeDays: record.minimumNoticeDays ?? undefined,
      halfDayAllowed: record.halfDayAllowed,
      futureDateAllowed: record.futureDateAllowed,
      backDateAllowed: record.backDateAllowed,
      backDateLimitDays: record.backDateLimitDays ?? undefined,
      weekendCounted: record.weekendCounted,
      holidayCounted: record.holidayCounted,
      negativeBalanceAllowed: record.negativeBalanceAllowed,
      resetEveryYear: record.resetEveryYear,
      carryForwardEnabled: record.carryForwardEnabled,
      carryForwardPercentage: record.carryForwardPercentage,
      carryForwardExpiryMonths: record.carryForwardExpiryMonths ?? undefined,
      maxCarryForward: record.maxCarryForward ?? undefined,
      encashmentEnabled: record.encashmentEnabled,
      encashmentPercentage: record.encashmentPercentage,
      approvalRequired: record.approvalRequired,
      autoApprove: record.autoApprove,
      notifyHR: record.notifyHR,
      notifyMaster: record.notifyMaster,
      notifyManager: record.notifyManager,
      sortOrder: record.sortOrder,
    });
    setErrors({});
    setModalOpen(true);
  }

  function handleSubmit() {
    const result = leaveTypeConfigSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    const payload = result.data;
    if (editing) {
      update.mutate(
        { id: editing.id, body: payload },
        {
          onSuccess: () => {
            toast.success("Leave type updated");
            setModalOpen(false);
          },
          onError: (err: unknown) => {
            const msg = err instanceof Error ? err.message : "Failed to update";
            toast.error(msg);
          },
        },
      );
    } else {
      create.mutate(payload, {
        onSuccess: () => {
          toast.success("Leave type created");
          setModalOpen(false);
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : "Failed to create";
          toast.error(msg);
        },
      });
    }
  }

  function handleToggleActive(record: LeaveTypeConfig) {
    if (record.isActive) {
      setConfirmAction("deactivate");
    } else {
      setConfirmAction("activate");
    }
    setConfirmId(record.id);
  }

  function confirmToggle() {
    if (!confirmId) return;
    const action = confirmAction === "activate" ? activate : deactivate;
    action.mutate(confirmId, {
      onSuccess: () => {
        toast.success(`Leave type ${confirmAction}d`);
        setConfirmId(null);
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : `Failed to ${confirmAction}`;
        toast.error(msg);
      },
    });
  }

  const columns: Column<LeaveTypeConfig>[] = [
    { key: "name", header: "Name", render: (r) => <span className="font-medium text-foreground">{r.name}</span> },
    { key: "code", header: "Code", render: (r) => <code className="text-xs bg-panel px-1.5 py-0.5 rounded">{r.code}</code> },
    { key: "isPaid", header: "Paid", render: (r) => (r.isPaid ? <Badge className="bg-emerald-100 text-emerald-700">Paid</Badge> : <Badge className="bg-zinc-100 text-zinc-600">Unpaid</Badge>) },
    { key: "annualAllocation", header: "Annual Alloc.", render: (r) => `${r.annualAllocation} days` },
    { key: "halfDayAllowed", header: "Half Day", render: (r) => (r.halfDayAllowed ? "Yes" : "No") },
    { key: "autoApprove", header: "Auto-Approve", render: (r) => (r.autoApprove ? "Yes" : "No") },
    {
      key: "status",
      header: "Status",
      render: (r) => (r.isActive ? <Badge className="bg-emerald-100 text-emerald-700">Active</Badge> : <Badge className="bg-rose-100 text-rose-700">Inactive</Badge>),
    },
    {
      key: "actions",
      header: "Actions",
      stickyRight: true,
      render: (r) => (
        <div className="flex gap-1">
          {canAction("hrms", "leave_types", "edit") && (
            <button onClick={() => openEdit(r)} className="rounded p-1 text-foreground-secondary hover:bg-panel" title="Edit">
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {canAction("hrms", "leave_types", "delete") && (
            <button onClick={() => handleToggleActive(r)} className="rounded p-1 hover:bg-panel" title={r.isActive ? "Deactivate" : "Activate"}>
              {r.isActive ? <PowerOff className="h-4 w-4 text-rose-500" /> : <Power className="h-4 w-4 text-emerald-500" />}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AccessGuard module="hrms" page="leave_types" action="view">
      <div className="space-y-6">
        <PageHeader
          title="Leave Type Configuration"
          subtitle="Configure leave types, allocation rules, and approval settings"
          actions={
            <CanAccess module="hrms" page="leave_types" action="create">
              <Button onClick={openCreate} size="sm">
                <Plus className="h-4 w-4" />
                Add Leave Type
              </Button>
            </CanAccess>
          }
        />

        <DataTable<LeaveTypeConfig>
          columns={columns}
          rows={data ?? []}
          rowKey={(r) => r.id}
          loading={isLoading}
          emptyTitle="No leave types configured"
          emptyMessage="Create your first leave type to get started."
        />

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? "Edit Leave Type" : "Add Leave Type"}
          size="xl"
          footer={
            <>
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} loading={create.isPending || update.isPending}>
                {editing ? "Save Changes" : "Create"}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Name" required error={errors.name}>
                <Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Annual Leave" invalid={!!errors.name} />
              </Field>
              <Field label="Code" required error={errors.code} hint="Lowercase snake_case identifier">
                <Input value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. annual" invalid={!!errors.code} disabled={!!editing} />
              </Field>
            </div>

            <Field label="Description" error={errors.description}>
              <Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of this leave type" />
            </Field>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Annual Allocation (days)" error={errors.annualAllocation}>
                <Input type="number" min={0} value={form.annualAllocation ?? 0} onChange={(e) => setForm({ ...form, annualAllocation: Number(e.target.value) })} />
              </Field>
              <Field label="Max Days / Request" error={errors.maxDaysPerRequest}>
                <Input type="number" min={1} value={form.maxDaysPerRequest ?? ""} onChange={(e) => setForm({ ...form, maxDaysPerRequest: e.target.value ? Number(e.target.value) : undefined })} placeholder="No limit" />
              </Field>
              <Field label="Min Notice (days)" error={errors.minimumNoticeDays}>
                <Input type="number" min={0} value={form.minimumNoticeDays ?? ""} onChange={(e) => setForm({ ...form, minimumNoticeDays: e.target.value ? Number(e.target.value) : undefined })} placeholder="0" />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Max Consecutive Days" error={errors.maximumConsecutiveDays}>
                <Input type="number" min={1} value={form.maximumConsecutiveDays ?? ""} onChange={(e) => setForm({ ...form, maximumConsecutiveDays: e.target.value ? Number(e.target.value) : undefined })} placeholder="No limit" />
              </Field>
              <Field label="Max Requests / Month" error={errors.maximumRequestsPerMonth}>
                <Input type="number" min={1} value={form.maximumRequestsPerMonth ?? ""} onChange={(e) => setForm({ ...form, maximumRequestsPerMonth: e.target.value ? Number(e.target.value) : undefined })} placeholder="No limit" />
              </Field>
              <Field label="Back-Date Limit (days)" error={errors.backDateLimitDays}>
                <Input type="number" min={1} value={form.backDateLimitDays ?? ""} onChange={(e) => setForm({ ...form, backDateLimitDays: e.target.value ? Number(e.target.value) : undefined })} placeholder="No limit" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Applicable Roles" hint="Comma-separated roles (empty = all)">
                <Select value={form.applicableRoles ?? ""} onChange={(e) => setForm({ ...form, applicableRoles: e.target.value })}>
                  {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </Select>
              </Field>
              <Field label="Sort Order">
                <Input type="number" min={0} value={form.sortOrder ?? 0} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
              </Field>
            </div>

            <div className="rounded-lg border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Rules & Flags</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: "isPaid", label: "Paid Leave" },
                  { key: "halfDayAllowed", label: "Half-Day Allowed" },
                  { key: "probationAllowed", label: "Probation Allowed" },
                  { key: "requiresMedicalCertificate", label: "Requires Medical Certificate" },
                  { key: "requiresAttachment", label: "Requires Attachment" },
                  { key: "futureDateAllowed", label: "Future Date Allowed" },
                  { key: "backDateAllowed", label: "Back-Date Allowed" },
                  { key: "weekendCounted", label: "Weekends Counted" },
                  { key: "holidayCounted", label: "Holidays Counted" },
                  { key: "negativeBalanceAllowed", label: "Negative Balance Allowed" },
                  { key: "resetEveryYear", label: "Reset Every Year" },
                  { key: "autoApprove", label: "Auto-Approve" },
                ].map((flag) => (
                  <label key={flag.key} className="flex items-center gap-2 text-sm text-foreground-secondary">
                    <input
                      type="checkbox"
                      checked={Boolean(form[flag.key as keyof LeaveTypeConfigFormValues])}
                      onChange={(e) => setForm({ ...form, [flag.key]: e.target.checked })}
                      className="h-4 w-4 rounded border-border accent-accent"
                    />
                    {flag.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Carry Forward & Encashment</h3>
              <div className="grid grid-cols-4 gap-3">
                <label className="flex items-center gap-2 text-sm text-foreground-secondary">
                  <input type="checkbox" checked={Boolean(form.carryForwardEnabled)} onChange={(e) => setForm({ ...form, carryForwardEnabled: e.target.checked })} className="h-4 w-4 rounded border-border accent-accent" />
                  Carry Forward
                </label>
                <Field label="CF Percentage" error={errors.carryForwardPercentage}>
                  <Input type="number" min={0} max={100} value={form.carryForwardPercentage ?? 0} onChange={(e) => setForm({ ...form, carryForwardPercentage: Number(e.target.value) })} />
                </Field>
                <Field label="Max CF (days)">
                  <Input type="number" min={0} value={form.maxCarryForward ?? ""} onChange={(e) => setForm({ ...form, maxCarryForward: e.target.value ? Number(e.target.value) : undefined })} placeholder="No limit" />
                </Field>
                <Field label="CF Expiry (months)">
                  <Input type="number" min={1} value={form.carryForwardExpiryMonths ?? ""} onChange={(e) => setForm({ ...form, carryForwardExpiryMonths: e.target.value ? Number(e.target.value) : undefined })} placeholder="No expiry" />
                </Field>
                <label className="flex items-center gap-2 text-sm text-foreground-secondary">
                  <input type="checkbox" checked={Boolean(form.encashmentEnabled)} onChange={(e) => setForm({ ...form, encashmentEnabled: e.target.checked })} className="h-4 w-4 rounded border-border accent-accent" />
                  Encashment
                </label>
                <Field label="Encashment %">
                  <Input type="number" min={0} max={100} value={form.encashmentPercentage ?? 0} onChange={(e) => setForm({ ...form, encashmentPercentage: Number(e.target.value) })} />
                </Field>
              </div>
            </div>

            <div className="rounded-lg border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Approval & Notifications</h3>
              <div className="grid grid-cols-4 gap-3">
                <label className="flex items-center gap-2 text-sm text-foreground-secondary">
                  <input type="checkbox" checked={Boolean(form.approvalRequired)} onChange={(e) => setForm({ ...form, approvalRequired: e.target.checked })} className="h-4 w-4 rounded border-border accent-accent" />
                  Approval Required
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground-secondary">
                  <input type="checkbox" checked={Boolean(form.notifyHR)} onChange={(e) => setForm({ ...form, notifyHR: e.target.checked })} className="h-4 w-4 rounded border-border accent-accent" />
                  Notify HR
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground-secondary">
                  <input type="checkbox" checked={Boolean(form.notifyMaster)} onChange={(e) => setForm({ ...form, notifyMaster: e.target.checked })} className="h-4 w-4 rounded border-border accent-accent" />
                  Notify Master
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground-secondary">
                  <input type="checkbox" checked={Boolean(form.notifyManager)} onChange={(e) => setForm({ ...form, notifyManager: e.target.checked })} className="h-4 w-4 rounded border-border accent-accent" />
                  Notify Manager
                </label>
              </div>
            </div>
          </div>
        </Modal>

        <ConfirmModal
          open={!!confirmId}
          onClose={() => setConfirmId(null)}
          onConfirm={confirmToggle}
          title={confirmAction === "activate" ? "Activate Leave Type?" : "Deactivate Leave Type?"}
          message={confirmAction === "activate" ? "This leave type will be available for new leave requests." : "This leave type will no longer be available for new leave requests. Existing requests remain unaffected."}
          confirmLabel={confirmAction === "activate" ? "Activate" : "Deactivate"}
          loading={activate.isPending || deactivate.isPending}
          danger={confirmAction === "deactivate"}
        />
      </div>
    </AccessGuard>
  );
}
