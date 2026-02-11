# 🚀 Arcane Platform - Production Ready Checklist

## ✅ Ce qui est déjà configuré

### Backend Infrastructure
- ✅ **NestJS** avec TypeScript
- ✅ **PostgreSQL** via Prisma ORM (18 models)
- ✅ **JWT Authentication** (signup/login)
- ✅ **Docker Compose** pour développement local
- ✅ **Players Module** avec REST endpoints
- ✅ **Health Check endpoints** (/health, /ready, /live)

### Sécurité
- ✅ **Helmet.js** - Security headers HTTP
- ✅ **Rate Limiting** - 100 req/min par IP (configurable)
- ✅ **bcrypt** - Password hashing (10 rounds)
- ✅ **CORS** configuré
- ✅ **Input Validation** - class-validator globale
- ✅ **Role-Based Access Control** (RBAC)

### DevOps & CI/CD
- ✅ **GitHub Actions** - 4 workflows complets
  - Backend CI (lint, test, build, security scan)
  - Code Coverage (avec seuil 70%)
  - Smoke Tests (health, performance, security)
  - Deploy Production (Railway/Render)
- ✅ **Dependabot** - Updates automatiques (NPM, Docker, GitHub Actions)
- ✅ **Git Branching Strategy** - main/staging/develop
- ✅ **Conventional Commits** enforcement
- ✅ **Pull Request Template**

### Monitoring & Observabilité
- ✅ **Sentry** intégré (error tracking)
- ✅ **Health Checks** (liveness, readiness)
- ✅ **Compression** activée
- ✅ **Structured logging** ready

### Documentation
- ✅ **TOOLS_GUIDE.md** - Guide complet d'utilisation des outils
- ✅ **GIT_WORKFLOW.md** - Workflow Git quotidien
- ✅ **DEPLOYMENT.md** - Guide de déploiement complet
- ✅ **GITHUB_SETUP.md** - Configuration GitHub
- ✅ **README.md** - Vue d'ensemble du projet

## ⚠️ À Configurer Avant Production

### 1. GitHub Configuration (30 min)

**Suivre [docs/GITHUB_SETUP.md](./docs/GITHUB_SETUP.md)**

- [ ] Protection branch `main` (require PR, reviews, status checks)
- [ ] Protection branch `staging` (require PR, status checks)
- [ ] Protection branch `develop` (require PR)
- [ ] Environment `production` (avec required reviewers)
- [ ] Environment `staging`
- [ ] Environment `development`
- [ ] Activer Dependabot alerts
- [ ] Activer Secret scanning
- [ ] Activer Code scanning (CodeQL)
- [ ] Configurer default branch = `develop`

### 2. Secrets GitHub (15 min)

**Staging Secrets :**
```bash
gh secret set DATABASE_URL --env staging
gh secret set JWT_SECRET --env staging
gh secret set JWT_REFRESH_SECRET --env staging
gh secret set RAILWAY_TOKEN --env staging
gh secret set SENTRY_DSN --env staging
gh secret set SUPABASE_URL --env staging
gh secret set SUPABASE_SERVICE_KEY --env staging
```

**Production Secrets :**
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

**Global Secrets :**
```bash
gh secret set CODECOV_TOKEN
```

### 3. Services Externes (45 min)

#### Railway (Hosting)
1. Créer compte sur [railway.app](https://railway.app)
2. Créer 2 projects : `arcane-staging` et `arcane-production`
3. Connecter GitHub repo
4. Récupérer les tokens Railway
5. Configurer variables d'environnement

#### Sentry (Error Tracking)
1. Créer compte sur [sentry.io](https://sentry.io)
2. Créer 2 projects : `arcane-backend-staging` et `arcane-backend-production`
3. Récupérer les DSN
4. Ajouter dans GitHub secrets

#### Supabase (Database & Storage)
1. Créer compte sur [supabase.com](https://supabase.com)
2. Créer 2 projects : staging et production
3. Récupérer connection strings et API keys
4. Activer Row Level Security

#### Codecov (Code Coverage)
1. Créer compte sur [codecov.io](https://codecov.io)
2. Lier le repo GitHub
3. Récupérer le token
4. Ajouter dans GitHub secrets

#### Stripe (Paiements)
1. Créer compte sur [stripe.com](https://stripe.com)
2. Récupérer Test API keys (staging)
3. Récupérer Live API keys (production)
4. Configurer webhooks

#### Firebase (Push Notifications)
1. Créer projet sur [console.firebase.google.com](https://console.firebase.google.com)
2. Activer Cloud Messaging
3. Télécharger service account JSON
4. Récupérer FCM server key

#### Better Stack (Monitoring - optionnel)
1. Créer compte sur [betterstack.com](https://betterstack.com)
2. Créer uptime monitors pour staging et production
3. Configurer alertes email/Slack

### 4. Database Setup (30 min)

**Staging :**
```bash
# Via Supabase dashboard
# 1. Créer database
# 2. Copier connection string
# 3. Ajouter dans GitHub secret DATABASE_URL (staging)

# Run migrations
railway run "npx prisma migrate deploy" --environment staging
```

**Production :**
```bash
# Via Supabase dashboard
# 1. Créer database avec backups automatiques
# 2. Configurer point-in-time recovery
# 3. Copier connection string
# 4. Ajouter dans GitHub secret DATABASE_URL (production)

# Run migrations
railway run "npx prisma migrate deploy" --environment production
```

### 5. DNS Configuration (optionnel, 20 min)

**Si tu veux un domaine custom :**

1. Acheter domaine (ex: arcane.app)
2. Configurer dans Railway :
   - `api.arcane.app` → Production
   - `staging-api.arcane.app` → Staging
3. Attendre propagation DNS (quelques heures)

## 🎯 Premier Déploiement

### Étape 1 : Deploy Staging

```bash
# 1. S'assurer que develop est à jour
git checkout develop
git pull origin develop

# 2. Créer PR vers staging
gh pr create --base staging --head develop --title "Initial deployment to staging"

# 3. Merger après validation
gh pr merge --squash

# 4. Le déploiement se lance automatiquement
gh run watch

# 5. Vérifier le déploiement
curl https://arcane-staging.up.railway.app/api/health

# 6. Lancer smoke tests
gh workflow run smoke-tests.yml -f environment=staging
```

### Étape 2 : Tests en Staging

```bash
# Tester manuellement tous les endpoints critiques
# - Auth (signup, login)
# - Players (GET, POST)
# - Health checks

# Vérifier Sentry (pas d'erreurs)
# Vérifier Railway metrics (CPU, RAM OK)
```

### Étape 3 : Deploy Production

```bash
# 1. Créer PR de staging vers main
gh pr create --base main --head staging --title "Release v1.0.0 to production"

# 2. Review approfondie (required reviewer)

# 3. Merger
gh pr merge --squash

# 4. Créer le tag
git checkout main
git pull origin main
git tag -a v1.0.0 -m "Release v1.0.0 - Initial production deployment"
git push origin v1.0.0

# 5. Vérifier le déploiement
curl https://arcane-api.up.railway.app/api/health

# 6. Smoke tests automatiques se lancent
```

## 📊 Post-Déploiement

### Monitoring Setup

1. **Better Stack** - Uptime monitoring
   - Monitor: `https://arcane-api.up.railway.app/api/health`
   - Interval: 1 minute
   - Alert: Email + Slack

2. **Sentry** - Error tracking
   - Vérifier qu'aucune erreur n'apparaît
   - Configurer alertes (error rate > 1%)

3. **Railway** - Infrastructure
   - Surveiller CPU/RAM usage
   - Configurer alertes si > 80%

### Backup Strategy

```bash
# Configurer backups automatiques
# → Supabase : Enable point-in-time recovery (7 jours)
# → Script backup quotidien (voir infra/scripts/backup.sh)
```

## 🔐 Sécurité Post-Déploiement

### Checklist Sécurité

- [ ] Secrets production sont forts (min 32 caractères)
- [ ] Secrets staging différents de production
- [ ] Rate limiting actif (tester avec 110 requêtes)
- [ ] Security headers présents (tester avec securityheaders.com)
- [ ] HTTPS forcé en production
- [ ] Secret scanning GitHub actif
- [ ] Dependabot actif
- [ ] Database backups configurés
- [ ] Access logs activés

### Tester la Sécurité

```bash
# 1. Headers de sécurité
curl -I https://arcane-api.up.railway.app/api/health

# 2. Rate limiting
for i in {1..110}; do curl https://arcane-api.up.railway.app/api/health; done

# 3. Security score
# → Aller sur https://securityheaders.com
# → Scanner https://arcane-api.up.railway.app
# → Objectif : Score A ou A+
```

## 📈 Métriques à Surveiller

### Première Semaine

- **Uptime** : > 99.9%
- **Response time p95** : < 200ms
- **Error rate** : < 1%
- **CPU usage** : < 50%
- **RAM usage** : < 50%

### Alertes à Configurer

**Railway :**
- CPU > 80% pendant 5 min
- RAM > 80% pendant 5 min

**Sentry :**
- Nouvelle erreur unique
- Error rate > 1%

**Better Stack :**
- Downtime > 30 secondes
- Response time > 2 secondes

## 🚨 Plan d'Urgence

### Si l'application crash

```bash
# 1. Vérifier les logs
railway logs --environment production --tail

# 2. Vérifier Sentry
# → Identifier l'erreur

# 3. Rollback si nécessaire
railway rollback --environment production

# 4. Fix et redéployer
```

### Si database est inaccessible

```bash
# 1. Vérifier Supabase status
# → https://status.supabase.com

# 2. Tester connexion
railway run "psql $DATABASE_URL -c 'SELECT 1'" --environment production

# 3. Vérifier le connection pool

# 4. Contacter support Supabase si nécessaire
```

## 📝 Checklist Finale

### Avant de Dire "Production Ready"

- [ ] Tous les secrets configurés (staging + production)
- [ ] Branch protection activée (main/staging/develop)
- [ ] Déployé avec succès en staging
- [ ] Smoke tests passent en staging
- [ ] Déployé avec succès en production
- [ ] Smoke tests passent en production
- [ ] Health checks accessibles publiquement
- [ ] Monitoring configuré (Sentry, Better Stack)
- [ ] Alertes configurées
- [ ] Backups database configurés
- [ ] Documentation à jour
- [ ] Équipe formée sur le workflow
- [ ] Plan d'urgence défini
- [ ] Contacts d'urgence listés

### Contacts d'Urgence

- **Tech Lead :** Abdallah Lakhdari - abdallah.lakhdari@epitech.eu
- **Railway Support :** https://railway.app/help
- **Supabase Support :** https://supabase.com/support
- **Sentry Support :** https://sentry.io/support

## 🎓 Formation Équipe

### Chaque membre de l'équipe doit :

1. Lire [docs/TOOLS_GUIDE.md](./docs/TOOLS_GUIDE.md) en entier
2. Faire au moins 1 PR en develop
3. Comprendre le workflow staging → production
4. Savoir faire un rollback
5. Avoir accès à tous les services (Railway, Sentry, etc.)

### Sessions de Formation

- **Session 1 (1h)** : Git Workflow & GitHub Actions
- **Session 2 (1h)** : Déploiement & Rollback
- **Session 3 (1h)** : Monitoring & Debugging
- **Session 4 (30min)** : Sécurité & Best Practices

## 🎉 Prochaines Étapes

Une fois production ready :

1. **Modules Backend**
   - [ ] Clubs CRUD
   - [ ] Matches endpoints
   - [ ] Scouting Reports
   - [ ] Media upload

2. **Tests**
   - [ ] Tests E2E complets
   - [ ] Load testing
   - [ ] Security testing

3. **Performance**
   - [ ] Redis caching
   - [ ] Query optimization
   - [ ] CDN pour static files

4. **Features Avancées**
   - [ ] Video processing (worker)
   - [ ] Real-time notifications
   - [ ] Analytics dashboard
   - [ ] Feature flags

5. **Mobile App**
   - [ ] Flutter initialization
   - [ ] Clean Architecture setup
   - [ ] Auth screens

## 📚 Ressources

### Documentation
- [Backend README](./backend/README.md)
- [Tools Guide](./docs/TOOLS_GUIDE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Git Workflow](./docs/GIT_WORKFLOW.md)
- [GitHub Setup](./docs/GITHUB_SETUP.md)

### Services
- [Railway Dashboard](https://railway.app)
- [Sentry Dashboard](https://sentry.io)
- [Supabase Dashboard](https://supabase.com)
- [GitHub Repo](https://github.com/ab1530/arcane-foot)

---

**Status :** 🟡 Configuration Required

**Dernière mise à jour :** 2025-10-16

**Prêt pour production après :** Configuration des services externes (2-3h)
