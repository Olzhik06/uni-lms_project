# UniLMS — Academic Management Platform

Full-stack LMS MVP: Next.js 14 + NestJS + Prisma + PostgreSQL + Tailwind.

## Run with Docker

```bash
cp .env.example .env
docker compose up --build
```

Wait ~2 minutes for first build. Then open:

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api
- Swagger docs: http://localhost:4000/api/docs

## Run locally (without Docker)

Requires: Node 20+, pnpm, PostgreSQL running on localhost:5432.

```bash
cp .env.example .env

cd apps/backend
pnpm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
pnpm dev

# Second terminal:
cd apps/frontend
pnpm install
pnpm dev
```

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

## What docker compose does

1. Starts PostgreSQL 15 with healthcheck
2. Backend waits for healthy Postgres, then:
   - `npx prisma migrate deploy` (applies migration SQL)
   - `npx ts-node prisma/seed.ts` (creates demo data, idempotent)
   - `node dist/main.js` (starts NestJS on port 4000)
3. Frontend builds Next.js and starts on port 3000

## Project structure

```
uni-lms/
├── docker-compose.yml
├── .env.example
├── README.md
├── apps/
│   ├── backend/
│   │   ├── Dockerfile
│   │   ├── docker-entrypoint.sh
│   │   ├── package.json          # ts-node in dependencies (not dev)
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── seed.ts
│   │   │   └── migrations/
│   │   │       ├── migration_lock.toml
│   │   │       └── 20250101000000_init/
│   │   │           └── migration.sql
│   │   └── src/                  # 11 NestJS modules
│   └── frontend/
│       ├── Dockerfile
│       ├── next.config.js        # /api/* proxy to backend
│       └── src/                  # 23 pages, 9 components
```
