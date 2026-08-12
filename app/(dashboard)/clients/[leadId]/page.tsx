"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  UserCircle2,
  Phone,
  Mail,
  Calendar,
  FileText,
  CreditCard,
  ExternalLink,
  DollarSign,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { AccessGuard } from "@/components/shared/Guards";
import { ClientDocumentCard } from "@/components/clients/ClientDocumentCard";
import { useClientByLeadId, useClientMutations } from "@/hooks/useClients";
import { displayValue, formatDate, formatDateTime, formatCurrency } from "@/lib/utils";

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm text-slate-800">{displayValue(value)}</p>
      </div>
    </div>
  );
}

export default function ClientDetailPage() {
  return (
    <AccessGuard module="client_details" page="all_clients" action="view">
      <ClientDetailPageContent />
    </AccessGuard>
  );
}

function ClientDetailPageContent() {
  const params = useParams<{ leadId: string }>();
  const { data: client, isLoading, isError, refetch } = useClientByLeadId(params.leadId);
  const { uploadPassport, deletePassport, uploadEmiratesId, deleteEmiratesId } =
    useClientMutations(params.leadId);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!client) {
    return (
      <div className="space-y-5">
        <Link
          href="/clients"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to clients
        </Link>
        <PageHeader
          title="Client Not Found"
          subtitle="No client record exists for this lead yet."
        />
        <p className="text-sm text-slate-500">
          Go to the{" "}
          <Link href={`/leads/${params.leadId}`} className="text-slate-800 underline">
            lead detail page
          </Link>{" "}
          to add client information.
        </p>
      </div>
    );
  }

  const lead = client.lead;

  return (
    <div className="space-y-5">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to clients
      </Link>

      <PageHeader
        title={displayValue(client.fullName) ?? "Client Profile"}
        subtitle={lead?.leadName ? `Lead: ${lead.leadName}` : ""}
        actions={
          lead && (
            <Link
              href={`/leads/${params.leadId}`}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View Lead
            </Link>
          )
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-5 lg:col-span-2">
          {/* Personal Information */}
          <Card>
            <CardHeader title="Personal Information" />
            <CardBody className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              <InfoRow icon={UserCircle2} label="Full Name"     value={client.fullName} />
              <InfoRow icon={Phone}       label="Mobile Number" value={client.mobileNumber} />
              <InfoRow icon={Mail}        label="Email"         value={client.email} />
              <InfoRow icon={Calendar}    label="Date of Birth" value={formatDate(client.dateOfBirth)} />
            </CardBody>
          </Card>

          {/* Identity Documents (Numbers) */}
          <Card>
            <CardHeader title="Identity Information" />
            <CardBody className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              <InfoRow icon={FileText}  label="Passport Number"   value={client.passportNumber} />
              <InfoRow icon={CreditCard} label="Emirates ID Number" value={client.emiratesIdNumber} />
            </CardBody>
          </Card>

          {/* Identity Documents (PDFs) */}
          <Card>
            <CardHeader title="KYC Documents" subtitle="PDF uploads — Passport and Emirates ID" />
            <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ClientDocumentCard
                label="Passport PDF"
                fileName={client.passportFileName}
                uploadedAt={client.passportUploadedAt}
                uploaderName={client.passportUploader?.fullName}
                signedUrl={client.passportUrl}
                onUpload={async (file) => { await uploadPassport.mutateAsync(file); }}
                onDelete={async () => { await deletePassport.mutateAsync(); }}
              />
              <ClientDocumentCard
                label="Emirates ID PDF"
                fileName={client.emiratesIdFileName}
                uploadedAt={client.emiratesIdUploadedAt}
                uploaderName={client.emiratesUploader?.fullName}
                signedUrl={client.emiratesIdUrl}
                onUpload={async (file) => { await uploadEmiratesId.mutateAsync(file); }}
                onDelete={async () => { await deleteEmiratesId.mutateAsync(); }}
              />
            </CardBody>
          </Card>
        </div>

        {/* Side column */}
        <div className="space-y-5">
          {/* Related Lead */}
          {lead && (
            <Card>
              <CardHeader title="Related Lead" />
              <CardBody className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500">Lead Name</p>
                  <p className="text-sm font-medium text-slate-800">{lead.leadName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={lead.leadStatus} />
                </div>
                {lead.assignedUser && (
                  <div>
                    <p className="text-xs text-slate-500">Assigned To</p>
                    <p className="text-sm text-slate-800">{lead.assignedUser.fullName}</p>
                  </div>
                )}
                {lead.sale && (
                  <div className="rounded-lg bg-emerald-50 p-3">
                    <p className="text-xs font-medium text-emerald-700 flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5" /> Deal Closed
                    </p>
                    <p className="mt-1 text-sm text-emerald-800">
                      {formatCurrency(lead.sale.amount)} AED
                    </p>
                    <p className="text-xs text-emerald-600">{formatDate(lead.sale.closedAt)}</p>
                  </div>
                )}
                <Link
                  href={`/leads/${params.leadId}`}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open lead
                </Link>
              </CardBody>
            </Card>
          )}

          {/* Audit */}
          <Card>
            <CardHeader title="Record Info" />
            <CardBody className="space-y-2">
              <div>
                <p className="text-xs text-slate-500">Created By</p>
                <p className="text-sm text-slate-800">{client.creator?.fullName ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Created At</p>
                <p className="text-sm text-slate-800">{formatDateTime(client.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Last Updated</p>
                <p className="text-sm text-slate-800">{formatDateTime(client.updatedAt)}</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
