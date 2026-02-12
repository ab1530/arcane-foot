# QA Notes – External Services

All acceptance and regression tests now run against the real integrations. Stubs have been removed to guarantee behaviour parity between local, staging and production environments.

- **Supabase** – provide `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`. For local development, run `docker-compose up postgres`, apply `supabase/policies.sql`, then launch the backend.
- **Stripe** – configure `STRIPE_SECRET_KEY` avec une clé test (`sk_test_*`).
- **Arkane AI Layer** – ensure the FastAPI service (`ai-service/`) is running locally (`uvicorn main:app --reload`) or via Docker Compose.

> ✅ CI will fail if any of these services are unreachable. Configure secrets in GitLab (`Settings > CI/CD > Variables`) before triggering QA pipelines.

## QA job (GitLab CI)

Le job `qa_job` du pipeline GitLab réalise automatiquement :

1. `npm run test:ci --prefix backend` – exécute Jest côté Nest.
2. `npm run lint --prefix web` – lint Next.js.
3. `npm run test:e2e --prefix web` – Playwright (Chrome headless).
4. `npm run test:ci --prefix web` – Jest + couverture UI.
5. Génération d’un rapport Markdown `tests/output/qa_report.md` archivé en artefact.

> Pense à publier manuellement le rapport dans Notion/Slack à chaque merge majeur.
