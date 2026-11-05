"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CanAccess } from "@/components/shared/Guards";
import { formatDateTime } from "@/lib/utils";
import {
  OPEN_HOUSE_EVENTS_PAGE,
  OPEN_HOUSE_LEADS_PAGE,
  OPEN_HOUSE_MODULE,
} from "@/constants/openHouse";
import { DetailRow, EventStatusBadge, formatEventWhen } from "./OpenHouseShared";
import type { OpenHouseEvent } from "@/types";

export function EventViewModal({
  open,
  onClose,
  onEdit,
  record,
}: {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  record: OpenHouseEvent | null;
}) {
  if (!record) return null;
  const leadCount = record._count?.leads ?? 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={record.eventName}
      description={`Created ${formatDateTime(record.createdAt)}${
        record.creator?.fullName ? ` by ${record.creator.fullName}` : ""
      }`}
      footer={
        <>
          <CanAccess module={OPEN_HOUSE_MODULE} page={OPEN_HOUSE_LEADS_PAGE} action="view">
            <Link href={`/open-house-events/leads?eventId=${record.id}`} className="mr-auto">
              <Button variant="secondary">
                <Users className="h-4 w-4" /> View Leads ({leadCount})
              </Button>
            </Link>
          </CanAccess>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <CanAccess module={OPEN_HOUSE_MODULE} page={OPEN_HOUSE_EVENTS_PAGE} action="edit">
            <Button onClick={onEdit}>Edit</Button>
          </CanAccess>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailRow label="Date & Time" value={formatEventWhen(record.eventDate, record.startTime, record.endTime)} />
          <DetailRow label="Status" value={<EventStatusBadge status={record.status} />} />
          <DetailRow label="Leads Collected" value={String(leadCount)} />
          <DetailRow label="Developer" value={record.developerName} />
          <DetailRow label="Location" value={record.location} />
          <DetailRow label="Hotel / Venue" value={record.venueName} />
          <DetailRow label="Expected Attendees" value={record.expectedAttendees != null ? String(record.expectedAttendees) : null} />
          <DetailRow label="Organizer" value={record.organizerName} />
          <DetailRow label="Organizer Contact" value={record.organizerContact} />
        </div>
        <div className="grid grid-cols-1 gap-4 border-t border-neutral-100 pt-4">
          <DetailRow label="Project Name" value={record.projectName} />
          <DetailRow label="Project Details" value={record.projectDetails} />
          <DetailRow label="Internal Notes" value={record.notes} />
        </div>
      </div>
    </Modal>
  );
}
