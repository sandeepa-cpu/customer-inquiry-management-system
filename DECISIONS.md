# Decisions

Record architecture and implementation choices here as they are made.

## Stack (already selected)

- Frontend: React + Vite
- Styling: Tailwind CSS
- Backend: Node.js + Express
- Database: PostgreSQL 18.7
- ORM: Prisma
- Version control: Git

## Phase 2 — Backend

- JavaScript with ES modules (`"type": "module"` in `backend/package.json`).
- Default API port is `5000` via `PORT` in `.env`.
- Express app lives in `src/app.js`; process entrypoint is `src/server.js`.
- Only `GET /api/health` in this phase. Prisma and PostgreSQL are deferred.

## Phase 3 — Database

- Prisma ORM **7.x** is pinned (`prisma@7` and `@prisma/client@7`). Do not use Prisma 8 RC (`prisma@latest`).
- Generator is `prisma-client-js` (deprecated but still supported in Prisma 7) so this JavaScript ESM app can import the client without TypeScript.
- Generated client output is `backend/generated/prisma/`. Runtime import from `src/db.js` is `../generated/prisma/index.js`.
- Prisma CLI config is `backend/prisma.config.js`. Prisma 7 does not load `.env` automatically; dotenv is loaded in that config file and at process startup.
- Local database name is `cims_db` on PostgreSQL 18.7. Two models only: `User` and `Inquiry`, with `InquiryStatus` enum (`NEW`, `IN_PROGRESS`, `RESOLVED`).
- `Inquiry` has indexes on `createdById` and `status`. PostgreSQL does not automatically index foreign-key columns.
- `GET /api/health` remains `{ "status": "ok" }` and does not depend on the database.

## Phase 4A — Authentication

- Server-side sessions (`express-session`) with an HttpOnly `cims.sid` cookie, not JWT and not `localStorage`.
- MemoryStore is local-assessment only; sessions are lost on process restart. No extra session table.
- `saveUninitialized: false`, `resave: false`, `SameSite=Lax`, 8-hour cookie max age.
- After successful login, `req.session.regenerate()` then `req.session.save()` to prevent session fixation.
- `POST /api/auth/logout` is public and idempotent (always 204). `GET /api/auth/me` is protected (401 if missing session or deleted user).
- Passwords hashed with bcrypt cost 10. `passwordHash` is never returned in API JSON.
- No extra roles: all authenticated staff will share the same access later.
- Staff seed reads credentials from env and is disabled when `NODE_ENV=production`. Schema unchanged.

## Phase 4B — Inquiry APIs

- All authenticated staff can list, view, and change status of every inquiry. `createdById` is recorded on create and is not an ownership filter.
- Status may move to any of `NEW`, `IN_PROGRESS`, `RESOLVED` in any direction, including reopening. Last-write-wins. Duplicate inquiries are allowed. List has no pagination (`createdAt` descending).
- Create body is strict: only `customerName`, `customerContact`, `subject`, and `description`. Client-supplied `status`, `createdById`, or other extra keys return 400. The server assigns `NEW` and the session user as `createdById`.
- Status updates use `PATCH /api/inquiries/:id/status` only, not resource-level `PATCH /api/inquiries/:id`.
- Search `q` is a case-insensitive contains on customer name or subject, not description. `q` and `status` combine with AND.
- No Prisma schema or migration change. No new npm dependencies. No frontend in this phase.
