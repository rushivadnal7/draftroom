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
        className="flex items-center gap-2 rounded-full border border-zinc-200 px-2 py-1 text-sm hover:bg-zinc-50"
      >
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: current.avatarColor }}
        >
          {current.name.charAt(0)}
        </span>
        <span className="pr-1 text-zinc-700">{current.name}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-10 mt-2 w-56 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg"
          onMouseLeave={() => setOpen(false)}
        >
          <p className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
            Switch user
          </p>
          {others.map((user) => (
            <form key={user.id} action="/api/auth/login" method="POST">
              <input type="hidden" name="userId" value={user.id} />
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-zinc-50"
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium text-white"
                  style={{ backgroundColor: user.avatarColor }}
                >
                  {user.name.charAt(0)}
                </span>
                <span>
                  <span className="block text-zinc-900">{user.name}</span>
                  <span className="block text-xs text-zinc-500">{user.title}</span>
                </span>
              </button>
            </form>
          ))}
          <div className="mt-1 border-t border-zinc-100 pt-1">
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="w-full rounded-md px-2 py-2 text-left text-sm text-zinc-500 hover:bg-zinc-50"
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
