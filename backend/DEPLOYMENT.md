# Deployment (Supabase Edge Functions)

This project is transitioning to an **Edge-first production setup**:
- Web: Vercel (`/web`)
- Public APIs: Supabase Edge Functions (`/supabase/functions`)
- Data/Storage: Supabase (Postgres + Storage)

## CI/CD (GitHub Actions)
Production workflow:
- `/Users/lakhdari/Desktop/AppFoot/.github/workflows/deploy-production.yml`

It deploys:
1. `health`, `passport`, `shortlist` Edge Functions to Supabase
2. Next.js web app to Vercel

## Required GitHub secrets
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_SERVICE_ROLE_KEY` (for syncing `SERVICE_ROLE_KEY` secret used by functions)
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Manual Edge deploy (local)
```bash
cd /Users/lakhdari/Desktop/AppFoot
supabase login
supabase functions deploy health --project-ref <project-ref>
supabase functions deploy passport --project-ref <project-ref>
supabase functions deploy shortlist --project-ref <project-ref>
supabase secrets set SERVICE_ROLE_KEY=<service-role-key> --project-ref <project-ref>
```

## Data and storage setup
- Apply DB schema via Prisma migrations from `/backend` against Supabase Postgres.
- Apply security policies:
  - `/Users/lakhdari/Desktop/AppFoot/supabase/policies.sql`
  - `/Users/lakhdari/Desktop/AppFoot/supabase/storage_policies.sql`

## Important migration note
Only selected public routes are currently Edge-ready (`passport`, `shortlist`, `health`).
If you want full backend replacement, migrate remaining NestJS endpoints module-by-module before switching all clients to Edge-only API.
