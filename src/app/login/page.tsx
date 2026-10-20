import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export default async function LoginPage() {
  const current = await getCurrentUser();
  if (current) redirect("/dashboard");

  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="relative flex min-h-full flex-1 items-center justify-center overflow-hidden bg-dark-bg px-4 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 size-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-3xl"
        style={{
          background: "radial-gradient(circle, var(--color-lime-strong) 0%, transparent 70%)",
          animation: "draftroom-glow-drift 24s ease-in-out infinite",
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        <h1 className="text-center text-5xl font-medium leading-[1.05] tracking-tight text-white md:text-6xl">
          Draft together.
          <br />
          Share with confidence.
        </h1>
        <p className="mt-4 text-center text-sm text-white/60">Draftroom — pick a user to continue.</p>

        <div className="mt-10 flex flex-col gap-3">
          {users.map((user) => (
            <form key={user.id} action="/api/auth/login" method="POST">
              <input type="hidden" name="userId" value={user.id} />
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-[var(--radius-panel)] bg-white/5 px-4 py-3 text-left ring-1 ring-white/10 transition-[background-color,transform] duration-[var(--dur-fast)] hover:-translate-y-0.5 hover:bg-white/10"
              >
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: user.avatarColor }}
                >
                  {user.name.charAt(0)}
                </span>
                <span>
                  <span className="block text-sm font-medium text-white">{user.name}</span>
                  <span className="block text-xs text-white/50">{user.title}</span>
                </span>
              </button>
            </form>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes draftroom-glow-drift {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-46%, -54%) scale(1.08); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="draftroom-glow-drift"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
