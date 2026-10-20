import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true, db: "connected" });
  } catch (error) {
    console.error(error);
    return Response.json({ ok: false, db: "error" }, { status: 500 });
  }
}
