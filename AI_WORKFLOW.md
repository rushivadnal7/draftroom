# AI Workflow Note

## Tools used

- **Claude** (chat) — research, the initial phase plan (schema, API surface, folder structure, access-control model, risks), review of that plan, and drafting `DESIGN.md` (the component/token/motion spec this app's UI was built against) and these docs.
- **Claude Code**, running inside VS Code — all implementation. Plan mode produced the Phase 0 plan, which I reviewed and approved with 8 changes (recorded in `DECISIONS_LOG.md`) before any code was written; implementation then proceeded phase by phase with terminal access for migrations, the dev server, `curl`, and the test runner.

## Where AI materially sped things up

- Produced the full Phase 0 plan (schema, API surface, folders, access-control model, risks) in one pass, which I corrected before coding started — avoided mid-build rework.
- Generated the Prisma schema, every zod-validated CRUD route, and the matching Vitest tests together rather than as separate passes, so the tests landed in step with the code instead of trailing it.
- Diagnosed two non-obvious Tiptap v3 bugs quickly from symptoms alone: the toolbar's "active" state lagging a keystroke behind (root cause: `useEditor`'s component-level re-render doesn't fire on selection-only transactions — fixed with `useEditorState`'s selector hook), and "Load latest" silently doing nothing (root cause: Tiptap's `content` prop is only read once at mount, so a server refresh never reaches the live ProseMirror doc — fixed by calling `editor.commands.setContent` directly with the 409 response's own payload).
- Wrote the hand-rolled HTML↔Markdown walker and the regex-based placeholder detector (`TODO`/`TBD`/`XXX`/`[bracket]`/`{{mustache}}`), each with its own small unit-test suite, faster than I'd have gotten both correct by hand inside the timebox.
- Ran a full responsive audit (320–1440px) across every page in one pass and fixed real bugs it found (toolbar overflow, missing `min-w-0` on truncated flex children, a ShareDialog row overflowing below ~375px) rather than eyeballing a couple of breakpoints.
- Drafted `DESIGN.md` once, then implemented every screen against it consistently instead of improvising UI per screen.

## What I changed or rejected

| AI output | What I did instead | Why |
|---|---|---|
| Timestamp (`expectedUpdatedAt`) compare for conflict detection | Integer `version` column + atomic conditional `updateMany` | Timestamp precision can race; an integer compare can't |
| Presence `lastSeenAt` relying on Prisma's `@updatedAt` | Set `lastSeenAt` explicitly on every heartbeat | `@updatedAt` doesn't reliably bump on a no-op upsert |
| Separate POST+PATCH for sharing, standalone `GET /shares` | One idempotent `PUT /shares/:userId` (grant or change) + `DELETE`; share list returned inline on the document page for owners | Fewer endpoints, same behavior, no extra round-trip |
| First pass of "Fix first" (closed the dialog, focused the doc start) | Rebuilt it to walk the live ProseMirror doc with the same pattern list used for detection and select/scroll to the actual match | I flagged that the spec says "scrolls to the first one" and the first pass didn't do that — a real scope cut, not a completed feature |
| Deploying with a Vercel API token / raw Neon connection strings handed to the AI | Asked for those directly; deployed via Vercel's GitHub Git integration with env vars set in the Vercel dashboard | Didn't want to hand infrastructure credentials to an AI session for an unattended deploy |
| Prisma 7 (what a plain `npm install prisma` pulled) | Pinned to Prisma 6.19.3 | Prisma 7 moves the datasource URL out of `schema.prisma` into a new driver-adapter config model — too large a paradigm change to adopt mid-assessment |
| Default Vercel/Neon regions | Pinned both to Singapore (`sin1` / `ap-southeast-1`) | Co-locates app and DB, cutting query latency |
| Next 16's default `cacheComponents`/`partialPrefetching` | Disabled both in `next.config.ts` | They reject the explicit Node-runtime declarations the API routes need, and risk caching one user's response for another session |

## How I verified correctness

- **Automated:** `npm run test` runs the full Vitest suite — **44 tests across 3 files, all passing**:
  - `tests/access.test.ts` — 21 tests (5 direct `getAccessRole` cases, plus a generated 4-role × 4-action permission matrix asserting correct 404-vs-403 behavior for every OWNER/EDITOR/VIEWER/stranger × read/edit/share/delete combination)
  - `tests/import.test.ts` — 16 tests covering txt/md/docx conversion, mocked-mammoth corrupt-file handling, and unsupported-type/empty-content rejection
  - `tests/placeholders.test.ts` — 7 tests for the `TODO`/`TBD`/`XXX`/bracket/mustache detector
- **Manual, via `curl`** against the running dev server and the real Neon database (no browser-automation tool was available in this session): sanitization strips `<script>`/`onclick` on save; a stale `version` on PATCH returns 409 with the latest document and editor name; GET on a document with no access returns 404 for both a stranger and a cross-tenant user; an EDITOR gets 403 on DELETE; import returns 415/422/413 for unsupported/empty/corrupt/oversized files; share grant/role-change/revoke and the immediate 404 after revoke; presence mutual visibility between two users.
- **Manual, on the live deployed URL** across real multi-user browser sessions — this is where the two Tiptap bugs above were actually caught (toolbar active-state lag, non-functional "Load latest"), since neither shows up in a curl check.
- **Explicit gap:** no automated browser/e2e suite (Playwright/Cypress etc.) exists. UI-level correctness relies on the manual testing above, not an automated test — stated plainly rather than implying the 44 Vitest tests cover the whole UI.
