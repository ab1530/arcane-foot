# Database Mode Quick Note

Use one database mode at a time.

## Runtime/API Mode (Default, IPv4-safe): Supabase Pooler
- File: `backend/.env`
- Variable: `DATABASE_URL`
- Runtime/API connection should use Supabase pooler (port `6543`):
  - `postgresql://<POOLER_USER>:<PASSWORD>@aws-<region>.pooler.supabase.com:6543/postgres?sslmode=require`
- Why this is default:
  - This project currently has IPv6-only direct host access.
  - On IPv4 networks, direct `db.<project-ref>.supabase.co:5432` can fail with `P1001`.

## Migration/Admin Mode (Optional Future): Supabase Direct Connection
- Use for Prisma migrate/introspection when IPv4 add-on is enabled or the network supports direct IPv6 DB access.
- Direct format:
  - `postgresql://postgres:<PASSWORD>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require`
- Suggested setup:
  - Keep runtime on `DATABASE_URL` (pooler)
  - Add direct admin URL as `DIRECT_URL` when available

## Local Docker Fallback
- File: `backend/.env.local`
- Variable: `DATABASE_URL`
- Value:
  - `postgresql://arcane_user:arcane_pass@localhost:5432/arcane_db?schema=public`

## Quick Checks
1. `npx prisma db pull --schema prisma/schema.prisma`
2. `npm run start:dev`
3. `curl http://localhost:5001/api/health`
