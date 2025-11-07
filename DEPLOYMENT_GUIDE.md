# 🚀 GUIDE DE DÉPLOIEMENT PRODUCTION - ARCANE FOOTBALL

**Status:** Post-Démo
**Durée estimée:** 2-4 heures
**Niveau:** Intermédiaire

---

## 📋 OVERVIEW

Ce guide vous accompagne pour déployer ARCANE Football en production avec:
- **Frontend:** Vercel (Next.js optimisé)
- **Backend:** Railway ou Heroku (NestJS)
- **Database:** Supabase PostgreSQL (ou Railway/Heroku)
- **Storage:** Supabase Storage
- **Monitoring:** Sentry (error tracking)
- **Payments:** Stripe (production mode)

---

## ⚡ ORDRE RECOMMANDÉ

1. Database (Supabase) → 30 min
2. Backend (Railway) → 45 min
3. Frontend (Vercel) → 30 min
4. Monitoring (Sentry) → 15 min
5. Payments (Stripe) → 20 min
6. Tests & Validation → 30 min

## 🛠️ GitLab CI/CD (Phase 3)

Le pipeline GitLab (`.gitlab-ci.yml`) orchestre toutes les étapes :

1. **build_backend / build_web** → `npm ci` + `npm run build` pour Nest et Next.
2. **build_docker_images** → construit les images Docker multi-stage.
3. **unit_test_backend / unit_test_web** → exécute Jest backend/frontend et Prisma migrate.
4. **qa_job** → Playwright + Jest web, génération `tests/output/qa_report.md`.
5. **deploy_staging / deploy_production** → scripts `scripts/deploy/deploy-*.sh` (build + push + kubectl).

> Renseigne les variables GitLab (`CI_REGISTRY_*`, `STAGING_KUBE_CONFIG`, `PRODUCTION_KUBE_CONFIG`, secrets Stripe/Supabase/Sentry) avant d’activer la pipeline.

---

## 1️⃣ DATABASE - SUPABASE (30 MIN)

### Créer un Projet Supabase

1. **Aller sur:** https://supabase.com/dashboard
2. **Créer un nouveau projet:**
   - Nom: `arcane-football-prod`
   - Region: `Europe (Frankfurt)` ou la plus proche
   - Database Password: Générer un mot de passe fort (le sauvegarder!)

3. **Attendre ~2 minutes** pour que le projet soit prêt

### Récupérer les Variables

1. **Project Settings > API:**
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY` (frontend)
   - `service_role` key → `SUPABASE_SERVICE_KEY` (backend - à garder secret!)

2. **Project Settings > Database:**
   - Connection string → `DATABASE_URL`
   - Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

### Migrer le Schema

```bash
cd backend

# 1. Mettre le DATABASE_URL dans .env
echo "DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" > .env

# 2. Push le schema Prisma
npx prisma db push

# 3. Générer le client
npx prisma generate

# 4. Seed les données (optionnel)
npm run prisma:seed
```

### Configurer Storage

1. **Storage > Create Bucket:**
   - Nom: `player-avatars`
   - Public: ✅ Oui
   - Allowed MIME types: `image/*`

2. **Créer les autres buckets:**
   - `club-logos` (public)
   - `documents` (private)
   - `reports` (private)

---

## 2️⃣ BACKEND - RAILWAY (45 MIN)

### Créer un Projet Railway

1. **Aller sur:** https://railway.app/
2. **New Project > Deploy from GitHub repo**
3. **Connecter votre repo GitHub** (fork si besoin)
4. **Sélectionner:** `/backend` comme root directory

### Configuration Variables d'Environnement

Dans Railway > Variables > Add all at once:

```env
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# JWT
JWT_SECRET=votre_secret_jwt_minimum_32_caracteres_tres_securise
JWT_EXPIRES_IN=7d

# Sentry (à configurer après)
SENTRY_DSN=
APP_VERSION=1.0.0

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx

# OpenAI (si utilisé)
OPENAI_API_KEY=sk-xxx

# Application
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://votre-app.vercel.app

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

### Build & Deploy

1. **Railway détecte automatiquement NestJS**
2. **Build Command:** `npm install && npx prisma generate && npm run build`
3. **Start Command:** `node dist/main`
4. **Attendre le déploiement** (~3-5 min)

### Récupérer l'URL Backend

- **Settings > Domains > Generate Domain**
- URL type: `arcane-football-backend.up.railway.app`
- **Sauvegarder cette URL** pour le frontend!

### Test Health Check

```bash
curl https://arcane-football-backend.up.railway.app/api/health

# Doit retourner:
# {"status":"healthy","timestamp":"...","uptime":...}
```

---

## 3️⃣ FRONTEND - VERCEL (30 MIN)

### Créer un Projet Vercel

1. **Aller sur:** https://vercel.com/
2. **Import Git Repository**
3. **Sélectionner votre repo GitHub**
4. **Framework Preset:** Next.js
5. **Root Directory:** `web`

### Configuration Variables d'Environnement

**Settings > Environment Variables > Add all:**

```env
# API
NEXT_PUBLIC_API_URL=https://arcane-football-backend.up.railway.app

# Application
NEXT_PUBLIC_APP_NAME=ARCANE Football
NEXT_PUBLIC_APP_URL=https://votre-app.vercel.app
NEXT_PUBLIC_APP_VERSION=1.0.0

# Sentry (à configurer après)
NEXT_PUBLIC_SENTRY_DSN=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx

# Google Maps (optionnel)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_MOCK_AUTH=false

# Environment
NODE_ENV=production
```

### Build Settings

- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

### Deploy

1. **Cliquer sur Deploy**
2. **Attendre ~2-3 minutes**
3. **Récupérer l'URL:** `https://arcane-football.vercel.app`

### Mettre à Jour Backend FRONTEND_URL

Retourner dans Railway > Variables > Modifier `FRONTEND_URL`:
```env
FRONTEND_URL=https://arcane-football.vercel.app
```

### Test

1. **Ouvrir:** `https://arcane-football.vercel.app`
2. **Vérifier:** Landing page charge
3. **Test login:** Avec credentials de test
4. **Vérifier:** Dashboard accessible

---

## 4️⃣ MONITORING - SENTRY (15 MIN)

### Créer un Compte Sentry

1. **Aller sur:** https://sentry.io/
2. **Create a New Organization:** `arcane-football`

### Créer 2 Projets

#### Frontend Project
- **Platform:** Next.js
- **Nom:** `arcane-football-web`
- **Récupérer DSN:** `https://xxx@xxx.ingest.sentry.io/xxx`

#### Backend Project
- **Platform:** Node.js / NestJS
- **Nom:** `arcane-football-api`
- **Récupérer DSN:** `https://xxx@xxx.ingest.sentry.io/xxx`

### Configurer les Variables

#### Vercel (Frontend)
```env
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```
→ Settings > Environment Variables > Add > Redeploy

#### Railway (Backend)
```env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```
→ Variables > Update > Redeploy

### Test Sentry

1. **Déclencher une erreur test:**
   - Frontend: Aller sur une page inexistante `/test-404`
   - Backend: `GET /api/health/debug-sentry`

2. **Vérifier dans Sentry:**
   - Issues > Check que l'erreur apparaît

---

## 5️⃣ PAYMENTS - STRIPE (20 MIN)

### Activer le Mode Production

1. **Aller sur:** https://dashboard.stripe.com/
2. **Toggle vers Production Mode** (en haut à droite)

### Récupérer les Clés Production

**Developers > API keys:**
- `Publishable key` → `pk_live_xxx`
- `Secret key` → `sk_live_xxx`

### Configurer le Webhook

**Developers > Webhooks > Add endpoint:**

```
Endpoint URL: https://arcane-football-backend.up.railway.app/api/payments/webhook
Events:
  - checkout.session.completed
  - customer.subscription.created
  - customer.subscription.updated
  - customer.subscription.deleted
  - invoice.payment_succeeded
  - invoice.payment_failed
```

**Récupérer le Signing Secret:** `whsec_xxx`

### Mettre à Jour les Variables

#### Railway (Backend)
```env
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

#### Vercel (Frontend)
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

**Redéployer les deux!**

### Test Paiement

1. **Mode test Stripe:**
   - Carte: `4242 4242 4242 4242`
   - Date: n'importe quelle date future
   - CVC: n'importe quel 3 chiffres

2. **Vérifier dans Stripe Dashboard** que le paiement apparaît

---

## 6️⃣ TESTS & VALIDATION (30 MIN)

### Checklist Fonctionnelle

#### Authentication
- [ ] Signup fonctionne
- [ ] Login fonctionne
- [ ] Logout fonctionne
- [ ] JWT token valide

#### Pages Publiques
- [ ] Landing page (/) charge
- [ ] About (/about)
- [ ] Services (/services)
- [ ] Pricing (/pricing)
- [ ] Contact (/contact)

#### Pages Protégées
- [ ] Dashboard (/dashboard) charge avec stats
- [ ] Players list (/players)
- [ ] Player detail (/players/[id])
- [ ] Reports list (/reports)
- [ ] Report detail (/reports/[id])
- [ ] Calendar (/calendar)
- [ ] Market Kanban (/market)
- [ ] Camps (/camps)
- [ ] Camp detail (/camps/[id])
- [ ] My Camps (/my-camps)
- [ ] AI Hub (/ai)
- [ ] Profile (/profile)
- [ ] Analytics (/analytics)

#### Fonctionnalités Critiques
- [ ] Création de rapport
- [ ] Édition de rapport
- [ ] Filtres fonctionnent
- [ ] Search global (Cmd+K)
- [ ] Upload avatar fonctionne (Supabase)
- [ ] Paiement Stripe fonctionne
- [ ] Inscription camp fonctionne

#### Monitoring
- [ ] Sentry reçoit les erreurs
- [ ] Health check backend répond
- [ ] Analytics frontend track events

### Tests Performance

```bash
# Test backend
curl https://arcane-football-backend.up.railway.app/api/health
# Doit répondre en < 500ms

# Test frontend
curl -I https://arcane-football.vercel.app
# Doit retourner 200 OK
```

### SEO Check

1. **Ouvrir:** `https://arcane-football.vercel.app/sitemap.xml`
   - Doit afficher le sitemap XML

2. **Ouvrir:** `https://arcane-football.vercel.app/robots.txt`
   - Doit afficher les règles

3. **Test Open Graph:**
   - Partager l'URL sur Slack/Discord
   - Vérifier que le preview s'affiche

---

## 🔒 SÉCURITÉ POST-DÉPLOIEMENT

### Variables Sensibles à Changer

- [ ] **JWT_SECRET** - Générer un nouveau (32+ caractères aléatoires)
- [ ] **Database Password** - Utiliser un mot de passe fort unique
- [ ] **Stripe Keys** - Vérifier que vous utilisez `sk_live_` et non `sk_test_`
- [ ] **Supabase Service Key** - Ne JAMAIS exposer côté client

### CORS Configuration

Vérifier dans le backend (`main.ts`):
```typescript
app.enableCors({
  origin: ['https://arcane-football.vercel.app'], // Uniquement votre domaine!
  credentials: true,
});
```

### Rate Limiting

Vérifier que le rate limiting est actif:
```env
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

---

## 🌐 CUSTOM DOMAIN (OPTIONNEL)

### Acheter un Domaine

**Recommandations:**
- Namecheap: https://www.namecheap.com/
- Google Domains: https://domains.google/
- OVH: https://www.ovh.com/

**Suggestions de noms:**
- `arcane-football.com`
- `arcanescouting.com`
- `arcane.football`

### Configurer Vercel

1. **Vercel > Settings > Domains**
2. **Add Domain:** `arcane-football.com`
3. **Suivre les instructions DNS**

### Configurer Railway (Optionnel)

1. **Railway > Settings > Domains**
2. **Custom Domain:** `api.arcane-football.com`
3. **Configurer CNAME** chez votre registrar

### Mettre à Jour les Variables

```env
# Vercel
NEXT_PUBLIC_APP_URL=https://arcane-football.com

# Railway
FRONTEND_URL=https://arcane-football.com
```

---

## 📊 MONITORING POST-PRODUCTION

### Sentry Alerts

1. **Project Settings > Alerts**
2. **Create Alert Rule:**
   - Condition: Error count > 10 in 1 hour
   - Action: Email + Slack notification

### Uptime Monitoring

**Services gratuits:**
- UptimeRobot: https://uptimerobot.com/
- Pingdom: https://www.pingdom.com/
- Better Uptime: https://betteruptime.com/

**Endpoints à monitor:**
- `https://arcane-football.vercel.app` (200 OK)
- `https://arcane-football-backend.up.railway.app/api/health` (200 OK avec JSON)

### Analytics

**Vérifier dans Sentry > Performance:**
- Page load times
- API response times
- Slow transactions

---

## 🔄 CI/CD AUTOMATIQUE

### GitHub Actions (déjà configuré par Vercel/Railway)

**Chaque push sur `main`:**
1. Tests automatiques (si configurés)
2. Build
3. Deploy automatique
4. Health check post-deploy

### Rollback si Problème

**Vercel:**
- Deployments > Select previous deployment > Promote to Production

**Railway:**
- Deployments > Select previous deployment > Redeploy

---

## 📝 CHECKLIST FINALE DÉPLOIEMENT

- [ ] Database Supabase créée et migrée
- [ ] Backend Railway déployé et accessible
- [ ] Frontend Vercel déployé et accessible
- [ ] Sentry configuré (frontend + backend)
- [ ] Stripe en mode production
- [ ] Webhooks Stripe configurés
- [ ] Variables d'environnement production définies
- [ ] JWT_SECRET changé et sécurisé
- [ ] CORS configuré correctement
- [ ] Rate limiting actif
- [ ] Tests fonctionnels passés
- [ ] Monitoring Uptime configuré
- [ ] Custom domain configuré (optionnel)
- [ ] Backup database configuré
- [ ] Documentation mise à jour

---

## 🆘 SUPPORT & TROUBLESHOOTING

### Backend ne répond pas (502/503)

```bash
# Check Railway logs
railway logs

# Redéployer
railway up
```

### Frontend erreur API

1. Vérifier `NEXT_PUBLIC_API_URL` dans Vercel
2. Vérifier CORS dans le backend
3. Check Railway backend logs

### Database connection error

1. Vérifier `DATABASE_URL` est correct
2. Test connexion: `npx prisma db push`
3. Vérifier IP whitelist Supabase (si activé)

### Sentry ne reçoit pas d'erreurs

1. Vérifier `SENTRY_DSN` est défini
2. Déclencher erreur test: `/api/health/debug-sentry`
3. Check Sentry quota (limite gratuite)

---

## 📚 RESSOURCES UTILES

- **Vercel Docs:** https://vercel.com/docs
- **Railway Docs:** https://docs.railway.app/
- **Supabase Docs:** https://supabase.com/docs
- **Sentry Docs:** https://docs.sentry.io/
- **Stripe Docs:** https://stripe.com/docs
- **Next.js Production:** https://nextjs.org/docs/deployment

---

**Créé par:** ARCANE Football Team
**Dernière mise à jour:** 28 Octobre 2025
**Version:** 1.0.0
