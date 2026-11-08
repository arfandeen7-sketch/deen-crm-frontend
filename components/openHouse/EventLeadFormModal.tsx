"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { getErrorMessage } from "@/services/api/client";
import { openHouseEventLeadsService, serverFieldErrors } from "@/services/openHouse/openHouse.service";
import {
  fieldErrors,
  openHouseEventLeadSchema,
  type OpenHouseEventLeadFormValue,
} from "@/schemas/openHouse.schema";
import {
  BEDROOM_OPTIONS,
  LEAD_INTEREST_OPTIONS,
  LEAD_PURPOSE_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
} from "@/constants/openHouse";
import { formatDate } from "@/lib/utils";
import type { OpenHouseEventLead, OpenHouseEventOption } from "@/types";

interface EventLeadFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** Existing record for edit mode; null = create mode. Remount (via `key`) to reset the form. */
  record?: OpenHouseEventLead | null;
  events: OpenHouseEventOption[];
  eventsLoading?: boolean;
  /** Pre-selected event in create mode. */
  defaultEventId?: string;
}

function initialValue(record?: OpenHouseEventLead | null, eventId = ""): OpenHouseEventLeadFormValue {
  return {
    eventId: record?.eventId ?? eventId,
    clientName: record?.clientName ?? "",
    mobileNumber: record?.mobileNumber ?? "",
    alternativeMobile: record?.alternativeMobile ?? "",
    email: record?.email ?? "",
    nationality: record?.nationality ?? "",
    budget: record?.budget != null ? String(Number(record.budget)) : "",
    interestedProject: record?.interestedProject ?? "",
    propertyType: record?.propertyType ?? "",
    bedrooms: record?.bedrooms ?? "",
    purpose: record?.purpose ?? "",
    interestLevel: record?.interestLevel ?? "",
    requirements: record?.requirements ?? "",
    notes: record?.notes ?? "",
  };
}

export function eventOptionLabel(e: Pick<OpenHouseEventOption, "eventName" | "eventDate">): string {
  return `${e.eventName} — ${formatDate(e.eventDate)}`;
}

export function EventLeadFormModal({
  open,
  onClose,
  onSaved,
  record,
  events,
  eventsLoading,
  defaultEventId,
}: EventLeadFormModalProps) {
  const isEdit = !!record;
  const [form, setForm] = useState<OpenHouseEventLeadFormValue>(() => initialValue(record, defaultEventId));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<false | "close" | "another">(false);
  const nameRef = useRef<HTMLInputElement>(null);

  function setField<K extends keyof OpenHouseEventLeadFormValue>(key: K, value: OpenHouseEventLeadFormValue[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  async function submit(mode: "close" | "another") {
    const parsed = openHouseEventLeadSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      toast.error("Please fix the highlighted fields");
      return;
    }
    const payload = { ...parsed.data, budget: parsed.data.budget.replace(/,/g, "") };
    setSaving(mode);
    try {
      if (isEdit && record) {
        await openHouseEventLeadsService.update(record.id, payload);
        toast.success("Event lead updated");
      } else {
        await openHouseEventLeadsService.create(payload);
        toast.success("Event lead added");
      }
      onSaved();
      if (mode === "another") {
        setForm(initialValue(null, form.eventId));
        setErrors({});
        nameRef.current?.focus();
      } else {
        onClose();
      }
    } catch (err) {
      setErrors(serverFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const noEvents = !eventsLoading && events.length === 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={isEdit ? "Edit Event Lead" : "Add Event Lead"}
      description="Event leads stay inside the Open House module and are not added to Lead Management."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit("close");
        }}
        className="space-y-5"
        noValidate
      >
        <section className="space-y-3">
          <Field
            label="Event Name"
            required
            error={errors.eventId}
            hint={noEvents ? "No events yet — create an event first." : undefined}
          >
            <Select
              value={form.eventId}
              onChange={(e) => setField("eventId", e.target.value)}
              placeholder={eventsLoading ? "Loading events…" : "Select an event"}
              invalid={!!errors.eventId}
              disabled={eventsLoading || noEvents}
            >
              <option value="">Select an event</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{eventOptionLabel(ev)}</option>
              ))}
            </Select>
          </Field>
        </section>

        <section className="space-y-3 border-t border-neutral-100 pt-4">
          <h3 className="text-xs font-semibold text-neutral-600">Client</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Client Name" required error={errors.clientName}>
              <Input
                ref={nameRef}
                value={form.clientName}
                onChange={(e) => setField("clientName", e.target.value)}
                placeholder="Full name"
                invalid={!!errors.clientName}
              />
            </Field>
            <Field label="Mobile Number" required error={errors.mobileNumber}>
              <Input
                type="tel"
                value={form.mobileNumber}
                onChange={(e) => setField("mobileNumber", e.target.value)}
                placeholder="+971 ..."
                invalid={!!errors.mobileNumber}
              />
            </Field>
            <Field label="Alternative Mobile Number" error={errors.alternativeMobile}>
              <Input
                type="tel"
                value={form.alternativeMobile}
                onChange={(e) => setField("alternativeMobile", e.target.value)}
                placeholder="+91 ..."
                invalid={!!errors.alternativeMobile}
              />
            </Field>
            <Field label="Email Address" error={errors.email}>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="client@example.com"
                invalid={!!errors.email}
              />
            </Field>
            <Field label="Nationality" error={errors.nationality}>
              <Input
                value={form.nationality}
                onChange={(e) => setField("nationality", e.target.value)}
                placeholder="e.g. Indian"
              />
            </Field>
            <Field label="Budget (AED)" error={errors.budget}>
              <Input
                inputMode="decimal"
                value={form.budget}
                onChange={(e) => setField("budget", e.target.value)}
                placeholder="e.g. 2,500,000"
                invalid={!!errors.budget}
              />
            </Field>
          </div>
        </section>

        <section className="space-y-3 border-t border-neutral-100 pt-4">
          <h3 className="text-xs font-semibold text-neutral-600">Interest</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Interested Project" error={errors.interestedProject}>
              <Input
                value={form.interestedProject}
                onChange={(e) => setField("interestedProject", e.target.value)}
                placeholder="Project name"
              />
            </Field>
            <Field label="Property Type" error={errors.propertyType}>
              <Select
                value={form.propertyType}
                onChange={(e) => setField("propertyType", e.target.value)}
                placeholder="Select type"
              >
                <option value="">Select type</option>
                {PROPERTY_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </Field>
            <Field label="Bedrooms" error={errors.bedrooms}>
              <Select
                value={form.bedrooms}
                onChange={(e) => setField("bedrooms", e.target.value)}
                placeholder="Select bedrooms"
              >
                <option value="">Select bedrooms</option>
                {BEDROOM_OPTIONS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </Select>
            </Field>
            <Field label="Purpose" error={errors.purpose}>
              <Select
                value={form.purpose}
                onChange={(e) => setField("purpose", e.target.value)}
                placeholder="Select purpose"
              >
                <option value="">Select purpose</option>
                {LEAD_PURPOSE_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Interest Level" error={errors.interestLevel}>
              <Select
                value={form.interestLevel}
                onChange={(e) => setField("interestLevel", e.target.value)}
                placeholder="Select level"
              >
                <option value="">Select level</option>
                {LEAD_INTEREST_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Requirements" error={errors.requirements} className="sm:col-span-2">
              <Textarea
                value={form.requirements}
                onChange={(e) => setField("requirements", e.target.value)}
                placeholder="Size, view, floor, payment plan, handover timeline…"
                rows={3}
              />
            </Field>
            <Field label="Additional Notes" error={errors.notes} className="sm:col-span-2">
              <Textarea
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Anything else discussed at the event"
                rows={3}
              />
            </Field>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-2.5 border-t border-neutral-100 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={!!saving}>
            Cancel
          </Button>
          {!isEdit && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => submit("another")}
              loading={saving === "another"}
              disabled={!!saving || noEvents}
            >
              Save &amp; Add Another
            </Button>
          )}
          <Button type="submit" loading={saving === "close"} disabled={!!saving || noEvents}>
            {isEdit ? "Save Changes" : "Add Lead"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
