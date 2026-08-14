"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Pencil, X, Check,
  Calendar, DollarSign, CreditCard, FileText, Hash,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { CanAccess } from "@/components/shared/Guards";
import { useRentalAgreementByLeadId, useRentalAgreementMutations } from "@/hooks/useRentalAgreements";
import { getErrorMessage } from "@/services/api/client";
import { rentalAgreementSchema, type RentalAgreementFormValues } from "@/schemas/rentalAgreement.schema";
import { formatDate, formatCurrency, displayValue } from "@/lib/utils";

interface RentalAgreementCardProps {
  leadId: string;
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: React.ReactNode;
}) {
  const rendered =
    typeof value === "string" || typeof value === "number" || value == null
      ? displayValue(value as string | number | null | undefined)
      : value;
  return (
    <div className="flex items-start gap-3 py-1.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm text-slate-800">{rendered}</p>
      </div>
    </div>
  );
}

export function RentalAgreementCard({ leadId }: RentalAgreementCardProps) {
  const { data: agreement, isLoading } = useRentalAgreementByLeadId(leadId);
  const { upsert } = useRentalAgreementMutations(leadId);
  const [editing, setEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RentalAgreementFormValues>({
    resolver: zodResolver(rentalAgreementSchema),
    defaultValues: {
      agreementStartDate: agreement?.agreementStartDate ? agreement.agreementStartDate.slice(0, 10) : "",
      agreementEndDate:   agreement?.agreementEndDate ? agreement.agreementEndDate.slice(0, 10) : "",
      rentAmount:         agreement?.rentAmount != null ? String(agreement.rentAmount) : "",
      currency:           agreement?.currency ?? "AED",
      numberOfCheques:    agreement?.numberOfCheques != null ? String(agreement.numberOfCheques) : "",
      securityDeposit:    agreement?.securityDeposit != null ? String(agreement.securityDeposit) : "",
      notes:              agreement?.notes ?? "",
    },
  });

  const startEdit = () => {
    reset({
      agreementStartDate: agreement?.agreementStartDate ? agreement.agreementStartDate.slice(0, 10) : "",
      agreementEndDate:   agreement?.agreementEndDate ? agreement.agreementEndDate.slice(0, 10) : "",
      rentAmount:         agreement?.rentAmount != null ? String(agreement.rentAmount) : "",
      currency:           agreement?.currency ?? "AED",
      numberOfCheques:    agreement?.numberOfCheques != null ? String(agreement.numberOfCheques) : "",
      securityDeposit:    agreement?.securityDeposit != null ? String(agreement.securityDeposit) : "",
      notes:              agreement?.notes ?? "",
    });
    setEditing(true);
  };

  async function onSave(values: RentalAgreementFormValues) {
    try {
      await upsert.mutateAsync(values);
      toast.success("Rental agreement saved.");
      setEditing(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  if (isLoading) return null;

  return (
    <Card>
      <CardHeader
        title="Rental Agreement"
        subtitle={agreement ? undefined : "No rental agreement recorded yet"}
        action={
          <CanAccess module="client_details" page="all_clients" action="edit">
            {editing ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                <X className="h-3.5 w-3.5" /> Cancel
              </Button>
            ) : (
              <Button type="button" variant="outline" size="sm" onClick={startEdit}>
                <Pencil className="h-3.5 w-3.5" /> {agreement ? "Edit" : "Add"}
              </Button>
            )}
          </CanAccess>
        }
      />
      <CardBody>
        {editing ? (
          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Agreement Start Date" error={errors.agreementStartDate?.message}>
                <Input type="date" {...register("agreementStartDate")} />
              </Field>
              <Field label="Agreement End Date" error={errors.agreementEndDate?.message}>
                <Input type="date" {...register("agreementEndDate")} />
              </Field>
              <Field label="Rent Amount (AED)" error={errors.rentAmount?.message}>
                <Input type="number" step="0.01" placeholder="e.g. 85000" {...register("rentAmount")} />
              </Field>
              <Field label="Currency" error={errors.currency?.message}>
                <Select {...register("currency")}>
                  <option value="AED">AED</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </Select>
              </Field>
              <Field label="Number of Cheques" error={errors.numberOfCheques?.message}>
                <Input type="number" placeholder="e.g. 1, 2, 4, 6, 12" {...register("numberOfCheques")} />
              </Field>
              <Field label="Security Deposit (AED)" error={errors.securityDeposit?.message}>
                <Input type="number" step="0.01" placeholder="e.g. 5000" {...register("securityDeposit")} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Notes / Payment Terms" error={errors.notes?.message}>
                  <Input placeholder="Ejari details, agency fees, payment schedule, etc." {...register("notes")} />
                </Field>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={upsert.isPending}>
                <Check className="h-3.5 w-3.5" /> Save
              </Button>
            </div>
          </form>
        ) : agreement ? (
          <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
            <InfoRow icon={Calendar} label="Agreement Start Date" value={formatDate(agreement.agreementStartDate)} />
            <InfoRow icon={Calendar} label="Agreement End Date" value={formatDate(agreement.agreementEndDate)} />
            <InfoRow
              icon={DollarSign}
              label="Rent Amount"
              value={agreement.rentAmount != null ? `${formatCurrency(Number(agreement.rentAmount))} ${agreement.currency}` : undefined}
            />
            <InfoRow icon={Hash} label="Number of Cheques" value={agreement.numberOfCheques} />
            <InfoRow
              icon={CreditCard}
              label="Security Deposit"
              value={agreement.securityDeposit != null ? `${formatCurrency(Number(agreement.securityDeposit))} ${agreement.currency}` : undefined}
            />
            <InfoRow icon={FileText} label="Notes / Payment Terms" value={agreement.notes} />
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No rental agreement recorded yet.{" "}
            <CanAccess module="client_details" page="all_clients" action="edit">
              <button
                type="button"
                onClick={startEdit}
                className="text-slate-800 underline hover:no-underline"
              >
                Add now
              </button>
            </CanAccess>
          </p>
        )}
      </CardBody>
    </Card>
  );
}
