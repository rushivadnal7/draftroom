"use client";

import { useState } from "react";

type SwitcherUser = {
  id: string;
  name: string;
  title: string;
  avatarColor: string;
};

export function UserSwitcher({
  current,
  others,
}: {
  current: SwitcherUser;
  others: SwitcherUser[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full bg-surface-muted px-2 py-1 text-sm transition-colors duration-[var(--dur-fast)] hover:bg-border/60"
      >
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white ring-2 ring-surface"
          style={{ backgroundColor: current.avatarColor }}
        >
          {current.name.charAt(0)}
        </span>
        <span className="min-w-0 max-w-24 truncate pr-1 text-ink sm:max-w-none">{current.name}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-20 mt-2 w-56 max-w-[calc(100vw-1.5rem)] rounded-[var(--radius-panel)] bg-surface p-2 shadow-[var(--shadow-float)]"
          onMouseLeave={() => setOpen(false)}
        >
          <p className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-ink-muted">Switch user</p>
          {others.map((user) => (
            <form key={user.id} action="/api/auth/login" method="POST">
              <input type="hidden" name="userId" value={user.id} />
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors duration-[var(--dur-fast)] hover:bg-surface-muted"
              >
                <span
                  className="flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white ring-2 ring-surface"
                  style={{ backgroundColor: user.avatarColor }}
                >
                  {user.name.charAt(0)}
                </span>
                <span>
                  <span className="block text-ink">{user.name}</span>
                  <span className="block text-xs text-ink-muted">{user.title}</span>
                </span>
              </button>
            </form>
          ))}
          <div className="mt-1 border-t border-border pt-1">
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="w-full rounded-md px-2 py-2 text-left text-sm text-ink-muted transition-colors duration-[var(--dur-fast)] hover:bg-surface-muted"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
