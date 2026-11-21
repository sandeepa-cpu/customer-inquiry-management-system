# Customer Inquiry Management System (CIMS)

Staff tool for handling customer inquiries: sign in, create inquiries, search or filter them, and move each one through New, In Progress, and Resolved.

## Technology stack

- Frontend: React + Vite
- Styling: Tailwind CSS
- Backend: Node.js + Express
- Database: PostgreSQL 18.7
- ORM: Prisma
- Version control: Git

## Layout

- `frontend/` — React + Vite client
- `backend/` — Express API and Prisma

## Backend

From `backend/`:

1. Copy `.env.example` to `.env` if `.env` does not already exist.
2. Set `PORT` and `DATABASE_URL` in `.env` for local `cims_db`. Do not commit `.env`. If the database password contains special characters, URL-encode them.
3. Create the local PostgreSQL database `cims_db` if it does not already exist. Do not drop or reset existing databases.
4. Run `npm install`.
5. Run `npx prisma migrate dev` then `npx prisma generate`.
6. Optionally run `npm run db:check` to verify the database connection.
7. Set `SESSION_SECRET` (at least 32 characters) in `.env`. Optionally set `SEED_STAFF_NAME`, `SEED_STAFF_EMAIL`, and `SEED_STAFF_PASSWORD`, then run `npm run db:seed` to create one local staff user. Do not commit `.env`.
8. Run `npm test` to run authentication and inquiry API tests.
9. Run `npm run dev` (or `npm start`).
10. Open `http://localhost:5000/api/health`.

Auth API (cookie session, HttpOnly):

- `POST /api/auth/login` — `{ "email", "password" }`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Inquiry API (authenticated; all staff can access all inquiries):

- `POST /api/inquiries` — `{ "customerName", "customerContact", "subject", "description" }` only. Server sets status `NEW` and `createdById`. Extra properties including `status` or `createdById` are rejected.
- `GET /api/inquiries` — optional `q` (customer name or subject) and `status`. Combined with AND. Newest first. No pagination.
- `GET /api/inquiries/:id`
- `PATCH /api/inquiries/:id/status` — `{ "status": "NEW" | "IN_PROGRESS" | "RESOLVED" }`

Frontend setup will be added in a later phase.
