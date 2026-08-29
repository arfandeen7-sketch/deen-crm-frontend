"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Eye, Pencil, Trash2, Phone, Mail, Building2, Import, AlertTriangle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmModal, Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { UserAvatar } from "@/components/ui/Avatar";
import { AccessGuard, CanAccess } from "@/components/shared/Guards";
import { useOwnersList, useOwnerMutations } from "@/hooks/useOwners";
import { useIsMaster } from "@/hooks/useIsMaster";
import { getErrorMessage } from "@/services/api/client";
import { ownerManualPropertiesService } from "@/services/owners/ownerManualProperties.service";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import type { Owner, BulkDeleteImportedPreview } from "@/types";

export default function OwnersPage() {
  return (
    <AccessGuard module="owners" page="all_owners" action="view">
      <OwnersPageContent />
    </AccessGuard>
  );
}

function OwnersPageContent() {
  const router = useRouter();
  const isMaster = useIsMaster();
  const [params, setParams] = useState({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    search: "",
  });
  const { data, isLoading, isError, refetch } = useOwnersList(params);
  const { remove } = useOwnerMutations();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ── Bulk delete imported data state ─────────────────────────────────────────
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkPreview, setBulkPreview] = useState<BulkDeleteImportedPreview | null>(null);
  const [bulkPreviewLoading, setBulkPreviewLoading] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  async function handleOpenBulkDelete() {
    setShowBulkDeleteModal(true);
    setBulkPreview(null);
    setBulkPreviewLoading(true);
    try {
      const preview = await ownerManualPropertiesService.bulkDeletePreview();
      setBulkPreview(preview);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setShowBulkDeleteModal(false);
    } finally {
      setBulkPreviewLoading(false);
    }
  }

  async function handleConfirmBulkDelete() {
    setBulkDeleting(true);
    try {
      const result = await ownerManualPropertiesService.bulkDelete();
      toast.success(
        `Deleted ${result.propertiesDeleted} properties and ${result.ownersDeleted} owners` +
        (result.ownersKept > 0 ? ` (${result.ownersKept} owners kept)` : "")
      );
      setShowBulkDeleteModal(false);
      setBulkPreview(null);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBulkDeleting(false);
    }
  }

  const rows = data?.data ?? [];

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await remove.mutateAsync(deleteId);
      toast.success("Owner deleted");
      setDeleteId(null);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  const columns: Column<Owner>[] = [
    {
      key: "name",
      header: "Owner",
      render: (o) => (
        <div className="flex items-center gap-2.5">
          <UserAvatar name={o.fullName} size="sm" />
          <div>
            <p className="font-medium text-slate-900">{o.fullName}</p>
            {o.email && (
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <Mail className="h-3 w-3" /> {o.email}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "mobile",
      header: "Mobile",
      render: (o) => (
        <span className="flex items-center gap-1.5 text-slate-700">
          <Phone className="h-3.5 w-3.5 text-slate-400" /> {o.mobileNumber}
        </span>
      ),
    },
    {
      key: "emirate",
      header: "Emirate",
      render: (o) => o.emirate ?? "—",
    },
    {
      key: "properties",
      header: "Properties",
      render: (o) => {
        const linkedCount = o._count?.properties ?? 0;
        const manualCount = (o._count as any)?.manualProperties ?? 0;
        const total = linkedCount + manualCount;
        return (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              <Building2 className="h-3 w-3" />
              {total}
            </span>
            {manualCount > 0 && (
              <span className="text-[10px] text-slate-400" title={`${linkedCount} linked + ${manualCount} manual`}>
                ({linkedCount}+{manualCount})
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "",
      stickyRight: true,
      headerClassName: "text-right",
      className: "text-right",
      render: (o) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/owners/${o.id}`}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <CanAccess module="owners" page="all_owners" action="edit">
            <Link
              href={`/owners/${o.id}/edit`}
              className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-gray-900"
            >
              <Pencil className="h-4 w-4" />
            </Link>
          </CanAccess>
          <CanAccess module="owners" page="all_owners" action="delete">
            <button
              onClick={() => setDeleteId(o.id)}
              className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </CanAccess>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Owners"
        subtitle={data ? `${data.total} owners` : "Manage property owners and their portfolios"}
        actions={
          <>
            {isMaster && (
              <>
                <Button
                  variant="outline"
                  onClick={handleOpenBulkDelete}
                  className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                >
                  <Trash2 className="h-4 w-4" /> Clear Import Data
                </Button>
                <Button variant="outline" onClick={() => router.push("/owners/import")}>
                  <Import className="h-4 w-4" /> Import CSV
                </Button>
              </>
            )}
            <CanAccess module="owners" page="all_owners" action="create">
              <Button onClick={() => router.push("/owners/create")}>
                <Plus className="h-4 w-4" /> Add Owner
              </Button>
            </CanAccess>
          </>
        }
      />

      <Card className="flex flex-wrap items-center gap-2 p-4">
        <SearchInput
          value={params.search}
          onChange={(v) => setParams((p) => ({ ...p, search: v, page: 1 }))}
          placeholder="Search owners by name, mobile, email…"
          className="w-full sm:w-80"
        />
      </Card>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(o) => o.id}
        loading={isLoading}
        error={isError}
        onRetry={refetch}
        emptyTitle="No owners yet"
        emptyMessage="Add your first property owner to get started."
        onRowClick={(o) => router.push(`/owners/${o.id}`)}
      />

      {data && data.total > 0 && (
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          totalPages={data.totalPages}
          onPageChange={(p) => setParams((prev) => ({ ...prev, page: p }))}
          onPageSizeChange={(s) => setParams((prev) => ({ ...prev, pageSize: s, page: 1 }))}
        />
      )}

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete owner?"
        message="This will permanently remove the owner and all their linked properties. This cannot be undone."
        confirmLabel="Delete"
        loading={remove.isPending}
      />

      {/* ── Bulk Delete Import Data Modal ─────────────────────────────────── */}
      <Modal
        open={showBulkDeleteModal}
        onClose={() => { setShowBulkDeleteModal(false); setBulkPreview(null); }}
        title={
          <span className="flex items-center gap-2 text-rose-700">
            <AlertTriangle className="h-5 w-5" /> Clear All Import Data
          </span>
        }
        size="lg"
      >
        <div className="space-y-4">
          {/* Warning banner */}
          <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
            <div className="text-sm text-rose-800">
              <p className="font-semibold">This action cannot be undone.</p>
              <p className="mt-1">
                This will permanently delete all properties that were imported via CSV
                (flagged as imported). Owners created during import will also be deleted
                <strong> only if they have no Property Finder or Off-Market Listing properties</strong>.
                Owners with non-imported data will be kept.
              </p>
            </div>
          </div>

          {/* Loading state */}
          {bulkPreviewLoading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              <span className="ml-2 text-sm text-slate-500">Calculating impact…</span>
            </div>
          )}

          {/* Preview data */}
          {bulkPreview && !bulkPreviewLoading && (
            <>
              {/* Summary stats */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-center">
                  <p className="text-2xl font-bold text-rose-700">{bulkPreview.importedPropertiesCount}</p>
                  <p className="mt-0.5 text-xs font-medium text-rose-600">Properties to Delete</p>
                </div>
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-center">
                  <p className="text-2xl font-bold text-rose-700">{bulkPreview.ownersToDeleteCount}</p>
                  <p className="mt-0.5 text-xs font-medium text-rose-600">Owners to Delete</p>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center">
                  <p className="text-2xl font-bold text-blue-700">{bulkPreview.ownersToKeepCount}</p>
                  <p className="mt-0.5 text-xs font-medium text-blue-600">Owners to Keep</p>
                </div>
              </div>

              {/* Owners to be deleted (preview) */}
              {bulkPreview.ownersToDeletePreview.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Owners to be deleted ({bulkPreview.ownersToDeleteCount}
                    {bulkPreview.ownersToDeleteCount > bulkPreview.ownersToDeletePreview.length
                      ? ` — showing first ${bulkPreview.ownersToDeletePreview.length}`
                      : ""})
                  </p>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-neutral-200 divide-y divide-neutral-100">
                    {bulkPreview.ownersToDeletePreview.map((o) => (
                      <div key={o.id} className="flex items-center justify-between px-4 py-2.5">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{o.fullName}</p>
                          <p className="text-xs text-slate-500">{o.mobileNumber}{o.email ? ` · ${o.email}` : ""}</p>
                        </div>
                        <span className="text-xs text-slate-400">
                          {o._count.manualProperties} {o._count.manualProperties === 1 ? "property" : "properties"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {bulkPreview.importedPropertiesCount === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Building2 className="h-10 w-10 text-slate-200" />
                  <p className="mt-3 text-sm font-medium text-slate-600">No imported data found</p>
                  <p className="mt-1 text-xs text-slate-400">There are no imported properties to delete.</p>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-neutral-100 pt-4">
            <Button
              variant="outline"
              onClick={() => { setShowBulkDeleteModal(false); setBulkPreview(null); }}
              disabled={bulkDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmBulkDelete}
              disabled={
                bulkDeleting ||
                bulkPreviewLoading ||
                !bulkPreview ||
                bulkPreview.importedPropertiesCount === 0
              }
              loading={bulkDeleting}
            >
              <Trash2 className="h-4 w-4" /> Delete All Import Data
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
