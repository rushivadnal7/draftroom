export type PresenceUser = { id: string; name: string; avatarColor: string };

export function PresenceAvatars({ users }: { users: PresenceUser[] }) {
  if (users.length === 0) return null;

  const shown = users.slice(0, 3);
  const extra = users.length - shown.length;

  return (
    <div className="flex -space-x-2">
      {shown.map((u) => (
        <span
          key={u.id}
          title={`${u.name} is viewing`}
          className="relative flex size-7 items-center justify-center rounded-full text-[11px] font-medium text-white ring-2 ring-surface"
          style={{ backgroundColor: u.avatarColor }}
        >
          {u.name.charAt(0)}
          <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-lime-strong ring-2 ring-surface" />
        </span>
      ))}
      {extra > 0 && (
        <span className="flex size-7 items-center justify-center rounded-full bg-surface-muted text-[11px] font-medium text-ink-muted ring-2 ring-surface">
          +{extra}
        </span>
      )}
    </div>
  );
}
