export type SaveState = "saving" | "saved" | "error";

const LABEL: Record<SaveState, string> = {
  saving: "Saving…",
  saved: "Saved",
  error: "Error",
};

const DOT_CLASS: Record<SaveState, string> = {
  saving: "bg-ink-muted",
  saved: "bg-lime-strong",
  error: "bg-danger",
};

export function SaveStatus({ state }: { state: SaveState }) {
  return (
    <span
      aria-live="polite"
      className="inline-flex w-[104px] shrink-0 items-center justify-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-ink"
    >
      <span className={`size-1.5 rounded-full ${DOT_CLASS[state]}`} />
      {LABEL[state]}
    </span>
  );
}
