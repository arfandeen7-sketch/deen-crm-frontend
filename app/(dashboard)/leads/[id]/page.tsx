"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User as UserIcon,
  Building2,
  History,
  Handshake,
  DollarSign,
  Maximize2,
} from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/Modal";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { StatusBadge, PriorityBadge, Badge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/ui/Avatar";
import { CanAccess } from "@/components/shared/Guards";
import { useLead, useLeadMutations } from "@/hooks/useLeads";
import { useLeadActivity } from "@/hooks/useLeadActivity";
import { getErrorMessage } from "@/services/api/client";
import { formatDate, formatDateTime, humanize, timeAgo } from "@/lib/utils";

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm text-slate-800">{value ?? "—"}</p>
      </div>
    </div>
  );
}

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: lead, isLoading, isError, refetch } = useLead(params.id);
  const { remove } = useLeadMutations();
  const { data: activityData } = useLeadActivity(params.id);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"history" | "activity">("history");

  async function handleDelete() {
    try {
      await remove.mutateAsync(params.id);
      toast.success("Lead deleted");
      router.push("/leads");
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  if (isLoading) return <LoadingState />;
  if (isError || !lead) return <ErrorState onRetry={refetch} />;

  return (
    <div className="space-y-5">
      <Link href="/leads" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to leads
      </Link>

      <PageHeader
        title={lead.leadName}
        subtitle={`${lead.source} · ${lead.serviceType}`}
        actions={
          <>
            <Button variant="outline" onClick={() => router.push(`/leads/${lead.id}/edit`)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <CanAccess module="leads" page="all_leads" action="delete">
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </CanAccess>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={lead.leadStatus} />
        <PriorityBadge priority={lead.leadPriority} />
        <Badge>{humanize(lead.ingestionSource)}</Badge>
        {lead.isImported && <Badge>Imported</Badge>}
        {!lead.isTouched && (
          <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-600/20">
            Untouched
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader title="Lead Information" />
            <CardBody className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              <InfoRow icon={Phone} label="Mobile" value={lead.mobileNumber} />
              <InfoRow icon={Phone} label="Alternate Mobile" value={lead.alternateMobile} />
              <InfoRow icon={Mail} label="Email" value={lead.email} />
              <InfoRow icon={Building2} label="Project" value={lead.projectName} />
              <InfoRow icon={MapPin} label="City" value={lead.city} />
              <InfoRow icon={MapPin} label="Locality" value={lead.locality} />
              <InfoRow icon={Calendar} label="Lead Date" value={formatDate(lead.leadDate)} />
              <InfoRow icon={Calendar} label="Follow Up Date" value={formatDate(lead.followUpDate)} />
              {lead.price && <InfoRow icon={DollarSign} label="Price (AED)" value={lead.price} />}
              {lead.propertySize && <InfoRow icon={Maximize2} label="Property Size" value={`${lead.propertySize} sqft`} />}
              {lead.unitNumber && <InfoRow icon={Building2} label="Unit Number" value={lead.unitNumber} />}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Notes & Comments" />
            <CardBody>
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {lead.comments || "No comments recorded."}
              </p>
            </CardBody>
          </Card>

          <Card>
            {/* Tab bar */}
            <div className="flex gap-1 border-b border-slate-100 px-4 pt-3">
              {(["history", "activity"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`rounded-t-md px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === t
                      ? "border-b-2 border-gray-900 text-gray-900"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {t === "history" ? "Status History" : "Activity Log"}
                </button>
              ))}
            </div>

            <CardBody>
              {activeTab === "history" ? (
                lead.statusHistory && lead.statusHistory.length > 0 ? (
                  <ol className="relative space-y-4 border-l border-slate-200 pl-5">
                    {lead.statusHistory.map((h) => (
                      <li key={h.id} className="relative">
                        <span className="absolute -left-[1.55rem] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-indigo-500 ring-4 ring-indigo-50" />
                        <div className="flex flex-wrap items-center gap-2">
                          {h.oldStatus && (
                            <>
                              <StatusBadge status={h.oldStatus} />
                              <span className="text-slate-400">→</span>
                            </>
                          )}
                          <StatusBadge status={h.newStatus} />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {h.changer?.fullName ? `${h.changer.fullName} · ` : ""}
                          {formatDateTime(h.changedAt)}
                        </p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="flex items-center gap-2 text-sm text-slate-500">
                    <History className="h-4 w-4" /> No status changes yet.
                  </p>
                )
              ) : (
                activityData && activityData.data.length > 0 ? (
                  <ol className="relative space-y-4 border-l border-slate-200 pl-5">
                    {activityData.data.map((a) => (
                      <li key={a.id} className="relative">
                        <span className="absolute -left-[1.55rem] top-1 h-3 w-3 rounded-full bg-slate-400 ring-4 ring-slate-50" />
                        <p className="text-sm font-medium text-slate-800 capitalize">
                          {humanize(a.action)}
                        </p>
                        {a.metadata && Object.keys(a.metadata).length > 0 && (
                          <p className="mt-0.5 text-xs text-slate-500">
                            {Object.entries(a.metadata)
                              .map(([k, v]) => `${humanize(k)}: ${v}`)
                              .join(" · ")}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-slate-400">
                          {a.actor?.fullName ?? "System"} · {timeAgo(a.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="flex items-center gap-2 text-sm text-slate-500">
                    <History className="h-4 w-4" /> No activity recorded yet.
                  </p>
                )
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Assignment Information" />
            <CardBody className="space-y-3">
              <div className="flex items-center gap-3">
                <UserAvatar name={lead.assignedUser?.fullName} size="sm" />
                <div>
                  <p className="text-xs text-slate-500">Assigned To</p>
                  <p className="text-sm font-medium text-slate-800">
                    {lead.assignedUser?.fullName ?? "Unassigned"}
                  </p>
                </div>
              </div>
              <InfoRow
                icon={UserIcon}
                label="Created By"
                value={
                  lead.creator?.fullName
                    ? `${lead.creator.fullName} · ${formatDateTime(lead.createdAt)}`
                    : formatDateTime(lead.createdAt)
                }
              />
              <InfoRow icon={Handshake} label="Broker" value={lead.broker?.brokerName} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Activity" />
            <CardBody className="space-y-1">
              <InfoRow icon={Calendar} label="Created" value={formatDateTime(lead.createdAt)} />
              <InfoRow icon={Calendar} label="Last Updated" value={formatDateTime(lead.updatedAt)} />
            </CardBody>
          </Card>
        </div>
      </div>

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete lead?"
        message="This will permanently remove the lead and its history."
        confirmLabel="Delete"
        loading={remove.isPending}
      />
    </div>
  );
}
