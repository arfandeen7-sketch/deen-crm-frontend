"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { getErrorMessage } from "@/services/api/client";
import { openHouseEventsService, serverFieldErrors } from "@/services/openHouse/openHouse.service";
import {
  fieldErrors,
  openHouseEventSchema,
  type OpenHouseEventFormValue,
} from "@/schemas/openHouse.schema";
import { EVENT_STATUS_OPTIONS } from "@/constants/openHouse";
import { toDateInput } from "./OpenHouseShared";
import type { OpenHouseEvent } from "@/types";

interface EventFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (event: OpenHouseEvent) => void;
  /** Existing record for edit mode; null = create mode. Remount (via `key`) to reset the form. */
  record?: OpenHouseEvent | null;
}

function initialValue(record?: OpenHouseEvent | null): OpenHouseEventFormValue {
  return {
    eventName: record?.eventName ?? "",
    eventDate: toDateInput(record?.eventDate),
    startTime: record?.startTime ?? "",
    endTime: record?.endTime ?? "",
    developerName: record?.developerName ?? "",
    location: record?.location ?? "",
    venueName: record?.venueName ?? "",
    projectName: record?.projectName ?? "",
    projectDetails: record?.projectDetails ?? "",
    status: record?.status ?? "upcoming",
    expectedAttendees: record?.expectedAttendees != null ? String(record.expectedAttendees) : "",
    organizerName: record?.organizerName ?? "",
    organizerContact: record?.organizerContact ?? "",
    notes: record?.notes ?? "",
  };
}

export function EventFormModal({ open, onClose, onSaved, record }: EventFormModalProps) {
  const isEdit = !!record;
  const [form, setForm] = useState<OpenHouseEventFormValue>(() => initialValue(record));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function setField<K extends keyof OpenHouseEventFormValue>(key: K, value: OpenHouseEventFormValue[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = openHouseEventSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSaving(true);
    try {
      const saved = isEdit && record
        ? await openHouseEventsService.update(record.id, parsed.data)
        : await openHouseEventsService.create(parsed.data);
      toast.success(isEdit ? "Event updated" : "Event created");
      onSaved(saved);
      onClose();
    } catch (err) {
      setErrors(serverFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={isEdit ? "Edit Open House Event" : "Create Open House Event"}
      description={isEdit ? "Update the event details." : "Add a new developer open house or roadshow."}
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-600">Event</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Event Name" required error={errors.eventName} className="sm:col-span-2">
              <Input
                value={form.eventName}
                onChange={(e) => setField("eventName", e.target.value)}
                placeholder="e.g. Emaar Mumbai Open House"
                invalid={!!errors.eventName}
                autoFocus
              />
            </Field>
            <Field label="Event Date" required error={errors.eventDate}>
              <Input
                type="date"
                value={form.eventDate}
                onChange={(e) => setField("eventDate", e.target.value)}
                invalid={!!errors.eventDate}
              />
            </Field>
            <Field label="Status" error={errors.status}>
              <Select
                value={form.status}
                onChange={(e) => setField("status", e.target.value as OpenHouseEventFormValue["status"])}
              >
                {EVENT_STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Start Time" error={errors.startTime}>
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) => setField("startTime", e.target.value)}
                invalid={!!errors.startTime}
              />
            </Field>
            <Field label="End Time" error={errors.endTime}>
              <Input
                type="time"
                value={form.endTime}
                onChange={(e) => setField("endTime", e.target.value)}
                invalid={!!errors.endTime}
              />
            </Field>
          </div>
        </section>

        <section className="space-y-3 border-t border-neutral-100 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-600">Developer &amp; Venue</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Developer Name" required error={errors.developerName}>
              <Input
                value={form.developerName}
                onChange={(e) => setField("developerName", e.target.value)}
                placeholder="e.g. Emaar Properties"
                invalid={!!errors.developerName}
              />
            </Field>
            <Field label="Location" required error={errors.location}>
              <Input
                value={form.location}
                onChange={(e) => setField("location", e.target.value)}
                placeholder="City / country"
                invalid={!!errors.location}
              />
            </Field>
            <Field label="Hotel / Venue Name" error={errors.venueName}>
              <Input
                value={form.venueName}
                onChange={(e) => setField("venueName", e.target.value)}
                placeholder="e.g. Taj Lands End, Ballroom 2"
              />
            </Field>
            <Field label="Expected Attendees" error={errors.expectedAttendees}>
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                value={form.expectedAttendees}
                onChange={(e) => setField("expectedAttendees", e.target.value)}
                placeholder="e.g. 150"
                invalid={!!errors.expectedAttendees}
              />
            </Field>
            <Field label="Organizer / Contact Person" error={errors.organizerName}>
              <Input
                value={form.organizerName}
                onChange={(e) => setField("organizerName", e.target.value)}
                placeholder="Name"
              />
            </Field>
            <Field label="Organizer Contact Number" error={errors.organizerContact}>
              <Input
                type="tel"
                value={form.organizerContact}
                onChange={(e) => setField("organizerContact", e.target.value)}
                placeholder="+971 ..."
                invalid={!!errors.organizerContact}
              />
            </Field>
          </div>
        </section>

        <section className="space-y-3 border-t border-neutral-100 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-600">Project</h3>
          <div className="grid grid-cols-1 gap-4">
            <Field label="Project Name" error={errors.projectName}>
              <Input
                value={form.projectName}
                onChange={(e) => setField("projectName", e.target.value)}
                placeholder="Project(s) being showcased"
              />
            </Field>
            <Field label="Project Details" error={errors.projectDetails}>
              <Textarea
                value={form.projectDetails}
                onChange={(e) => setField("projectDetails", e.target.value)}
                placeholder="Unit mix, starting prices, payment plan, handover…"
                rows={4}
              />
            </Field>
            <Field label="Internal Notes" error={errors.notes}>
              <Textarea
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Logistics, team on duty, materials…"
                rows={3}
              />
            </Field>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-2.5 border-t border-neutral-100 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {isEdit ? "Save Changes" : "Create Event"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
