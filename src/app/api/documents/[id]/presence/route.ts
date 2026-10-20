import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getAccessRole, requireRole } from "@/lib/access";
import { ApiError, errorResponse } from "@/lib/api-error";

export const runtime = "nodejs";

const ACTIVE_WINDOW_MS = 25_000;

// Heartbeat: client calls this every ~10s while a doc is open. Presence lives
// in the DB (not memory) because Vercel serverless instances don't share memory.
export async function POST(_req: Request, ctx: RouteContext<"/api/documents/[id]/presence">) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new ApiError(401, "Not signed in");

    const { id } = await ctx.params;
    const role = await getAccessRole(user.id, id);
    requireRole(role, ["OWNER", "EDITOR", "VIEWER"]);

    const now = new Date();
    await prisma.presence.upsert({
      where: { documentId_userId: { documentId: id, userId: user.id } },
      update: { lastSeenAt: now },
      create: { documentId: id, userId: user.id, lastSeenAt: now },
    });

    const activeSince = new Date(now.getTime() - ACTIVE_WINDOW_MS);
    const others = await prisma.presence.findMany({
      where: { documentId: id, userId: { not: user.id }, lastSeenAt: { gte: activeSince } },
      include: { user: { select: { id: true, name: true, avatarColor: true } } },
    });

    return NextResponse.json({
      others: others.map((p) => ({ id: p.user.id, name: p.user.name, avatarColor: p.user.avatarColor })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
