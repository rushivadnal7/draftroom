"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { ArrowLeft, Share2 } from "lucide-react";
import { Toolbar } from "./Toolbar";
import { SaveStatus, type SaveState } from "./SaveStatus";
import { ExportMenu } from "./ExportMenu";
import { ShareDialog, type ShareableUser, type ShareEntry } from "@/components/documents/ShareDialog";
import { PresenceAvatars, type PresenceUser } from "@/components/documents/PresenceAvatars";
import { findFirstPlaceholderPosition } from "@/lib/placeholders-doc";

type Role = "OWNER" | "EDITOR" | "VIEWER";

export function DocumentEditor({
  documentId,
  initialTitle,
  initialContentHtml,
  initialVersion,
  role,
  isOwner,
  shareableUsers,
  initialShares,
}: {
  documentId: string;
  initialTitle: string;
  initialContentHtml: string;
  initialVersion: number;
  role: Role;
  isOwner: boolean;
  shareableUsers: ShareableUser[];
  initialShares: ShareEntry[];
}) {
  const isReadOnly = role === "VIEWER";

  const [title, setTitle] = useState(initialTitle);
  const [shareOpen, setShareOpen] = useState(false);
  const [others, setOthers] = useState<PresenceUser[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [conflict, setConflict] = useState<{
    updatedBy: string;
    title: string;
    contentHtml: string;
    version: number;
  } | null>(null);

  const versionRef = useRef(initialVersion);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    async (patch: { title?: string; contentHtml?: string }) => {
      try {
        const res = await fetch(`/api/documents/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ version: versionRef.current, ...patch }),
        });

        if (res.status === 409) {
          const data = await res.json();
          setConflict({
            updatedBy: data.document?.updatedBy?.name ?? "Someone",
            title: data.document?.title ?? "",
            contentHtml: data.document?.contentHtml ?? "",
            version: data.document?.version ?? versionRef.current,
          });
          setSaveState("error");
          return;
        }

        if (!res.ok) {
          setSaveState("error");
          return;
        }

        const data = await res.json();
        versionRef.current = data.document.version;
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    },
    [documentId]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        strike: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Underline,
    ],
    content: initialContentHtml,
    editable: !isReadOnly,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (isReadOnly) return;
      setSaveState("saving");
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        void save({ contentHtml: editor.getHTML() });
      }, 800);
    },
  });

  // Polling refs rather than effect deps: the interval is created once per
  // document and reads the latest state at each tick, so a flurry of
  // saveState changes while typing doesn't keep restarting (and starving) it.
  const saveStateRef = useRef(saveState);
  const hasConflictRef = useRef(Boolean(conflict));

  useEffect(() => {
    saveStateRef.current = saveState;
  }, [saveState]);

  useEffect(() => {
    hasConflictRef.current = Boolean(conflict);
  }, [conflict]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (saveStateRef.current === "saving" || hasConflictRef.current) return;
      try {
        const res = await fetch(`/api/documents/${documentId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.document.version !== versionRef.current) {
          setConflict({
            updatedBy: data.document.updatedBy?.name ?? "Someone",
            title: data.document.title,
            contentHtml: data.document.contentHtml,
            version: data.document.version,
          });
        }
      } catch {
        // transient poll failure - try again next tick
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [documentId]);

  useEffect(() => {
    let cancelled = false;

    async function beat() {
      try {
        const res = await fetch(`/api/documents/${documentId}/presence`, { method: "POST" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        setOthers(data.others ?? []);
      } catch {
        // transient heartbeat failure - try again next tick
      }
    }

    void beat();
    const interval = setInterval(beat, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [documentId]);

  function handleTitleBlur() {
    const trimmed = title.trim() || "Untitled document";
    setTitle(trimmed);
    if (trimmed !== initialTitle) {
      setSaveState("saving");
      void save({ title: trimmed });
    }
  }

  function jumpToFirstPlaceholder() {
    if (!editor) return;
    const match = findFirstPlaceholderPosition(editor.state.doc);
    if (!match) {
      editor.commands.focus("start");
      return;
    }
    // Selecting the range is also the "highlight" - the browser's native text
    // selection makes it visually obvious, no custom decoration needed.
    editor.chain().focus().setTextSelection(match).scrollIntoView().run();
  }

  function loadLatest() {
    if (!conflict || !editor) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    // emitUpdate: false - this is us syncing to the server's state, not a local
    // edit, so it must not schedule another autosave of what we just loaded.
    editor.commands.setContent(conflict.contentHtml, { emitUpdate: false });
    setTitle(conflict.title);
    versionRef.current = conflict.version;
    setConflict(null);
    setSaveState("saved");
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="sticky top-0 z-20 flex h-16 items-center justify-between gap-2 border-b border-border bg-surface px-3 sm:gap-4 sm:px-6 print:hidden">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <Link href="/dashboard" className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-surface-muted">
            <ArrowLeft className="size-4" strokeWidth={1.75} />
          </Link>
          {isReadOnly ? (
            <span className="min-w-0 flex-1 truncate text-base font-medium">{title}</span>
          ) : (
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onBlur={handleTitleBlur}
              aria-label="Document title"
              className="min-w-0 flex-1 truncate rounded-md bg-transparent px-2 py-1 text-base font-medium outline-none hover:bg-surface-muted focus-visible:bg-surface-muted"
            />
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <PresenceAvatars users={others} />
          {!isReadOnly && <SaveStatus state={saveState} />}
          <ExportMenu title={title} getHtml={() => editor?.getHTML() ?? ""} />
          {isOwner && (
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="flex h-9 items-center gap-1.5 rounded-full bg-ink px-2.5 text-sm font-medium text-white transition hover:bg-ink-soft sm:px-4"
            >
              <Share2 className="size-3.5" strokeWidth={1.75} />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}
        </div>
      </div>

      {isOwner && (
        <ShareDialog
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          documentId={documentId}
          shareableUsers={shareableUsers}
          initialShares={initialShares}
          getContentHtml={() => editor?.getHTML() ?? ""}
          onFixFirst={jumpToFirstPlaceholder}
        />
      )}

      {conflict && (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-orange bg-orange-soft px-3 py-2 text-sm text-ink sm:px-6 print:hidden">
          <span>{conflict.updatedBy} updated this document.</span>
          <button type="button" onClick={loadLatest} className="shrink-0 font-medium underline">
            Load latest
          </button>
        </div>
      )}

      {isReadOnly && (
        <div className="flex h-11 items-center justify-center border-b border-border bg-surface-muted text-sm text-ink-muted print:hidden">
          View only
        </div>
      )}

      {!isReadOnly && editor && <Toolbar editor={editor} />}

      <div className="mx-auto w-full max-w-3xl flex-1 px-3 py-6 sm:px-6 sm:py-10 print:max-w-none print:p-0">
        <div className="print-area min-h-[70vh] rounded-[var(--radius-card)] bg-surface p-5 shadow-[var(--shadow-card)] sm:p-8 md:p-12 print:min-h-0 print:rounded-none print:p-0 print:shadow-none">
          <EditorContent editor={editor} className="prose-editor text-[16px] leading-[1.7]" />
        </div>
      </div>
    </div>
  );
}
