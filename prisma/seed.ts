import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const alice = await prisma.user.upsert({
    where: { email: "alice@draftroom.test" },
    update: {},
    create: {
      id: "user_alice",
      name: "Alice",
      title: "Consultant",
      avatarColor: "#6366F1",
      email: "alice@draftroom.test",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@draftroom.test" },
    update: {},
    create: {
      id: "user_bob",
      name: "Bob",
      title: "Consultant",
      avatarColor: "#10B981",
      email: "bob@draftroom.test",
    },
  });

  const carol = await prisma.user.upsert({
    where: { email: "carol@draftroom.test" },
    update: {},
    create: {
      id: "user_carol",
      name: "Carol",
      title: "Client",
      avatarColor: "#F59E0B",
      email: "carol@draftroom.test",
    },
  });

  const sow = await prisma.document.upsert({
    where: { id: "doc_sow" },
    update: {},
    create: {
      id: "doc_sow",
      title: "Acme Corp - Statement of Work",
      contentHtml:
        "<h1>Acme Corp - Statement of Work</h1><p>This SOW covers the Q1 engagement scope, deliverables, and timeline.</p><h2>Scope</h2><ul><li>Discovery workshops</li><li>Process audit</li><li>Recommendations report</li></ul>",
      ownerId: alice.id,
    },
  });

  await prisma.share.upsert({
    where: { documentId_userId: { documentId: sow.id, userId: bob.id } },
    update: { role: Role.EDITOR },
    create: { documentId: sow.id, userId: bob.id, role: Role.EDITOR },
  });

  await prisma.document.upsert({
    where: { id: "doc_proposal" },
    update: {},
    create: {
      id: "doc_proposal",
      title: "Project Proposal - Draft",
      contentHtml:
        "<h1>Project Proposal</h1><p>Prepared for [CLIENT NAME] by Draftroom Consulting.</p><p>TODO: fill in final budget numbers before sending.</p><h2>Next steps</h2><ol><li>Confirm scope with {{stakeholder}}</li><li>Sign off by [DATE]</li></ol>",
      ownerId: alice.id,
    },
  });

  console.log("Seeded users:", { alice: alice.id, bob: bob.id, carol: carol.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
