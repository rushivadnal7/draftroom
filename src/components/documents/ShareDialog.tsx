"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";

type ShareRole = "EDITOR" | "VIEWER" | "NONE";

export type ShareableUser = { id: string; name: string; title: string; avatarColor: string };
export type ShareEntry = {
  userId: string;
  name: string;
  title: string;
  avatarColor: string;
  role: "EDITOR" | "VIEWER";
};

export function ShareDialog({
  open,
  onClose,
  documentId,
  shareableUsers,
  initialShares,
}: {
  open: boolean;
  onClose: () => void;
  documentId: string;
  shareableUsers: ShareableUser[];
  initialShares: ShareEntry[];
}) {
  const [roles, setRoles] = useState<Record<string, ShareRole>>(() => {
    const map: Record<string, ShareRole> = {};
    for (const u of shareableUsers) map[u.id] = "NONE";
    for (const s of initialShares) map[s.userId] = s.role;
    return map;
  });
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setRole(userId: string, role: ShareRole) {
    const previous = roles[userId];
    if (previous === role) return;

    setRoles((r) => ({ ...r, [userId]: role }));
    setPending(userId);
    setError(null);

    try {
      const res =
        role === "NONE"
          ? await fetch(`/api/documents/${documentId}/shares/${userId}`, { method: "DELETE" })
          : await fetch(`/api/documents/${documentId}/shares/${userId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ role }),
            });
      if (!res.ok) throw new Error("Failed to update access");
    } catch {
      setRoles((r) => ({ ...r, [userId]: previous }));
      setError("Couldn't update access. Try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <h3 className="text-base font-medium">Share</h3>
      <p className="mt-1 text-sm text-ink-muted">Choose who can view or edit this document.</p>

      <div className="mt-4 flex flex-col gap-3">
        {shareableUsers.length === 0 && (
          <p className="text-sm text-ink-muted">No other seeded users to share with.</p>
        )}
        {shareableUsers.map((u) => (
          <div key={u.id} className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white ring-2 ring-surface"
                style={{ backgroundColor: u.avatarColor }}
              >
                {u.name.charAt(0)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm text-ink">{u.name}</span>
                <span className="block text-xs text-ink-muted">{u.title}</span>
              </span>
            </div>
            <div className="flex shrink-0 gap-1">
              {(["NONE", "VIEWER", "EDITOR"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  disabled={pending === u.id}
                  onClick={() => setRole(u.id, option)}
                  className={`h-7 rounded-full px-2.5 text-xs font-medium transition disabled:opacity-60 ${
                    roles[u.id] === option
                      ? option === "EDITOR"
                        ? "bg-lime text-ink"
                        : option === "VIEWER"
                          ? "bg-surface-muted text-ink ring-1 ring-border"
                          : "bg-ink text-white"
                      : "text-ink-muted hover:bg-surface-muted"
                  }`}
                >
                  {option === "NONE" ? "No access" : option === "VIEWER" ? "Viewer" : "Editor"}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 min-h-5 text-xs text-danger">{error}</p>

      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="h-10 rounded-full bg-surface-muted px-5 text-sm transition hover:bg-border/60"
        >
          Done
        </button>
      </div>
    </Dialog>
  );
}
