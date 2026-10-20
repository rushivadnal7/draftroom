import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { htmlToPreviewText } from "@/lib/text";
import { DashboardClient } from "@/components/documents/DashboardClient";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [mine, sharedShares] = await Promise.all([
    prisma.document.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.share.findMany({
      where: { userId: user.id },
      include: { document: true },
      orderBy: { document: { updatedAt: "desc" } },
    }),
  ]);

  const ownerIds = [...new Set(sharedShares.map((s) => s.document.ownerId))];
  const owners = ownerIds.length
    ? await prisma.user.findMany({ where: { id: { in: ownerIds } }, select: { id: true, name: true } })
    : [];
  const ownerNameById = new Map(owners.map((o) => [o.id, o.name]));

  return (
    <DashboardClient
      userName={user.name}
      mine={mine.map((d) => ({
        id: d.id,
        title: d.title,
        updatedAt: d.updatedAt.toISOString(),
        preview: htmlToPreviewText(d.contentHtml),
      }))}
      shared={sharedShares.map((s) => ({
        id: s.document.id,
        title: s.document.title,
        updatedAt: s.document.updatedAt.toISOString(),
        preview: htmlToPreviewText(s.document.contentHtml),
        role: s.role,
        ownerName: ownerNameById.get(s.document.ownerId) ?? "Unknown",
      }))}
    />
  );
}
