"use client";

import { useRef, useState } from "react";
import { Upload, FileText, X, AlertCircle } from "lucide-react";

const ACCEPTED = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];
const MAX_SIZE = 5 * 1024 * 1024;

export function AttachmentUpload({
  file,
  onFileSelect,
}: {
  file: File | null;
  onFileSelect: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function validate(f: File): string | null {
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED.includes(ext)) return `Invalid format. Use PDF, JPEG, PNG, or WebP`;
    if (f.size > MAX_SIZE) return "File too large. Maximum 5 MB";
    return null;
  }

  function handleFile(f: File) {
    const err = validate(f);
    if (err) { setError(err); return; }
    setError(null);
    onFileSelect(f);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      {file ? (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
          <span className="flex-1 truncate text-sm text-slate-700">{file.name}</span>
          <span className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</span>
          <button type="button" onClick={() => { onFileSelect(null); setError(null); }} className="text-slate-400 hover:text-rose-500">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
          className={`flex w-full flex-col items-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${dragging ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-slate-300"}`}
        >
          <Upload className="h-5 w-5 text-slate-400" />
          <span className="text-sm text-slate-500">Click or drag to upload</span>
          <span className="text-xs text-slate-400">PDF, JPEG, PNG, WebP — max 5 MB</span>
        </button>
      )}
      {error && (
        <p className="mt-1 flex items-center gap-1 text-xs text-rose-600">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  );
}
