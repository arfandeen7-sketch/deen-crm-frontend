"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CanAccess } from "@/components/shared/Guards";
import { formatDateTime } from "@/lib/utils";
import {
  OPEN_HOUSE_MODULE,
  OPEN_HOUSE_RSVP_PAGE,
  RSVP_ARRIVAL_SLOTS,
  RSVP_BUDGET_OPTIONS,
  RSVP_INTEREST_OPTIONS,
  labelFor,
} from "@/constants/openHouse";
import { DetailRow, RsvpStatusBadge, formatEventWhen } from "./OpenHouseShared";
import type { OpenHouseRsvp } from "@/types";

export function RsvpViewModal({
  open,
  onClose,
  onEdit,
  record,
}: {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  record: OpenHouseRsvp | null;
}) {
  if (!record) return null;
  const event = record.event;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={record.guestName}
      description={`Added ${formatDateTime(record.createdAt)}${
        record.creator?.fullName ? ` by ${record.creator.fullName}` : ""
      }`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <CanAccess module={OPEN_HOUSE_MODULE} page={OPEN_HOUSE_RSVP_PAGE} action="edit">
            <Button onClick={onEdit}>Edit</Button>
          </CanAccess>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DetailRow
          label="Event"
          className="sm:col-span-2 lg:col-span-3"
          value={event ? `${event.eventName} — ${formatEventWhen(event.eventDate, event.startTime, event.endTime)}` : undefined}
        />
        <DetailRow label="Developer" value={event?.developerName} />
        <DetailRow label="Location" value={event?.location} />
        <DetailRow label="Hotel / Venue" value={event?.venueName} />
        <DetailRow label="Mobile" value={record.mobile} />
        <DetailRow label="People Coming With" value={String(record.peopleComingWith)} />
        <DetailRow label="Expected Arrival" value={labelFor(RSVP_ARRIVAL_SLOTS, record.expectedArrival)} />
        <DetailRow label="Status" value={<RsvpStatusBadge status={record.status} />} />
        <DetailRow label="Interested In" value={labelFor(RSVP_INTEREST_OPTIONS, record.interestedIn)} />
        <DetailRow label="Budget" value={labelFor(RSVP_BUDGET_OPTIONS, record.budget)} />
        <DetailRow label="Created By" value={record.creator?.fullName} />
        <DetailRow
          label="Updated By"
          value={record.updater?.fullName ? `${record.updater.fullName} · ${formatDateTime(record.updatedAt)}` : undefined}
        />
        <DetailRow label="Notes" className="sm:col-span-2 lg:col-span-3" value={record.notes} />
      </div>
    </Modal>
  );
}
