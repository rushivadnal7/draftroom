import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { ApiError, errorResponse } from "@/lib/api-error";

export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new ApiError(401, "Not signed in");

    const doc = await prisma.document.create({
      data: { ownerId: user.id },
    });

    return NextResponse.json({ id: doc.id }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
