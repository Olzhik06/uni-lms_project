#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Generating Prisma Client..."
npx prisma generate

echo "Running seed (idempotent)..."
npx ts-node prisma/seed.ts || echo "Seed skipped or already applied"

echo "Starting backend..."
if [ -f "dist/main.js" ]; then
  echo "Found dist/main.js"
  exec node dist/main.js
elif [ -f "dist/src/main.js" ]; then
  echo "Found dist/src/main.js (NestJS structure)"
  exec node dist/src/main.js
else
  echo "CRITICAL: main.js not found in dist/ or dist/src/"
  ls -R dist/
  exit 1
fi
