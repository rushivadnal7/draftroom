# Submission

## Contents of this folder

- **Source code** — the full `draftroom` repository (excluding `node_modules/`, `.next/`, `.git/`)
- `README.md` — product overview, test accounts, 2-minute walkthrough, setup, API reference, access matrix
- `ARCHITECTURE.md` — architecture note: what was prioritized and why, data model, key decisions, deployment, security, deliberate cuts
- `AI_WORKFLOW.md` — AI workflow note
- `SUBMISSION.md` — this file
- `VIDEO_URL.txt` — walkthrough video link
- `DECISIONS_LOG.md` — timestamped log of decisions and defaults made under ambiguity during the build; the primary source for `AI_WORKFLOW.md`'s "what I changed or rejected"

No screenshots/GIF are included — setup requires only the standard `npm install` / `.env` / `prisma migrate` steps documented in `README.md`, and the live URL + video cover the visual walkthrough.

## Live product

- **URL:** https://draftroom-gray.vercel.app
- **Repo:** https://github.com/rushivadnal7/draftroom

## Test accounts (no password — pick a profile at `/login`)

| Name | Title | Role in the scenario |
|---|---|---|
| Alice | Consultant | Owner of the two seeded documents |
| Bob | Consultant | Teammate — grant Editor access to see collaborative editing |
| Carol | Client | External client — grant Viewer access to see read-only sharing |

## Walkthrough video

See `VIDEO_URL.txt`.

## Status

### Working end to end

- Document creation, rename, delete, rich-text editing (bold/italic/underline/H1–H3/bulleted+numbered lists), debounced autosave, persistence across refresh
- File import: `.txt`/`.md`/`.docx` → new editable document, 2 MB cap, typed rejections (415/422/413)
- Sharing: owner-only grant/change/revoke, Editor/Viewer roles, owned-vs-shared dashboard split
- Access control: every document-scoped route enforces role server-side (404 for no access, 403 for wrong role)
- Optimistic-concurrency conflict detection (409 + "Load latest") and a 10s background staleness poll
- Presence (DB-backed heartbeat, avatar stack of other active viewers)
- Export to Markdown and PDF
- Ready-to-share placeholder check before granting Viewer access
- 44 automated Vitest tests, all passing
- Live deployment on Vercel + Neon

### Incomplete / not built

- Real-time collaborative editing — concurrent edits are detected (409 + poll), not merged
- Comments / suggestion mode
- Full version history — only the last editor's name is retained, not stored snapshots
- A global toast/notification system — sharing surfaces errors inline with optimistic rollback instead
- Automated browser/e2e tests — UI correctness was verified manually (curl + live multi-user sessions), not by an automated suite

### What I'd build next with 2–4 more hours

- Playwright smoke tests for the three main flows (create/edit/refresh, import, share → switch user → 403), currently only verified manually
- A minimal `document_versions` table (snapshot per save) so "Load latest" could show a diff instead of replacing content outright
- Redis-backed presence instead of a 10s Postgres poll, for when viewer counts per document grow
- A small toast system so sharing/import errors aren't just inline text
- A real version-history UI
