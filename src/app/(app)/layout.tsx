import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { UserSwitcher } from "@/components/UserSwitcher";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const others = await prisma.user.findMany({
    where: { id: { not: user.id } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3">
        <Link href="/dashboard" className="text-sm font-semibold text-zinc-900">
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
