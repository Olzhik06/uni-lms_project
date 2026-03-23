# UniLMS — Academic Management Platform

Full-stack Learning Management System built with **Next.js 14**, **NestJS**, **Prisma**, **PostgreSQL**, and **Tailwind CSS**.

## Features

- **Authentication** — JWT (access + refresh tokens via cookies), RBAC (Admin / Teacher / Student)
- **Courses** — create, enroll, browse with pagination and per-student progress bar
- **Assignments** — create, submit (with file upload), grade; due-date tracking
- **Grades** — per-student grade book, teacher grading UI
- **Course Materials** — teachers/admins add links, files, or text content per course
- **Attendance** — teachers mark Present / Late / Absent; students view their own record
- **Schedule** — color-coded timetable with day and course filters
- **Notifications** — in-app bell + full notifications page; mark read / mark all read
- **Global Search** — search courses, materials, and assignments from the sidebar
- **Dashboard** — upcoming assignments widget for students
- **Admin Panel** — platform-wide stats (users, courses, enrollments, submissions, grades)
- **Activity Log** — automatic logging of create/submit/grade events
- **Email Notifications** — nodemailer (graceful no-op when SMTP not configured)
- **Security** — Helmet headers, rate limiting (100 req/min global via @nestjs/throttler)
- **Swagger** — full API docs at `/api/docs`
- **Tests** — Jest + Supertest specs for auth, courses, and assignments
- **AI Module** — Claude-powered features: assignment feedback, quiz generator, course summary, student analysis, streaming chat assistant

---

## AI Setup (Claude / Anthropic)

The AI module integrates with the Anthropic API (`claude-opus-4-6`). All AI features work in **demo mode** (structured placeholder responses) when no API key is set — the backend never crashes.

### Getting an API key

1. Sign up at [console.anthropic.com](https://console.anthropic.com)
2. Go to **API Keys** → **Create Key**
3. Copy the key (starts with `sk-ant-api03-...`)

### Docker

Add to the root `.env` file (same directory as `docker-compose.yml`):

```env
LLM_API_KEY=sk-ant-api03-your-key-here
```

Then restart: `docker compose down && docker compose up`

### Local development

Add to `apps/backend/.env`:

```env
LLM_API_KEY=sk-ant-api03-your-key-here
```

### AI Features by Role

| Feature | Student | Teacher | Admin |
|---------|---------|---------|-------|
| Assignment AI Feedback | ✅ own submissions only | ✅ any submission | ✅ |
| AI Quiz Generator | ❌ | ✅ | ✅ |
| AI Course Summary | ✅ | ✅ | ✅ |
| Student Analysis | ✅ own profile only | ✅ any student | ✅ |
| AI Chat Assistant | ✅ | ✅ | ✅ |

### Where to find AI features in the UI

- **Chat** — floating purple button in the bottom-right corner (all pages)
- **Assignment Feedback** — "AI Feedback" button next to each assignment (students, after submitting)
- **Quiz Generator** — "✨ AI Quiz" tab inside any course
- **Course Summary** — "AI Course Summary" button on the course Overview tab
- **Student Analysis** — available via API (`POST /api/ai/student-analysis`)

### Demo mode

When `LLM_API_KEY` is not set, all endpoints return a structured response with `_demo: true` flag. The frontend renders these responses normally with a "demo" badge. No errors are thrown.

---

## Quick start — Docker (recommended)

> **Requires:** Docker Desktop running.

```bash
docker compose up --build
```

Wait ~2 minutes for the first build. Then open:

| Service     | URL                              |
|-------------|----------------------------------|
| Frontend    | http://localhost:3000            |
| Backend API | http://localhost:4000/api        |
| Swagger     | http://localhost:4000/api/docs   |

Docker will automatically:
1. Start PostgreSQL 15
2. Run `prisma migrate deploy` (applies all migrations)
3. Run `prisma db seed` (creates demo users, courses, assignments, etc.)
4. Start the NestJS backend on port 4000
5. Build and start the Next.js frontend on port 3000

---

## Local development (without Docker)

**Requires:** Node 20+, pnpm 8+, PostgreSQL 15 on `localhost:5432`.

### 1. Database

Create the database:
```sql
CREATE DATABASE unilms;
```

### 2. Environment

Create `apps/backend/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/unilms?schema=public"
JWT_SECRET="change-me-super-secret-jwt-key-at-least-32-chars"
JWT_REFRESH_SECRET="change-me-super-secret-refresh-key-at-least-32"
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Optional — email notifications (skip to disable silently)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=you@gmail.com
# SMTP_PASS=your-app-password
# SMTP_FROM="UniLMS <no-reply@uni.kz>"
```

### 3. Backend

```bash
cd apps/backend
pnpm install
npx prisma generate        # generate Prisma client
npx prisma migrate deploy  # apply DB migrations
npx prisma db seed         # seed demo data
pnpm dev                   # start on http://localhost:4000
```

### 4. Frontend

```bash
# In a second terminal
cd apps/frontend
pnpm install
pnpm dev                   # start on http://localhost:3000
```

---

## Demo credentials

| Role    | Email             | Password     |
|---------|-------------------|--------------|
| Admin   | admin@uni.kz      | Admin123!    |
| Teacher | teacher1@uni.kz   | Teacher123!  |
| Teacher | teacher2@uni.kz   | Teacher123!  |
| Student | student1@uni.kz   | Student123!  |
| Student | student2@uni.kz   | Student123!  |
| Student | student3@uni.kz   | Student123!  |
| Student | student4@uni.kz   | Student123!  |
| Student | student5@uni.kz   | Student123!  |

---

## Running tests

```bash
cd apps/backend
pnpm install
pnpm test
# or run smoke tests with migrations first
pnpm test:smoke

# frontend smoke tests (boots backend + frontend dev servers and checks auth/routes)
cd ../frontend
pnpm test:smoke
```

`pnpm test:smoke` applies pending Prisma migrations before running the backend smoke suite. It uses the current backend `DATABASE_URL` by default, or `TEST_DATABASE_URL` if you want to point tests at a separate database.

Covers: auth/profile, admin course setup, enrollments, assignments, submissions, grading, and notifications.

Frontend smoke tests run through the real Next.js `/api/*` proxy and cover public auth pages, register/login/logout, `auth/me`, and key authenticated routes like dashboard, courses, profile, and notifications. By default they use `http://127.0.0.1:3000` and `http://127.0.0.1:4000`, automatically reusing already running servers when available. You can override those URLs with `SMOKE_FRONTEND_URL` and `SMOKE_BACKEND_URL`.

If you already have older English notification records in the database and want to rewrite them using each user's current `preferredLang`, run:

```bash
cd apps/backend
pnpm notifications:backfill
```

---

## Environment variables reference

| Variable               | Required | Default | Description                         |
|------------------------|----------|---------|-------------------------------------|
| `DATABASE_URL`         | ✅       | —       | PostgreSQL connection string        |
| `JWT_SECRET`           | ✅       | —       | Access token signing secret         |
| `JWT_REFRESH_SECRET`   | ✅       | —       | Refresh token signing secret        |
| `JWT_EXPIRATION`       | ✅       | `15m`   | Access token TTL                    |
| `JWT_REFRESH_EXPIRATION` | ✅     | `7d`    | Refresh token TTL                   |
| `SMTP_HOST`            | ❌       | —       | SMTP server (emails skipped if unset)|
| `SMTP_PORT`            | ❌       | `587`   | SMTP port                           |
| `SMTP_USER`            | ❌       | —       | SMTP username                       |
| `SMTP_PASS`            | ❌       | —       | SMTP password                       |
| `SMTP_FROM`            | ❌       | —       | From address for emails             |
| `LLM_API_KEY`          | ❌       | —       | Anthropic API key — AI runs in demo mode if unset |

---

## Project structure

```
uni-lms/
├── docker-compose.yml
├── README.md
├── pnpm-workspace.yaml
├── apps/
│   ├── backend/                        # NestJS API (port 4000)
│   │   ├── Dockerfile
│   │   ├── docker-entrypoint.sh
│   │   ├── prisma/
│   │   │   ├── schema.prisma           # 12 models
│   │   │   ├── seed.ts                 # demo data
│   │   │   └── migrations/
│   │   └── src/
│   │       ├── ai/                     # Claude AI — feedback, quiz, summary, analysis, chat
│   │       ├── activity-log/           # event logging
│   │       ├── admin/                  # stats + course progress
│   │       ├── announcements/
│   │       ├── assignments/            # CRUD, file upload, grading
│   │       ├── attendance/             # mark/view attendance
│   │       ├── auth/                   # JWT, refresh tokens
│   │       ├── courses/                # CRUD, enrollment, pagination
│   │       ├── enrollments/
│   │       ├── grades/
│   │       ├── groups/
│   │       ├── mail/                   # nodemailer (optional SMTP)
│   │       ├── materials/              # course materials CRUD
│   │       ├── notifications/          # in-app notifications
│   │       ├── prisma/                 # PrismaService
│   │       ├── schedule/
│   │       ├── search/                 # global full-text search
│   │       └── users/
│   └── frontend/                       # Next.js 14 App Router (port 3000)
│       ├── Dockerfile
│       ├── next.config.js              # /api/* proxy to backend
│       └── src/
│           ├── app/(app)/
│           │   ├── admin/              # platform stats
│           │   ├── calendar/
│           │   ├── courses/
│           │   │   └── [id]/
│           │   │       ├── assignments/
│           │   │       ├── attendance/
│           │   │       ├── grades/
│           │   │       ├── materials/
│           │   │       └── participants/
│           │   ├── dashboard/
│           │   ├── notifications/
│           │   ├── profile/
│           │   ├── schedule/
│           │   └── search/
│           ├── components/
│           │   ├── layout/             # sidebar, header
│           │   └── ui/                 # button, card, badge, input…
│           └── lib/
│               ├── api.ts              # fetch wrapper
│               ├── types.ts            # shared TypeScript types
│               └── utils.ts
```

---

## Tech stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | Next.js 14, React 18, Tailwind CSS, TanStack Query, Lucide icons |
| Backend    | NestJS 10, Passport JWT, class-validator |
| ORM        | Prisma 5 + PostgreSQL 15                |
| Auth       | JWT access + refresh tokens (httpOnly cookies) |
| Security   | Helmet, @nestjs/throttler (100 req/min) |
| Email      | Nodemailer (optional)                   |
| File upload| Multer (local disk → `/uploads`)        |
| AI         | Anthropic Claude (`claude-opus-4-6`), SSE streaming, Zod validation |
| Testing    | Jest + Supertest                        |
| Packaging  | pnpm workspaces (monorepo)              |
