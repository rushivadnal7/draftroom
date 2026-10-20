# Draftroom

Draftroom — a document workspace for consultancy teams drafting client deliverables: teammates edit together, clients get safe view-only access.

**Live URL:** https://draftroom-gray.vercel.app
**Repo:** https://github.com/rushivadnal7/draftroom

## Test accounts

No password — the login page lists these seeded profiles, click one to sign in as them.

| Name | Title | Role in the scenario |
|---|---|---|
| Alice | Consultant | Owns the two seeded documents |
| Bob | Consultant | Teammate — grant Editor access to see collaborative editing |
| Carol | Client | External client — grant Viewer access to see read-only sharing |

## Try it in 2 minutes

1. Open the live URL and sign in as **Alice**.
2. Open "Acme Corp — Statement of Work" (or create a new document), type something, apply **Bold**, a **Heading**, and a **bulleted list** from the floating toolbar, then refresh the page — your text and formatting are still there.
3. From the dashboard, drag a `.txt` or `.md` file onto the **Import a file** card — it becomes a new, fully editable document.
4. Open the document's **Share** dialog (owner-only) and set **Bob = Editor** and **Carol = Viewer**.
5. Log out, sign back in as **Bob**, open the document, and make an edit — it saves (Editor can write).
6. Log out, sign back in as **Carol**, open the document — the toolbar is disabled with a read-only banner (Viewer can't write; the API returns 403 if a save is forced). Opening a document Carol has no access to returns 404, not 403 — existence is hidden from users with zero access.

## Features

### Core (from the brief)

| Area | What's built |
|---|---|
| Document editing | Create, rename, delete; rich text via Tiptap — bold, italic, underline, H1–H3, bulleted/numbered lists, undo/redo |
| Persistence | Postgres (Neon) via Prisma; survives refresh; formatting preserved as sanitized HTML |
| Autosave | Debounced 800ms save on every change, with a save-status indicator |
| File upload | `.txt` / `.md` / `.docx` → converted into a new, immediately-editable document |
| Sharing | Owner-only grant/change/revoke; Editor and Viewer roles; dashboard visibly separates "My documents" from "Shared with me" |
| Validation & errors | Zod-validated API bodies; typed error responses (400/401/403/404/413/415/422/409) |
| Automated tests | 44 Vitest tests (see below) |
| Deployment | Live on Vercel + Neon |

### Stretch (built, beyond the core ask)

| Feature | Notes |
|---|---|
| Optimistic-concurrency conflict detection | Integer `version` column; a stale PATCH gets a 409 with the latest content instead of silently overwriting it |
| Background staleness poll | Client polls every 10s so a remote edit surfaces even if you never type |
| Presence indicators | Avatar stack showing who else has the document open (DB-backed heartbeat, not full live cursors/co-editing) |
| Export | Markdown (client-side) and PDF (via print) |
| Ready-to-share check | Warns the owner if a document still has `TODO`/`[placeholder]`/`{{mustache}}` markers before granting Viewer access, with a "jump to it" action |

**Not built:** live collaborative co-editing (concurrent edits are detected, not merged), comments/suggestion mode, full version history. See [ARCHITECTURE.md](ARCHITECTURE.md) for why.

## File import

| | |
|---|---|
| Supported | `.txt`, `.md`, `.docx` |
| Size limit | 2 MB |
| Rejected | Unsupported extension → `415`; empty file → `422`; corrupt `.docx` → `422`; over 2 MB → `413` |

`.md` titles are taken from the file's first `# H1` if present, otherwise (like `.txt`/`.docx`) from the filename. All imported content is run through the same HTML sanitizer as the editor before it's stored.

## Local setup

**Prerequisites:** Node.js 20+, a Postgres database (a free [Neon](https://neon.tech) project works and gives you the pooled + direct URLs below).

```bash
git clone https://github.com/rushivadnal7/draftroom.git
cd draftroom
npm install
cp .env.example .env   # fill in the three vars below
npx prisma migrate dev # creates the schema
npm run db:seed        # seeds Alice, Bob, Carol + 2 sample documents
npm run dev             # http://localhost:3000
```

`.env` vars (see `.env.example`):

| Var | What |
|---|---|
| `DATABASE_URL` | Pooled Postgres connection string — used by the running app |
| `DIRECT_URL` | Direct (non-pooled) connection string — used only by Prisma Migrate |
| `SESSION_SECRET` | Random secret for signing the session cookie — generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

Other commands:

```bash
npm run test   # 44 Vitest tests
npm run build  # prisma migrate deploy && next build
npm run lint
```

## API reference

Every document-scoped route resolves the caller's role through one function (`getAccessRole`/`requireRole` in `src/lib/access.ts`) — no route trusts a client-sent role.

| Method | Path | Who | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | Anyone (picks a seeded user) | Sign in; sets the signed session cookie |
| POST | `/api/auth/logout` | Signed in | Clears the session cookie |
| GET | `/api/auth/me` | Signed in | Current user, or 401 |
| GET | `/api/health` | Public | DB connectivity check |
| POST | `/api/documents` | Signed in | Create a new blank document (caller becomes owner) |
| GET | `/api/documents/[id]` | OWNER / EDITOR / VIEWER | Read a document (also used by the staleness poll) |
| PATCH | `/api/documents/[id]` | OWNER / EDITOR | Autosave title/content; optimistic concurrency via `version` |
| DELETE | `/api/documents/[id]` | OWNER | Delete a document |
| POST | `/api/import` | Signed in | Upload `.txt`/`.md`/`.docx` → new document |
| PUT | `/api/documents/[id]/shares/[userId]` | OWNER | Grant or change a collaborator's role |
| DELETE | `/api/documents/[id]/shares/[userId]` | OWNER | Revoke a collaborator's access |
| POST | `/api/documents/[id]/presence` | OWNER / EDITOR / VIEWER | Heartbeat; returns other viewers active in the last 25s |

## Access rules

| Action | OWNER | EDITOR | VIEWER | No access |
|---|---|---|---|---|
| Read (GET) | ✅ | ✅ | ✅ | 404 |
| Edit / autosave (PATCH) | ✅ | ✅ | 403 | 404 |
| Delete | ✅ | 403 | 403 | 404 |
| Share (grant/change/revoke) | ✅ | 403 | 403 | 404 |
| Presence heartbeat | ✅ | ✅ | ✅ | 404 |

A caller with zero access always gets 404, never 403 — so a stranger can't tell a document exists.

## Known limitations

- **Neon cold start:** the first request after idle can take 1–2s while the serverless Postgres instance wakes up.
- **Simulated auth:** login is a seeded profile picker with no password, per the brief's allowance for mocked/lightweight auth. The session cookie itself is a real HMAC-SHA256-signed, httpOnly, 7-day cookie — not a placeholder.
- **Conflicts are detected, not merged:** a concurrent edit surfaces as a 409 (or within 10s via the background poll), and the loser has to click "Load latest" — there's no live collaborative merge.
- No comments/suggestion mode, no full version history (only the last editor's name is kept), no global toast system (sharing shows inline errors with optimistic rollback instead).

See [ARCHITECTURE.md](ARCHITECTURE.md) for the reasoning behind these cuts and [AI_WORKFLOW.md](AI_WORKFLOW.md) for how this was built.
