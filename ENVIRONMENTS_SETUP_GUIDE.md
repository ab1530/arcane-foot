# 🌍 Guide Complet des Environnements ARCANE Football

Guide interactif pour configurer **DEV**, **STAGING**, et **PRODUCTION** de bout en bout.

---

## 📊 Vue d'Ensemble des Environnements

### 🎨 Architecture Complète

```
┌─────────────────────────────────────────────────────────────┐
│                    CODE (Git)                               │
│  Developer → commit → push → GitLab                         │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│              GITLAB CI/CD PIPELINE                          │
│                                                             │
│  Stage 1: 🔍 Validate (lint, format check)                 │
│  Stage 2: 🏗️  Build (backend + web)                        │
│  Stage 3: 🧪 Test (unit + e2e)                             │
│  Stage 4: 🔒 Security (SAST + npm audit)                   │
│  Stage 5: 🎭 QA (Playwright E2E)                           │
│  Stage 6: 📦 Package (Docker images)                       │
│  Stage 7: 🚀 Deploy                                        │
│                                                             │
└────────┬──────────────┬─────────────────┬─────────────────┘
         │              │                 │
         ▼              ▼                 ▼
    ┌────────┐    ┌──────────┐    ┌──────────────┐
    │  DEV   │    │ STAGING  │    │ PRODUCTION   │
    │ (auto) │    │ (manual) │    │   (manual)   │
    └────────┘    └──────────┘    └──────────────┘
```

---

## 🎯 ENVIRONNEMENT 1 : DEV (Développement Local)

### Objectif
- Tests rapides en local
- Développement actif
- Pas de déploiement automatique

### Configuration

#### Variables GitLab (Settings → CI/CD → Variables)

```bash
# Scope: All branches (ou spécifique à 'develop')
# Environment: Development

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/arcane_dev
JWT_SECRET=dev-secret-change-me-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=development

# Supabase (Dev Project)
SUPABASE_URL=https://your-dev-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (dev key)
SUPABASE_STORAGE_BUCKET=arcane-media-dev

# Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_test_xxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx

# OpenAI (Dev - limite les coûts)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx

# Sentry (Dev environment)
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
SENTRY_ENVIRONMENT=development

# Firebase (Dev project)
FIREBASE_PROJECT_ID=arcane-football-dev
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@arcane-football-dev.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nxxxxx\n-----END PRIVATE KEY-----

# Rate Limiting (Plus permissif pour dev)
RATE_LIMIT_TTL=60000
RATE_LIMIT_MAX=1000
```

#### Commandes Locales

```bash
# Démarrer en dev
cd backend
npm run start:dev

# Tests
npm run test
npm run test:e2e

# Build local
npm run build
```

#### Pipeline GitLab pour DEV

- ✅ Lint & Format check
- ✅ Build
- ✅ Tests unitaires
- ⚠️ Security scan (non-bloquant)
- ❌ Pas de déploiement auto

---

## 🧪 ENVIRONNEMENT 2 : STAGING (Pré-production)

### Objectif
- Tester avant production
- Environnement identique à la production
- Déploiement manuel après validation QA

### Configuration

#### Variables GitLab (Protected + Masked)

```bash
# Scope: develop branch only
# Environment: Staging
# Type: Protected + Masked

# Base URLs
STAGING_URL=https://staging.arcane-football.com
STAGING_API_URL=https://api-staging.arcane-football.com

# Database (Staging - PostgreSQL)
STAGING_DATABASE_URL=postgresql://arcane_staging:STRONG_PASSWORD@staging-db.arcane.com:5432/arcane_staging
DATABASE_URL=${STAGING_DATABASE_URL}

# JWT
JWT_SECRET=staging-super-secret-jwt-token-change-me
JWT_EXPIRES_IN=7d

# Supabase (Staging Project)
SUPABASE_URL=https://staging-xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (staging key)
SUPABASE_STORAGE_BUCKET=arcane-media-staging

# Stripe (Still Test Mode)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_test_staging_xxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx

# OpenAI (Production API key mais budgété)
OPENAI_API_KEY=sk-proj-staging-xxxxxxxxxxxx

# Sentry (Staging environment)
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
SENTRY_ENVIRONMENT=staging
SENTRY_TRACES_SAMPLE_RATE=1.0

# Firebase (Staging project)
FIREBASE_PROJECT_ID=arcane-football-staging
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@arcane-football-staging.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nxxxxx\n-----END PRIVATE KEY-----

# Email (Staging - Sendgrid sandbox)
SENDGRID_API_KEY=SG.staging_xxxxxxxxxx
SMTP_FROM=staging@arcane-football.com

# Rate Limiting (Production-like)
RATE_LIMIT_TTL=60000
RATE_LIMIT_MAX=100

# Deployment (Railway/Render/K8s)
STAGING_HOST=staging.arcane-football.com
STAGING_SSH_USER=deploy
STAGING_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----\nxxxxx\n-----END OPENSSH PRIVATE KEY-----

# Container Registry
CI_REGISTRY=registry.gitlab.com
CI_REGISTRY_IMAGE=registry.gitlab.com/ab1530/arcane-foot
```

#### Pipeline GitLab pour STAGING

```yaml
deploy_staging:
  stage: 🚀 deploy
  environment:
    name: staging
    url: https://staging.arcane-football.com
    on_stop: stop_staging
  script:
    - chmod +x scripts/deploy/deploy-staging.sh
    - ./scripts/deploy/deploy-staging.sh
  rules:
    - if: '$CI_COMMIT_BRANCH == "develop"'
      when: manual  # ← Déclenchement MANUEL
  only:
    - develop
```

#### Déploiement Staging

**Option A : Railway (Recommandé pour commencer)**

```bash
# 1. Créer compte Railway : https://railway.app
# 2. Nouveau projet : "arcane-football-staging"
# 3. Services :
#    - Backend (Node.js)
#    - Web (Next.js)
#    - PostgreSQL

# 4. Ajouter variable GitLab :
RAILWAY_TOKEN=xxxxx (obtenir dans Railway → Project Settings → Tokens)

# 5. Le script deploy-staging.sh détectera Railway automatiquement
```

**Option B : Render.com**

```bash
# 1. Créer compte Render : https://render.com
# 2. New Web Service × 2 :
#    - Backend : Docker (Dockerfile.backend)
#    - Web : Docker (Dockerfile.web)
# 3. New PostgreSQL Database

# 4. Configurer dans GitLab Variables :
RENDER_API_KEY=rnd_xxxxxxxxxxxxx
STAGING_HOST=arcane-staging.onrender.com
```

**Option C : VPS/Serveur (Avancé)**

```bash
# 1. Louer un VPS (DigitalOcean, OVH, Hetzner)
# 2. Installer Docker + Docker Compose
# 3. Configurer SSH :
ssh-keygen -t ed25519 -f ~/.ssh/arcane_staging_deploy
ssh-copy-id -i ~/.ssh/arcane_staging_deploy.pub deploy@staging.arcane-football.com

# 4. Ajouter dans GitLab Variables :
STAGING_HOST=staging.arcane-football.com
STAGING_SSH_USER=deploy
STAGING_SSH_KEY=<contenu de ~/.ssh/arcane_staging_deploy>
```

---

## 🚀 ENVIRONNEMENT 3 : PRODUCTION

### Objectif
- Environnement LIVE avec vrais utilisateurs
- Haute disponibilité
- Monitoring actif
- Déploiement très contrôlé

### Configuration

#### Variables GitLab (Protected + Masked)

```bash
# Scope: main branch ONLY
# Environment: Production
# Type: Protected + Masked + Protected branches only

# Base URLs
PROD_URL=https://arcane-football.com
PROD_API_URL=https://api.arcane-football.com

# Database (Production - Managed PostgreSQL)
PROD_DATABASE_URL=postgresql://arcane_prod:ULTRA_STRONG_PASSWORD@prod-db.arcane.com:5432/arcane_production?sslmode=require
DATABASE_URL=${PROD_DATABASE_URL}

# JWT (ROTATION RÉGULIÈRE)
JWT_SECRET=production-ultra-secret-rotate-every-90-days-xxxxxxxxxxxxx
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=production-refresh-secret-xxxxxxxxxxxxxx
JWT_REFRESH_EXPIRES_IN=30d

# Supabase (Production Project)
SUPABASE_URL=https://prod-xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (production key)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (public key)
SUPABASE_STORAGE_BUCKET=arcane-media

# Stripe (LIVE MODE - Attention!)
STRIPE_SECRET_KEY=sk_live_51xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_51xxxxxxxxxxxxx

# OpenAI (Production avec budget alerts)
OPENAI_API_KEY=sk-proj-prod-xxxxxxxxxxxx
OPENAI_ORG_ID=org-xxxxxxxxxxxx

# Sentry (Production - High priority)
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% pour économiser
SENTRY_PROFILES_SAMPLE_RATE=0.1

# Firebase (Production project)
FIREBASE_PROJECT_ID=arcane-football-prod
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@arcane-football-prod.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nxxxxx\n-----END PRIVATE KEY-----

# Email (Production - Sendgrid Production)
SENDGRID_API_KEY=SG.prod_xxxxxxxxxx
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_FROM=noreply@arcane-football.com
SMTP_REPLY_TO=support@arcane-football.com

# Rate Limiting (Strict en prod)
RATE_LIMIT_TTL=60000
RATE_LIMIT_MAX=60
AI_RATE_LIMIT_TTL=60000
AI_RATE_LIMIT_MAX=10
AUTH_RATE_LIMIT_TTL=900000  # 15 min
AUTH_RATE_LIMIT_MAX=5

# Redis (Production - Caching)
REDIS_URL=redis://:password@prod-redis.arcane.com:6379

# Deployment
PROD_HOST=arcane-football.com
PROD_SSH_USER=deploy
PROD_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----\nxxxxx\n-----END OPENSSH PRIVATE KEY-----

# Monitoring & Alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00/B00/xxxxxxxxxxxx
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxxxxxxxxxxx
PAGERDUTY_API_KEY=xxxxxxxxxxxxx

# Backups
BACKUP_S3_BUCKET=arcane-backups-prod
BACKUP_S3_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
BACKUP_S3_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
BACKUP_RETENTION_DAYS=30

# Container Registry
CI_REGISTRY=registry.gitlab.com
CI_REGISTRY_IMAGE=registry.gitlab.com/ab1530/arcane-foot
```

#### Pipeline GitLab pour PRODUCTION

```yaml
deploy_production:
  stage: 🚀 deploy
  environment:
    name: production
    url: https://arcane-football.com
  script:
    # Validation PRE-DEPLOYMENT
    - echo "🔍 Pre-deployment checks..."
    - |
      if [ "$CI_COMMIT_BRANCH" != "main" ]; then
        echo "❌ ERROR: Production must be from 'main' branch"
        exit 1
      fi

    # Backup automatique
    - echo "💾 Creating backup..."
    - ./scripts/backup-production.sh

    # Déploiement
    - chmod +x scripts/deploy/deploy-production.sh
    - ./scripts/deploy/deploy-production.sh

    # Health check
    - echo "🏥 Running health checks..."
    - sleep 30
    - curl -f https://arcane-football.com/health || exit 1
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
      when: manual  # ← TOUJOURS MANUEL
  only:
    - main
  retry:
    max: 1
    when: never  # Jamais de retry auto en prod
```

#### Déploiement Production

**Architecture Recommandée : Kubernetes (K8s)**

```yaml
# kubernetes/production/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: arcane-backend
  namespace: production
spec:
  replicas: 3  # Haute disponibilité
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0  # Zero downtime
  template:
    spec:
      containers:
      - name: backend
        image: registry.gitlab.com/ab1530/arcane-foot/backend:latest
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
```

---

## 📊 Tableau Récapitulatif

| Caractéristique | DEV | STAGING | PRODUCTION |
|----------------|-----|---------|------------|
| **Branch Git** | develop/feature | develop | main |
| **Déploiement** | ❌ Aucun | 🟡 Manuel | 🔴 Manuel strict |
| **Base de données** | Local | PostgreSQL managé | PostgreSQL HA |
| **Stripe Mode** | Test | Test | **LIVE** 🔴 |
| **Rate Limiting** | Permissif (1000/min) | Normal (100/min) | Strict (60/min) |
| **Monitoring** | Minimal | Sentry | Sentry + PagerDuty |
| **Backups** | ❌ Non | Quotidien | Horaire |
| **SSL** | Auto (localhost) | Let's Encrypt | Let's Encrypt |
| **Scalabilité** | 1 instance | 1-2 instances | 3+ instances |
| **Coût estimé** | Gratuit | ~$20/mois | ~$100-200/mois |

---

## 🎯 Workflow Complet

### 1. Développement Local

```bash
# Feature branch
git checkout -b feature/nouvelle-fonctionnalite

# Développement + tests locaux
npm run dev
npm run test

# Commit
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin feature/nouvelle-fonctionnalite
```

### 2. Merge Request → Staging

```bash
# Sur GitLab : Créer MR vers 'develop'
# Pipeline CI s'exécute automatiquement :
# ✅ Lint
# ✅ Build
# ✅ Tests
# ✅ Security scan
# ✅ QA

# Si tout est vert → Merge

# Pipeline 'develop' s'exécute
# Stage deploy_staging est MANUEL
# → Cliquer "Play" pour déployer sur staging
```

### 3. Tests Staging

```bash
# Vérifier staging
curl https://staging.arcane-football.com/health

# Tests manuels
# - Parcourir l'app
# - Tester les features
# - Valider avec l'équipe

# Si OK → Créer MR develop → main
```

### 4. Production Release

```bash
# Sur GitLab : MR develop → main
# Code review STRICTE
# Approbation requise

# Merge → Pipeline 'main'
# Stage deploy_production est MANUEL
# ⚠️ ATTENTION : Production LIVE

# Cliquer "Play" après validation finale
# → Backup automatique
# → Déploiement avec zero-downtime
# → Health checks
# → Notification équipe
```

---

## 🔒 Checklist de Sécurité

### Avant de Déployer en Production

- [ ] Tous les secrets sont dans GitLab Variables (pas dans le code)
- [ ] Variables marquées "Protected" et "Masked"
- [ ] Stripe en mode LIVE (pas TEST)
- [ ] Rate limiting activé (strict)
- [ ] Sentry configuré avec alertes
- [ ] Backups automatiques configurés
- [ ] SSL/TLS activé (HTTPS)
- [ ] CORS configuré correctement
- [ ] Helmet.js activé (sécurité HTTP)
- [ ] CSRF protection activée
- [ ] Validation des inputs partout
- [ ] Pas de console.log en production
- [ ] Environment variables validées
- [ ] Health checks configurés
- [ ] Monitoring actif (Sentry, Datadog, etc.)
- [ ] Plan de rollback testé

---

## 🚨 Procédure d'Urgence (Rollback)

Si un problème critique survient en production :

```bash
# 1. Rollback immédiat (Kubernetes)
kubectl rollout undo deployment/arcane-backend -n production

# OU (Docker Compose)
docker-compose pull arcane-backend:previous-tag
docker-compose up -d

# 2. Vérifier le rollback
curl https://arcane-football.com/health

# 3. Notifier l'équipe
# Slack : "🚨 Rollback production effectué - Investigating..."

# 4. Investiguer en staging
# Reproduire le bug
# Fixer
# Re-tester
# Re-déployer
```

---

## 📈 Monitoring en Production

### Métriques à Surveiller

1. **Performance**
   - Temps de réponse API : < 200ms (p95)
   - Temps de chargement page : < 2s
   - CPU usage : < 70%
   - Memory usage : < 80%

2. **Disponibilité**
   - Uptime : > 99.9%
   - Health check : Toujours vert
   - Database connections : < 80% du pool

3. **Erreurs**
   - Error rate : < 0.1%
   - 5xx errors : 0 tolérance
   - 4xx errors : Monitorer trends

4. **Business**
   - Nouvelles inscriptions
   - Scouting reports créés
   - Conversions abonnements
   - Revenue tracking

---

## 🎉 Félicitations !

Tu as maintenant une vue complète de tes environnements. Prochaine étape : **Configurer tout ça sur GitLab** !

**Questions ?** Je suis là pour t'aider pas à pas. 🤝
