"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { getErrorMessage } from "@/services/api/client";
import { openHouseRsvpsService, serverFieldErrors } from "@/services/openHouse/openHouse.service";
import { fieldErrors, openHouseRsvpSchema, type OpenHouseRsvpFormValue } from "@/schemas/openHouse.schema";
import {
  RSVP_ARRIVAL_SLOTS,
  RSVP_BUDGET_OPTIONS,
  RSVP_INTEREST_OPTIONS,
  RSVP_STATUS_OPTIONS,
} from "@/constants/openHouse";
import { formatDate } from "@/lib/utils";
import type { OpenHouseEventOption, OpenHouseRsvp } from "@/types";

function eventLabel(e: OpenHouseEventOption): string {
  const place = [e.developerName, e.venueName, e.location].filter(Boolean).join(" · ");
  const when = formatDate(e.eventDate);
  return place ? `${e.eventName} — ${when} · ${place}` : `${e.eventName} — ${when}`;
}

function initialValue(record?: OpenHouseRsvp | null, defaultEventId?: string): OpenHouseRsvpFormValue {
  return {
    eventId: record?.eventId ?? defaultEventId ?? "",
    guestName: record?.guestName ?? "",
    mobile: record?.mobile ?? "",
    peopleComingWith: String(record?.peopleComingWith ?? 0),
    expectedArrival: record?.expectedArrival ?? "",
    status: record?.status ?? "awaiting",
    interestedIn: record?.interestedIn ?? "",
    budget: record?.budget ?? "",
    notes: record?.notes ?? "",
  };
}

export function RsvpFormModal({
  open,
  onClose,
  onSaved,
  record,
  events,
  eventsLoading,
  defaultEventId,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  record?: OpenHouseRsvp | null;
  events: OpenHouseEventOption[];
  eventsLoading: boolean;
  defaultEventId?: string;
}) {
  const isEdit = !!record;
  const [form, setForm] = useState<OpenHouseRsvpFormValue>(() => initialValue(record, defaultEventId));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  function setField<K extends keyof OpenHouseRsvpFormValue>(key: K, value: OpenHouseRsvpFormValue[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function setPeople(next: number) {
    setField("peopleComingWith", String(Math.min(100, Math.max(0, next))));
  }

  async function submit(mode: "close" | "another") {
    const parsed = openHouseRsvpSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    const body = {
      eventId: parsed.data.eventId,
      guestName: parsed.data.guestName,
      mobile: parsed.data.mobile,
      peopleComingWith: Number(parsed.data.peopleComingWith),
      expectedArrival: parsed.data.expectedArrival,
      status: parsed.data.status,
      interestedIn: parsed.data.interestedIn,
      budget: parsed.data.budget,
      notes: parsed.data.notes.trim() || null,
    };
    setSaving(true);
    try {
      if (isEdit && record) {
        await openHouseRsvpsService.update(record.id, body);
        toast.success("RSVP updated");
      } else {
        await openHouseRsvpsService.create(body);
        toast.success("RSVP added");
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
  const people = Number(form.peopleComingWith) || 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={isEdit ? "Edit RSVP" : "Add RSVP"}
      description="Guest responses stay in RSVP and are not added to Lead Management."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit("close");
        }}
        className="space-y-5"
        noValidate
      >
        <Field
          label="Event"
          required
          error={errors.eventId}
          hint={noEvents ? "No events yet — create an event first." : "Name, date, developer, and location"}
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
              <option key={ev.id} value={ev.id}>{eventLabel(ev)}</option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Guest Name" required error={errors.guestName}>
            <Input
              ref={nameRef}
              value={form.guestName}
              onChange={(e) => setField("guestName", e.target.value)}
              placeholder="Full name"
              invalid={!!errors.guestName}
            />
          </Field>
          <Field label="Mobile" required error={errors.mobile} hint="Include the country code, for example +971 50 123 4567">
            <Input
              type="tel"
              value={form.mobile}
              onChange={(e) => setField("mobile", e.target.value)}
              placeholder="+971 ..."
              invalid={!!errors.mobile}
            />
          </Field>
          <Field label="People Coming With" required error={errors.peopleComingWith} hint="Accompanying guests, not including this guest">
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="icon" onClick={() => setPeople(people - 1)} aria-label="Fewer people">
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min={0}
                max={100}
                inputMode="numeric"
                value={form.peopleComingWith}
                onChange={(e) => setField("peopleComingWith", e.target.value)}
                invalid={!!errors.peopleComingWith}
                className="w-24 text-center"
              />
              <Button type="button" variant="outline" size="icon" onClick={() => setPeople(people + 1)} aria-label="More people">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </Field>
          <Field label="Expected Arrival" required error={errors.expectedArrival}>
            <Select
              value={form.expectedArrival}
              onChange={(e) => setField("expectedArrival", e.target.value)}
              placeholder="Select a time"
              invalid={!!errors.expectedArrival}
            >
              <option value="">Select a time</option>
              {RSVP_ARRIVAL_SLOTS.map((slot) => (
                <option key={slot.value} value={slot.value}>{slot.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Status" required error={errors.status}>
            <Select
              value={form.status}
              onChange={(e) => setField("status", e.target.value as OpenHouseRsvpFormValue["status"])}
              invalid={!!errors.status}
            >
              {RSVP_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Interested In" required error={errors.interestedIn}>
            <Select
              value={form.interestedIn}
              onChange={(e) => setField("interestedIn", e.target.value)}
              placeholder="Select an option"
              invalid={!!errors.interestedIn}
            >
              <option value="">Select an option</option>
              {RSVP_INTEREST_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Budget" required error={errors.budget} className="sm:col-span-2">
            <Select
              value={form.budget}
              onChange={(e) => setField("budget", e.target.value)}
              placeholder="Select a budget"
              invalid={!!errors.budget}
            >
              <option value="">Select a budget</option>
              {RSVP_BUDGET_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Notes" error={errors.notes}>
          <Textarea
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
            placeholder="Optional"
            rows={3}
            invalid={!!errors.notes}
          />
        </Field>

        <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          {!isEdit && (
            <Button type="button" variant="secondary" loading={saving} onClick={() => submit("another")}>
              Save & Add Another
            </Button>
          )}
          <Button type="submit" loading={saving}>{isEdit ? "Save changes" : "Add RSVP"}</Button>
        </div>
      </form>
    </Modal>
  );
}
