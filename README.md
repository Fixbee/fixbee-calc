# Fixbee

SvelteKit app with Supabase Auth (SSR) and Drizzle ORM.

## What is implemented

- Supabase SSR session handling in `hooks.server.ts`
- Auth routes:
  - `/login`
  - `/forgot-password`
  - `/auth/callback`
  - `/update-password`
- Protected routes:
  - `/valuation`
  - `/history`
- Drizzle ORM setup for Postgres (Supabase database)
- Migration with `public.users` table, RLS policies and trigger sync from `auth.users`

## Environment variables

Copy `.env.example` to `.env` and fill values:

```bash
cp .env.example .env
```

Required:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (reserved for future server-only tasks)
- `DATABASE_URL`

## Install and run (local Vite)

```bash
bun install
bun run dev
```

## Cloudflare Workers

Project is configured to run on Cloudflare Workers with `@sveltejs/adapter-cloudflare`.

### 1) Configure local dev vars for Wrangler

Create `.dev.vars` (not committed):

```bash
PUBLIC_SUPABASE_URL=...
PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=...
```

### 2) Run Workers runtime locally

```bash
bun run cf:dev
```

### 3) Configure production secrets/vars

Set required values in Cloudflare Worker environment:

```bash
wrangler secret put PUBLIC_SUPABASE_URL
wrangler secret put PUBLIC_SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put DATABASE_URL
```

### 4) Deploy to Cloudflare Workers

```bash
bun run cf:deploy
```

## Database migration (Drizzle)

Generate migration (already done in this repository):

```bash
DATABASE_URL="..." bun run db:generate
```

Apply migrations:

```bash
DATABASE_URL="..." bun run db:migrate
```

Open Drizzle Studio:

```bash
DATABASE_URL="..." bun run db:studio
```

## Supabase dashboard checklist

1. Auth -> Providers -> enable Email.
2. Auth -> URL Configuration:
   - Site URL: your app URL (for local: `http://localhost:5173`)
   - Redirect URLs: add `http://localhost:5173/auth/callback`
3. (Production) configure custom SMTP.
4. Run Drizzle migrations against Supabase Postgres.

## Auth-to-users sync

Migration creates:

- `public.users` (one row per company account)
- Trigger function `public.handle_auth_user()`
- Triggers on `auth.users` insert/update
- RLS policies so authenticated account can select/update only its own row

`company_name` is read from `raw_user_meta_data.company_name`.
