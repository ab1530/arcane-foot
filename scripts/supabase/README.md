# Supabase Migration Scripts (Old Account -> New Account)

These scripts implement a safe migration flow before Vercel cutover.

## Prerequisites
- `psql`, `pg_dump`, `pg_restore`
- `npx prisma`
- `supabase` CLI (for edge deploy)
- Python 3 (for storage sync script)

## Suggested execution order

1. Export old DB
```bash
OLD_DATABASE_URL='postgresql://...' ./scripts/supabase/01_export_old_db.sh
```

2. Apply schema on new DB
```bash
NEW_DATABASE_URL='postgresql://...' ./scripts/supabase/02_apply_schema_new_db.sh
```

3. Restore dump to new DB
```bash
NEW_DATABASE_URL='postgresql://...' BACKUP_FILE='old_prod.dump' ./scripts/supabase/03_restore_new_db.sh
```

4. Compare row counts
```bash
OLD_DATABASE_URL='postgresql://...' NEW_DATABASE_URL='postgresql://...' ./scripts/supabase/04_compare_counts.sh
```

5. Apply RLS and storage policies
```bash
NEW_DATABASE_URL='postgresql://...' ./scripts/supabase/05_apply_policies_new_db.sh
```

6. Sync storage (dry-run first)
```bash
python3 ./scripts/supabase/sync_storage.py \
  --old-url 'https://old-project.supabase.co' \
  --old-key '<old-service-role-key>' \
  --new-url 'https://new-project.supabase.co' \
  --new-key '<new-service-role-key>' \
  --bucket 'arcane-media'
```

Apply copy:
```bash
python3 ./scripts/supabase/sync_storage.py \
  --old-url 'https://old-project.supabase.co' \
  --old-key '<old-service-role-key>' \
  --new-url 'https://new-project.supabase.co' \
  --new-key '<new-service-role-key>' \
  --bucket 'arcane-media' \
  --apply
```

7. Deploy edge functions
```bash
SUPABASE_PROJECT_REF='<new-project-ref>' SERVICE_ROLE_KEY='<new-service-role-key>' ./scripts/supabase/06_deploy_edge_functions.sh
```

8. Print Vercel env checklist
```bash
NEW_PROJECT_REF='<new-project-ref>' API_URL='https://your-api.example.com' ./scripts/supabase/07_vercel_env_checklist.sh
```

## Notes
- Keep old Supabase project active for at least 72 hours after cutover.
- Run all scripts first in a rehearsal environment when possible.
- `sync_storage.py` is dry-run by default for safety.
