"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Eye, Trash2, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CanAccess } from "@/components/shared/Guards";
import { getErrorMessage } from "@/services/api/client";
import { formatDateTime } from "@/lib/utils";

interface ClientDocumentCardProps {
  label: string;
  fileName?: string | null;
  uploadedAt?: string | null;
  uploaderName?: string | null;
  signedUrl?: string | null;
  onUpload: (file: File) => Promise<void>;
  onDelete: () => Promise<void>;
}

const MAX_PDF_MB = 5;

export function ClientDocumentCard({
  label,
  fileName,
  uploadedAt,
  uploaderName,
  signedUrl,
  onUpload,
  onDelete,
}: ClientDocumentCardProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const hasDocument = !!fileName;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are accepted.");
      return;
    }
    if (file.size > MAX_PDF_MB * 1024 * 1024) {
      toast.error(`File too large. Maximum ${MAX_PDF_MB} MB.`);
      return;
    }
    setUploading(true);
    try {
      await onUpload(file);
      toast.success(`${label} uploaded successfully.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
      // Reset so re-selecting the same file fires onChange again
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete();
      toast.success(`${label} removed.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 shrink-0 text-neutral-500" />
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600">{label}</span>
      </div>

      {hasDocument ? (
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-800 truncate" title={fileName ?? undefined}>
            {fileName}
          </p>
          {uploadedAt && (
            <p className="text-xs text-slate-500">
              Uploaded {formatDateTime(uploadedAt)}
              {uploaderName ? ` by ${uploaderName}` : ""}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-neutral-400 italic">No document uploaded</p>
      )}

      <div className="flex flex-wrap gap-2">
        {hasDocument && signedUrl && (
          <a
            href={signedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" /> View
          </a>
        )}

        <CanAccess module="client_details" page="all_clients" action="upload_documents">
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={uploading}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" />
              {hasDocument ? "Replace" : "Upload PDF"}
            </Button>

            {hasDocument && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Remove
              </Button>
            )}
          </>
        </CanAccess>
      </div>

      {/* Hidden file input — PDF only, max 5 MB */}
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
