"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { DocumentCard, type DocSummary } from "./DocumentCard";

type SharedDocSummary = DocSummary & { role: "EDITOR" | "VIEWER"; ownerName: string };

export function DashboardClient({
  userName,
  mine,
  shared,
}: {
  userName: string;
  mine: DocSummary[];
  shared: SharedDocSummary[];
}) {
  const router = useRouter();
  const [documents, setDocuments] = useState(mine);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DocSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function createDocument() {
    setCreating(true);
    try {
      const res = await fetch("/api/documents", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create document");
      const data = await res.json();
      router.push(`/documents/${data.id}`);
    } catch {
      setCreating(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setDocuments((docs) => docs.filter((d) => d.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[var(--radius-card)] bg-surface p-6 shadow-[var(--shadow-card)]">
          <p className="text-3xl font-medium tracking-tight">Good day, {userName}</p>
          <p className="mt-1 text-sm text-ink-muted tabular-nums">
            {documents.length} document{documents.length === 1 ? "" : "s"} · {shared.length} shared with you
          </p>
        </div>
        <button
          type="button"
          onClick={createDocument}
          disabled={creating}
          className="flex items-center justify-center gap-2 rounded-[var(--radius-card)] bg-ink p-6 text-white shadow-[var(--shadow-card)] transition hover:bg-ink-soft disabled:opacity-60"
        >
          <Plus className="size-4" strokeWidth={1.75} />
          {creating ? "Creating…" : "New document"}
        </button>
      </div>

      <section className="mt-10">
        <h2 className="text-base font-medium">My documents</h2>
        {documents.length === 0 ? (
          <EmptyState label="No documents yet. Create your first one above." />
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                rolePillLabel="Owner"
                rolePillClass="bg-ink text-white"
                onDelete={() => setDeleteTarget(doc)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-base font-medium">Shared with me</h2>
        {shared.length === 0 ? (
          <EmptyState label="Nothing shared with you yet." />
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shared.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                subtitle={`Owned by ${doc.ownerName}`}
                rolePillLabel={doc.role === "EDITOR" ? "Editor" : "Viewer"}
                rolePillClass={doc.role === "EDITOR" ? "bg-lime text-ink" : "bg-surface-muted text-ink"}
              />
            ))}
          </div>
        )}
      </section>

      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)}>
        <h3 className="text-base font-medium">Delete &ldquo;{deleteTarget?.title}&rdquo;?</h3>
        <p className="mt-2 text-sm text-ink-muted">
          This can&apos;t be undone. Anyone it was shared with will lose access.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="h-10 rounded-full bg-surface-muted px-5 text-sm transition hover:bg-border/60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={deleting}
            className="h-10 rounded-full bg-danger px-5 text-sm text-white transition hover:brightness-95 disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </Dialog>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="mt-4 flex flex-col items-center gap-3 rounded-[var(--radius-card)] bg-surface p-10 text-center shadow-[var(--shadow-card)]">
      <div className="grid size-10 place-items-center rounded-full bg-surface-muted">
        <FileText className="size-5 text-ink-muted" strokeWidth={1.75} />
      </div>
      <p className="text-sm text-ink-muted">{label}</p>
    </div>
  );
}
