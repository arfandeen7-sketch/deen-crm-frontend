"use client";

import { useRef, useState } from "react";
import { FileText, Upload, Trash2, ExternalLink, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { Field, Input, Select } from "@/components/ui/Input";
import { CanAccess } from "@/components/shared/Guards";
import { getErrorMessage } from "@/services/api/client";
import { formatDateTime } from "@/lib/utils";
import type { GenericDocument } from "@/types";

const DOC_TYPES = [
  "Ejari",
  "Passport",
  "Emirates ID",
  "Agreement",
  "Contract",
  "NOC",
  "Title Deed",
  "Other",
];

const ACCEPTED = "image/jpeg,image/png,application/pdf";
const MAX_MB = 20;

interface Props {
  documents: GenericDocument[];
  onUpload: (file: File, type: string, label?: string) => Promise<unknown>;
  onDelete: (docId: string) => Promise<unknown>;
  /** Returns the authenticated download URL for a document. */
  fileUrl: (docId: string) => string;
  /** Permission gating for the upload/delete controls. */
  permissionModule: string;
  permissionPage: string;
  permissionAction: string;
  emptyHint?: string;
}

export function GenericDocumentSection({
  documents,
  onUpload,
  onDelete,
  fileUrl,
  permissionModule,
  permissionPage,
  permissionAction,
  emptyHint = "No documents uploaded yet.",
}: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="space-y-3">
      {documents.length === 0 ? (
        <p className="text-sm text-slate-400">{emptyHint}</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              viewUrl={fileUrl(doc.id)}
              permissionModule={permissionModule}
              permissionPage={permissionPage}
              permissionAction={permissionAction}
              onDelete={() => setDeleteId(doc.id)}
            />
          ))}
        </div>
      )}

      <CanAccess module={permissionModule} page={permissionPage} action={permissionAction}>
        <Button type="button" variant="outline" size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Add Document
        </Button>
      </CanAccess>

      <AddDocumentModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onUpload={onUpload}
      />

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          setDeleting(true);
          try {
            await onDelete(deleteId);
            toast.success("Document removed.");
            setDeleteId(null);
          } catch (err) {
            toast.error(getErrorMessage(err));
          } finally {
            setDeleting(false);
          }
        }}
        title="Remove document?"
        message="This will permanently delete the uploaded file."
        confirmLabel="Remove"
        loading={deleting}
      />
    </div>
  );
}

function DocumentRow({
  doc,
  viewUrl,
  permissionModule,
  permissionPage,
  permissionAction,
  onDelete,
}: {
  doc: GenericDocument;
  viewUrl: string;
  permissionModule: string;
  permissionPage: string;
  permissionAction: string;
  onDelete: () => void;
}) {
  const typeLabel = doc.label && doc.label.trim() ? doc.label : doc.type;
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-neutral-200 bg-neutral-50/60 px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
          <FileText className="h-4 w-4 text-neutral-500" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            {typeLabel}
          </p>
          <p className="mt-0.5 truncate text-xs text-emerald-700" title={doc.fileName}>
            {doc.fileName}
          </p>
          <p className="mt-0.5 text-xs text-neutral-400">
            Uploaded {formatDateTime(doc.uploadedAt)}
            {doc.uploader?.fullName ? ` by ${doc.uploader.fullName}` : ""}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <a
          href={viewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 rounded px-2 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" /> View
        </a>
        <CanAccess module={permissionModule} page={permissionPage} action={permissionAction}>
          <button
            type="button"
            onClick={onDelete}
            className="rounded p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            title="Remove document"
          >
            <Trash2 className="h-4 w-4" />
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
  const [type, setType] = useState("Ejari");
  const [label, setLabel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  function reset() {
    setType("Ejari");
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
      description="Upload a document (Ejari, Passport, Agreement, etc.). Accepted: JPEG, PNG, PDF (max 20 MB)."
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
