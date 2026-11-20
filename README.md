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
7. Run `npm run dev` (or `npm start`).
8. Open `http://localhost:5000/api/health`.

Frontend setup will be added in a later phase.
