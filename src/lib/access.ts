import { prisma } from "./prisma";
import { ApiError } from "./api-error";

export type AccessRole = "OWNER" | "EDITOR" | "VIEWER" | null;
type GrantedRole = Exclude<AccessRole, null>;

/**
 * Single source of truth for "who can do what" on a document. Every route
 * handler that touches a document, its shares, presence, or export must
 * resolve the caller's role through this function — never query
 * Document.ownerId / Share directly for a permission decision.
 */
export async function getAccessRole(userId: string, documentId: string): Promise<AccessRole> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      ownerId: true,
      shares: { where: { userId }, select: { role: true } },
    },
  });

  if (!doc) return null;
  if (doc.ownerId === userId) return "OWNER";
  return doc.shares[0]?.role ?? null;
}

/**
 * Throws a 404 for callers with no access (so a stranger can't tell the
 * document exists) and a 403 for callers who have access but the wrong role.
 */
export function requireRole(role: AccessRole, allowed: GrantedRole[]): GrantedRole {
  if (role === null) throw new ApiError(404, "Not found");
  if (!allowed.includes(role)) throw new ApiError(403, "Forbidden");
  return role;
}
