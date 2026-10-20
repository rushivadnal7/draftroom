"use client";

import { useState } from "react";
import { Download, FileDown, Printer } from "lucide-react";
import { htmlToMarkdown, slugifyFilename } from "@/lib/export/markdown";

export function ExportMenu({ title, getHtml }: { title: string; getHtml: () => string }) {
  const [open, setOpen] = useState(false);

  function exportMarkdown() {
    const markdown = htmlToMarkdown(getHtml());
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugifyFilename(title)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  }

  function exportPdf() {
    setOpen(false);
    window.print();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-1.5 rounded-full bg-surface-muted px-2.5 text-sm font-medium text-ink transition hover:bg-border/60 sm:px-4"
      >
        <Download className="size-3.5" strokeWidth={1.75} />
        <span className="hidden sm:inline">Export</span>
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-20 mt-2 w-44 max-w-[calc(100vw-1.5rem)] rounded-[var(--radius-panel)] bg-surface p-1.5 shadow-[var(--shadow-float)] sm:w-48"
          onMouseLeave={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={exportMarkdown}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-surface-muted"
          >
            <FileDown className="size-4 text-ink-muted" strokeWidth={1.75} />
            Export Markdown
          </button>
          <button
            type="button"
            onClick={exportPdf}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-surface-muted"
          >
            <Printer className="size-4 text-ink-muted" strokeWidth={1.75} />
            Export PDF
          </button>
        </div>
      )}
    </div>
  );
}
