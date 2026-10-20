"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { ArrowLeft } from "lucide-react";
import { Toolbar } from "./Toolbar";
import { SaveStatus, type SaveState } from "./SaveStatus";

type Role = "OWNER" | "EDITOR" | "VIEWER";

export function DocumentEditor({
  documentId,
  initialTitle,
  initialContentHtml,
  initialVersion,
  role,
}: {
  documentId: string;
  initialTitle: string;
  initialContentHtml: string;
  initialVersion: number;
  role: Role;
}) {
  const isReadOnly = role === "VIEWER";

  const [title, setTitle] = useState(initialTitle);
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
        // transient poll failure — try again next tick
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [documentId]);

  function handleTitleBlur() {
    const trimmed = title.trim() || "Untitled document";
    setTitle(trimmed);
    if (trimmed !== initialTitle) {
      setSaveState("saving");
      void save({ title: trimmed });
    }
  }

  function loadLatest() {
    if (!conflict || !editor) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    // emitUpdate: false — this is us syncing to the server's state, not a local
    // edit, so it must not schedule another autosave of what we just loaded.
    editor.commands.setContent(conflict.contentHtml, { emitUpdate: false });
    setTitle(conflict.title);
    versionRef.current = conflict.version;
    setConflict(null);
    setSaveState("saved");
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-surface px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/dashboard" className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-surface-muted">
            <ArrowLeft className="size-4" strokeWidth={1.75} />
          </Link>
          {isReadOnly ? (
            <span className="truncate text-base font-medium">{title}</span>
          ) : (
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onBlur={handleTitleBlur}
              aria-label="Document title"
              className="min-w-0 truncate rounded-md bg-transparent px-2 py-1 text-base font-medium outline-none hover:bg-surface-muted focus-visible:bg-surface-muted"
            />
          )}
        </div>
        {!isReadOnly && <SaveStatus state={saveState} />}
      </div>

      {conflict && (
        <div className="flex items-center justify-between border-b border-orange bg-orange-soft px-6 py-2 text-sm text-ink">
          <span>{conflict.updatedBy} updated this document.</span>
          <button type="button" onClick={loadLatest} className="font-medium underline">
            Load latest
          </button>
        </div>
      )}

      {isReadOnly && (
        <div className="flex h-11 items-center justify-center border-b border-border bg-surface-muted text-sm text-ink-muted">
          View only
        </div>
      )}

      {!isReadOnly && editor && <Toolbar editor={editor} />}

      <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <div className="min-h-[70vh] rounded-[var(--radius-card)] bg-surface p-12 shadow-[var(--shadow-card)]">
          <EditorContent editor={editor} className="prose-editor text-[16px] leading-[1.7]" />
        </div>
      </div>
    </div>
  );
}
