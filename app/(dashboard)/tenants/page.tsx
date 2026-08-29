"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  UserCircle2,
  Phone,
  Mail,
  ExternalLink,
  FileText,
  CreditCard,
  CalendarClock,
  Home,
  Upload,
  Trash2,
  Building2,
  User,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { AccessGuard } from "@/components/shared/Guards";
import { useTenantsList } from "@/hooks/useTenants";
import { useIsMaster } from "@/hooks/useIsMaster";
import { tenantsService } from "@/services/tenants/tenants.service";
import { getErrorMessage } from "@/services/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { displayValue, formatDate, formatCurrency } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import type { Tenant, TenantBulkDeletePreview } from "@/types";

/** Whole-day difference between an end date and now (negative if already expired). */
function remainingDays(endDate?: string | null): number | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  if (isNaN(end.getTime())) return null;
  const now = new Date();
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const ms = endDay.getTime() - todayDay.getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

function RemainingDaysBadge({ days }: { days: number | null }) {
  if (days == null) return <span className="text-slate-400">—</span>;
  if (days < 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
        Expired
      </span>
    );
  }
  if (days <= 7) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
        {days}d left
      </span>
    );
  }
  if (days <= 30) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
        {days}d left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
      {days}d left
    </span>
  );
}

/** Resolve the property label from either OwnerProperty or OwnerManualProperty. */
function propertyLabel(t: Tenant): string | null {
  if (t.ownerManualProperty) {
    const mp = t.ownerManualProperty;
    const parts = [mp.buildingName, mp.unitNumber && `Unit ${mp.unitNumber}`, mp.community].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  }
  if (t.ownerProperty) {
    const op = t.ownerProperty;
    const parts = [op.building ?? op.projectName, op.unitNumber && `Unit ${op.unitNumber}`, op.community].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  }
  // Fallback to lead projectName
  return t.lead?.projectName ?? null;
}

export default function TenantsPage() {
  return (
    <AccessGuard module="tenant_details" page="all_tenants" action="view">
      <TenantsPageContent />
    </AccessGuard>
  );
}

function TenantsPageContent() {
  const router = useRouter();
  const isMaster = useIsMaster();
  const qc = useQueryClient();
  const [params, setParams] = useState({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    search: "",
  });
  const { data, isLoading, isError, refetch } = useTenantsList(params);
  const rows = data?.data ?? [];

  // ── Bulk delete state ──────────────────────────────────────────────────────
  const [deletePreview, setDeletePreview] = useState<TenantBulkDeletePreview | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteExecuting, setDeleteExecuting] = useState(false);

  async function handleDeletePreview() {
    setDeleteLoading(true);
    try {
      const preview = await tenantsService.bulkDeletePreview();
      setDeletePreview(preview);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleDeleteExecute() {
    setDeleteExecuting(true);
    try {
      const result = await tenantsService.bulkDelete();
      toast.success(
        `Deleted ${result.tenantsDeleted} tenants, ${result.leadsDeleted} leads, ${result.propertiesDeleted} properties, ${result.ownersDeleted} owners.`,
      );
      setDeletePreview(null);
      qc.invalidateQueries({ queryKey: ["tenants"] });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setDeleteExecuting(false);
    }
  }

  const columns: Column<Tenant>[] = [
    {
      key: "tenant",
      header: "Tenant Name",
      render: (t) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <UserCircle2 className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{displayValue(t.fullName)}</p>
            <p className="text-xs text-slate-500">
              {displayValue(t.tenantNationality, "—")}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Email / Phone",
      render: (t) => (
        <div className="space-y-0.5">
          {t.email && (
            <span className="flex items-center gap-1.5 text-sm text-slate-700">
              <Mail className="h-3.5 w-3.5 text-slate-400" /> {t.email}
            </span>
          )}
          {t.mobileNumber && (
            <span className="flex items-center gap-1.5 text-sm text-slate-500">
              <Phone className="h-3.5 w-3.5 text-slate-400" /> {t.mobileNumber}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "owner",
      header: "Owner",
      render: (t) => (
        <div className="space-y-0.5">
          {t.owner ? (
            <>
              <Link
                href={`/owners/${t.owner.id}`}
                className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
                onClick={(e) => e.stopPropagation()}
              >
                <User className="h-3.5 w-3.5 text-slate-400" /> {t.owner.fullName}
              </Link>
              {t.owner.mobileNumber && (
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Phone className="h-3 w-3 text-slate-400" /> {t.owner.mobileNumber}
                </span>
              )}
            </>
          ) : (
            <span className="text-sm text-slate-400">—</span>
          )}
        </div>
      ),
    },
    {
      key: "property",
      header: "Property",
      render: (t) => {
        const label = propertyLabel(t);
        return (
          <span className="flex items-center gap-1.5 text-sm text-slate-700">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{displayValue(label)}</span>
          </span>
        );
      },
    },
    {
      key: "rent",
      header: "Annual Rent",
      render: (t) => (
        <div className="space-y-0.5">
          {t.annualRent != null ? (
            <span className="text-sm font-semibold text-slate-900">
              {formatCurrency(Number(t.annualRent))}
            </span>
          ) : (
            <span className="text-sm text-slate-400">—</span>
          )}
          {t.modeOfPayment && (
            <span className="block text-xs text-slate-500">{t.modeOfPayment}</span>
          )}
        </div>
      ),
    },
    {
      key: "ids",
      header: "Passport / EID",
      render: (t) => (
        <div className="space-y-0.5">
          <span className="flex items-center gap-1.5 text-sm text-slate-700">
            <FileText className="h-3.5 w-3.5 text-slate-400" /> {displayValue(t.passportNumber)}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-slate-500">
            <CreditCard className="h-3.5 w-3.5 text-slate-400" /> {displayValue(t.emiratesIdNumber)}
          </span>
        </div>
      ),
    },
    {
      key: "agreementStart",
      header: "Start Date",
      render: (t) => (
        <span className="whitespace-nowrap text-sm text-slate-700">
          {formatDate(t.agreementStartDate)}
        </span>
      ),
    },
    {
      key: "agreementEnd",
      header: "End Date",
      render: (t) => (
        <span className="whitespace-nowrap text-sm text-slate-700">
          {formatDate(t.agreementEndDate)}
        </span>
      ),
    },
    {
      key: "remaining",
      header: "Remaining",
      render: (t) => <RemainingDaysBadge days={remainingDays(t.agreementEndDate)} />,
    },
    {
      key: "cheques",
      header: "Cheques",
      render: (t) => (
        <span className="text-sm text-slate-700">
          {t.cheques && t.cheques.length > 0 ? `${t.cheques.length} cheques` : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      stickyRight: true,
      headerClassName: "text-right",
      className: "text-right",
      render: (t) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/tenants/${t.leadId}`}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            title="View tenant profile"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
          <Link
            href={`/leads/${t.leadId}`}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            title="View lead"
          >
            <CalendarClock className="h-4 w-4" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tenant Details"
        subtitle={data ? `${data.total} tenants` : "All tenant records"}
        actions={
          isMaster && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/tenants/import")}
              >
                <Upload className="h-4 w-4" /> Import
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeletePreview}
                loading={deleteLoading}
                className="text-red-600 hover:border-red-300 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" /> Delete Imported
              </Button>
            </div>
          )
        }
      />

      <Card className="flex flex-wrap items-center gap-2 p-4">
        <SearchInput
          value={params.search}
          onChange={(v) => setParams((p) => ({ ...p, search: v, page: 1 }))}
          placeholder="Search by name, mobile, email, passport, Emirates ID…"
          className="w-full sm:w-96"
        />
      </Card>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(t) => t.id}
        loading={isLoading}
        error={isError}
        onRetry={refetch}
        emptyTitle="No tenants"
        emptyMessage="Tenant records are created when rental leads are closed and tenant details are saved."
        onRowClick={(t) => router.push(`/tenants/${t.leadId}`)}
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

      {/* ── Bulk Delete Imported Data Modal ─────────────────────────────────── */}
      <Modal
        open={!!deletePreview}
        onClose={() => setDeletePreview(null)}
        title="Delete All Imported Tenant Data"
        size="lg"
      >
        {deletePreview && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <p className="text-xs text-red-800">
                This will permanently delete all tenant data imported via the Zoho CSV import.
                This action cannot be undone.
              </p>
            </div>

            {/* Summary stats */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
                <p className="text-2xl font-bold text-red-700">{deletePreview.tenantsCount}</p>
                <p className="mt-0.5 text-xs font-medium text-red-600">Tenants</p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
                <p className="text-2xl font-bold text-amber-700">{deletePreview.leadsCount}</p>
                <p className="mt-0.5 text-xs font-medium text-amber-600">Leads</p>
              </div>
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-center">
                <p className="text-2xl font-bold text-purple-700">{deletePreview.propertiesCount}</p>
                <p className="mt-0.5 text-xs font-medium text-purple-600">Properties</p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">{deletePreview.ownersToDeleteCount}</p>
                <p className="mt-0.5 text-xs font-medium text-blue-600">Owners to Delete</p>
              </div>
            </div>

            {deletePreview.ownersToKeepCount > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" />
                <p className="text-xs text-blue-800">
                  {deletePreview.ownersToKeepCount} owner(s) will be kept — they have other
                  properties or tenants not from this import.
                </p>
              </div>
            )}

            {/* Preview list */}
            {deletePreview.tenantsPreview.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Tenants to be deleted (first {deletePreview.tenantsPreview.length})
                </p>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-neutral-200 divide-y divide-neutral-100">
                  {deletePreview.tenantsPreview.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 px-4 py-2">
                      <Trash2 className="h-3.5 w-3.5 shrink-0 text-red-400" />
                      <span className="text-xs text-slate-700">
                        {t.fullName ?? "Unknown"}
                        {t.externalZohoId && (
                          <span className="ml-2 text-slate-400">Zoho ID: {t.externalZohoId}</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
              <Button variant="outline" onClick={() => setDeletePreview(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleDeleteExecute}
                loading={deleteExecuting}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" /> Delete All Imported Data
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
