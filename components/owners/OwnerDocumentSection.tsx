"use client";

import { useRef, useState } from "react";
import { FileText, Upload, Trash2, ExternalLink, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/Modal";
import { PassportDateModal, type PassportDateValues } from "@/components/shared/PassportDateModal";
import { useOwnerDocumentMutations } from "@/hooks/useOwners";
import { ownerManualPropertiesService } from "@/services/owners/ownerManualProperties.service";
import { getErrorMessage } from "@/services/api/client";
import { formatDate } from "@/lib/utils";
import type { Owner } from "@/types";

interface Props {
  owner: Owner;
}

export function OwnerDocumentSection({ owner }: Props) {
  const { uploadPassport, removePassport, uploadEmiratesId, removeEmiratesId } =
    useOwnerDocumentMutations();
  const passportRef = useRef<HTMLInputElement>(null);
  const eidRef = useRef<HTMLInputElement>(null);
  const [removingPassport, setRemovingPassport] = useState(false);
  const [removingEid, setRemovingEid] = useState(false);
  const [passportModalOpen, setPassportModalOpen] = useState(false);
  const pendingPassportFile = useRef<File | null>(null);

  async function handlePassportUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Stash the file and ask for passport validity dates before uploading.
    pendingPassportFile.current = file;
    setPassportModalOpen(true);
    if (passportRef.current) passportRef.current.value = "";
  }

  async function onPassportDatesConfirm(values: PassportDateValues) {
    const file = pendingPassportFile.current;
    if (!file) {
      setPassportModalOpen(false);
      return;
    }
    try {
      await uploadPassport.mutateAsync({
        ownerId: owner.id,
        file,
        passportStartDate: values.passportStartDate,
        passportEndDate: values.passportEndDate,
      });
      toast.success("Passport uploaded successfully");
      setPassportModalOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      pendingPassportFile.current = null;
    }
  }

  async function handleEidUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadEmiratesId.mutateAsync({ ownerId: owner.id, file });
      toast.success("Emirates ID uploaded successfully");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      if (eidRef.current) eidRef.current.value = "";
    }
  }

  async function handleRemovePassport() {
    try {
      await removePassport.mutateAsync(owner.id);
      toast.success("Passport removed");
      setRemovingPassport(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleRemoveEid() {
    try {
      await removeEmiratesId.mutateAsync(owner.id);
      toast.success("Emirates ID removed");
      setRemovingEid(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-3">
      {/* ── Passport ──────────────────────────────────────────────── */}
      <DocumentSlot
        label="Passport"
        number={owner.passportNumber}
        fileName={owner.passportFileName}
        uploadedAt={owner.passportUploadedAt}
        passportStartDate={owner.passportStartDate}
        passportEndDate={owner.passportEndDate}
        viewUrl={owner.passportFileName ? ownerManualPropertiesService.passportUrl(owner.id) : null}
        inputRef={passportRef}
        onUploadClick={() => passportRef.current?.click()}
        onUploadChange={handlePassportUpload}
        onRemoveClick={() => setRemovingPassport(true)}
        uploading={uploadPassport.isPending}
        accept="image/jpeg,image/png,application/pdf"
      />

      {/* ── Emirates ID ────────────────────────────────────────────── */}
      <DocumentSlot
        label="Emirates ID"
        number={owner.emiratesIdNumber}
        fileName={owner.emiratesIdFileName}
        uploadedAt={owner.emiratesIdUploadedAt}
        viewUrl={owner.emiratesIdFileName ? ownerManualPropertiesService.emiratesIdUrl(owner.id) : null}
        inputRef={eidRef}
        onUploadClick={() => eidRef.current?.click()}
        onUploadChange={handleEidUpload}
        onRemoveClick={() => setRemovingEid(true)}
        uploading={uploadEmiratesId.isPending}
        accept="image/jpeg,image/png,application/pdf"
      />

      <ConfirmModal
        open={removingPassport}
        onClose={() => setRemovingPassport(false)}
        onConfirm={handleRemovePassport}
        title="Remove Passport?"
        message="This will permanently delete the passport file for this owner."
        confirmLabel="Remove"
        loading={removePassport.isPending}
      />
      <ConfirmModal
        open={removingEid}
        onClose={() => setRemovingEid(false)}
        onConfirm={handleRemoveEid}
        title="Remove Emirates ID?"
        message="This will permanently delete the Emirates ID file for this owner."
        confirmLabel="Remove"
        loading={removeEmiratesId.isPending}
      />

      <PassportDateModal
        open={passportModalOpen}
        onClose={() => { setPassportModalOpen(false); pendingPassportFile.current = null; }}
        onConfirm={onPassportDatesConfirm}
        loading={uploadPassport.isPending}
        entityLabel="this owner"
        initial={{
          passportStartDate: owner.passportStartDate ?? undefined,
          passportEndDate: owner.passportEndDate ?? undefined,
        }}
      />
    </div>
  );
}

function DocumentSlot({
  label,
  number,
  fileName,
  uploadedAt,
  passportStartDate,
  passportEndDate,
  viewUrl,
  inputRef,
  onUploadClick,
  onUploadChange,
  onRemoveClick,
  uploading,
  accept,
}: {
  label: string;
  number?: string | null;
  fileName?: string | null;
  uploadedAt?: string | null;
  passportStartDate?: string | null;
  passportEndDate?: string | null;
  viewUrl: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onUploadClick: () => void;
  onUploadChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveClick: () => void;
  uploading: boolean;
  accept: string;
}) {
  const hasFile = !!fileName;
  const uploadedDate = uploadedAt
    ? new Date(uploadedAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-neutral-200 bg-neutral-50/60 px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
          <FileText className="h-4 w-4 text-neutral-500" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            {label}
          </p>
          {number && (
            <p className="mt-0.5 font-mono text-xs text-neutral-700">{number}</p>
          )}
          {hasFile ? (
            <p className="mt-0.5 text-xs text-emerald-700">
              {fileName}
              {uploadedDate && (
                <span className="ml-1 text-neutral-400">· Uploaded {uploadedDate}</span>
              )}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-neutral-400">No document uploaded</p>
          )}
          {(passportStartDate || passportEndDate) && (
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-neutral-600">
              {passportStartDate && (
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="h-3 w-3 text-neutral-400" />
                  Start: {formatDate(passportStartDate)}
                </span>
              )}
              {passportEndDate && (
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="h-3 w-3 text-neutral-400" />
                  Expiry: {formatDate(passportEndDate)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {hasFile && viewUrl && (
          <a
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded px-2 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" /> View
          </a>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onUploadClick}
          loading={uploading}
        >
          <Upload className="h-3.5 w-3.5" />
          {hasFile ? "Replace" : "Upload"}
        </Button>
        {hasFile && (
          <button
            type="button"
            onClick={onRemoveClick}
            className="rounded p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            title={`Remove ${label}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={onUploadChange}
        />
      </div>
    </div>
  );
}
