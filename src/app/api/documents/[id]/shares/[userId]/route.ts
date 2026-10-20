import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getAccessRole, requireRole } from "@/lib/access";
import { ApiError, errorResponse } from "@/lib/api-error";

export const runtime = "nodejs";

const bodySchema = z.object({ role: z.enum(["EDITOR", "VIEWER"]) });

// Idempotent grant-or-change-role, owner only.
export async function PUT(req: Request, ctx: RouteContext<"/api/documents/[id]/shares/[userId]">) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new ApiError(401, "Not signed in");

    const { id, userId } = await ctx.params;
    const role = await getAccessRole(user.id, id);
    requireRole(role, ["OWNER"]);

    if (userId === user.id) throw new ApiError(400, "You already own this document");

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) throw new ApiError(404, "User not found");

    const { role: newRole } = bodySchema.parse(await req.json());

    const share = await prisma.share.upsert({
      where: { documentId_userId: { documentId: id, userId } },
      update: { role: newRole },
      create: { documentId: id, userId, role: newRole },
    });

    return NextResponse.json({ share });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: { message: "Invalid role" } }, { status: 400 });
    }
    return errorResponse(error);
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/documents/[id]/shares/[userId]">) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new ApiError(401, "Not signed in");

    const { id, userId } = await ctx.params;
    const role = await getAccessRole(user.id, id);
    requireRole(role, ["OWNER"]);

    await prisma.share.deleteMany({ where: { documentId: id, userId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
