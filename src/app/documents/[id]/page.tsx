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

  return (
    <DocumentEditor
      documentId={doc.id}
      initialTitle={doc.title}
      initialContentHtml={doc.contentHtml}
      initialVersion={doc.version}
      role={role}
    />
  );
}
