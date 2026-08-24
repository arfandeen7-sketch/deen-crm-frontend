"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, RefreshCw } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Select, Input, Textarea } from "@/components/ui/Input";
import { useLeadMutations } from "@/hooks/useLeads";
import { useFieldOptions } from "@/hooks/useDynamicFields";
import { useBrokerOptions } from "@/hooks/useBrokers";
import { getErrorMessage } from "@/services/api/client";

// ── Field definitions ─────────────────────────────────────────────────────────
// Each entry describes how to label, validate and render the value input.

type FieldKind = "dynamic" | "brokers" | "date" | "text" | "email" | "textarea";

interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  /** For kind === 'dynamic': the dynamic-field category to load options from */
  category?: string;
  /** Whether clearing (null value) is allowed */
  nullable?: boolean;
}

const MASS_UPDATE_FIELDS: FieldDef[] = [
  { key: "leadName",       label: "Name",            kind: "text" },
  { key: "lastName",       label: "Last Name",       kind: "text",     nullable: true },
  { key: "email",          label: "Email",           kind: "email",    nullable: true },
  { key: "source",         label: "Lead Source",     kind: "dynamic",  category: "source" },
  { key: "serviceType",    label: "Service Type",    kind: "text" },
  { key: "projectName",    label: "Project",         kind: "text",     nullable: true },
  { key: "projectType",    label: "Property Type",   kind: "dynamic",  category: "project_type", nullable: true },
  { key: "configuration",  label: "Configuration",   kind: "dynamic",  category: "configuration", nullable: true },
  { key: "city",           label: "City",            kind: "text",     nullable: true },
  { key: "locality",       label: "Community",       kind: "text",     nullable: true },
  { key: "unitNumber",     label: "Unit",            kind: "text",     nullable: true },
  { key: "price",          label: "Price",           kind: "text",     nullable: true },
  { key: "propertySize",   label: "Size",            kind: "text",     nullable: true },
  { key: "comments",       label: "Comments",        kind: "textarea", nullable: true },
  { key: "leadStatus",     label: "Status",          kind: "dynamic",  category: "lead_status" },
  { key: "leadPriority",   label: "Priority",        kind: "dynamic",  category: "lead_priority", nullable: true },
  { key: "brokerId",       label: "Broker",          kind: "brokers",  nullable: true },
  { key: "followUpDate",   label: "Follow-up Date",  kind: "date",     nullable: true },
  { key: "followUpNote",   label: "Follow-up Note",  kind: "textarea", nullable: true },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function useFieldOptions_safe(category: string | undefined): string[] {
  // Always call the hook (Rules of Hooks), but only use the result when category is set.
  const opts = useFieldOptions(category ?? "__none__");
  return category ? opts : [];
}

// ── Sub-component: value input renderer ──────────────────────────────────────

function ValueInput({
  fieldDef,
  value,
  onChange,
}: {
  fieldDef: FieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  const dynamicOptions = useFieldOptions_safe(fieldDef.category);
  const brokers = useBrokerOptions();

  if (fieldDef.kind === "dynamic") {
    return (
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select {fieldDef.label.toLowerCase()}</option>
        {dynamicOptions.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </Select>
    );
  }

  if (fieldDef.kind === "brokers") {
    return (
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">No broker</option>
        {brokers.map((broker) => (
          <option key={broker.id} value={broker.id}>{broker.brokerName}</option>
        ))}
      </Select>
    );
  }

  if (fieldDef.kind === "date") {
    return (
      <Input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (fieldDef.kind === "textarea") {
    return (
      <Textarea
        placeholder={`Enter ${fieldDef.label.toLowerCase()}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <Input
      type={fieldDef.kind === "email" ? "email" : "text"}
      placeholder={`Enter ${fieldDef.label.toLowerCase()}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// ── Value display label (for preview) ─────────────────────────────────────────

function useValueLabel(fieldDef: FieldDef | undefined, value: string): string {
  const brokers = useBrokerOptions();
  if (!fieldDef || !value) return value || "—";
  if (fieldDef.kind === "brokers") {
    const broker = brokers.find((b) => b.id === value);
    return broker ? broker.brokerName : value;
  }
  return value;
}

// ── Main component ─────────────────────────────────────────────────────────────

interface MassUpdateModalProps {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
  onSuccess: () => void;
}

export function MassUpdateModal({
  open,
  onClose,
  selectedIds,
  onSuccess,
}: MassUpdateModalProps) {
  const { bulkUpdate } = useLeadMutations();

  const [fieldKey, setFieldKey] = useState("");
  const [value, setValue] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const fieldDef = MASS_UPDATE_FIELDS.find((f) => f.key === fieldKey);
  const valueLabel = useValueLabel(fieldDef, value);

  // Reset state when modal opens / field changes
  function handleFieldChange(key: string) {
    setFieldKey(key);
    setValue("");
    setConfirmed(false);
  }

  function handleClose() {
    setFieldKey("");
    setValue("");
    setConfirmed(false);
    onClose();
  }

  // Whether the user has entered a valid value
  const hasValue =
    fieldDef?.nullable
      ? true // nullable fields: empty string = "clear", always valid once field selected
      : value.trim().length > 0;

  const canPreview = !!fieldKey && hasValue;

  async function handleConfirm() {
    if (!fieldDef) return;
    const leadIds = Array.from(new Set(selectedIds)).filter(Boolean);
    if (leadIds.length === 0) {
      toast.error("Select at least one lead");
      return;
    }
    const sendValue = value.trim() === "" ? null : value.trim();
    try {
      const res = await bulkUpdate.mutateAsync({
        ids: leadIds,
        field: fieldDef.key,
        value: sendValue,
      });
      toast.success(
        `${res.updated} lead${res.updated === 1 ? "" : "s"} updated successfully.`,
      );
      handleClose();
      onSuccess();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  const isLoading = bulkUpdate.isPending;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Mass Update"
      description={`Update a field for ${selectedIds.length} selected lead${selectedIds.length === 1 ? "" : "s"}`}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          {!confirmed ? (
            <Button
              onClick={() => setConfirmed(true)}
              disabled={!canPreview}
            >
              Preview
            </Button>
          ) : (
            <Button
              onClick={handleConfirm}
              loading={isLoading}
            >
              Confirm Update
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-5">
        {/* Step 1 – Field selector */}
        <Field label="Field to Update" required>
          <Select
            value={fieldKey}
            onChange={(e) => handleFieldChange(e.target.value)}
            disabled={confirmed}
          >
            <option value="">Select field…</option>
            {MASS_UPDATE_FIELDS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </Select>
        </Field>

        {/* Step 2 – Value input (shown once a field is selected) */}
        {fieldDef && !confirmed && (
          <Field
            label={`New ${fieldDef.label}`}
            hint={fieldDef.nullable ? "Leave blank to clear this field." : undefined}
          >
            <ValueInput
              fieldDef={fieldDef}
              value={value}
              onChange={(v) => {
                setValue(v);
                setConfirmed(false);
              }}
            />
          </Field>
        )}

        {/* Step 3 – Preview (shown after clicking Preview) */}
        {confirmed && fieldDef && (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Preview
            </p>
            <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-neutral-800">
              <span className="rounded-md bg-blue-100 px-2.5 py-1 text-blue-800">
                {selectedIds.length} lead{selectedIds.length === 1 ? "" : "s"}
              </span>
              <ArrowRight className="h-4 w-4 text-neutral-400" />
              <span className="rounded-md bg-neutral-200 px-2.5 py-1 text-neutral-700">
                {fieldDef.label}
              </span>
              <ArrowRight className="h-4 w-4 text-neutral-400" />
              <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-emerald-800">
                {valueLabel || <span className="italic text-neutral-500">Clear</span>}
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              You are about to update <strong>{fieldDef.label}</strong> for{" "}
              <strong>{selectedIds.length}</strong> lead
              {selectedIds.length === 1 ? "" : "s"}. This action cannot be undone.
            </p>
            <button
              type="button"
              onClick={() => setConfirmed(false)}
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <RefreshCw className="h-3 w-3" /> Change selection
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
