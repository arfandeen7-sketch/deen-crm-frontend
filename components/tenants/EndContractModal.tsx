"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { useTenantPropertyMutations } from "@/hooks/useTenants";
import { getErrorMessage } from "@/services/api/client";
import type { PropertyTenantSummary } from "@/types";

interface EndContractModalProps {
  tenant: PropertyTenantSummary;
  open: boolean;
  onClose: () => void;
}

export function EndContractModal({ tenant, open, onClose }: EndContractModalProps) {
  const { endContract } = useTenantPropertyMutations();
  const [actualEndDate, setActualEndDate] = useState("");

  // Pre-fill with the current agreement end date (if any)
  useEffect(() => {
    if (open && tenant.agreementEndDate) {
      setActualEndDate(tenant.agreementEndDate.slice(0, 10));
    } else if (open) {
      setActualEndDate(new Date().toISOString().slice(0, 10));
    }
  }, [open, tenant.agreementEndDate]);

  async function handleConfirm() {
    if (!actualEndDate) {
      toast.error("Please select an actual end date.");
      return;
    }
    try {
      await endContract.mutateAsync({ leadId: tenant.leadId, actualEndDate });
      toast.success("Contract ended. Property is now available.");
      onClose();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="End Tenant Contract"
      description={`End the contract for ${tenant.fullName ?? "this tenant"} before the agreement end date.`}
      size="md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold">This will end the tenant&apos;s contract early.</p>
            <p className="mt-1">
              The tenant&apos;s agreement end date will be updated to the date you select,
              and the property status will change back to <span className="font-semibold">Available</span>.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-medium text-slate-500">Tenant</p>
              <p className="text-slate-900">{tenant.fullName ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Current End Date</p>
              <p className="text-slate-900">
                {tenant.agreementEndDate
                  ? new Date(tenant.agreementEndDate).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>

          <Field
            label="Actual End Date"
            required
            hint="Select the date the tenant is vacating the property."
          >
            <Input
              type="date"
              value={actualEndDate}
              onChange={(e) => setActualEndDate(e.target.value)}
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            loading={endContract.isPending}
            className="bg-amber-600 hover:bg-amber-700"
          >
            End Contract
          </Button>
        </div>
      </div>
    </Modal>
  );
}
