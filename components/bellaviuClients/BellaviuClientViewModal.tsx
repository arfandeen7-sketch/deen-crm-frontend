"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { BellaviuDocumentField } from "./BellaviuDocumentField";
import { bellaviuClientsService } from "@/services/bellaviuClients/bellaviuClients.service";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { BellaviuClient } from "@/types";

interface BellaviuClientViewModalProps {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onChanged: () => void;
  record: BellaviuClient | null;
  setRecord: (r: BellaviuClient) => void;
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </span>
      <span className="text-sm text-neutral-900">{value || "—"}</span>
    </div>
  );
}

export function BellaviuClientViewModal({
  open,
  onClose,
  onEdit,
  onChanged,
  record,
  setRecord,
}: BellaviuClientViewModalProps) {
  if (!record) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="Bellaviu Client Details"
      description={`Created ${formatDateTime(record.createdAt)}${
        record.creator?.fullName ? ` by ${record.creator.fullName}` : ""
      }`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onEdit}>Edit</Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Row label="Name" value={record.name} />
          <Row label="Phone Number" value={record.phoneNumber} />
          <Row label="Alternative Number" value={record.alternativeNumber} />
          <Row label="Email" value={record.email} />
          <Row label="Check-In Date" value={formatDate(record.checkInDate)} />
          <Row label="Check-Out Date" value={formatDate(record.checkOutDate)} />
          <Row label="Booking Channel" value={record.bookingChannel} />
          <Row label="Emirates ID" value={record.emiratesId} />
          <Row label="Passport Number" value={record.passportNumber} />
          <Row label="Property Name" value={record.propertyName} />
          <Row label="Property Size" value={record.propertySize} />
          <Row label="Unit No." value={record.unitNo} />
          <Row label="Country of Client" value={record.countryOfClient} />
          <Row label="Location of Property" value={record.locationOfProperty} />
        </div>

        <div className="space-y-3 border-t border-neutral-100 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
            Documents
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <BellaviuDocumentField
              label="Passport PDF"
              fileName={record.passportFileName}
              uploadedAt={record.passportUploadedAt}
              uploaderName={record.passportUploader?.fullName ?? null}
              signedUrl={record.passportUrl}
              onUpload={(file) =>
                bellaviuClientsService
                  .uploadPassport(record.id, file)
                  .then((updated) => {
                    setRecord(updated);
                    onChanged();
                  })
              }
              onDelete={() =>
                bellaviuClientsService.deletePassport(record.id).then(() => {
                  setRecord({
                    ...record,
                    passportFilePath: null,
                    passportFileName: null,
                    passportMimeType: null,
                    passportUploadedAt: null,
                    passportUploadedBy: null,
                    passportUrl: null,
                  });
                  onChanged();
                })
              }
            />
            <BellaviuDocumentField
              label="Emirates ID PDF"
              fileName={record.emiratesIdFileName}
              uploadedAt={record.emiratesIdUploadedAt}
              uploaderName={record.emiratesUploader?.fullName ?? null}
              signedUrl={record.emiratesIdUrl}
              onUpload={(file) =>
                bellaviuClientsService
                  .uploadEmiratesId(record.id, file)
                  .then((updated) => {
                    setRecord(updated);
                    onChanged();
                  })
              }
              onDelete={() =>
                bellaviuClientsService.deleteEmiratesId(record.id).then(() => {
                  setRecord({
                    ...record,
                    emiratesIdFilePath: null,
                    emiratesIdFileName: null,
                    emiratesIdMimeType: null,
                    emiratesIdUploadedAt: null,
                    emiratesIdUploadedBy: null,
                    emiratesIdUrl: null,
                  });
                  onChanged();
                })
              }
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
