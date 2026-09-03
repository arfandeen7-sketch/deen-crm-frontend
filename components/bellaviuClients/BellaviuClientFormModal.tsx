"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { BellaviuDocumentField } from "./BellaviuDocumentField";
import { CanAccess } from "@/components/shared/Guards";
import { bellaviuClientsService } from "@/services/bellaviuClients/bellaviuClients.service";
import { getErrorMessage } from "@/services/api/client";
import type { BellaviuClient } from "@/types";

const BOOKING_CHANNELS = [
  "Direct",
  "Booking.com",
  "Airbnb",
  "Expedia",
  "Agoda",
  "Travel Agent",
  "Walk-in",
  "Other",
];

export interface BellaviuClientFormValue {
  name: string;
  phoneNumber?: string;
  alternativeNumber?: string;
  email?: string;
  checkInDate?: string;
  checkOutDate?: string;
  bookingChannel?: string;
  emiratesId?: string;
  passportNumber?: string;
  propertyName?: string;
  propertySize?: string;
  unitNo?: string;
  countryOfClient?: string;
  locationOfProperty?: string;
}

interface BellaviuClientFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** Existing record for edit mode; undefined = create mode */
  record?: BellaviuClient | null;
}

function toDateInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // yyyy-mm-dd in local time
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export function BellaviuClientFormModal({
  open,
  onClose,
  onSaved,
  record,
}: BellaviuClientFormModalProps) {
  const isEdit = !!record;
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState<BellaviuClient | null>(record ?? null);

  const [form, setForm] = useState<BellaviuClientFormValue>({
    name: "",
    phoneNumber: "",
    alternativeNumber: "",
    email: "",
    checkInDate: "",
    checkOutDate: "",
    bookingChannel: "",
    emiratesId: "",
    passportNumber: "",
    propertyName: "",
    propertySize: "",
    unitNo: "",
    countryOfClient: "",
    locationOfProperty: "",
  });

  useEffect(() => {
    if (open) {
      setCurrent(record ?? null);
      setForm({
        name: record?.name ?? "",
        phoneNumber: record?.phoneNumber ?? "",
        alternativeNumber: record?.alternativeNumber ?? "",
        email: record?.email ?? "",
        checkInDate: toDateInput(record?.checkInDate),
        checkOutDate: toDateInput(record?.checkOutDate),
        bookingChannel: record?.bookingChannel ?? "",
        emiratesId: record?.emiratesId ?? "",
        passportNumber: record?.passportNumber ?? "",
        propertyName: record?.propertyName ?? "",
        propertySize: record?.propertySize ?? "",
        unitNo: record?.unitNo ?? "",
        countryOfClient: record?.countryOfClient ?? "",
        locationOfProperty: record?.locationOfProperty ?? "",
      });
    }
  }, [open, record]);

  function setField<K extends keyof BellaviuClientFormValue>(
    key: K,
    value: BellaviuClientFormValue[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Enter a valid email");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (isEdit && record) {
        const updated = await bellaviuClientsService.update(record.id, payload);
        setCurrent(updated);
        toast.success("Bellaviu client updated");
      } else {
        const created = await bellaviuClientsService.create(payload);
        setCurrent(created);
        toast.success("Bellaviu client created");
      }
      onSaved();
      if (!isEdit) onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // After create, switch into "edit" mode so the user can upload documents
  // to the just-created record without reopening.
  const effectiveRecord = useMemo(() => current ?? record ?? null, [current, record]);
  const showDocuments = isEdit || !!current;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={isEdit ? "Edit Bellaviu Client" : "Add Bellaviu Client"}
      description={isEdit ? "Update guest and stay details." : "Create a new Bellaviu guest record."}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name" required>
            <Input
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Guest full name"
              required
            />
          </Field>
          <Field label="Phone Number">
            <Input
              value={form.phoneNumber}
              onChange={(e) => setField("phoneNumber", e.target.value)}
              placeholder="+971 ..."
            />
          </Field>
          <Field label="Alternative Number">
            <Input
              value={form.alternativeNumber}
              onChange={(e) => setField("alternativeNumber", e.target.value)}
              placeholder="+971 ..."
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="guest@example.com"
            />
          </Field>
          <Field label="Check-In Date">
            <Input
              type="date"
              value={form.checkInDate}
              onChange={(e) => setField("checkInDate", e.target.value)}
            />
          </Field>
          <Field label="Check-Out Date">
            <Input
              type="date"
              value={form.checkOutDate}
              onChange={(e) => setField("checkOutDate", e.target.value)}
            />
          </Field>
          <Field label="Booking Channel">
            <Select
              value={form.bookingChannel}
              onChange={(e) => setField("bookingChannel", e.target.value)}
              placeholder="Select channel"
            >
              <option value="">Select channel</option>
              {BOOKING_CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Emirates ID">
            <Input
              value={form.emiratesId}
              onChange={(e) => setField("emiratesId", e.target.value)}
              placeholder="784-XXXX-XXXXXXX-X"
            />
          </Field>
          <Field label="Passport Number">
            <Input
              value={form.passportNumber}
              onChange={(e) => setField("passportNumber", e.target.value)}
              placeholder="Passport number"
            />
          </Field>
          <Field label="Property Name">
            <Input
              value={form.propertyName}
              onChange={(e) => setField("propertyName", e.target.value)}
              placeholder="Property / building name"
            />
          </Field>
          <Field label="Property Size">
            <Input
              value={form.propertySize}
              onChange={(e) => setField("propertySize", e.target.value)}
              placeholder="e.g. 1200 sqft"
            />
          </Field>
          <Field label="Unit No.">
            <Input
              value={form.unitNo}
              onChange={(e) => setField("unitNo", e.target.value)}
              placeholder="Unit number"
            />
          </Field>
          <Field label="Country of Client">
            <Input
              value={form.countryOfClient}
              onChange={(e) => setField("countryOfClient", e.target.value)}
              placeholder="Country"
            />
          </Field>
          <Field label="Location of Property">
            <Input
              value={form.locationOfProperty}
              onChange={(e) => setField("locationOfProperty", e.target.value)}
              placeholder="City / community"
            />
          </Field>
        </div>

        {showDocuments && effectiveRecord && (
          <div className="space-y-3 border-t border-neutral-100 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
              Documents
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <BellaviuDocumentField
                label="Passport PDF"
                fileName={effectiveRecord.passportFileName}
                uploadedAt={effectiveRecord.passportUploadedAt}
                uploaderName={effectiveRecord.passportUploader?.fullName ?? null}
                signedUrl={effectiveRecord.passportUrl}
                onUpload={(file) =>
                  bellaviuClientsService
                    .uploadPassport(effectiveRecord.id, file)
                    .then((updated) => {
                      setCurrent(updated);
                      onSaved();
                    })
                }
                onDelete={() =>
                  bellaviuClientsService
                    .deletePassport(effectiveRecord.id)
                    .then(() => {
                      setCurrent((c) =>
                        c
                          ? {
                              ...c,
                              passportFilePath: null,
                              passportFileName: null,
                              passportMimeType: null,
                              passportUploadedAt: null,
                              passportUploadedBy: null,
                              passportUrl: null,
                            }
                          : c,
                      );
                      onSaved();
                    })
                }
              />
              <BellaviuDocumentField
                label="Emirates ID PDF"
                fileName={effectiveRecord.emiratesIdFileName}
                uploadedAt={effectiveRecord.emiratesIdUploadedAt}
                uploaderName={effectiveRecord.emiratesUploader?.fullName ?? null}
                signedUrl={effectiveRecord.emiratesIdUrl}
                onUpload={(file) =>
                  bellaviuClientsService
                    .uploadEmiratesId(effectiveRecord.id, file)
                    .then((updated) => {
                      setCurrent(updated);
                      onSaved();
                    })
                }
                onDelete={() =>
                  bellaviuClientsService
                    .deleteEmiratesId(effectiveRecord.id)
                    .then(() => {
                      setCurrent((c) =>
                        c
                          ? {
                              ...c,
                              emiratesIdFilePath: null,
                              emiratesIdFileName: null,
                              emiratesIdMimeType: null,
                              emiratesIdUploadedAt: null,
                              emiratesIdUploadedBy: null,
                              emiratesIdUrl: null,
                            }
                          : c,
                      );
                      onSaved();
                    })
                }
              />
            </div>
            {!isEdit && (
              <p className="text-xs text-neutral-400">
                Record created — you can now upload documents above. Close when done.
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 border-t border-neutral-100 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            {isEdit ? "Close" : "Cancel"}
          </Button>
          <CanAccess
            module="bellaviu_client_data"
            page="all_bellaviu_clients"
            action={isEdit ? "edit" : "create"}
          >
            <Button type="submit" loading={saving}>
              {isEdit ? "Save Changes" : "Create Client"}
            </Button>
          </CanAccess>
        </div>
      </form>
    </Modal>
  );
}
