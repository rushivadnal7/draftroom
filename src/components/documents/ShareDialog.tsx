"use client";

import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { findUnfinishedPlaceholders, type PlaceholderMatch } from "@/lib/placeholders";

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
  getContentHtml,
  onFixFirst,
}: {
  open: boolean;
  onClose: () => void;
  documentId: string;
  shareableUsers: ShareableUser[];
  initialShares: ShareEntry[];
  getContentHtml: () => string;
  onFixFirst: () => void;
}) {
  const [roles, setRoles] = useState<Record<string, ShareRole>>(() => {
    const map: Record<string, ShareRole> = {};
    for (const u of shareableUsers) map[u.id] = "NONE";
    for (const s of initialShares) map[s.userId] = s.role;
    return map;
  });
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [readyCheck, setReadyCheck] = useState<{ userId: string; matches: PlaceholderMatch[] } | null>(null);

  async function applyRole(userId: string, role: ShareRole) {
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

  function requestRole(userId: string, option: ShareRole) {
    // Ready-to-share check: scanning content only matters when someone is
    // about to gain VIEWER (client-facing, read-only) access.
    if (option === "VIEWER" && roles[userId] !== "VIEWER") {
      const matches = findUnfinishedPlaceholders(getContentHtml());
      if (matches.length > 0) {
        setReadyCheck({ userId, matches });
        return;
      }
    }
    void applyRole(userId, option);
  }

  function handleClose() {
    setReadyCheck(null);
    onClose();
  }

  if (readyCheck) {
    const count = readyCheck.matches.length;
    return (
      <Dialog open={open} onClose={handleClose}>
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-orange-soft">
            <TriangleAlert className="size-4 text-orange" strokeWidth={1.75} />
          </span>
          <div>
            <h3 className="text-base font-medium">
              {count} unfinished placeholder{count === 1 ? "" : "s"} found
            </h3>
            <p className="mt-1 text-sm text-ink-muted">
              This document still has draft markers. Share anyway, or go fix them first?
            </p>
          </div>
        </div>

        <ul className="mt-4 flex max-h-48 flex-col gap-2 overflow-y-auto">
          {readyCheck.matches.map((match, i) => (
            <li
              key={i}
              className="rounded-full bg-orange-soft px-3 py-1.5 text-xs text-ink"
              title={match.snippet}
            >
              <span className="font-medium">{match.text}</span>
              <span className="ml-1.5 text-ink-muted">{match.snippet}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              onFixFirst();
              setReadyCheck(null);
              handleClose();
            }}
            className="h-10 rounded-full bg-ink px-5 text-sm font-medium text-white transition hover:bg-ink-soft"
          >
            Fix first
          </button>
          <button
            type="button"
            onClick={() => {
              const { userId } = readyCheck;
              setReadyCheck(null);
              void applyRole(userId, "VIEWER");
            }}
            className="h-10 rounded-full bg-surface-muted px-5 text-sm transition hover:bg-border/60"
          >
            Share anyway
          </button>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose}>
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
                  onClick={() => requestRole(u.id, option)}
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
          onClick={handleClose}
          className="h-10 rounded-full bg-surface-muted px-5 text-sm transition hover:bg-border/60"
        >
          Done
        </button>
      </div>
    </Dialog>
  );
}
