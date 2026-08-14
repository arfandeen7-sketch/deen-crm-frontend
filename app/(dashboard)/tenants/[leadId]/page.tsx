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
  CalendarClock,
  Home,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { AccessGuard } from "@/components/shared/Guards";
import { ClientDocumentCard } from "@/components/clients/ClientDocumentCard";
import { useTenantByLeadId, useTenantMutations } from "@/hooks/useTenants";
import { displayValue, formatDate, formatDateTime } from "@/lib/utils";

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

function remainingDays(endDate?: string | null): number | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  if (isNaN(end.getTime())) return null;
  const now = new Date();
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((endDay.getTime() - todayDay.getTime()) / (24 * 60 * 60 * 1000));
}

export default function TenantDetailPage() {
  return (
    <AccessGuard module="tenant_details" page="all_tenants" action="view">
      <TenantDetailPageContent />
    </AccessGuard>
  );
}

function TenantDetailPageContent() {
  const params = useParams<{ leadId: string }>();
  const { data: tenant, isLoading, isError, refetch } = useTenantByLeadId(params.leadId);
  const {
    uploadPassport, deletePassport,
    uploadEmiratesId, deleteEmiratesId,
    uploadAgreement, deleteAgreement,
  } = useTenantMutations(params.leadId);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!tenant) {
    return (
      <div className="space-y-5">
        <Link
          href="/tenants"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to tenants
        </Link>
        <PageHeader
          title="Tenant Not Found"
          subtitle="No tenant record exists for this lead yet."
        />
        <p className="text-sm text-slate-500">
          Go to the{" "}
          <Link href={`/leads/${params.leadId}`} className="text-slate-800 underline">
            lead detail page
          </Link>{" "}
          to add tenant information.
        </p>
      </div>
    );
  }

  const lead = tenant.lead;
  const daysLeft = remainingDays(tenant.agreementEndDate);

  return (
    <div className="space-y-5">
      <Link
        href="/tenants"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to tenants
      </Link>

      <PageHeader
        title={displayValue(tenant.fullName) ?? "Tenant Profile"}
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
              <InfoRow icon={UserCircle2} label="Tenant Name"   value={tenant.fullName} />
              <InfoRow icon={Phone}       label="Phone Number"  value={tenant.mobileNumber} />
              <InfoRow icon={Mail}        label="Email"         value={tenant.email} />
              <InfoRow icon={Calendar}    label="Date of Birth" value={formatDate(tenant.dateOfBirth)} />
            </CardBody>
          </Card>

          {/* Identity Documents (Numbers) */}
          <Card>
            <CardHeader title="Identity Information" />
            <CardBody className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              <InfoRow icon={FileText}   label="Passport Number"   value={tenant.passportNumber} />
              <InfoRow icon={CreditCard} label="Emirates ID Number" value={tenant.emiratesIdNumber} />
            </CardBody>
          </Card>

          {/* Tenancy Agreement */}
          <Card>
            <CardHeader
              title="Tenancy Agreement"
              subtitle={
                daysLeft != null
                  ? daysLeft < 0
                    ? "Agreement expired"
                    : `${daysLeft} days remaining`
                  : undefined
              }
            />
            <CardBody className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              <InfoRow icon={CalendarClock} label="Agreement Start Date" value={formatDate(tenant.agreementStartDate)} />
              <InfoRow icon={CalendarClock} label="Agreement End Date"   value={formatDate(tenant.agreementEndDate)} />
            </CardBody>
          </Card>

          {/* Identity & Agreement Documents (PDFs) */}
          <Card>
            <CardHeader title="KYC & Agreement Documents" subtitle="PDF uploads — Passport, Emirates ID, Tenant Agreement" />
            <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ClientDocumentCard
                label="Passport PDF"
                fileName={tenant.passportFileName}
                uploadedAt={tenant.passportUploadedAt}
                uploaderName={tenant.passportUploader?.fullName}
                signedUrl={tenant.passportUrl}
                onUpload={async (file) => { await uploadPassport.mutateAsync(file); }}
                onDelete={async () => { await deletePassport.mutateAsync(); }}
              />
              <ClientDocumentCard
                label="Emirates ID PDF"
                fileName={tenant.emiratesIdFileName}
                uploadedAt={tenant.emiratesIdUploadedAt}
                uploaderName={tenant.emiratesUploader?.fullName}
                signedUrl={tenant.emiratesIdUrl}
                onUpload={async (file) => { await uploadEmiratesId.mutateAsync(file); }}
                onDelete={async () => { await deleteEmiratesId.mutateAsync(); }}
              />
              <ClientDocumentCard
                label="Tenant Agreement PDF"
                fileName={tenant.agreementFileName}
                uploadedAt={tenant.agreementUploadedAt}
                uploaderName={tenant.agreementUploader?.fullName}
                signedUrl={tenant.agreementUrl}
                onUpload={async (file) => { await uploadAgreement.mutateAsync(file); }}
                onDelete={async () => { await deleteAgreement.mutateAsync(); }}
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
                {lead.projectName && (
                  <div className="flex items-center gap-1.5">
                    <Home className="h-3.5 w-3.5 text-slate-400" />
                    <p className="text-sm text-slate-800">{lead.projectName}</p>
                  </div>
                )}
                {lead.assignedUser && (
                  <div>
                    <p className="text-xs text-slate-500">Assigned To</p>
                    <p className="text-sm text-slate-800">{lead.assignedUser.fullName}</p>
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
                <p className="text-sm text-slate-800">{tenant.creator?.fullName ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Created At</p>
                <p className="text-sm text-slate-800">{formatDateTime(tenant.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Last Updated</p>
                <p className="text-sm text-slate-800">{formatDateTime(tenant.updatedAt)}</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
