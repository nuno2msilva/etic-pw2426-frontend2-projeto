# Push Database Schema Changes to Vercel

This guide explains how to push your latest Prisma schema to the production database used by your Vercel deployment.

## Prerequisites

- Vercel project is already connected to this repository.
- Production database URL is configured in Vercel as `DATABASE_URL`.
- You can run commands from this repo locally.

## 1. Verify schema locally first

From project root:

```bash
cd sushi-dash
make db-check
make db-push
```

This confirms your schema is valid and applies correctly in local/dev.

## 2. Ensure Vercel has the right environment variable

In Vercel Dashboard:

1. Open your project.
2. Go to Settings -> Environment Variables.
3. Confirm `DATABASE_URL` exists for Production.
4. Save if you changed anything.

## 3. Pull Vercel production env to local

From project root:

```bash
cd sushi-dash
vercel env pull .env.vercel.production --environment=production
```

This writes production env values into `.env.vercel.production`.

## 4. Push schema to production database

From project root:

```bash
cd sushi-dash/server
set -a
source ../.env.vercel.production
set +a
npm run db:push
```

What this does:

- Loads the production `DATABASE_URL` from pulled env file.
- Runs `prisma db push` against production.

## 5. Regenerate Prisma client (optional but recommended)

```bash
npm run db:generate
```

## 6. Validate quickly

From project root:

```bash
cd sushi-dash
make db-check
```

If `DATABASE_URL` is still loaded from production env in your shell, this checks production connectivity.

## Safer Team Workflow (recommended)

For production changes in team environments, prefer Prisma migrations over direct `db push`:

```bash
# create migration locally
cd sushi-dash/server
npx prisma migrate dev --name your_change_name

# then in deployment/CI
npx prisma migrate deploy
```

`db push` is fast and useful, but `migrate deploy` gives a clearer migration history.

## Common Issues

- `P1001` connection error:
  - Check Vercel DB host/port/network allowlist.
- `DATABASE_URL environment variable is not set`:
  - Confirm you sourced `.env.vercel.production` in the same shell.
- Wrong database updated:
  - Print URL target before push (without credentials) and verify environment.

## Quick One-Liner

From project root:

```bash
cd sushi-dash/server && set -a && source ../.env.vercel.production && set +a && npm run db:push
```
