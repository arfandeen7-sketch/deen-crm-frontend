"use client";

import Link from "next/link";
import { Calendar, ExternalLink, History, Lock, Pencil, Trash2 } from "lucide-react";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/ui/Avatar";
import { CanAccess } from "@/components/shared/Guards";
import { LeadQuickActions } from "@/components/leads/LeadQuickActions";
import { OfferingTypeBadge } from "@/components/leads/OfferingTypeBadge";
import type { Column } from "@/components/tables/DataTable";
import { displayValue, formatDate, formatDateTime, isEmptyDisplayValue } from "@/lib/utils";
import type { Lead, LeadQueryParams } from "@/types";

/**
 * All Leads columns, shared with Deal Closed so both tables stay aligned.
 *
 * Deal Closed adds, before Actions: Sales User, Closed By, Deal Closed, Sales Value.
 * Those extras are composed by the Deal Closed page.
 */
export function buildLeadColumns({
  dateField,
  onOpenHistory,
  onDelete,
  canMutate,
  editHref,
}: {
  dateField?: LeadQueryParams["dateField"];
  onOpenHistory: (lead: { id: string; name: string }) => void;
  onDelete: (id: string) => void;
  /** When omitted, row actions follow the normal lead permissions. */
  canMutate?: (lead: Lead) => boolean;
  editHref?: (id: string) => string;
}): Column<Lead>[] {
  const allow = (lead: Lead) => (canMutate ? canMutate(lead) : true);
  const Dash = () => <span className="text-sm text-slate-400">—</span>;

  return [
    {
      key: "name",
      header: "Name",
      sortKey: "leadName",
      render: (l) => (
        <div className="flex items-center gap-2.5">
          <UserAvatar name={displayValue(l.leadName, "Lead")} size="sm" />
          <div>
            <p className="font-medium text-slate-900">
              {displayValue(l.leadName)}
              {!isEmptyDisplayValue(l.lastName) ? ` ${l.lastName}` : ""}
            </p>
            {l.email && <p className="text-xs text-slate-400">{l.email}</p>}
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (l) => (
        <div>
          <p className="text-sm text-slate-700">{displayValue(l.mobileNumber)}</p>
          {!isEmptyDisplayValue(l.alternateMobile) && (
            <p className="text-xs text-slate-400">{displayValue(l.alternateMobile)}</p>
          )}
        </div>
      ),
    },
    {
      key: "nationality",
      header: "Nationality",
      render: (l) =>
        !isEmptyDisplayValue(l.nationality) ? (
          <span className="text-sm text-slate-700">{displayValue(l.nationality)}</span>
        ) : (
          <Dash />
        ),
    },
    {
      key: "source",
      header: "Source",
      sortKey: "source",
      render: (l) => (
        <div className="space-y-0.5">
          <p className="text-sm text-slate-700">{displayValue(l.source)}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortKey: "status",
      render: (l) => (
        <div className="flex flex-wrap items-center gap-1">
          <StatusBadge status={l.leadStatus} />
          {l.convertedToOwnerId ? (
            <span className="inline-flex items-center rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-800">
              Converted to owner
            </span>
          ) : dateField === "manual" || dateField === "master_assigned" ? (
            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Active
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "assigned",
      header: "Assigned To",
      render: (l) =>
        l.assignedUser ? (
          <span className="text-sm text-slate-700">{l.assignedUser.fullName}</span>
        ) : (
          <span className="text-xs text-slate-400">Unassigned</span>
        ),
    },
    {
      key: "assignmentHistory",
      header: "Assignment History",
      render: (l) => {
        const hasAssignment = l.assignedByUser || l.assignedUser || l.assignedAt;
        if (!hasAssignment) return <Dash />;

        const assigner = l.assignedByUser?.fullName;
        const assignee = l.assignedUser?.fullName;
        const flow =
          assigner && assignee ? `${assigner} → ${assignee}` : (assigner ?? assignee ?? null);
        if (!flow) return <Dash />;

        const moreCount = Math.max(0, (l.assignmentCount ?? 0) - 1);
        const name = `${l.leadName}${l.lastName ? ` ${l.lastName}` : ""}`;

        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-medium text-slate-800">{flow}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenHistory({ id: l.id, name });
                }}
                className="shrink-0 cursor-pointer rounded p-0.5 text-slate-400 transition-colors hover:text-blue-600"
                title="View assignment history"
              >
                <History className="h-3.5 w-3.5" />
              </button>
            </div>
            {l.assignedAt && <p className="text-xs text-slate-400">{formatDateTime(l.assignedAt)}</p>}
            {moreCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenHistory({ id: l.id, name });
                }}
                className="cursor-pointer text-xs text-blue-600 hover:text-blue-700 hover:underline"
              >
                (+{moreCount} more)
              </button>
            )}
          </div>
        );
      },
    },
    { key: "priority", header: "Priority", render: (l) => <PriorityBadge priority={l.leadPriority} /> },
    {
      key: "broker",
      header: "Broker",
      render: (l) =>
        l.broker ? <span className="text-sm text-slate-700">{l.broker.brokerName}</span> : <Dash />,
    },
    {
      key: "project",
      header: "Project",
      render: (l) =>
        l.pfBuildingName ? (
          <span className="text-sm text-slate-700">{l.pfBuildingName}</span>
        ) : l.projectName ? (
          <span className="text-sm text-slate-700">{l.projectName}</span>
        ) : (
          <Dash />
        ),
    },
    {
      key: "community",
      header: "Community",
      render: (l) =>
        l.pfCommunityName ? (
          <span className="text-sm text-slate-700">{l.pfCommunityName}</span>
        ) : (
          <Dash />
        ),
    },
    {
      key: "type",
      header: "Type",
      render: (l) =>
        l.pfPropertyType ? (
          <span className="text-sm capitalize text-slate-700">{l.pfPropertyType}</span>
        ) : (
          <Dash />
        ),
    },
    {
      key: "category",
      header: "Category",
      render: (l) =>
        l.pfPropertyCategory ? (
          <span className="text-sm capitalize text-slate-700">{l.pfPropertyCategory}</span>
        ) : (
          <Dash />
        ),
    },
    {
      key: "offering",
      header: "For Sale / Rent",
      render: (l) => <OfferingTypeBadge lead={l} />,
    },
    {
      key: "price",
      header: "Price",
      sortKey: "price",
      render: (l) =>
        l.price ? (
          <span className="text-sm font-medium text-slate-800">
            AED {Number(l.price).toLocaleString()}
          </span>
        ) : (
          <Dash />
        ),
    },
    {
      key: "unit",
      header: "Unit",
      render: (l) =>
        l.unitNumber ? <span className="text-sm text-slate-700">{l.unitNumber}</span> : <Dash />,
    },
    {
      key: "buildingNo",
      header: "Building No.",
      render: (l) =>
        l.buildingNo ? <span className="text-sm text-slate-700">{l.buildingNo}</span> : <Dash />,
    },
    {
      key: "size",
      header: "Size",
      render: (l) =>
        l.propertySize ? (
          <span className="text-sm text-slate-700">{l.propertySize} sqft</span>
        ) : (
          <Dash />
        ),
    },
    {
      key: "configuration",
      header: "Configuration",
      render: (l) =>
        l.configuration ? (
          <span className="text-sm text-slate-700">{l.configuration}</span>
        ) : (
          <Dash />
        ),
    },
    {
      key: "inquiry",
      header: "Inquiry Date",
      render: (l) => (
        <div className="space-y-0.5">
          <p className="flex items-center gap-1 text-xs text-slate-600">
            <Calendar className="h-3 w-3 text-slate-400" />
            {formatDate(l.leadDate)}
          </p>
          {l.followUpDate && (
            <p className="text-xs text-slate-400">Follow up: {formatDate(l.followUpDate)}</p>
          )}
        </div>
      ),
    },
    {
      key: "createdBy",
      header: "Created By",
      sortKey: "createdAt",
      render: (l) => (
        <div>
          <p className="text-sm text-slate-700">{l.creator?.fullName ?? "—"}</p>
          <p className="text-xs text-slate-400">{formatDateTime(l.createdAt)}</p>
        </div>
      ),
    },
    {
      key: "comments",
      header: "Comments",
      render: (l) =>
        l.comments ? (
          <span className="line-clamp-2 max-w-[200px] truncate text-sm text-slate-600" title={l.comments}>
            {l.comments}
          </span>
        ) : (
          <Dash />
        ),
    },
    {
      key: "actions",
      header: "",
      stickyRight: true,
      headerClassName: "text-right",
      className: "text-right",
      render: (l) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {l.responseLink && (
            <a
              href={l.responseLink}
              target="_blank"
              rel="noopener noreferrer"
              title="View in Property Finder"
              className="rounded p-1.5 text-slate-400 hover:text-blue-600"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          {allow(l) ? (
            <Link href={editHref ? editHref(l.id) : `/leads/${l.id}/edit`} className="rounded p-1.5 text-slate-400 hover:text-gray-900">
              <Pencil className="h-4 w-4" />
            </Link>
          ) : (
            <span
              className="rounded p-1.5 text-slate-300"
              title="Locked. Only a Master user can edit a closed deal."
            >
              <Lock className="h-4 w-4" />
            </span>
          )}
          {allow(l) && (
            <CanAccess module="leads" page="all_leads" action="delete">
              <button
                onClick={() => onDelete(l.id)}
                className="rounded p-1.5 text-slate-400 hover:text-rose-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </CanAccess>
          )}
          <LeadQuickActions lead={l} locked={!allow(l)} />
        </div>
      ),
    },
  ];
}
