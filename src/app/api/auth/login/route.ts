import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSessionCookieValue,
} from "@/lib/session";
import { ApiError, errorResponse } from "@/lib/api-error";

export const runtime = "nodejs";

function setSessionCookie(response: NextResponse, userId: string) {
  response.cookies.set(SESSION_COOKIE_NAME, createSessionCookieValue(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");

    const userId = isJson
      ? String((await req.json())?.userId ?? "")
      : String((await req.formData()).get("userId") ?? "");

    if (!userId) throw new ApiError(400, "userId is required");

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(401, "Unknown user");

    if (isJson) {
      const response = NextResponse.json({
        user: { id: user.id, name: user.name, title: user.title, avatarColor: user.avatarColor },
      });
      setSessionCookie(response, user.id);
      return response;
    }

    const response = NextResponse.redirect(new URL("/dashboard", req.url), { status: 303 });
    setSessionCookie(response, user.id);
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
