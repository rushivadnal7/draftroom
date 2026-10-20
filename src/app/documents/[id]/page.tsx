import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getAccessRole } from "@/lib/access";
import { DocumentEditor } from "@/components/editor/DocumentEditor";

export default async function DocumentPage({ params }: PageProps<"/documents/[id]">) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const role = await getAccessRole(user.id, id);
  if (!role) notFound();

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) notFound();

  const isOwner = role === "OWNER";

  const [shares, shareableUsers] = isOwner
    ? await Promise.all([
        prisma.share.findMany({
          where: { documentId: id },
          include: { user: { select: { id: true, name: true, title: true, avatarColor: true } } },
        }),
        prisma.user.findMany({
          where: { id: { not: doc.ownerId } },
          orderBy: { name: "asc" },
        }),
      ])
    : [[], []];

  return (
    <DocumentEditor
      documentId={doc.id}
      initialTitle={doc.title}
      initialContentHtml={doc.contentHtml}
      initialVersion={doc.version}
      role={role}
      isOwner={isOwner}
      shareableUsers={shareableUsers.map((u) => ({
        id: u.id,
        name: u.name,
        title: u.title,
        avatarColor: u.avatarColor,
      }))}
      initialShares={shares.map((s) => ({
        userId: s.userId,
        name: s.user.name,
        title: s.user.title,
        avatarColor: s.user.avatarColor,
        role: s.role,
      }))}
    />
  );
}
