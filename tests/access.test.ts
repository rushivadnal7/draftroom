import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiError } from "@/lib/api-error";

vi.mock("@/lib/prisma", () => ({
  prisma: { document: { findUnique: vi.fn() } },
}));

const { prisma } = await import("@/lib/prisma");
const { getAccessRole, requireRole } = await import("@/lib/access");

const findUnique = prisma.document.findUnique as unknown as ReturnType<typeof vi.fn>;

describe("getAccessRole", () => {
  beforeEach(() => {
    findUnique.mockReset();
  });

  it("returns null when the document does not exist", async () => {
    findUnique.mockResolvedValue(null);
    expect(await getAccessRole("stranger", "doc1")).toBeNull();
  });

  it("returns OWNER for the document's owner", async () => {
    findUnique.mockResolvedValue({ ownerId: "alice", shares: [] });
    expect(await getAccessRole("alice", "doc1")).toBe("OWNER");
  });

  it("returns EDITOR for a user shared as editor", async () => {
    findUnique.mockResolvedValue({ ownerId: "alice", shares: [{ role: "EDITOR" }] });
    expect(await getAccessRole("bob", "doc1")).toBe("EDITOR");
  });

  it("returns VIEWER for a user shared as viewer", async () => {
    findUnique.mockResolvedValue({ ownerId: "alice", shares: [{ role: "VIEWER" }] });
    expect(await getAccessRole("carol", "doc1")).toBe("VIEWER");
  });

  it("returns null for a stranger with no share row", async () => {
    findUnique.mockResolvedValue({ ownerId: "alice", shares: [] });
    expect(await getAccessRole("stranger", "doc1")).toBeNull();
  });
});

// Role × action matrix. "read" = GET, "edit" = PATCH content, "share"/"delete" = owner-only actions.
const ACTIONS = {
  read: ["OWNER", "EDITOR", "VIEWER"] as const,
  edit: ["OWNER", "EDITOR"] as const,
  share: ["OWNER"] as const,
  delete: ["OWNER"] as const,
};

const ROLES = ["OWNER", "EDITOR", "VIEWER", null] as const;

describe("requireRole - full access-control matrix", () => {
  for (const role of ROLES) {
    for (const [action, allowed] of Object.entries(ACTIONS)) {
      const allowedRoles: readonly string[] = allowed;
      const isAllowed = role !== null && allowedRoles.includes(role);
      const label = role ?? "stranger";

      it(`${label} × ${action} → ${isAllowed ? "allowed" : "denied"}`, () => {
        if (isAllowed) {
          expect(() => requireRole(role, [...allowed])).not.toThrow();
          return;
        }

        expect.assertions(2);
        try {
          requireRole(role, [...allowed]);
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).status).toBe(role === null ? 404 : 403);
        }
      });
    }
  }
});
