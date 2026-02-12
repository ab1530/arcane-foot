# Guide de Déploiement - Arcane Platform

Ce guide explique comment déployer l'application Arcane sur différents environnements en utilisant les meilleures pratiques DevOps.

## Table des Matières

1. [Prérequis](#prérequis)
2. [Environnements](#environnements)
3. [Configuration des Secrets](#configuration-des-secrets)
4. [Déploiement Development](#déploiement-development)
5. [Déploiement Staging](#déploiement-staging)
6. [Déploiement Production](#déploiement-production)
7. [Rollback](#rollback)
8. [Troubleshooting](#troubleshooting)

## Prérequis

### Outils nécessaires

```bash
# Git
git --version

# Node.js 20+
node --version

# Docker
docker --version
docker compose version

# GitHub CLI (optionnel mais recommandé)
gh --version

# PostgreSQL client (pour debug)
psql --version
```

### Accès nécessaires

- [x] Accès GitHub au repo `ab1530/arcane-foot`
- [x] Accès Railway ou Render (production)
- [x] Accès Sentry (error tracking)
- [x] Accès Supabase (storage)
- [x] Accès Stripe (paiements)
- [x] Accès Firebase (push notifications)

## Environnements

### Vue d'ensemble

```
┌──────────────┐
│ Development  │ ← Développement local
│ (localhost)  │   Docker Compose
└──────────────┘
       ↓
┌──────────────┐
│   Staging    │ ← Tests avant production
│  (Railway)   │   Branch: staging
└──────────────┘
       ↓
┌──────────────┐
│ Production   │ ← Environnement live
│  (Railway)   │   Branch: main
└──────────────┘
```

### Caractéristiques par environnement

| Feature | Development | Staging | Production |
|---------|------------|---------|------------|
| Database | PostgreSQL (Docker) | Supabase | Supabase |
| Storage | Local | Supabase | Supabase |
| Email | Logs | SendGrid (test) | SendGrid |
| Payments | Stripe Test | Stripe Test | Stripe Live |
| Push Notif | Disabled | Firebase (test) | Firebase |
| Monitoring | Console | Sentry | Sentry |
| Rate Limit | 1000/min | 100/min | 100/min |

## Configuration des Secrets

### 1. Development (local)

Copie `.env.example` vers `.env` :

```bash
cp .env.example backend/.env
```

Édite `backend/.env` avec les valeurs locales :

```env
DATABASE_URL="postgresql://arcane_user:arcane_pass@localhost:5432/arcane_db?schema=public"
JWT_SECRET="dev-secret-change-me"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
API_PORT="3000"
```

### 2. Staging

Sur GitHub, configure les secrets pour l'environment `staging` :

```bash
# Méthode 1 : Via l'interface web
# Settings → Environments → staging → Add secret

# Méthode 2 : Via CLI
gh secret set DATABASE_URL --env staging
gh secret set JWT_SECRET --env staging
gh secret set RAILWAY_TOKEN --env staging
gh secret set SENTRY_DSN --env staging
```

**Secrets requis pour staging :**
```
DATABASE_URL          # Supabase connection string
JWT_SECRET            # Generate with: openssl rand -hex 32
JWT_REFRESH_SECRET    # Generate with: openssl rand -hex 32
RAILWAY_TOKEN         # Token from Railway dashboard
SENTRY_DSN            # Sentry project DSN (staging)
SUPABASE_URL
SUPABASE_SERVICE_KEY
```

### 3. Production

Sur GitHub, configure les secrets pour l'environment `production` :

```bash
gh secret set DATABASE_URL --env production
gh secret set JWT_SECRET --env production
gh secret set JWT_REFRESH_SECRET --env production
gh secret set RAILWAY_TOKEN --env production
gh secret set SENTRY_DSN --env production
gh secret set STRIPE_SECRET_KEY --env production
gh secret set STRIPE_WEBHOOK_SECRET --env production
gh secret set FCM_SERVER_KEY --env production
gh secret set SUPABASE_URL --env production
gh secret set SUPABASE_SERVICE_KEY --env production
gh secret set SLACK_WEBHOOK --env production
```

**⚠️ Important pour production :**
- Utilise des secrets forts (min 32 caractères aléatoires)
- Active "Required reviewers" sur l'environment production
- Ne partage JAMAIS les secrets production

## Déploiement Development

### Première fois

```bash
# Clone le repo
git clone git@github.com:ab1530/arcane-foot.git
cd arcane-foot

# Checkout develop
git checkout develop

# Démarre la base de données
docker compose up -d postgres

# Installe les dépendances backend
cd backend
npm install

# Génère Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Démarre le serveur
npm run start:dev
```

L'API sera disponible sur : `http://localhost:3000/api`

### Tests locaux

```bash
# Tests unitaires
npm run test

# Tests avec coverage
npm run test:cov

# Tests E2E
npm run test:e2e

# Linter
npm run lint

# Format code
npm run format
```

### Healthcheck local

```bash
# Health check complet
curl http://localhost:3000/api/health

# Readiness
curl http://localhost:3000/api/health/ready

# Liveness
curl http://localhost:3000/api/health/live
```

## Déploiement Staging

### Workflow automatique

Staging se déploie automatiquement quand tu push sur la branch `staging` :

```bash
# Partir de develop à jour
git checkout develop
git pull origin develop

# Créer une PR vers staging
gh pr create --base staging --head develop --title "Release v1.1.0 to staging"

# Après review, merge la PR
# Le déploiement staging se lance automatiquement
```

### Workflow manuel

Si besoin de déployer manuellement :

```bash
# Via GitHub Actions
gh workflow run deploy-production.yml --ref staging -f environment=staging

# Ou via Railway CLI
cd backend
railway up --service arcane-backend --environment staging
```

### Vérification post-déploiement

```bash
# Remplace URL_STAGING par ton URL staging
STAGING_URL="https://arcane-staging.up.railway.app"

# Health check
curl $STAGING_URL/api/health

# Test login
curl -X POST $STAGING_URL/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@arcane.com","password":"TestPass123"}'

# Smoke tests automatiques
gh workflow run smoke-tests.yml -f environment=staging
```

## Déploiement Production

### Workflow complet

```mermaid
graph LR
    A[develop] -->|PR| B[staging]
    B -->|Tests OK| C[main]
    C -->|Auto| D[Production]
    D -->|Smoke Tests| E[Live]
```

### Étape 1 : Préparer la release

```bash
# Sur develop, s'assurer que tout est à jour
git checkout develop
git pull origin develop

# Mettre à jour le numéro de version
cd backend
npm version patch  # ou minor, ou major
git push origin develop --tags

# Créer PR vers staging
gh pr create --base staging --head develop --title "Release v1.1.0 to staging"
```

### Étape 2 : Tests en staging

```bash
# Après merge dans staging, attendre le déploiement
# Vérifier les logs
gh run list --workflow=deploy-production.yml

# Run smoke tests
gh workflow run smoke-tests.yml -f environment=staging

# Tests manuels
# - Tester toutes les features critiques
# - Vérifier les metrics Sentry
# - Checker les logs Railway
```

### Étape 3 : Promotion vers production

```bash
# Créer PR de staging vers main
gh pr create --base main --head staging --title "Release v1.1.0 to production"

# ⚠️ IMPORTANT : Reviewer soigneusement la PR
# - Vérifier tous les changements
# - S'assurer que staging est stable
# - Vérifier qu'il n'y a pas de secrets exposés

# Après approbation (required reviewer), merge
# Le déploiement production se lance automatiquement

# Créer le tag de release
git checkout main
git pull origin main
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin v1.1.0
```

### Étape 4 : Vérification production

Les smoke tests se lancent automatiquement après le déploiement. Tu peux aussi vérifier manuellement :

```bash
PROD_URL="https://arcane-api.up.railway.app"

# Health check
curl $PROD_URL/api/health

# Vérifier la version
curl $PROD_URL/api/health | jq '.version'

# Vérifier Sentry
# → Aller sur sentry.io, vérifier qu'il n'y a pas d'erreurs

# Vérifier les metrics
# → Railway dashboard, checker CPU/RAM/Response time

# Vérifier les logs
railway logs --service arcane-backend --environment production
```

## Rollback

### Rollback automatique

Si les smoke tests échouent, le déploiement est automatiquement annulé (configurable dans le workflow).

### Rollback manuel

#### Option 1 : Via Railway (le plus rapide)

```bash
# Lister les déploiements
railway status --environment production

# Rollback au déploiement précédent
railway rollback --environment production
```

#### Option 2 : Via Git (le plus propre)

```bash
# Identifier le commit à rollback
git log --oneline main

# Créer un revert commit
git revert <commit-hash>

# Ou revenir à un tag précédent
git checkout v1.0.0
git push origin main --force  # ⚠️ DANGEREUX, éviter si possible

# Mieux : créer un hotfix
git checkout -b hotfix/rollback-v1.1.0 main
git revert <commit-hash>
git push origin hotfix/rollback-v1.1.0
# Créer PR vers main en fast-track
```

#### Option 3 : Revert via GitHub

1. Aller sur GitHub → Commits
2. Trouver le commit problématique
3. Cliquer sur les "..." → **Revert**
4. Créer une PR de revert
5. Merge rapidement

### Après le rollback

```bash
# Vérifier que l'ancienne version fonctionne
curl $PROD_URL/api/health

# Vérifier Sentry
# Vérifier les logs

# Investiguer la cause du problème
# Fix dans une nouvelle branch
# Re-tester en staging avant re-déploiement
```

## Database Migrations

### Development

```bash
# Créer une migration
cd backend
npm run prisma:migrate -- --name add_user_preferences

# Appliquer les migrations
npm run prisma:migrate

# Reset la database (⚠️ perte de données)
npx prisma migrate reset
```

### Staging / Production

Les migrations sont appliquées automatiquement par les workflows CI/CD.

**⚠️ Bonnes pratiques :**

1. **Toujours tester les migrations en staging d'abord**
2. **Faire un backup avant migration en production**
3. **Migrations doivent être réversibles (rollback-safe)**
4. **Ne jamais supprimer de colonnes directement** (3-step migration)

#### Migration réversible (exemple)

```typescript
// ✅ BON : Migration en 3 étapes
// Step 1 : Ajouter nouvelle colonne (nullable)
// → Deploy, tester
// Step 2 : Migrer les données
// → Script de migration
// Step 3 : Rendre obligatoire / Supprimer ancienne colonne
// → Deploy final

// ❌ MAUVAIS : Migration breaking
model User {
  // email String  ← Supprimé directement
  emailAddress String  ← Ajouté
}
```

### Backup automatique avant migration

Le workflow de déploiement fait un backup automatique avant d'appliquer les migrations :

```yaml
- name: Backup database
  run: |
    railway run "pg_dump $DATABASE_URL" > backup-$(date +%Y%m%d-%H%M%S).sql
    # Upload vers S3 ou autre storage
```

## Monitoring Post-Déploiement

### 1. Sentry (Error Tracking)

```bash
# Aller sur sentry.io
# → Projet arcane-backend
# → Environment: production

# Vérifier :
# - Pas de nouvelles erreurs
# - Response time stable
# - No regression
```

### 2. Railway Metrics

```bash
# Via dashboard Railway
# → Service: arcane-backend
# → Tab: Metrics

# Surveiller :
# - CPU usage (< 80%)
# - Memory usage (< 80%)
# - Request rate
# - Response time (< 200ms p95)
# - Error rate (< 1%)
```

### 3. Logs

```bash
# Via Railway CLI
railway logs --service arcane-backend --environment production --tail

# Ou via dashboard Railway
# → Service → Logs tab

# Chercher :
# - ❌ Errors
# - ⚠️ Warnings
# - 🐛 Anomalies
```

### 4. Healthcheck monitoring

Utilise un service externe pour monitoring :

- [UptimeRobot](https://uptimerobot.com) (gratuit jusqu'à 50 monitors)
- [Better Stack](https://betterstack.com) (recommandé)
- [Pingdom](https://www.pingdom.com)

Configuration UptimeRobot :
```
Monitor Type: HTTP(S)
URL: https://arcane-api.up.railway.app/api/health
Interval: 5 minutes
Alert when: Down
Alert contacts: ton-email@example.com, Slack webhook
```

## Troubleshooting

### Déploiement échoue

#### 1. Check les logs du workflow

```bash
# Lister les runs récents
gh run list --workflow=deploy-production.yml

# Voir les logs d'un run
gh run view <run-id> --log
```

#### 2. Erreurs communes

**Error: "Prisma migration failed"**
```bash
# Solution : Run migrations manuellement
railway run "npx prisma migrate deploy" --environment production
```

**Error: "Database connection failed"**
```bash
# Vérifier le DATABASE_URL
railway variables --environment production | grep DATABASE_URL

# Tester la connexion
railway run "psql $DATABASE_URL -c 'SELECT 1'" --environment production
```

**Error: "Build timeout"**
```bash
# Augmenter le timeout dans le workflow
timeout-minutes: 20  # dans .github/workflows/deploy-production.yml
```

### Service ne répond pas

```bash
# 1. Vérifier le status du service
railway status --environment production

# 2. Redémarrer le service
railway restart --service arcane-backend --environment production

# 3. Vérifier les logs
railway logs --service arcane-backend --environment production --tail
```

### Performance dégradée

```bash
# 1. Vérifier les metrics
railway metrics --service arcane-backend --environment production

# 2. Identifier les requêtes lentes
# → Checker Sentry Performance
# → Analyser les logs pour slow queries

# 3. Scale up si nécessaire
# Railway → Service → Settings → Resources
# Augmenter RAM/CPU temporairement
```

### Database est pleine

```bash
# Vérifier l'espace disque
railway run "psql $DATABASE_URL -c 'SELECT pg_size_pretty(pg_database_size(current_database()))'"  --environment production

# Nettoyer les anciennes données
railway run "psql $DATABASE_URL -c 'VACUUM FULL'"  --environment production

# Upgrade le plan Supabase si nécessaire
```

## Checklist de Déploiement

Avant chaque déploiement production :

- [ ] Tests passent en local
- [ ] PR reviewée et approuvée
- [ ] Migrations testées en staging
- [ ] Smoke tests passent en staging
- [ ] Pas d'erreurs Sentry en staging
- [ ] Backup database effectué (auto)
- [ ] Secrets production à jour
- [ ] Documentation mise à jour
- [ ] Changelog mis à jour
- [ ] Équipe informée du déploiement
- [ ] Plan de rollback préparé

Après déploiement production :

- [ ] Smoke tests passent
- [ ] Health check OK
- [ ] Pas de nouvelles erreurs Sentry
- [ ] Metrics Railway normales
- [ ] Fonctionnalités critiques testées manuellement
- [ ] Uptime monitor actif
- [ ] Tag git créé
- [ ] Release notes publiées (GitHub)
- [ ] Équipe informée du succès

## Commandes Utiles

```bash
# Voir le status de tous les services
railway status

# Run une commande sur production
railway run "npm run prisma:studio" --environment production

# SSH dans le container (debug)
railway shell --environment production

# Voir les variables d'env
railway variables --environment production

# Déployer une branch spécifique
railway up --service arcane-backend --environment staging

# Voir l'historique des déploiements
gh run list --workflow=deploy-production.yml --limit 20

# Trigger un workflow manuellement
gh workflow run deploy-production.yml -f environment=production

# Créer un tag rapidement
git tag -a v1.2.0 -m "Release v1.2.0" && git push origin v1.2.0
```

## Ressources

- [Railway Documentation](https://docs.railway.app)
- [Sentry Error Tracking](https://docs.sentry.io)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Better Stack Monitoring](https://betterstack.com/docs)
