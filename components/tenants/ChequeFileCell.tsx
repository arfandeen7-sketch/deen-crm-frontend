"use client";

import { useRef, useState } from "react";
import { Upload, Eye, Trash2, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { CanAccess } from "@/components/shared/Guards";
import { getErrorMessage } from "@/services/api/client";
import { formatDateTime } from "@/lib/utils";
import type { TenantCheque } from "@/types";

const ACCEPTED = "image/jpeg,image/png,application/pdf";
const MAX_MB = 10;

interface Props {
  leadId: string;
  cheque: TenantCheque;
  fileUrl?: (leadId: string, chequeId: string) => string;
  onUpload: (chequeId: string, file: File) => Promise<unknown>;
  onDelete: (chequeId: string) => Promise<unknown>;
}

export function ChequeFileCell({ leadId, cheque, fileUrl, onUpload, onDelete }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const hasFile = !!cheque.fileName;
  const resolvedFileUrl = cheque.fileUrl ?? fileUrl?.(leadId, cheque.id) ?? null;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`File too large. Maximum ${MAX_MB} MB.`);
      return;
    }
    setUploading(true);
    try {
      await onUpload(cheque.id, file);
      toast.success(`Cheque ${cheque.chequeNumber} file uploaded.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete(cheque.id);
      toast.success(`Cheque ${cheque.chequeNumber} file removed.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {hasFile ? (
        <div className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
          {resolvedFileUrl ? (
            <a
              href={resolvedFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-xs font-medium text-blue-600 hover:underline"
              title={cheque.fileName ?? undefined}
            >
              {cheque.fileName}
            </a>
          ) : (
            <span className="truncate text-xs font-medium text-neutral-600" title={cheque.fileName ?? undefined}>
              {cheque.fileName}
            </span>
          )}
        </div>
      ) : (
        <span className="text-xs text-neutral-400 italic">No file</span>
      )}

      {cheque.uploadedAt && (
        <span className="text-[10px] text-neutral-400">
          {formatDateTime(cheque.uploadedAt)}
          {cheque.fileUploader?.fullName ? ` · ${cheque.fileUploader.fullName}` : ""}
        </span>
      )}

      <CanAccess module="tenant_details" page="all_tenants" action="upload_documents">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-[11px] font-medium text-neutral-600 hover:bg-neutral-100 transition-colors disabled:opacity-50"
            title={hasFile ? "Replace file" : "Upload file"}
          >
            {uploading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Upload className="h-3 w-3" />
            )}
            {hasFile ? "Replace" : "Upload"}
          </button>

          {hasFile && (
            <>
              {resolvedFileUrl && (
                <a
                  href={resolvedFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-[11px] font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                  title="View"
                >
                  <Eye className="h-3 w-3" /> View
                </a>
              )}
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                title="Remove file"
              >
                {deleting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </button>
            </>
          )}
        </div>
      </CanAccess>

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
