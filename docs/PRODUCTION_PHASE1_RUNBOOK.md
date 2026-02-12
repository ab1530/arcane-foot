# Production Phase 1 Runbook (Edge-First)

## Scope
- No Render deployment.
- Use Supabase Edge Functions for public/selected APIs.
- Use Vercel for web production.
- Keep iOS TestFlight manual via Xcode.

## 1. Security prerequisites
Rotate and re-issue all active credentials before cutover:
- Supabase (`SUPABASE_SERVICE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- JWT secrets
- Stripe secrets
- Sentry DSNs
- Firebase credentials

Keep secrets only in provider vaults and CI secret storage.

## 2. Supabase Pro target setup
1. Create new Supabase Pro project.
2. Enable Postgres + Storage.
3. Configure buckets (default expected: `arcane-media`).

## 3. Database migration
Apply Prisma schema to new Supabase Postgres:
```bash
cd /Users/lakhdari/Desktop/AppFoot/backend
DATABASE_URL="<new_supabase_postgres_url>" npx prisma migrate deploy
```

Migrate data:
```bash
pg_dump "<old_database_url>" -Fc -f old_prod.dump
pg_restore --no-owner --no-privileges --clean --if-exists -d "<new_database_url>" old_prod.dump
```

Validate counts table-by-table (old vs new).

Scripted flow (recommended):
```bash
cd /Users/lakhdari/Desktop/AppFoot
OLD_DATABASE_URL="<old_database_url>" ./scripts/supabase/01_export_old_db.sh
NEW_DATABASE_URL="<new_database_url>" ./scripts/supabase/02_apply_schema_new_db.sh
NEW_DATABASE_URL="<new_database_url>" BACKUP_FILE="old_prod.dump" ./scripts/supabase/03_restore_new_db.sh
OLD_DATABASE_URL="<old_database_url>" NEW_DATABASE_URL="<new_database_url>" ./scripts/supabase/04_compare_counts.sh
```

## 4. Storage and RLS policies
Apply:
- `/Users/lakhdari/Desktop/AppFoot/supabase/policies.sql`
- `/Users/lakhdari/Desktop/AppFoot/supabase/storage_policies.sql`

Scripted:
```bash
NEW_DATABASE_URL="<new_database_url>" ./scripts/supabase/05_apply_policies_new_db.sh
```

## 5. Edge Functions deploy
Functions currently prepared for production:
- `health`
- `passport`
- `shortlist`

Deploy:
```bash
cd /Users/lakhdari/Desktop/AppFoot
supabase functions deploy health --project-ref <project-ref>
supabase functions deploy passport --project-ref <project-ref>
supabase functions deploy shortlist --project-ref <project-ref>
supabase secrets set SERVICE_ROLE_KEY=<service-role-key> --project-ref <project-ref>
```

Scripted:
```bash
SUPABASE_PROJECT_REF="<project-ref>" SERVICE_ROLE_KEY="<service-role-key>" ./scripts/supabase/06_deploy_edge_functions.sh
```

## 6. Vercel web production
Project root: `/Users/lakhdari/Desktop/AppFoot/web`

Required envs:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Recommended env:
- `NEXT_PUBLIC_PUBLIC_SHARE_API_URL` (point to `https://<project-ref>.functions.supabase.co`)

Helper:
```bash
NEW_PROJECT_REF="<project-ref>" API_URL="<your-api-url>" ./scripts/supabase/07_vercel_env_checklist.sh
```

## 7. Controlled cutover
1. Announce maintenance window.
2. Freeze writes.
3. Final backup old DB/storage.
4. Switch production env vars to new Supabase.
5. Deploy Edge Functions + web.
6. Run smoke tests.
7. Unfreeze writes only after validation.

Storage sync helper (dry-run first):
```bash
python3 /Users/lakhdari/Desktop/AppFoot/scripts/supabase/sync_storage.py \
  --old-url "https://old-project.supabase.co" \
  --old-key "<old-service-role-key>" \
  --new-url "https://new-project.supabase.co" \
  --new-key "<new-service-role-key>" \
  --bucket "arcane-media"
```

## 8. Smoke tests
- Edge health:
```bash
curl -fsS https://<project-ref>.functions.supabase.co/health
```
- Public pages:
  - `/passport/{token}`
  - `/shortlist/{token}`
- Auth/login flow on web/mobile
- Media upload flow (if still served by existing backend path, keep that service active until endpoint migration completes)

## 9. iOS TestFlight (manual Xcode)
1. Set `EXPO_PUBLIC_API_URL` for production target.
2. Open `/Users/lakhdari/Desktop/AppFoot/mobile/ios/mobile.xcworkspace`.
3. Select client Apple Developer team.
4. Ensure bundle id: `com.arcane.football`.
5. Product -> Archive.
6. Upload to TestFlight.
7. Validate on real device.

## 10. Rollback
1. Keep previous Supabase/backend active for at least 72h.
2. Keep previous env snapshot.
3. On incident: restore previous env + redeploy previous web/build.
4. Document root cause and corrective action.

## 11. Full Edge migration boundary (important)
Current repo is not yet 100% Edge-native. Only selected functions are Edge-ready.
For a full “Edge-only backend”, migrate remaining NestJS modules incrementally before cutting clients to Edge-only API.
