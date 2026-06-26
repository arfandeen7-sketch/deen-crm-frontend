"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { Field, Input } from "@/components/ui/Input";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { cn } from "@/lib/utils";
import { MANAGED_DYNAMIC_CATEGORIES } from "@/constants";
import {
  useDynamicFields,
  useDynamicFieldMutations,
} from "@/hooks/useDynamicFields";
import { getErrorMessage } from "@/services/api/client";
import { PermissionGuard } from "@/components/shared/Guards";
import type { DynamicField } from "@/types";

export default function DynamicFieldsPage() {
  const params = useParams<{ category: string }>();
  const config = MANAGED_DYNAMIC_CATEGORIES.find((c) => c.slug === params.category);

  const { data, isLoading, isError, refetch } = useDynamicFields(config?.category);
  const { create, update, remove } = useDynamicFieldMutations();

  const [editing, setEditing] = useState<DynamicField | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [value, setValue] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (!config) return notFound();

  function openCreate() {
    setEditing(null);
    setValue("");
    setModalOpen(true);
  }
  function openEdit(field: DynamicField) {
    setEditing(field);
    setValue(field.value);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!value.trim()) return toast.error("Enter a value");
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, body: { value: value.trim() } });
        toast.success("Field updated");
      } else {
        await create.mutateAsync({ category: config!.category, value: value.trim() });
        toast.success("Field added");
      }
      setModalOpen(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await remove.mutateAsync(deleteId);
      toast.success("Field deleted");
      setDeleteId(null);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  return (
    <PermissionGuard permission="dynamicFields.manage">
    <div className="space-y-5">
      <PageHeader
        title="Dynamic Fields"
        subtitle="Manage configurable dropdown values"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add {config.label}
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {MANAGED_DYNAMIC_CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/dynamic-fields/${c.slug}`}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              c.slug === config.slug
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
            )}
          >
            {c.label}
          </Link>
        ))}
      </div>

      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <LoadingState />
          ) : isError ? (
            <ErrorState onRetry={refetch} />
          ) : (data?.length ?? 0) === 0 ? (
            <EmptyState
              title={`No ${config.label.toLowerCase()} yet`}
              message="Add your first value to populate this dropdown."
              action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add value</Button>}
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data?.map((field) => (
                <li key={field.id} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm font-medium text-slate-800">{field.value}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(field)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleteId(field.id)} className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit ${config.label}` : `Add ${config.label}`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={create.isPending || update.isPending}>
              {editing ? "Save" : "Add"}
            </Button>
          </>
        }
      >
        <Field label="Value" required>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`Enter ${config.label.toLowerCase()}`}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            autoFocus
          />
        </Field>
      </Modal>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete value?"
        message="This may affect existing records that use this value."
        confirmLabel="Delete"
        loading={remove.isPending}
      />
    </div>
    </PermissionGuard>
  );
}
