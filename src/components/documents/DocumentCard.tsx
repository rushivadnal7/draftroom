"use client";

import { motion } from "motion/react";
import { FileText, Trash2 } from "lucide-react";

export type DocSummary = { id: string; title: string; updatedAt: string; preview: string };

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function DocumentCard({
  doc,
  subtitle,
  rolePillLabel,
  rolePillClass,
  onDelete,
  index = 0,
}: {
  doc: DocSummary;
  subtitle?: string;
  rolePillLabel: string;
  rolePillClass: string;
  onDelete?: () => void;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index, 8) * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex min-h-[148px] flex-col rounded-[var(--radius-card)] bg-surface p-5 shadow-[var(--shadow-card)] transition-[transform,box-shadow] duration-[var(--dur-fast)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-float)]"
    >
      <a href={`/documents/${doc.id}`} className="flex flex-1 flex-col">
        <div className="flex items-start gap-2 pr-8">
          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-surface-muted">
            <FileText className="size-3.5 text-ink-muted" strokeWidth={1.75} />
          </span>
          <p className="truncate text-base font-medium">{doc.title}</p>
        </div>
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-ink-muted">
          {doc.preview || <span className="italic text-ink-muted/60">No content yet</span>}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className={`inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-xs font-medium ${rolePillClass}`}>
            {rolePillLabel}
          </span>
          <span className="truncate text-xs text-ink-muted tabular-nums">
            {subtitle ? `${subtitle} · ${timeAgo(doc.updatedAt)}` : timeAgo(doc.updatedAt)}
          </span>
        </div>
      </a>
      {onDelete && (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            onDelete();
          }}
          aria-label="Delete document"
          className="absolute right-3 top-3 grid size-8 place-items-center rounded-full opacity-0 transition hover:bg-surface-muted focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Trash2 className="size-4 text-ink-muted" strokeWidth={1.75} />
        </button>
      )}
    </motion.div>
  );
}
