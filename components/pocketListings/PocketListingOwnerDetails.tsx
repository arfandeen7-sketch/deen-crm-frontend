"use client";

import { useRef, useState } from "react";
import {
  FileText,
  Upload,
  Trash2,
  ExternalLink,
  Plus,
  Loader2,
  CalendarClock,
  User,
  Phone,
  Globe,
  BookUser,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { Field, Input, Select } from "@/components/ui/Input";
import { CanAccess } from "@/components/shared/Guards";
import { PassportDateModal, type PassportDateValues } from "@/components/shared/PassportDateModal";
import { getErrorMessage } from "@/services/api/client";
import { formatDateTime } from "@/lib/utils";
import { usePocketListingOwnerDocMutations } from "@/hooks/usePocketListings";
import { pocketListingsService } from "@/services/pocketListings/pocketListings.service";
import type { PocketListing, PocketListingDocument } from "@/types";

const ACCEPTED = "image/jpeg,image/png,application/pdf";
const MAX_MB = 20;

const DOC_TYPES = [
  "Ejari",
  "Agreement",
  "Contract",
  "NOC",
  "Title Deed",
  "Other",
];

interface Props {
  listing: PocketListing;
}

export function PocketListingOwnerDetails({ listing }: Props) {
  const {
    uploadOwnerPassport,
    removeOwnerPassport,
    uploadOwnerEmiratesId,
    removeOwnerEmiratesId,
    uploadOwnerDoc,
    removeOwnerDoc,
  } = usePocketListingOwnerDocMutations();

  const passportFileRef = useRef<HTMLInputElement>(null);
  const emiratesIdFileRef = useRef<HTMLInputElement>(null);

  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [passportDateOpen, setPassportDateOpen] = useState(false);
  const [passportDeleting, setPassportDeleting] = useState(false);
  const [emiratesIdFile, setEmiratesIdFile] = useState<File | null>(null);
  const [emiratesIdDeleting, setEmiratesIdDeleting] = useState(false);

  const [addDocOpen, setAddDocOpen] = useState(false);
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [docDeleting, setDocDeleting] = useState(false);

  const documents = listing.documents ?? [];

  function handlePassportFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPassportFile(file);
    if (file) setPassportDateOpen(true);
    if (passportFileRef.current) passportFileRef.current.value = "";
  }

  async function handlePassportUpload(values: PassportDateValues) {
    if (!passportFile) {
      setPassportDateOpen(false);
      toast.error("No file selected.");
      return;
    }
    if (passportFile.size > MAX_MB * 1024 * 1024) {
      setPassportDateOpen(false);
      toast.error(`File too large. Maximum ${MAX_MB} MB.`);
      return;
    }
    try {
      await uploadOwnerPassport.mutateAsync({
        id: listing.id,
        file: passportFile,
        ownerPassportStartDate: values.passportStartDate,
        ownerPassportEndDate: values.passportEndDate,
      });
      toast.success("Passport uploaded successfully.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPassportDateOpen(false);
      setPassportFile(null);
    }
  }

  async function handlePassportRemove() {
    setPassportDeleting(true);
    try {
      await removeOwnerPassport.mutateAsync(listing.id);
      toast.success("Passport removed.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPassportDeleting(false);
    }
  }

  function handleEmiratesIdFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setEmiratesIdFile(file);
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`File too large. Maximum ${MAX_MB} MB.`);
      setEmiratesIdFile(null);
      return;
    }
    uploadOwnerEmiratesId
      .mutateAsync({ id: listing.id, file })
      .then(() => toast.success("Emirates ID uploaded successfully."))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => {
        setEmiratesIdFile(null);
        if (emiratesIdFileRef.current) emiratesIdFileRef.current.value = "";
      });
  }

  async function handleEmiratesIdRemove() {
    setEmiratesIdDeleting(true);
    try {
      await removeOwnerEmiratesId.mutateAsync(listing.id);
      toast.success("Emirates ID removed.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setEmiratesIdDeleting(false);
    }
  }

  async function handleDocUpload(file: File, type: string, label?: string) {
    await uploadOwnerDoc.mutateAsync({ id: listing.id, file, type, label });
  }

  async function handleDocDelete(docId: string) {
    setDocDeleting(true);
    try {
      await removeOwnerDoc.mutateAsync({ id: listing.id, docId });
      toast.success("Document removed.");
      setDeleteDocId(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDocDeleting(false);
    }
  }

  const passportUrl = listing.ownerPassportUrl ?? pocketListingsService.ownerPassportUrl(listing.id);
  const emiratesIdUrl = listing.ownerEmiratesIdUrl ?? pocketListingsService.ownerEmiratesIdUrl(listing.id);

  return (
    <div className="space-y-6">
      {/* ── Owner Identity Fields ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DetailField icon={<User className="h-4 w-4" />} label="Owner Name" value={listing.ownerName} />
        <DetailField icon={<Phone className="h-4 w-4" />} label="Mobile Number" value={listing.ownerMobileNumber} />
        <DetailField icon={<Phone className="h-4 w-4" />} label="Alternative Mobile" value={listing.ownerAlternateMobile} />
        <DetailField icon={<Globe className="h-4 w-4" />} label="Nationality" value={listing.ownerNationality} />
        <DetailField icon={<BookUser className="h-4 w-4" />} label="Passport Number" value={listing.ownerPassportNumber} />
        <DetailField icon={<BookUser className="h-4 w-4" />} label="Emirates ID" value={listing.ownerEmiratesId} />
        <DetailField icon={<CalendarClock className="h-4 w-4" />} label="Passport Start Date" value={formatDate(listing.ownerPassportStartDate)} />
        <DetailField icon={<CalendarClock className="h-4 w-4" />} label="Passport Expiry Date" value={formatDate(listing.ownerPassportEndDate)} />
      </div>

      {/* ── Passport Document ────────────────────────────────────────────────── */}
      <div>
        <h4 className="mb-2 text-sm font-semibold text-neutral-700">Passport Document</h4>
        {listing.ownerPassportFileName ? (
          <DocumentRow
            fileName={listing.ownerPassportFileName}
            uploadedAt={listing.ownerPassportUploadedAt}
            viewUrl={passportUrl}
            onDelete={handlePassportRemove}
            deleting={passportDeleting}
          />
        ) : (
          <p className="text-sm text-slate-400">No passport uploaded yet.</p>
        )}
        <CanAccess module="pocket_listings" page="all_pocket_listings" action="edit">
          <input
            ref={passportFileRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={handlePassportFilePicked}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => passportFileRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" /> {listing.ownerPassportFileName ? "Replace Passport" : "Upload Passport"}
          </Button>
        </CanAccess>
      </div>

      {/* ── Emirates ID Document ─────────────────────────────────────────────── */}
      <div>
        <h4 className="mb-2 text-sm font-semibold text-neutral-700">Emirates ID Document</h4>
        {listing.ownerEmiratesIdFileName ? (
          <DocumentRow
            fileName={listing.ownerEmiratesIdFileName}
            uploadedAt={listing.ownerEmiratesIdUploadedAt}
            viewUrl={emiratesIdUrl}
            onDelete={handleEmiratesIdRemove}
            deleting={emiratesIdDeleting}
          />
        ) : (
          <p className="text-sm text-slate-400">No Emirates ID uploaded yet.</p>
        )}
        <CanAccess module="pocket_listings" page="all_pocket_listings" action="edit">
          <input
            ref={emiratesIdFileRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={handleEmiratesIdFilePicked}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => emiratesIdFileRef.current?.click()}
            loading={emiratesIdFile !== null}
          >
            <Upload className="h-3.5 w-3.5" /> {listing.ownerEmiratesIdFileName ? "Replace Emirates ID" : "Upload Emirates ID"}
          </Button>
        </CanAccess>
      </div>

      {/* ── Additional Documents ──────────────────────────────────────────────── */}
      <div>
        <h4 className="mb-2 text-sm font-semibold text-neutral-700">Additional Documents</h4>
        {documents.length === 0 ? (
          <p className="text-sm text-slate-400">No additional documents uploaded yet.</p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <DocumentRow
                key={doc.id}
                fileName={doc.fileName}
                uploadedAt={doc.uploadedAt}
                uploaderName={doc.uploader?.fullName}
                viewUrl={doc.fileUrl ?? pocketListingsService.ownerDocFileUrl(listing.id, doc.id)}
                onDelete={() => setDeleteDocId(doc.id)}
              />
            ))}
          </div>
        )}
        <CanAccess module="pocket_listings" page="all_pocket_listings" action="edit">
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setAddDocOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Document
          </Button>
        </CanAccess>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────────── */}
      <PassportDateModal
        open={passportDateOpen}
        onClose={() => {
          setPassportDateOpen(false);
          setPassportFile(null);
        }}
        onConfirm={handlePassportUpload}
        loading={uploadOwnerPassport.isPending}
        entityLabel="the property owner"
        initial={{
          passportStartDate: listing.ownerPassportStartDate?.slice(0, 10),
          passportEndDate: listing.ownerPassportEndDate?.slice(0, 10),
        }}
      />

      <AddDocumentModal
        open={addDocOpen}
        onClose={() => setAddDocOpen(false)}
        onUpload={handleDocUpload}
      />

      <ConfirmModal
        open={!!deleteDocId}
        onClose={() => setDeleteDocId(null)}
        onConfirm={() => deleteDocId && handleDocDelete(deleteDocId)}
        title="Remove document?"
        message="This will permanently delete the uploaded file."
        confirmLabel="Remove"
        loading={docDeleting}
      />
    </div>
  );
}

function formatDate(iso?: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toISOString().split("T")[0];
  } catch {
    return iso;
  }
}

function DetailField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50/60 px-4 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{label}</p>
        <p className="mt-0.5 truncate text-sm text-neutral-800" title={value ?? ""}>
          {value || <span className="text-neutral-300">—</span>}
        </p>
      </div>
    </div>
  );
}

function DocumentRow({
  fileName,
  uploadedAt,
  uploaderName,
  viewUrl,
  onDelete,
  deleting,
}: {
  fileName: string;
  uploadedAt?: string | null;
  uploaderName?: string | null;
  viewUrl: string | null;
  onDelete: () => void;
  deleting?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-neutral-200 bg-neutral-50/60 px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
          <FileText className="h-4 w-4 text-neutral-500" />
        </div>
        <div className="min-w-0">
          <p className="mt-0.5 truncate text-xs text-emerald-700" title={fileName}>
            {fileName}
          </p>
          {uploadedAt && (
            <p className="mt-0.5 text-xs text-neutral-400">
              Uploaded {formatDateTime(uploadedAt)}
              {uploaderName ? ` by ${uploaderName}` : ""}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {viewUrl && (
          <a
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded px-2 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" /> View
          </a>
        )}
        <CanAccess module="pocket_listings" page="all_pocket_listings" action="edit">
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="rounded p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-50"
            title="Remove document"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </button>
        </CanAccess>
      </div>
    </div>
  );
}

function AddDocumentModal({
  open,
  onClose,
  onUpload,
}: {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File, type: string, label?: string) => Promise<unknown>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState("NOC");
  const [label, setLabel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  function reset() {
    setType("NOC");
    setLabel("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`File too large. Maximum ${MAX_MB} MB.`);
      return;
    }
    setUploading(true);
    try {
      await onUpload(file, type, label.trim() || undefined);
      toast.success("Document uploaded successfully.");
      handleClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Document"
      description="Upload an additional document (NOC, Title Deed, Agreement, etc.). Accepted: JPEG, PNG, PDF (max 20 MB)."
      size="md"
    >
      <div className="space-y-4">
        <Field label="Document Type">
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </Field>

        {type === "Other" && (
          <Field label="Custom Label">
            <Input
              placeholder="e.g. Utility Bill"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </Field>
        )}

        <Field label="File">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" /> Choose file
            </Button>
            <span className="text-xs text-slate-500 truncate">
              {file ? file.name : "No file selected"}
            </span>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </Field>

        <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} loading={uploading}>
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Upload
          </Button>
        </div>
      </div>
    </Modal>
  );
}
