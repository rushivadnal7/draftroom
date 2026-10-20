import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { UserSwitcher } from "@/components/UserSwitcher";
import { Logo } from "@/components/Logo";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const others = await prisma.user.findMany({
    where: { id: { not: user.id } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border bg-surface px-3 sm:px-6">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2 text-sm font-semibold text-ink">
          <Logo className="size-7 shrink-0" />
          Draftroom
        </Link>
        <UserSwitcher
          current={{ id: user.id, name: user.name, title: user.title, avatarColor: user.avatarColor }}
          others={others.map((o) => ({ id: o.id, name: o.name, title: o.title, avatarColor: o.avatarColor }))}
        />
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
