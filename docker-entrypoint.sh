#!/bin/sh
set -e

echo "Waiting for database to be ready..."
npx prisma db push --skip-generate 2>&1 || echo "Schema push attempted"

echo "Starting Next.js..."
exec node server.js
