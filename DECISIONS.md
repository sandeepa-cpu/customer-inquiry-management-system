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

## Phase 5A — Frontend setup

- React + Vite JavaScript (JSX) in `frontend/`, not TypeScript. Tailwind CSS v4 via `@tailwindcss/vite`. React Router for `/login`, `/`, `/inquiries/new`, `/inquiries/:id`.
- Visual tokens: slate page background, white cards, teal-700 accent, status badges slate / amber / emerald. System UI font. Max content width ~960px.
- API origin is `VITE_API_URL` (example `http://localhost:5000`). CORS already allows `http://localhost:5173`.

## Phase 5B — Login and session

- Fetch uses `credentials: 'include'`. Auth is the HttpOnly `cims.sid` cookie. No tokens or passwords in `localStorage` or `sessionStorage`.
- `GET /api/auth/me` restores the session on load. Protected routes redirect to `/login`. Authenticated visits to `/login` redirect to `/`.
- Logout calls `POST /api/auth/logout` and clears local user state. Backend 401 on later APIs clears the UI session without storing credentials.

## Phase 5C — Dashboard

- List uses `GET /api/inquiries` with optional `q` and `status`. Search submits on the Search button; status filter reloads immediately. Desktop table plus mobile cards. Empty copy distinguishes “no inquiries yet” from “no matches”.

## Phase 5D — Create and details

- Create sends only `customerName`, `customerContact`, `subject`, and `description`. Success navigates to `/inquiries/:id`. Details load with GET and update status with `PATCH /api/inquiries/:id/status`. Reopening Resolved to New is allowed.

## Phase 5E — Tests, polish, limitations

- Frontend tests: Vitest, jsdom, React Testing Library, user-event, jest-dom. API functions are mocked in tests only.
- Concurrent edits: last-write-wins. Details include Reload so staff can refresh a stale tab. No websocket or polling.
- `requireAuth` still loads the user from the database and destroys the session if the account was deleted.

## AI usage

Cursor AI (in this workspace) and ChatGPT were used as assistants, not as the source of product requirements. Phase plans were written and approved before implementation. The stack, schema, and API shape came from those plans, not from an unconstrained redesign.

**Where AI helped**
- Planning: draft phase plans, file lists, and test matrices for Express, Prisma, sessions, and the React client.
- Implementation: scaffold and edit backend routes, Zod schemas, session middleware, and frontend pages against the approved contracts.
- Debugging: session restore, CORS/`credentials`, deleted-user 401s, and frontend 401 handling that must not loop the login page.
- Tests: Node test cases for auth/inquiries and Vitest + Testing Library flows with a mocked `api.js`.

**How work was reviewed**
- Design stayed inside the approved decisions in this file (HttpOnly sessions, strict create body, `PATCH /:id/status`, search on name/subject only).
- Security behavior was checked in source: `requireAuth` loads the user, create rejects extra fields, responses omit `passwordHash`.
- Automated tests were run in this repo: backend `npm test` (18 passed) and frontend `npm test` (21 passed), plus `npm run build`. Browser checks used the local API and PostgreSQL, not mock data in the running app.

**Example that was accepted**
Status updates use `PATCH /api/inquiries/:id/status` only. A generic `PATCH /api/inquiries/:id` was not added, matching Phase 4B and `backend/src/routes/inquiries.js`.

**Example that was modified**
An early `requireAuth` implementation only checked `req.session.userId`. After a security review, that was not enough if the staff row was deleted. The working `backend/src/middleware/requireAuth.js` looks the user up, destroys the session, and returns 401. That behavior is covered by the “deleted staff session cannot call a protected API” test.

**Example that was not taken**
Realtime or locking for two open tabs was not added. Stale views are last-write-wins, with Reload on the details page, as recorded above.
