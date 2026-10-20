import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const response = NextResponse.redirect(new URL("/login", req.url), { status: 303 });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
