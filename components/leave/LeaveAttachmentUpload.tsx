"use client";

import { useState, useRef } from "react";
import { Upload, X, FileText, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPTED = ".pdf,.jpg,.jpeg,.png,.webp";
const MAX_SIZE = 5 * 1024 * 1024;

export function LeaveAttachmentUpload({
  file,
  onFileChange,
}: {
  file: File | null;
  onFileChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const validate = (f: File): string | null => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    const valid = ["pdf", "jpg", "jpeg", "png", "webp"];
    if (!ext || !valid.includes(ext)) return "Only PDF, JPEG, PNG, WebP files allowed";
    if (f.size > MAX_SIZE) return "File size must be under 5MB";
    return null;
  };

  const handleFile = (f: File | null) => {
    if (!f) {
      onFileChange(null);
      return;
    }
    const err = validate(f);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    onFileChange(f);
  };

  const isImage = file && file.type.startsWith("image/");

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files?.[0] ?? null);
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-8 text-center transition-colors",
            dragging && "border-accent bg-accent/5",
          )}
        >
          <Upload className="h-6 w-6 text-foreground-muted" />
          <p className="text-sm text-foreground-secondary">
            Drag &amp; drop or <span className="font-medium text-accent">browse</span>
          </p>
          <p className="text-xs text-foreground-muted">PDF, JPEG, PNG, WebP — max 5MB</p>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-panel p-3">
          {isImage ? (
            <ImageIcon className="h-8 w-8 text-accent" />
          ) : (
            <FileText className="h-8 w-8 text-accent" />
          )}
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-foreground-muted">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            onClick={() => {
              onFileChange(null);
              setError(null);
            }}
            className="rounded p-1 text-foreground-muted hover:bg-background hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
