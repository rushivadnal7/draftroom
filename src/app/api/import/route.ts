import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { sanitizeDocumentHtml } from "@/lib/sanitize";
import { ApiError, errorResponse } from "@/lib/api-error";
import { convertImportFile, ImportError, MAX_IMPORT_BYTES } from "@/lib/import/convert";

export const runtime = "nodejs";

const STATUS_BY_CODE: Record<ImportError["code"], number> = {
  UNSUPPORTED_TYPE: 415,
  EMPTY: 422,
  CORRUPT: 422,
};

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new ApiError(401, "Not signed in");

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError(400, "No file provided");

    if (file.size === 0) throw new ApiError(422, "This file is empty.", "EMPTY");
    if (file.size > MAX_IMPORT_BYTES) throw new ApiError(413, "File is larger than 2 MB.", "TOO_LARGE");

    const buffer = Buffer.from(await file.arrayBuffer());

    let converted;
    try {
      converted = await convertImportFile(file.name, buffer);
    } catch (error) {
      if (error instanceof ImportError) {
        throw new ApiError(STATUS_BY_CODE[error.code], error.message, error.code);
      }
      throw error;
    }

    const doc = await prisma.document.create({
      data: {
        title: converted.title,
        contentHtml: sanitizeDocumentHtml(converted.html),
        ownerId: user.id,
      },
    });

    return NextResponse.json({ id: doc.id }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
