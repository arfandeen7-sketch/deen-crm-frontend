"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CanAccess } from "@/components/shared/Guards";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  LEAD_PURPOSE_OPTIONS,
  OPEN_HOUSE_LEADS_PAGE,
  OPEN_HOUSE_MODULE,
  labelFor,
} from "@/constants/openHouse";
import { DetailRow, InterestBadge } from "./OpenHouseShared";
import { eventOptionLabel } from "./EventLeadFormModal";
import type { OpenHouseEventLead } from "@/types";

export function EventLeadViewModal({
  open,
  onClose,
  onEdit,
  record,
}: {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  record: OpenHouseEventLead | null;
}) {
  if (!record) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={record.clientName}
      description={`Added ${formatDateTime(record.createdAt)}${
        record.creator?.fullName ? ` by ${record.creator.fullName}` : ""
      }`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <CanAccess module={OPEN_HOUSE_MODULE} page={OPEN_HOUSE_LEADS_PAGE} action="edit">
            <Button onClick={onEdit}>Edit</Button>
          </CanAccess>
        </>
      }
    >
      <div className="space-y-5">
        <DetailRow label="Event" value={record.event ? eventOptionLabel(record.event) : null} />
        <div className="grid grid-cols-1 gap-4 border-t border-neutral-100 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailRow label="Mobile Number" value={record.mobileNumber} />
          <DetailRow label="Alternative Mobile" value={record.alternativeMobile} />
          <DetailRow label="Email" value={record.email} />
          <DetailRow label="Nationality" value={record.nationality} />
          <DetailRow label="Budget" value={record.budget != null ? formatCurrency(record.budget) : null} />
          <DetailRow label="Interest Level" value={record.interestLevel ? <InterestBadge level={record.interestLevel} /> : null} />
          <DetailRow label="Interested Project" value={record.interestedProject} />
          <DetailRow label="Property Type" value={record.propertyType} />
          <DetailRow label="Bedrooms" value={record.bedrooms} />
          <DetailRow label="Purpose" value={record.purpose ? labelFor(LEAD_PURPOSE_OPTIONS, record.purpose) : null} />
        </div>
        <div className="grid grid-cols-1 gap-4 border-t border-neutral-100 pt-4">
          <DetailRow label="Requirements" value={record.requirements} />
          <DetailRow label="Additional Notes" value={record.notes} />
        </div>
      </div>
    </Modal>
  );
}
