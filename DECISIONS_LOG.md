# Decisions Log

Factual, timestamped (IST) log of notable decisions, defaults chosen under ambiguity, and anything proposed-then-changed. For the AI workflow note.

- 16:50 — Read BREIF.md (actual brief; pasted scope doc is my own refinement of it, confirmed consistent). Timer: 16:24–20:24 IST.
- 16:52 — Planned stack/schema/API/folders/access-control/risks in plan mode; user approved with 8 changes (see below), applied before coding started.
  - Concurrency control changed from `expectedUpdatedAt` timestamp compare to an integer `version` column with atomic conditional `updateMany` (avoids timestamp-precision races).
  - Added indexes: `Document(ownerId, updatedAt desc)`, `Share(userId)`, `Presence(documentId, lastSeenAt)`.
  - Presence heartbeat sets `lastSeenAt` explicitly (not relying on `@updatedAt`, which may not bump on a no-op upsert); merged heartbeat+read into one `POST /presence` returning `{others, version, lastEditedBy}`, dropping the separate GET.
  - Sharing collapsed from POST+PATCH to one idempotent `PUT /shares/:userId`; dropped standalone `GET /shares` (share list now returned inline on `GET /documents/:id` for owners).
  - Schema: added `User.title`/`avatarColor` for UI; `Document.title`/`contentHtml` defaults; `updatedBy` as a real relation (`onDelete: SetNull`).
  - Added `GET /api/health` (SELECT 1) to verify the Phase 0 deploy end-to-end.
  - Using `create-next-app@latest` (current stable) rather than pinning to Next 14.
  - Will commit after each phase.
- 16:55 — npm package name can't contain capital letters ("Draftroom"), so scaffolded into a temp lowercase dir (`draftroom-tmp`) and will move contents into the actual project folder; `package.json` name set to `draftroom`.
- No Vercel CLI / GitHub CLI pre-authenticated in this environment. Asked user for a Neon connection string (pooled + direct) and a Vercel API token to deploy non-interactively, rather than requiring an interactive browser login mid-assessment.
