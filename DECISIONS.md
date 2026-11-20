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
