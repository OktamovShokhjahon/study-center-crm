# Study Center CRM

A CRM for **one study center**: students, teachers, parents, schedules, and payments. **Next.js** frontend, **Express** + **MongoDB** backend, JWT auth, roles (Admin, Teacher, Student, Parent), Uzbek / English / Russian UI, and light/dark themes.

This is a **single-tenant** deployment: one database installation serves your center only (no multi-center SaaS).

## Prerequisites

- Node.js 18+
- MongoDB

## Backend

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

API defaults to `http://localhost:4000`. Set `JWT_SECRET` and `MONGODB_URI` in `.env`.

## Frontend

```bash
cd frontend
copy .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000` (redirects to `/uz`). Set `NEXT_PUBLIC_API_URL` if the API is not on port 4000.

## First-time setup

1. Start MongoDB and both servers.
2. Open `/uz/register` (or `/en/register`, `/ru/register`).
3. Enter your **study center name** and create the **administrator** account (allowed only while the database has no users).
4. Sign in and use the admin dashboard to add students, teachers, and courses.

## Project layout

- `frontend/` — Next.js 14, Tailwind, `next-intl`, `next-themes`
- `backend/` — Express, Mongoose, JWT, PDF login cards (pdfkit)

Data is scoped by an internal `centerId` for a clean data model; a single center record is created at setup (no subdomain or multi-center UI).
# study-center-crm
