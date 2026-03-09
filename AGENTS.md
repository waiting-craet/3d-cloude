# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is a **3D Knowledge Graph Visualization Platform** built with Next.js 14 (App Router), Prisma ORM, PostgreSQL, Three.js/React Three Fiber. Single `package.json` at root (not a monorepo).

### Services

| Service | Required | Port | Command |
|---------|----------|------|---------|
| PostgreSQL | Yes | 5432 | `sudo pg_ctlcluster 16 main start` |
| Next.js dev server | Yes | 3000 | `npm run dev` |

### Database

- Prisma schema uses `postgresql` provider. A local PostgreSQL database is configured at `postgresql://devuser:devpass@localhost:5432/knowledgegraph`.
- The `.env` file at the repo root contains `DATABASE_URL` — Prisma CLI reads from `.env` (not `.env.local`).
- After schema changes: `npx prisma db push` to sync, then `npx prisma generate` to regenerate the client.
- The `postinstall` script in `package.json` runs `prisma generate` automatically.

### Running the app

1. Start PostgreSQL: `sudo pg_ctlcluster 16 main start`
2. Start dev server: `npm run dev` (port 3000)

### Standard commands (see `package.json` scripts)

- **Lint**: `npm run lint`
- **Test**: `npm test`
- **Build**: `npm run build`
- **DB push**: `npm run db:push`
- **DB seed**: `npm run db:seed`

### Authentication

The app uses a simple cookie-based auth (`userId` cookie). API calls requiring auth need the cookie header: `-b "userId=<user-id>"`.

### Gotchas

- ESLint config (`.eslintrc.json`) must exist for `npm run lint` to work non-interactively. If missing, `next lint` prompts interactively. The file should contain `{"extends": "next/core-web-vitals"}`.
- Some test files have pre-existing lint errors (parsing errors in property test files). These are not caused by environment setup.
- Many Jest tests (232 of 994) fail due to pre-existing issues in the test suite, not environment problems. The test infrastructure itself works correctly.
- Optional services (AI API via `AI_API_KEY`/`AI_API_ENDPOINT`, Vercel Blob via `BLOB_READ_WRITE_TOKEN`) are not required for core functionality.
