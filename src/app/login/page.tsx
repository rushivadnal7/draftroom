import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export default async function LoginPage() {
  const current = await getCurrentUser();
  if (current) redirect("/dashboard");

  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Draftroom</h1>
        <p className="mt-1 text-sm text-zinc-500">Pick a user to continue.</p>

        <div className="mt-6 flex flex-col gap-3">
          {users.map((user) => (
            <form key={user.id} action="/api/auth/login" method="POST">
              <input type="hidden" name="userId" value={user.id} />
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 px-4 py-3 text-left transition hover:border-zinc-300 hover:bg-zinc-50"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: user.avatarColor }}
                >
                  {user.name.charAt(0)}
                </span>
                <span>
                  <span className="block text-sm font-medium text-zinc-900">{user.name}</span>
                  <span className="block text-xs text-zinc-500">{user.title}</span>
                </span>
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
