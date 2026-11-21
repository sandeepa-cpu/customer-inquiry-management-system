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
8. Run `npm test` (18 API tests).
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

## Frontend

From `frontend/`:

1. Copy `.env.example` to `.env` if `.env` does not already exist. Default `VITE_API_URL` is `http://localhost:5000`. Do not commit `.env`.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open `http://localhost:5173`.
5. Run `npm test` (21 interaction tests; API is mocked).
6. Run `npm run build` to confirm a production build.

Keep the backend running on port 5000 when using the API. Automated frontend tests mock `src/api.js` and do not write to PostgreSQL.

Routes:

- `/login` — staff sign-in
- `/` — dashboard (protected): search, status filter, list
- `/inquiries/new` — create inquiry (protected)
- `/inquiries/:id` — inquiry details and status (protected)

## Reviewer demo

Use a local seeded staff account. Email is `SEED_STAFF_EMAIL` in `backend/.env` (example: `staff@example.com`). Password is `SEED_STAFF_PASSWORD` in the same file. Do not commit `.env`.

1. Start the API from `backend/` with `npm run dev`, then the client from `frontend/` with `npm run dev`. Confirm `http://localhost:5000/api/health` and open `http://localhost:5173`.
2. Sign in at `/login` with the seeded staff email and password.
3. Open **New inquiry**, enter customer name, contact, subject, and description, and save. You should land on `/inquiries/:id`.
4. Go to the dashboard. Search by customer name or subject, then filter by New / In Progress / Resolved (combined with search).
5. Open the inquiry details. Confirm customer fields, status, dates, and created-by staff.
6. Set status to In Progress, save, then Resolved, then New (reopen). Use **Reload** if another tab already changed the status.
7. Open **New inquiry** and submit empty fields (client errors). Open `/inquiries/not-a-valid-id` or a random UUID (validation or not-found).
8. Log out, then visit `/` or `/inquiries/new` — you should return to `/login`.

## Local limitations

- Sessions use in-memory store: they do not survive API restart and are not for multiple servers.
- Status updates are last-write-wins. Two tabs can be stale until Reload. There is no live sync.
- Every authenticated staff member can see and update every inquiry. There is no pagination.

