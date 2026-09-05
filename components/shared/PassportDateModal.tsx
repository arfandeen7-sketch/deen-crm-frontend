"use client";

import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";

export interface PassportDateValues {
  passportStartDate?: string;
  passportEndDate?: string;
}

interface PassportDateModalProps {
  open: boolean;
  onClose: () => void;
  /** Called with the chosen dates. The caller performs the actual upload. */
  onConfirm: (values: PassportDateValues) => void;
  /** Optional pre-filled values (e.g. existing passport dates on replace). */
  initial?: PassportDateValues;
  loading?: boolean;
  /** Entity label shown in the modal copy (e.g. "Owner", "Buyer", "Tenant"). */
  entityLabel?: string;
}

/**
 * Modal that asks the user for the Passport Start Date and Passport End Date
 * after they pick a passport file. The dates are sent alongside the file
 * upload so the backend can store them and drive expiry notifications.
 */
export function PassportDateModal({
  open,
  onClose,
  onConfirm,
  initial,
  loading,
  entityLabel = "this record",
}: PassportDateModalProps) {
  const [passportStartDate, setPassportStartDate] = useState("");
  const [passportEndDate, setPassportEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPassportStartDate(initial?.passportStartDate?.slice(0, 10) ?? "");
      setPassportEndDate(initial?.passportEndDate?.slice(0, 10) ?? "");
      setError(null);
    }
  }, [open, initial]);

  function handleConfirm() {
    if (!passportEndDate) {
      setError("Passport End Date is required.");
      return;
    }
    if (passportStartDate && passportEndDate && passportStartDate > passportEndDate) {
      setError("Passport Start Date must be before the End Date.");
      return;
    }
    setError(null);
    onConfirm({
      passportStartDate: passportStartDate || undefined,
      passportEndDate,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Passport Validity Dates"
      description={`Enter the passport start and end dates for ${entityLabel}. Expiry reminders will be sent based on the end date.`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} loading={loading}>
            <CalendarClock className="h-3.5 w-3.5" /> Save &amp; Upload
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Passport Start Date">
          <Input
            type="date"
            value={passportStartDate}
            onChange={(e) => setPassportStartDate(e.target.value)}
          />
        </Field>
        <Field label="Passport End Date" required>
          <Input
            type="date"
            value={passportEndDate}
            onChange={(e) => setPassportEndDate(e.target.value)}
          />
        </Field>
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <p className="text-xs text-neutral-500">
          Notifications will be sent 90, 60, 30, 7, and 1 day(s) before the passport
          expires, and on the expiry date — to the user who created this record and
          to all Master users.
        </p>
      </div>
    </Modal>
  );
}
