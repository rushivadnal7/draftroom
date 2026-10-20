import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getAccessRole, requireRole } from "@/lib/access";
import { sanitizeDocumentHtml } from "@/lib/sanitize";
import { ApiError, errorResponse } from "@/lib/api-error";

export const runtime = "nodejs";

const patchSchema = z.object({
  version: z.number().int().positive(),
  title: z.string().trim().min(1).max(200).optional(),
  contentHtml: z.string().optional(),
});

export async function PATCH(req: Request, ctx: RouteContext<"/api/documents/[id]">) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new ApiError(401, "Not signed in");

    const { id } = await ctx.params;
    const role = await getAccessRole(user.id, id);
    requireRole(role, ["OWNER", "EDITOR"]);

    const body = patchSchema.parse(await req.json());

    const data: {
      version: { increment: number };
      updatedById: string;
      title?: string;
      contentHtml?: string;
    } = {
      version: { increment: 1 },
      updatedById: user.id,
    };
    if (body.title !== undefined) data.title = body.title;
    if (body.contentHtml !== undefined) data.contentHtml = sanitizeDocumentHtml(body.contentHtml);

    const result = await prisma.document.updateMany({
      where: { id, version: body.version },
      data,
    });

    if (result.count === 0) {
      const latest = await prisma.document.findUnique({
        where: { id },
        include: { updatedBy: { select: { name: true } } },
      });
      if (!latest) throw new ApiError(404, "Not found");

      return NextResponse.json(
        {
          error: {
            message: `${latest.updatedBy?.name ?? "Someone"} updated this document. Load latest.`,
            code: "STALE_VERSION",
          },
          document: latest,
        },
        { status: 409 }
      );
    }

    const updated = await prisma.document.findUnique({ where: { id } });
    return NextResponse.json({ document: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: { message: "Invalid request" } }, { status: 400 });
    }
    return errorResponse(error);
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/documents/[id]">) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new ApiError(401, "Not signed in");

    const { id } = await ctx.params;
    const role = await getAccessRole(user.id, id);
    requireRole(role, ["OWNER"]);

    await prisma.document.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
