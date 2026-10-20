import fs from "node:fs";
import path from "node:path";

let counter = 1;
const nid = (p) => `${p}${counter++}`;

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function lbl(text) {
  return esc(String(text).split("\n").join("<br>"));
}

function vertex(id, value, x, y, w, h, style) {
  return `<mxCell id="${id}" value="${lbl(value)}" style="${style}" vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`;
}
function edgeCell(id, source, target, value, style) {
  return `<mxCell id="${id}" value="${lbl(value)}" style="${style}" edge="1" parent="1" source="${source}" target="${target}"><mxGeometry relative="1" as="geometry"/></mxCell>`;
}

// ---------- shared styles ----------
const BASE = "whiteSpace=wrap;html=1;fontSize=11;align=center;verticalAlign=middle;rounded=1;arcSize=8;spacing=4;";
const STYLE = {
  client: `${BASE}fillColor=#DAE8FC;strokeColor=#6C8EBF;`,
  server: `${BASE}fillColor=#E1D5E7;strokeColor=#9673A6;`,
  api: `${BASE}fillColor=#FFE6CC;strokeColor=#D79B00;`,
  lib: `${BASE}fillColor=#D5E8D4;strokeColor=#82B366;`,
  db: `${BASE}fillColor=#F5F5F5;strokeColor=#666666;`,
  decision: "rhombus;whiteSpace=wrap;html=1;fillColor=#FFF2CC;strokeColor=#D6B656;fontSize=11;align=center;verticalAlign=middle;spacing=4;",
  note: "rounded=1;arcSize=6;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#999999;dashed=1;fontStyle=2;fontSize=10;align=left;verticalAlign=top;spacing=8;",
  titlebar: "rounded=0;whiteSpace=wrap;html=1;fillColor=#0F110E;strokeColor=none;fontColor=#FFFFFF;fontSize=14;fontStyle=1;align=left;verticalAlign=middle;spacing=14;",
  laneHeader: "rounded=0;whiteSpace=wrap;html=1;fontColor=#FFFFFF;fontSize=12;fontStyle=1;align=center;verticalAlign=middle;",
};
const EDGE_DEFAULT = "edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;fontSize=10;strokeColor=#333333;endArrow=block;endFill=1;jettySize=auto;orthogonalLoop=1;fontColor=#333333;labelBackgroundColor=#FFFFFF;";
const EDGE_YES = "edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;fontSize=10;strokeColor=#5B9A3B;endArrow=block;endFill=1;fontColor=#5B9A3B;labelBackgroundColor=#FFFFFF;";
const EDGE_NO = "edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;fontSize=10;strokeColor=#E5484D;dashed=1;endArrow=block;endFill=1;fontColor=#E5484D;labelBackgroundColor=#FFFFFF;";

// ============================================================
// PAGE 1 — DB SCHEMA
// ============================================================
function buildSchemaPage() {
  const cells = [];
  const ROWH = 26, HEADH = 32, W = 260;

  function entity(idPrefix, x, y, title, rows, color) {
    cells.push(vertex(idPrefix + "_h", title, x, y, W, HEADH,
      `rounded=0;whiteSpace=wrap;html=1;fillColor=${color};strokeColor=#333333;fontColor=#FFFFFF;fontSize=13;fontStyle=1;align=center;verticalAlign=middle;`));
    rows.forEach((r, i) => {
      let extra = "fontColor=#222222;";
      if (r.startsWith("PK")) extra = "fontStyle=1;fontColor=#111111;";
      else if (r.startsWith("FK")) extra = "fontColor=#6C8EBF;fontStyle=1;";
      else if (r.startsWith("UQ") || r.startsWith("IDX")) extra = "fontColor=#999999;fontStyle=2;fontSize=10;";
      cells.push(vertex(idPrefix + "_r" + i, r, x, y + HEADH + i * ROWH, W, ROWH,
        `rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#333333;fontSize=11;align=left;verticalAlign=middle;spacing=8;${extra}`));
    });
    const h = HEADH + rows.length * ROWH;
    return { top: idPrefix + "_h", bottom: idPrefix + "_r" + (rows.length - 1), x, y, w: W, h };
  }

  cells.push(vertex("title1", "Draftroom — Database Schema (PostgreSQL via Prisma ORM)", 40, 20, 900, 40,
    STYLE.titlebar));

  const user = entity("user", 60, 100, "User", [
    "PK  id : String (cuid)",
    "    name : String",
    "    title : String",
    "    avatarColor : String",
    "UQ  email : String",
  ], "#2A2E28");

  const doc = entity("doc", 460, 100, "Document", [
    "PK  id : String (cuid)",
    "    title : String = \"Untitled document\"",
    "    contentHtml : Text = \"\"",
    "    version : Int = 1",
    "FK  ownerId : String → User.id",
    "FK  updatedById : String? → User.id",
    "    createdAt : DateTime",
    "    updatedAt : DateTime",
    "IDX (ownerId, updatedAt desc)",
  ], "#6C8EBF");

  const share = entity("share", 860, 100, "Share", [
    "PK  id : String (cuid)",
    "FK  documentId : String → Document.id (cascade)",
    "FK  userId : String → User.id (cascade)",
    "    role : Role",
    "    createdAt : DateTime",
    "UQ  (documentId, userId)",
    "IDX (userId)",
  ], "#D79B00");

  const presence = entity("pres", 860, 400, "Presence", [
    "PK  id : String (cuid)",
    "FK  documentId : String → Document.id (cascade)",
    "FK  userId : String → User.id (cascade)",
    "    lastSeenAt : DateTime",
    "UQ  (documentId, userId)",
    "IDX (documentId, lastSeenAt)",
  ], "#82B366");

  const roleEnum = entity("role", 1220, 100, "enum Role", [
    "    EDITOR",
    "    VIEWER",
  ], "#9673A6");

  cells.push(vertex("roleNote", "OWNER is implicit: it is whichever\nUser.id equals Document.ownerId.\nIt is never stored as a Share row —\nRole only covers granted (non-owner) access.",
    1220, 230, 260, 90, STYLE.note));

  const ER = "edgeStyle=entityRelationEdgeStyle;rounded=0;html=1;startArrow=ERone;startFill=0;endArrow=ERmany;endFill=0;strokeColor=#555555;fontSize=10;labelBackgroundColor=#FFFFFF;";

  cells.push(edgeCell(nid("e"), user.top, doc.top, "owns\n(ownerId)", ER));
  cells.push(edgeCell(nid("e"), user.top, doc.top, "last edited\n(updatedById, nullable,\nSetNull on delete)",
    "edgeStyle=entityRelationEdgeStyle;rounded=0;html=1;startArrow=oval;startFill=0;endArrow=open;dashed=1;strokeColor=#999999;fontSize=10;labelBackgroundColor=#FFFFFF;exitX=0;exitY=0.75;entryX=0;entryY=0.75;"));
  cells.push(edgeCell(nid("e"), doc.top, share.top, "has shares", ER));
  cells.push(edgeCell(nid("e"), user.top, share.top, "is shared with", ER));
  cells.push(edgeCell(nid("e"), doc.top, presence.top, "has viewers", ER));
  cells.push(edgeCell(nid("e"), user.top, presence.top, "is present in",
    "edgeStyle=entityRelationEdgeStyle;rounded=0;html=1;startArrow=ERone;startFill=0;endArrow=ERmany;endFill=0;strokeColor=#555555;fontSize=10;labelBackgroundColor=#FFFFFF;exitX=0;exitY=1;entryX=0;entryY=0;"));
  cells.push(edgeCell(nid("e"), share.top, roleEnum.top, "role :",
    "edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=open;strokeColor=#555555;fontSize=10;labelBackgroundColor=#FFFFFF;"));

  cells.push(vertex("legend", "Legend\nPK = primary key   FK = foreign key\nUQ = unique constraint   IDX = index\n—▶ one-to-many   —→ nullable, SetNull on delete",
    60, 560, 320, 100, STYLE.note));

  cells.push(vertex("engineNote",
    "Engine notes\nPostgres (hosted on Neon), accessed only through Prisma Client — no raw SQL in route handlers.\nAll ids are cuid() strings (collision-resistant, sortable-ish, generated app-side, not DB serials).\nShare and Presence both cascade-delete when their Document or User is deleted, so a removed\ndocument/user never leaves orphaned access-control or presence rows behind.\nSingle migration so far: prisma/migrations/20261020123000_init (schema evolves via\n`prisma migrate dev` locally, `prisma migrate deploy` runs automatically on every Vercel build).",
    420, 560, 760, 130, STYLE.note));

  return { cells, width: 1520, height: 730 };
}

// ============================================================
// PAGE 2 — ARCHITECTURE & WORKFLOW
// ============================================================
function buildArchPage() {
  const cells = [];
  const LANES = [
    { key: "client", x: 40, label: "Browser\n(Client Components)", color: "#6C8EBF" },
    { key: "server", x: 320, label: "Next.js Server\n(Server Components / Pages)", color: "#9673A6" },
    { key: "api", x: 600, label: "API Route Handlers\n(route.ts, Node runtime)", color: "#D79B00" },
    { key: "lib", x: 880, label: "Lib / Domain Logic\n(src/lib/*)", color: "#82B366" },
    { key: "db", x: 1160, label: "Database\n(Prisma → Postgres/Neon)", color: "#666666" },
  ];
  const LANE_W = 260, LANE_INNER = 240, GAP = 20;
  const PAGE_LEFT = 40, PAGE_RIGHT = 1420;

  function laneX(i) { return LANES[i].x; }

  const ROW_PITCH = 130;

  function estimateHeight(label, w, isDecision) {
    const charsPerLine = Math.max(8, Math.floor((w - 16) / 6.2));
    const lines = label.split("\n");
    let totalLines = 0;
    for (const line of lines) totalLines += Math.max(1, Math.ceil(line.length / charsPerLine));
    const h = totalLines * 14 + 22;
    const capped = Math.min(h, 120);
    return isDecision ? Math.max(64, capped + 10) : Math.max(50, capped);
  }

  // node placement: row is a float; half: undefined | 'L' | 'R'
  function place(lane, sectionBaseY, row, label, type, half) {
    const y = sectionBaseY + 60 + row * ROW_PITCH;
    let x, w;
    const lx = laneX(lane);
    if (half === "L") { x = lx + 10; w = 115; }
    else if (half === "R") { x = lx + 135; w = 115; }
    else { x = lx + 10; w = LANE_INNER; }
    const h = estimateHeight(label, w, type === "decision");
    const id = nid("n");
    const style = type === "decision" ? STYLE.decision : STYLE[type];
    cells.push(vertex(id, label, x, y, w, h, style));
    return { id, x, y, w, h };
  }

  function sectionTitle(y, text) {
    cells.push(vertex(nid("t"), text, PAGE_LEFT, y, PAGE_RIGHT - PAGE_LEFT, 40, STYLE.titlebar));
  }

  function conn(a, b, label, kind) {
    const style = kind === "yes" ? EDGE_YES : kind === "no" ? EDGE_NO : EDGE_DEFAULT;
    cells.push(edgeCell(nid("e"), a.id, b.id, label || "", style));
  }

  let cursorY = 0;

  // ---- lane headers (drawn after we know total height, placeholder for now) ----
  // ---- cross-cutting notes up top ----
  cursorY = 20;
  cells.push(vertex("mainTitle", "Draftroom — System Architecture & Workflow", PAGE_LEFT, cursorY, PAGE_RIGHT - PAGE_LEFT, 44,
    "rounded=0;whiteSpace=wrap;html=1;fillColor=#0F110E;strokeColor=none;fontColor=#D4F36B;fontSize=18;fontStyle=1;align=left;verticalAlign=middle;spacing=16;"));
  cursorY += 60;

  cells.push(vertex("note_access", "Cross-cutting — lib/access.ts\ngetAccessRole(userId, documentId) is the ONLY place permission is decided: it re-derives\nOWNER | EDITOR | VIEWER | null from Document.ownerId + Share on every call — no route ever\ntrusts a client-sent role. requireRole() throws 404 for no access (hides whether the document\nexists) vs 403 for the wrong role. Used by: GET/PATCH/DELETE documents, PUT/DELETE\nshares, POST presence — see the green \"getAccessRole()\" box repeated through this diagram.",
    PAGE_LEFT, cursorY, 660, 110, STYLE.note));
  cells.push(vertex("note_sanitize", "Cross-cutting — lib/sanitize.ts\nsanitizeDocumentHtml() (sanitize-html, fixed allow-list) runs on EVERY write path that stores\nHTML: editor autosave (PATCH) and file-import conversion. Because stored HTML is always this\nknown-safe subset, the hand-rolled Markdown export walker can safely assume its shape —\nno general-purpose HTML parser needed on the way back out.",
    PAGE_LEFT + 680, cursorY, 700, 110, STYLE.note));
  cursorY += 130;

  // ================= W1: Sign in =================
  sectionTitle(cursorY, "1 — Sign in (pick a seeded profile)");
  { const base = cursorY;
    const n0 = place(0, base, 0, "/login — UserSwitcher\nclick a seeded profile card", "client");
    const n1 = place(0, base, 1, "fetch POST /api/auth/login\n{ userId }", "client");
    const n2 = place(2, base, 2, "api/auth/login/route.ts\nPOST handler", "api");
    const n3 = place(4, base, 3, "prisma.user.findUnique\n({ id: userId })\n(401 if not found)", "db");
    const n4 = place(3, base, 4, "session.ts\ncreateSessionCookieValue(userId)\nHMAC-SHA256 signed,\nbase64url { uid, exp }", "lib");
    const n5 = place(2, base, 5, "Set-Cookie: draftroom_session\nhttpOnly, sameSite=lax,\n7-day maxAge", "api");
    const n6 = place(0, base, 6, "Client redirected\n→ /dashboard", "client");
    conn(n0, n1); conn(n1, n2); conn(n2, n3, "find user"); conn(n3, n4, "user found"); conn(n4, n5); conn(n5, n6);
    cursorY = base + 60 + 7 * ROW_PITCH + 20;
  }

  // ================= W2: Route protection =================
  sectionTitle(cursorY, "2 — Route protection (every page load, cross-cutting)");
  { const base = cursorY;
    const n0 = place(0, base, 0, "Browser requests\n/dashboard or /documents/[id]", "client");
    const n1 = place(1, base, 1, "Server Component runs\ngetCurrentUser()", "server");
    const n2 = place(3, base, 2, "session.ts: getSessionUserId()\nreads cookie → verifySessionCookieValue()\n(HMAC compare via timingSafeEqual + exp check)", "lib");
    const n3 = place(4, base, 3, "prisma.user.findUnique\n({ id: uid })", "db");
    const n4 = place(1, base, 4, "Signed in?", "decision");
    const n5l = place(1, base, 5, "No → redirect('/login')", "server", "L");
    const n5r = place(1, base, 5, "Yes → render page,\n`user` in scope", "server", "R");
    conn(n0, n1); conn(n1, n2); conn(n2, n3); conn(n3, n4);
    conn(n4, n5l, "no", "no"); conn(n4, n5r, "yes", "yes");
    cursorY = base + 60 + 6 * ROW_PITCH + 20;
  }

  // ================= W3: Dashboard load =================
  sectionTitle(cursorY, "3 — Dashboard load (Server Component reads Prisma directly — no API route)");
  { const base = cursorY;
    const n0 = place(0, base, 0, "Navigate to /dashboard\n(after step 2 passes)", "client");
    const n1 = place(1, base, 1, "dashboard/page.tsx\n(Server Component)\ngetCurrentUser()", "server");
    const n2 = place(4, base, 2, "Promise.all:\nprisma.document.findMany({ownerId}) — \"mine\"\nprisma.share.findMany({userId, include: document}) — \"shared\"", "db");
    const n3 = place(4, base, 3, "prisma.user.findMany\n({ id: in ownerIds })\nresolve owner names for shared docs", "db");
    const n4 = place(3, base, 4, "htmlToPreviewText(contentHtml)\nper document → 2-line card preview", "lib");
    const n5 = place(0, base, 5, "<DashboardClient mine shared />\nrenders DocumentCard grid", "client");
    conn(n0, n1); conn(n1, n2); conn(n2, n3); conn(n3, n4); conn(n4, n5);
    cursorY = base + 60 + 6 * ROW_PITCH + 20;
  }

  // ================= W4: Create blank doc =================
  sectionTitle(cursorY, "4 — Create a new blank document");
  { const base = cursorY;
    const n0 = place(0, base, 0, "Click \"New document\" card", "client");
    const n1 = place(0, base, 1, "fetch POST /api/documents", "client");
    const n2 = place(2, base, 2, "documents/route.ts POST\ngetCurrentUser() (401 if none)", "api");
    const n3 = place(4, base, 3, "prisma.document.create({ ownerId })\ndefaults: title, contentHtml=\"\", version=1", "db");
    const n4 = place(2, base, 4, "201 { id }", "api");
    const n5 = place(0, base, 5, "router.push('/documents/[id]')", "client");
    conn(n0, n1); conn(n1, n2); conn(n2, n3); conn(n3, n4); conn(n4, n5);
    cursorY = base + 60 + 6 * ROW_PITCH + 20;
  }

  // ================= W5: Import =================
  sectionTitle(cursorY, "5 — Import a file → new document (.txt / .md / .docx, ≤ 2MB)");
  { const base = cursorY;
    const n0 = place(0, base, 0, "ImportCard — drag/drop\nor file picker", "client");
    const n1 = place(0, base, 1, "fetch POST /api/import\nmultipart FormData{ file }", "client");
    const n2 = place(2, base, 2, "import/route.ts POST\ngetCurrentUser(); validate size\n(empty→422, >2MB→413)", "api");
    const n3 = place(3, base, 3, "convert.ts\ngetImportKind(filename)", "lib");
    const n4 = place(3, base, 4, "Known extension?", "decision");
    const n5l = place(3, base, 5, "convertTxtToHtml() /\nconvertMarkdownToHtml()+extractMarkdownH1() /\nconvertDocxToHtml() via mammoth", "lib", "L");
    const n5r = place(3, base, 5, "throw ImportError\nUNSUPPORTED_TYPE → 415", "lib", "R");
    const n6 = place(3, base, 6, "deriveTitleFromFilename()\nfallback title", "lib");
    const n7 = place(3, base, 7, "sanitizeDocumentHtml(html)", "lib");
    const n8 = place(4, base, 8, "prisma.document.create\n({ title, contentHtml, ownerId })", "db");
    const n9 = place(0, base, 9, "201 { id } → client redirects\nto /documents/[id]", "client");
    conn(n0, n1); conn(n1, n2); conn(n2, n3); conn(n3, n4);
    conn(n4, n5l, "yes", "yes"); conn(n4, n5r, "no", "no");
    conn(n5l, n6); conn(n6, n7); conn(n7, n8); conn(n8, n9);
    cursorY = base + 60 + 10 * ROW_PITCH + 20;
  }

  // ================= W6: Open document =================
  sectionTitle(cursorY, "6 — Open a document (access-gated Server Component)");
  { const base = cursorY;
    const n0 = place(0, base, 0, "Navigate to /documents/[id]", "client");
    const n1 = place(1, base, 1, "documents/[id]/page.tsx\ngetCurrentUser() — redirect if none\n(reuses step 2)", "server");
    const n2 = place(3, base, 2, "access.ts: getAccessRole(userId, id)\nprisma.document.findUnique\n({ ownerId, shares: where userId })", "lib");
    const n3 = place(1, base, 3, "role === null ?", "decision");
    const n4l = place(1, base, 4, "Has role → continue", "server", "L");
    const n4r = place(1, base, 4, "notFound() → 404\n(hides existence\nfrom strangers)", "server", "R");
    const n5 = place(4, base, 5, "prisma.document.findUnique\n({ id }) — full document", "db");
    const n6 = place(1, base, 6, "role === OWNER ?", "decision");
    const n7l = place(4, base, 7, "Yes → also fetch:\nprisma.share.findMany (collaborators)\nprisma.user.findMany (shareable users)", "db", "L");
    const n7r = place(1, base, 7, "No → shares=[],\nshareableUsers=[]", "server", "R");
    const n8 = place(0, base, 8, "<DocumentEditor> mounts client-side\nwith title, contentHtml, version, role,\nisOwner... Tiptap initialized from\ninitialContentHtml", "client");
    conn(n0, n1); conn(n1, n2); conn(n2, n3);
    conn(n3, n4l, "has role", "yes"); conn(n3, n4r, "null", "no");
    conn(n4l, n5); conn(n5, n6);
    conn(n6, n7l, "yes", "yes"); conn(n6, n7r, "no", "no");
    conn(n7l, n8); conn(n7r, n8);
    cursorY = base + 60 + 9 * ROW_PITCH + 20;
  }

  // ================= W7: Edit / autosave / conflict =================
  sectionTitle(cursorY, "7 — Edit content: debounced autosave + optimistic-concurrency conflict (the core workflow)");
  { const base = cursorY;
    const n0 = place(0, base, 0, "User types → Tiptap\nonUpdate fires", "client");
    const n1 = place(0, base, 1, "setSaveState('saving')\ndebounce 800ms", "client");
    const n2 = place(0, base, 2, "fetch PATCH /api/documents/[id]\n{ version: versionRef.current, contentHtml }", "client");
    const n3 = place(2, base, 3, "documents/[id]/route.ts PATCH\ngetCurrentUser()", "api");
    const n4 = place(3, base, 4, "getAccessRole() → requireRole\n([OWNER, EDITOR])\n(403 if VIEWER)", "lib");
    const n5 = place(2, base, 5, "zod patchSchema.parse(body)", "api");
    const n6 = place(3, base, 6, "sanitizeDocumentHtml(contentHtml)", "lib");
    const n7 = place(4, base, 7, "ATOMIC: prisma.document.updateMany(\nwhere:{ id, version: body.version },\ndata:{ version:{increment:1}, updatedById, contentHtml })", "db");
    const n8 = place(4, base, 8, "result.count === 0 ?\n(version already moved)", "decision");
    const n9l = place(4, base, 9, "count===1 → re-fetch\nupdated doc", "db", "L");
    const n9r = place(4, base, 9, "count===0 → re-fetch latest\ndoc + updatedBy.name", "db", "R");
    const n10l = place(2, base, 10, "200 { document }", "api", "L");
    const n10r = place(2, base, 10, "409 { error: STALE_VERSION,\ndocument: latest }", "api", "R");
    const n11l = place(0, base, 11, "versionRef.current = document.version\nsetSaveState('saved')", "client", "L");
    const n11r = place(0, base, 11, "Orange conflict banner:\n\"<name> updated this document.\nLoad latest.\"", "client", "R");
    const n12r = place(0, base, 12, "Click Load latest →\neditor.commands.setContent(latest.contentHtml,\n{emitUpdate:false}) + sync title/version\n(no re-save loop)", "client", "R");
    conn(n0, n1); conn(n1, n2); conn(n2, n3); conn(n3, n4); conn(n4, n5); conn(n5, n6); conn(n6, n7); conn(n7, n8);
    conn(n8, n9l, "count=1", "yes"); conn(n8, n9r, "count=0", "no");
    conn(n9l, n10l); conn(n9r, n10r);
    conn(n10l, n11l); conn(n10r, n11r);
    conn(n11r, n12r);
    cursorY = base + 60 + 13 * ROW_PITCH + 20;
  }

  // ================= W8: Poll =================
  sectionTitle(cursorY, "8 — Background staleness poll (catches remote edits even if you never type)");
  { const base = cursorY;
    const n0 = place(0, base, 0, "setInterval every 10s\n(skipped while saving or\nconflict already shown)", "client");
    const n1 = place(0, base, 1, "fetch GET /api/documents/[id]", "client");
    const n2 = place(2, base, 2, "GET handler: getCurrentUser()\n→ getAccessRole() → requireRole\n([OWNER, EDITOR, VIEWER])", "api");
    const n3 = place(4, base, 3, "prisma.document.findUnique\n({ id, include: updatedBy })", "db");
    const n4 = place(0, base, 4, "data.document.version\n!== versionRef.current ?", "decision");
    const n5l = place(0, base, 5, "No — still up to date,\nno-op", "client", "L");
    const n5r = place(0, base, 5, "Yes — show conflict banner\n(reuses step 7's conflict UI)", "client", "R");
    conn(n0, n1); conn(n1, n2); conn(n2, n3); conn(n3, n4);
    conn(n4, n5l, "no", "no"); conn(n4, n5r, "yes", "yes");
    cursorY = base + 60 + 6 * ROW_PITCH + 20;
  }

  // ================= W9: Presence =================
  sectionTitle(cursorY, "9 — Presence heartbeat");
  { const base = cursorY;
    const n0 = place(0, base, 0, "On mount + every 10s\nfetch POST /api/documents/[id]/presence", "client");
    const n1 = place(2, base, 1, "presence/route.ts POST\ngetCurrentUser() → getAccessRole()\n→ requireRole(ALL roles)", "api");
    const n2 = place(4, base, 2, "prisma.presence.upsert\n({documentId_userId},\nupdate:{lastSeenAt: now}, create:{...})", "db");
    const n3 = place(4, base, 3, "prisma.presence.findMany({documentId,\nuserId:{not:self}, lastSeenAt >= now-25s})\n+ include user{ name, avatarColor }", "db");
    const n4 = place(2, base, 4, "200 { others: [...] }", "api");
    const n5 = place(0, base, 5, "<PresenceAvatars> renders\nlive dots", "client");
    conn(n0, n1); conn(n1, n2); conn(n2, n3); conn(n3, n4); conn(n4, n5);
    cells.push(vertex(nid("note"), "Presence lives in the DB, not in-memory —\nVercel serverless instances share no memory,\nso an in-process Map would silently miss updates.",
      laneX(4), base + 60 + 5 * ROW_PITCH + 70, 260, 70, STYLE.note));
    cursorY = base + 60 + 5 * ROW_PITCH + 160;
  }

  // ================= W10 + W11: Sharing =================
  sectionTitle(cursorY, "10 — Sharing: grant / change / revoke access (owner only)");
  { const base = cursorY;
    const n0 = place(0, base, 0, "Owner clicks Share →\n<ShareDialog> opens\n(shareableUsers + initialShares)", "client");
    const n1 = place(0, base, 1, "Owner clicks a role pill\n(No access / Viewer / Editor)", "client");
    const n1b = place(0, base, 2, "If target → Viewer: run the\nready-to-share check (see step 11)\nfirst", "client");
    const n2 = place(0, base, 3, "Optimistic UI update (instant)", "client");
    const n3 = place(0, base, 4, "fetch PUT /api/documents/[id]/shares/[userId]\n{ role }  — or DELETE to revoke", "client");
    const n4 = place(2, base, 5, "shares/[userId]/route.ts\nPUT | DELETE — getCurrentUser()", "api");
    const n5 = place(3, base, 6, "getAccessRole() → requireRole\n([OWNER]) — 403 for non-owners", "lib");
    const n6 = place(2, base, 7, "userId === caller.id ?", "decision");
    const n7l = place(4, base, 8, "No → prisma.user.findUnique(userId)\n(404 if unknown)", "db", "L");
    const n7r = place(2, base, 8, "Yes → 400 — \"you already\nown this document\"", "api", "R");
    const n8 = place(4, base, 9, "PUT → prisma.share.upsert\n({documentId_userId}, update:{role}, create:{...})\nDELETE → prisma.share.deleteMany({documentId,userId})", "db");
    const n9 = place(2, base, 10, "200 { share } or { ok:true }", "api");
    const n10 = place(0, base, 11, "Response ok?", "decision");
    const n11l = place(0, base, 12, "Yes — keep optimistic\nstate (already correct)", "client", "L");
    const n11r = place(0, base, 12, "No — roll back optimistic\nUI + inline error text", "client", "R");
    conn(n0, n1); conn(n1, n1b); conn(n1b, n2); conn(n2, n3); conn(n3, n4); conn(n4, n5); conn(n5, n6);
    conn(n6, n7l, "no", "yes"); conn(n6, n7r, "yes", "no");
    conn(n7l, n8); conn(n8, n9); conn(n9, n10);
    conn(n10, n11l, "ok", "yes"); conn(n10, n11r, "error", "no");
    cursorY = base + 60 + 13 * ROW_PITCH + 20;
  }

  sectionTitle(cursorY, "11 — Ready-to-share placeholder check (runs inside step 10, before granting Viewer access)");
  { const base = cursorY;
    const n0 = place(0, base, 0, "Triggered when owner sets a\ncollaborator's role → Viewer", "client");
    const n1 = place(3, base, 1, "findUnfinishedPlaceholders(contentHtml)\n(lib/placeholders.ts — pure regex,\nexported PLACEHOLDER_PATTERNS)", "lib");
    const n2 = place(0, base, 2, "Unfinished placeholders found?", "decision");
    const n3l = place(0, base, 3, "No → proceed straight to\nstep 10's PUT /shares call", "client", "L");
    const n3r = place(0, base, 3, "Yes → dialog shows orange chips:\n\"N unfinished placeholders found\"\nactions: Fix first / Share anyway", "client", "R");
    const n4r = place(0, base, 4, "\"Fix first\" → close dialog →\njumpToFirstPlaceholder()", "client", "R");
    const n5r = place(3, base, 5, "findFirstPlaceholderPosition(editor.state.doc)\n(lib/placeholders-doc.ts — walks the live\nProseMirror doc with the SAME pattern list)", "lib", "R");
    const n6r = place(0, base, 6, "editor.chain().focus()\n.setTextSelection(match).scrollIntoView().run()\n(native text selection doubles as the highlight)", "client", "R");
    const n7r = place(0, base, 7, "\"Share anyway\" → proceed to\nstep 10's PUT /shares call", "client", "R");
    conn(n0, n1); conn(n1, n2);
    conn(n2, n3l, "no", "no"); conn(n2, n3r, "yes", "yes");
    conn(n3r, n4r); conn(n4r, n5r); conn(n5r, n6r);
    cells.push(edgeCell(nid("e"), n3r.id, n7r.id, "or", EDGE_DEFAULT));
    cursorY = base + 60 + 8 * ROW_PITCH + 20;
  }

  // ================= W12: Export =================
  sectionTitle(cursorY, "12 — Export (entirely client-side — no API route involved)");
  { const base = cursorY;
    const n0 = place(0, base, 0, "<ExportMenu> → \"Export Markdown\"", "client", "L");
    const n0b = place(0, base, 0, "<ExportMenu> → \"Export PDF\"", "client", "R");
    const n1 = place(0, base, 1, "editor.getHTML()\n(live client content)", "client", "L");
    const n1b = place(0, base, 1, "window.print()\nTailwind print: variants hide all\nchrome, leaving only .print-area\n→ browser's native print-to-PDF", "client", "R");
    const n2 = place(3, base, 2, "htmlToMarkdown() walker\n(lib/export/markdown.ts — hand-rolled,\nsafe because content HTML only ever comes\nfrom our own fixed sanitize-html allow-list)", "lib");
    const n3 = place(0, base, 3, "Blob download — no network\ncall, no server round-trip", "client", "L");
    conn(n0, n1); conn(n1, n2); conn(n2, n3);
    conn(n0b, n1b);
    cursorY = base + 60 + 4 * ROW_PITCH + 20;
  }

  const totalHeight = cursorY + 40;

  // ---- lane background bands + headers (prepend so they render behind) ----
  const bandCells = [];
  LANES.forEach((lane, i) => {
    bandCells.push(vertex(nid("band"), "", lane.x - 10, 70, LANE_W, totalHeight - 70,
      `rounded=0;html=1;fillColor=${lane.color};opacity=6;strokeColor=none;`));
    bandCells.push(vertex(nid("lh"), lane.label, lane.x - 10, 70, LANE_W, 50,
      `rounded=0;whiteSpace=wrap;html=1;fillColor=${lane.color};strokeColor=none;fontColor=#FFFFFF;fontSize=12;fontStyle=1;align=center;verticalAlign=middle;`));
  });

  return { cells: [...bandCells, ...cells], width: 1460, height: totalHeight };
}

// ============================================================
// PAGE 3 — APPROACH & RATIONALE
// ============================================================
function buildRationalePage() {
  const cells = [];
  cells.push(vertex("rtitle", "Draftroom — Approach & Rationale (why it's built this way)", 40, 20, 1360, 44,
    "rounded=0;whiteSpace=wrap;html=1;fillColor=#0F110E;strokeColor=none;fontColor=#D4F36B;fontSize=18;fontStyle=1;align=left;verticalAlign=middle;spacing=16;"));

  const cardStyle = "rounded=1;arcSize=6;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#DCE0D7;fontSize=11;align=left;verticalAlign=top;spacing=10;shadow=0;";
  const headStyle = "rounded=0;whiteSpace=wrap;html=1;fillColor=#D5E8D4;strokeColor=#82B366;fontColor=#1A2E12;fontSize=12;fontStyle=1;align=left;verticalAlign=middle;spacing=10;";

  const cards = [
    ["Server Components for reads, Route Handlers for writes",
      "Dashboard, the auth gate, and the document-open page query Prisma directly\nfrom a Server Component — no API hop for pure reads, lower TTFB. The editor's\ninteractive calls (autosave, conflict poll, presence, sharing) run from client\nstate after mount, so those go through real API routes under /api instead."],
    ["Lightweight HMAC-signed cookie session (no auth provider)",
      "The brief explicitly allows seeded accounts / mocked / lightweight login to keep\nscope reasonable. The cookie is still real: httpOnly, sameSite=lax, HMAC-SHA256\nsigned payload verified with crypto.timingSafeEqual, 7-day expiry checked\nserver-side on every request — enough to demonstrate the pattern without\npulling in a full auth framework for a 4–6 hour build."],
    ["Version-int optimistic concurrency, not locks / websockets / CRDT",
      "A single Int version column plus an atomic conditional updateMany(where:\n{id, version}) replaces an earlier timestamp-compare design (timestamp precision\ncan race). Real-time collaborative merging (OT/CRDT) is explicitly out of the\nbrief's scope — the requirement is just \"don't silently overwrite,\" satisfied by\na 409 on the next save attempt plus a 10s poll, with no extra infra."],
    ["Presence stored in Postgres, not in-memory",
      "Vercel serverless function instances don't share memory, so an in-process\nMap of \"who's viewing\" would silently miss other instances in production.\nA DB upsert + windowed query (25s activity window) is simple, serverless-safe,\nand reuses the exact same access-gating as every other document route."],
    ["Single access-control chokepoint: lib/access.ts",
      "getAccessRole() re-derives OWNER / EDITOR / VIEWER / null from Document.ownerId\n+ Share on every call; requireRole() enforces it. Every document-scoped route\n(GET/PATCH/DELETE documents, PUT/DELETE shares, POST presence) calls through\nthis one function instead of re-implementing its own ownership check — and the\n404-vs-403 split deliberately hides a document's existence from users with zero\naccess to it."],
    ["Sanitized HTML as the content column (not JSON/ProseMirror doc, not Markdown)",
      "Tiptap reads and writes HTML directly, so storing HTML avoids a serialize/\ndeserialize layer. sanitize-html's fixed allow-list runs on every write path\n(editor save and import conversion), which is also what makes the hand-rolled\nMarkdown export safe without needing a general-purpose HTML parser on the way\nback out — the input shape is fully constrained by what we ourselves wrote."],
    ["Server-side file conversion on import, not raw blob storage",
      ".txt / .md / .docx (via mammoth) are converted to sanitized HTML and become a\nreal, immediately-editable Document — matching the brief's intent that upload be\na \"product-relevant\" step, not just file storage. Unsupported types are rejected\nwith 415, empty/corrupt files with 422, oversized files with 413."],
    ["Deployment: Vercel + Neon, forced Node runtime",
      "export const runtime = \"nodejs\" on every API route, since Prisma, mammoth, and\nsanitize-html all require Node APIs unavailable on the Edge runtime. Build script\nis `prisma migrate deploy && next build` with `postinstall: prisma generate`, so\nevery deploy applies pending migrations automatically against the same Neon\ndatabase used locally."],
    ["Deliberate scope cuts",
      "No real-time collaborative editing (OT/CRDT) or websockets — conflict is\nsurfaced, not merged. No comment/suggestion mode. No full version history (only\nlast-editor name + conflict detection). No global toast system — sharing uses\ninline error + optimistic rollback instead. \"Fix first\" selects/scrolls to the\nfirst placeholder rather than a fully custom highlight overlay."],
  ];

  const colW = 670, colGap = 20, cardH = 190, headH = 30, rowGap = 20;
  cards.forEach((c, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 40 + col * (colW + colGap);
    const y = 90 + row * (cardH + rowGap);
    cells.push(vertex(nid("ch"), c[0], x, y, colW, headH, headStyle));
    cells.push(vertex(nid("cb"), c[1], x, y + headH, colW, cardH - headH, cardStyle));
  });

  const rows = Math.ceil(cards.length / 2);
  const height = 90 + rows * (cardH + rowGap) + 20;
  return { cells, width: 40 + 2 * colW + colGap + 40, height };
}

// ============================================================
// Assemble mxfile
// ============================================================
function page(name, built) {
  const safeId = name.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return `<diagram id="${safeId}" name="${esc(name)}">
    <mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${built.width}" pageHeight="${built.height}" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        ${built.cells.join("\n        ")}
      </root>
    </mxGraphModel>
  </diagram>`;
}

const schema = buildSchemaPage();
const arch = buildArchPage();
const rationale = buildRationalePage();

const mxfile = `<mxfile host="app.diagrams.net" agent="draftroom-diagram-generator" version="24.0.0">
${page("DB Schema", schema)}
${page("System Architecture & Workflow", arch)}
${page("Approach & Rationale", rationale)}
</mxfile>
`;

const outPath = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "draftroom-diagrams.drawio");
fs.writeFileSync(outPath, mxfile, "utf8");
console.log("Wrote", outPath, mxfile.length, "bytes, cell count approx", counter);
