"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Input";
import { getErrorMessage } from "@/services/api/client";
import { openHouseRsvpsService, type RsvpImportAgentOption } from "@/services/openHouse/openHouse.service";
import { RSVP_BUDGET_OPTIONS, RSVP_INTEREST_OPTIONS, labelFor } from "@/constants/openHouse";
import { DetailRow } from "./OpenHouseShared";
import type { OpenHouseRsvp } from "@/types";

export function ConvertRsvpModal({
  record,
  onClose,
  onConverted,
}: {
  record: OpenHouseRsvp | null;
  onClose: () => void;
  onConverted: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const missing = !record?.guestName?.trim() || !record?.mobile?.trim();

  async function confirm() {
    if (!record || missing) return;
    setSaving(true);
    try {
      await openHouseRsvpsService.convert(record.id);
      toast.success("RSVP converted to an event lead");
      onConverted();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={!!record}
      onClose={onClose}
      title="Convert to Event Lead"
      description="Review the guest details. The RSVP stays in this list and is marked as converted."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={confirm} loading={saving} disabled={missing}>Convert</Button>
        </>
      }
    >
      {record && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DetailRow label="Guest Name" value={record.guestName} />
          <DetailRow label="Mobile" value={record.mobile} />
          <DetailRow label="Event" value={record.event?.eventName} />
          <DetailRow label="Agent" value={record.creator?.fullName} />
          <DetailRow label="Interest" value={labelFor(RSVP_INTEREST_OPTIONS, record.interestedIn)} />
          <DetailRow label="Budget" value={labelFor(RSVP_BUDGET_OPTIONS, record.budget)} />
          {missing && (
            <p className="text-sm text-rose-600 sm:col-span-2">
              An event lead needs a guest name and a mobile number. Add those on the RSVP before converting.
            </p>
          )}
          <p className="text-xs text-slate-500 sm:col-span-2">
            Email and nationality are not stored on an RSVP, so those lead fields stay empty. A budget range is copied into the lead notes because event leads store a single amount.
          </p>
        </div>
      )}
    </Modal>
  );
}

export function TransferRsvpModal({
  record,
  agents,
  onClose,
  onTransferred,
}: {
  record: OpenHouseRsvp | null;
  agents: RsvpImportAgentOption[];
  onClose: () => void;
  onTransferred: () => void;
}) {
  const [agentId, setAgentId] = useState("");
  const [saving, setSaving] = useState(false);
  const choices = agents.filter((agent) => agent.isActive && agent.id !== record?.createdBy);

  async function confirm() {
    if (!record || !agentId) return;
    setSaving(true);
    try {
      await openHouseRsvpsService.transfer(record.id, agentId);
      toast.success("RSVP transferred");
      onTransferred();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={!!record}
      onClose={onClose}
      title="Transfer Agent"
      description="The RSVP will leave the current agent’s list and appear for the agent you select."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={confirm} loading={saving} disabled={!agentId}>Transfer</Button>
        </>
      }
    >
      {record && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailRow label="Guest Name" value={record.guestName} />
            <DetailRow label="Current Assigned Agent" value={record.creator?.fullName ?? "Unassigned"} />
          </div>
          <Field label="New agent" required>
            <Select value={agentId} onChange={(event) => setAgentId(event.target.value)}>
              <option value="">Select an agent</option>
              {choices.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.fullName}{agent.employeeId ? ` (${agent.employeeId})` : ""}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      )}
    </Modal>
  );
}
