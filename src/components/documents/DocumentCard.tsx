"use client";

import { Trash2 } from "lucide-react";

export type DocSummary = { id: string; title: string; updatedAt: string };

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
}: {
  doc: DocSummary;
  subtitle?: string;
  rolePillLabel: string;
  rolePillClass: string;
  onDelete?: () => void;
}) {
  return (
    <div className="group relative rounded-[var(--radius-card)] bg-surface p-5 shadow-[var(--shadow-card)] transition-[transform,box-shadow] duration-[var(--dur-fast)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-float)]">
      <a href={`/documents/${doc.id}`} className="block">
        <p className="truncate pr-8 text-base font-medium">{doc.title}</p>
        <p className="mt-1 text-xs text-ink-muted tabular-nums">{timeAgo(doc.updatedAt)}</p>
        {subtitle && <p className="mt-1 truncate text-xs text-ink-muted">{subtitle}</p>}
        <span className={`mt-3 inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium ${rolePillClass}`}>
          {rolePillLabel}
        </span>
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
    </div>
  );
}
