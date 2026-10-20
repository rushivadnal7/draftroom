import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ user: null }, { status: 401 });
  return Response.json({
    user: { id: user.id, name: user.name, title: user.title, avatarColor: user.avatarColor },
  });
}
