"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";

const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = ["txt", "md", "docx"];

export function ImportCard({ onImported }: { onImported: (documentId: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    setError(null);

    const ext = file.name.toLowerCase().split(".").pop() ?? "";
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      setError("Only .txt, .md, or .docx files are supported.");
      return;
    }
    if (file.size === 0) {
      setError("This file is empty.");
      return;
    }
    if (file.size > MAX_IMPORT_BYTES) {
      setError("File is larger than 2 MB.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? "Import failed.");
        setUploading(false);
        return;
      }
      onImported(data.id);
    } catch {
      setError("Import failed. Try again.");
      setUploading(false);
    }
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragOver(false);
        const file = event.dataTransfer.files[0];
        if (file) void handleFile(file);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
      }}
      className={`flex cursor-pointer flex-col justify-center gap-1 rounded-[var(--radius-card)] bg-lime p-6 text-ink shadow-[var(--shadow-card)] transition-[filter] duration-[var(--dur-fast)] ${
        dragOver ? "brightness-95" : ""
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.md,.docx"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.target.value = "";
        }}
      />
      <div className="flex items-center gap-2 text-sm font-medium">
        <Upload className="size-4" strokeWidth={1.75} />
        {uploading ? "Importing…" : "Import a file"}
      </div>
      <p className="text-xs text-ink/70">.txt · .md · .docx, max 2 MB</p>
      <p className="min-h-4 text-xs text-danger">{error}</p>
    </div>
  );
}
