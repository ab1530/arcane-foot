# Guide d'Utilisation des Outils - Arcane Platform

Ce guide t'explique **comment utiliser tous les outils** mis en place pour les bonnes pratiques DevOps.

## Table des Matières

1. [Git Workflow](#git-workflow)
2. [GitHub Actions (CI/CD)](#github-actions-cicd)
3. [Dependabot](#dependabot)
4. [Sentry (Error Tracking)](#sentry-error-tracking)
5. [Code Coverage](#code-coverage)
6. [Healthchecks](#healthchecks)
7. [Rate Limiting](#rate-limiting)
8. [Security (Helmet)](#security-helmet)
9. [Monitoring](#monitoring)
10. [Best Practices](#best-practices)

---

## Git Workflow

### Workflow Quotidien

#### 1. Créer une nouvelle feature

```bash
# Partir de develop à jour
git checkout develop
git pull origin develop

# Créer ta branch
git checkout -b feature/add-match-scoring

# Faire tes modifications
# ...

# Commit avec conventional commits
git add "YOUR_CHANGE"
git commit -m "feat: add match scoring system"

# Push ta branch
git push -u origin feature/add-match-scoring
```

#### 2. Créer une Pull Request

```bash
# Via CLI (recommandé)
gh pr create \
  --title "feat: add match scoring system" \
  --body "Implements scoring system for matches with ratings" \
  --base develop

# Ou via l'interface GitHub
# → GitHub.com → Pull requests → New pull request
```

**Le PR template se remplit automatiquement** avec :
- Type of change (feature, fix, etc.)
- Description
- Checklist de tests
- Checklist de sécurité

#### 3. Attendre la Review

Quand tu crées une PR vers `develop`, **GitHub Actions lance automatiquement** :

✅ Linting du code
✅ Tests unitaires
✅ Build du projet
✅ Security scan
✅ Code coverage

Tu peux voir le statut dans l'onglet **Checks** de ta PR.

```bash
# Voir le status des checks
gh pr checks

# Voir les logs d'un check qui a échoué
gh run view <run-id> --log
```

#### 4. Corriger les problèmes

Si un check échoue :

```bash
# Lint errors
npm run lint

# Test errors
npm run test

# Fix et re-push
git add .
git commit -m "fix: resolve linting issues"
git push

# Les checks se relancent automatiquement
```

#### 5. Merge

Après approbation et checks OK :

```bash
# Via CLI
gh pr merge --squash --delete-branch

# Ou via GitHub UI
# → Bouton "Squash and merge"
```

**La branch feature est automatiquement supprimée** après merge.

### Release vers Staging

```bash
# Créer PR de develop vers staging
gh pr create --base staging --head develop --title "Release v1.1.0 to staging"

# Après merge, le déploiement staging se lance automatiquement
# Tu peux suivre le déploiement :
gh run watch
```

### Release vers Production

```bash
# Créer PR de staging vers main
gh pr create --base main --head staging --title "Release v1.1.0 to production"

# ⚠️ Cette PR nécessite une review (protection de main)

# Après merge, le déploiement production se lance automatiquement
# Smoke tests se lancent automatiquement après
```

### Commandes Git Utiles

```bash
# Voir l'historique propre
git log --oneline --graph --all -20

# Voir tes branches
git branch -a

# Supprimer branches locales mergées
git branch --merged | grep -v "\*\|main\|develop\|staging" | xargs -n 1 git branch -d

# Stash tes changements temporairement
git stash
git stash pop

# Amend le dernier commit (avant push)
git commit --amend --no-edit

# Voir les changements non committed
git diff

# Voir les changements staged
git diff --staged
```

---

## GitHub Actions (CI/CD)

### Workflows Disponibles

#### 1. Backend CI (`backend-ci.yml`)

**Déclenché sur :** Push ou PR vers `main`, `develop`, ou `staging` (fichiers backend)

**Ce qu'il fait :**
- ✅ Lint le code
- ✅ Run les tests unitaires et E2E
- ✅ Build le projet
- ✅ Scan de sécurité (Trivy)

**Comment l'utiliser :**

```bash
# C'est automatique ! Il se lance dès que tu push.

# Voir les runs récents
gh run list --workflow=backend-ci.yml

# Voir les détails d'un run
gh run view <run-id>

# Voir les logs
gh run view <run-id> --log

# Re-run un workflow qui a échoué
gh run rerun <run-id>
```

#### 2. Code Coverage (`code-coverage.yml`)

**Déclenché sur :** Push ou PR vers `main`, `develop`, `staging`

**Ce qu'il fait :**
- ✅ Run tests avec coverage
- ✅ Upload coverage vers Codecov
- ✅ Comment la PR avec le rapport
- ✅ Vérifie que coverage >= 70%

**Comment l'utiliser :**

Automatique ! Quand tu crées une PR, un commentaire apparaît avec le coverage :

```
Code Coverage Report

Total Coverage: 85.3% ✅
Lines: 850/1000
Branches: 120/150
Functions: 45/50

Coverage increased by +2.3% 📈
```

**Voir le coverage en local :**

```bash
cd backend
npm run test:cov

# Ouvrir le rapport HTML
open coverage/lcov-report/index.html
```

#### 3. Smoke Tests (`smoke-tests.yml`)

**Déclenché sur :** Après un déploiement production, ou manuellement

**Ce qu'il fait :**
- ✅ Health check
- ✅ Readiness check
- ✅ Database connectivity
- ✅ API response time
- ✅ Rate limiting
- ✅ Security headers
- ✅ CORS

**Comment l'utiliser :**

```bash
# Lancer manuellement sur staging
gh workflow run smoke-tests.yml -f environment=staging

# Lancer sur production
gh workflow run smoke-tests.yml -f environment=production

# Voir les résultats
gh run list --workflow=smoke-tests.yml
gh run view <run-id>
```

#### 4. Deploy Production (`deploy-production.yml`)

**Déclenché sur :**
- Push sur `main` ou `staging`
- Tag `v*` (ex: v1.0.0)
- Manuellement

**Ce qu'il fait :**
- ✅ Build l'application
- ✅ Deploy vers Railway/Render
- ✅ Run migrations database
- ✅ Lance smoke tests
- ✅ Notifie Slack (optionnel)

**Comment l'utiliser :**

```bash
# Déploiement automatique (recommandé)
# → Merge PR vers main = déploiement auto

# Déploiement manuel
gh workflow run deploy-production.yml -f environment=production

# Voir le status
gh run watch

# Rollback si problème
railway rollback --environment production
```

### Secrets GitHub

#### Voir les secrets configurés

```bash
# Secrets globaux
gh secret list

# Secrets par environment
gh secret list --env production
```

#### Ajouter/Mettre à jour un secret

```bash
# Global secret
gh secret set NOM_DU_SECRET

# Environment secret
gh secret set DATABASE_URL --env production

# Depuis un fichier
gh secret set PRIVATE_KEY < private-key.pem --env production
```

#### Secrets nécessaires

**Pour staging :**
```bash
gh secret set DATABASE_URL --env staging
gh secret set JWT_SECRET --env staging
gh secret set RAILWAY_TOKEN --env staging
gh secret set SENTRY_DSN --env staging
```

**Pour production :**
```bash
gh secret set DATABASE_URL --env production
gh secret set JWT_SECRET --env production
gh secret set JWT_REFRESH_SECRET --env production
gh secret set RAILWAY_TOKEN --env production
gh secret set SENTRY_DSN --env production
gh secret set STRIPE_SECRET_KEY --env production
gh secret set FCM_SERVER_KEY --env production
gh secret set SLACK_WEBHOOK --env production
```

---

## Dependabot

### C'est Quoi ?

**Dependabot** surveille automatiquement tes dépendances et crée des PRs pour les mettre à jour.

### Comment ça Marche ?

Tous les lundis à 9h, Dependabot :
1. ✅ Vérifie les nouvelles versions de packages
2. ✅ Crée des PRs groupées (NestJS, Prisma, Security)
3. ✅ Lance les tests automatiquement
4. ✅ T'assigne en reviewer

### Gérer les PRs Dependabot

#### Option 1 : Merge automatique (recommandé pour patch)

```bash
# Voir les PRs Dependabot
gh pr list --label dependencies

# Auto-merge une PR (si tests passent)
gh pr review <pr-number> --approve
gh pr merge <pr-number> --auto --squash
```

#### Option 2 : Review manuelle

```bash
# Voir les changements
gh pr view <pr-number>
gh pr diff <pr-number>

# Tester en local
gh pr checkout <pr-number>
cd backend
npm install
npm run test

# Si OK, merge
gh pr merge <pr-number> --squash
```

#### Groupes de Dépendances

Les PRs sont groupées par catégorie :

- **NestJS** : Tous les packages `@nestjs/*` ensemble
- **Prisma** : `prisma` + `@prisma/client` ensemble
- **Security** : `helmet`, `@sentry/*` ensemble

**Exemple de PR :**
```
chore(deps): bump @nestjs packages to 11.2.0

Updates:
- @nestjs/common: 11.1.6 → 11.2.0
- @nestjs/core: 11.1.6 → 11.2.0
- @nestjs/platform-express: 11.1.6 → 11.2.0
```

### Ignorer une Dépendance

Si tu veux ignorer une dépendance temporairement :

```bash
# Éditer .github/dependabot.yml
# Ajouter dans la section ignore :

ignore:
  - dependency-name: "nom-du-package"
    update-types: ["version-update:semver-major"]
```

### Commandes Utiles

```bash
# Voir toutes les PRs Dependabot ouvertes
gh pr list --label dependencies

# Fermer toutes les PRs Dependabot (si trop)
gh pr list --label dependencies --json number --jq '.[].number' | xargs -I {} gh pr close {}

# Re-run Dependabot maintenant (pas d'attendre lundi)
# → GitHub.com → Insights → Dependency graph → Dependabot → "Check for updates"
```

---

## Sentry (Error Tracking)

### C'est Quoi ?

**Sentry** capture automatiquement toutes les erreurs de ton application en production et te notifie.

### Configuration

Déjà configuré dans `main.ts` ! Il suffit d'ajouter le `SENTRY_DSN` dans les secrets :

```bash
gh secret set SENTRY_DSN --env production
```

### Utiliser Sentry

#### 1. Créer un compte Sentry

1. Va sur [sentry.io](https://sentry.io)
2. Crée un compte gratuit
3. Crée un projet **Node.js**
4. Copie le **DSN** (ex: `https://xxx@sentry.io/123`)

#### 2. Configurer par environnement

```bash
# Créer 2 projets Sentry :
# - arcane-backend-staging
# - arcane-backend-production

# Ajouter les DSN
gh secret set SENTRY_DSN --env staging
# Colle le DSN staging

gh secret set SENTRY_DSN --env production
# Colle le DSN production
```

#### 3. Voir les erreurs

**Dans Sentry Dashboard :**
- **Issues** → Toutes les erreurs capturées
- **Performance** → Temps de réponse des endpoints
- **Releases** → Erreurs par version

#### 4. Capturer des erreurs manuellement

```typescript
// Dans ton code NestJS
import * as Sentry from '@sentry/node';

// Capturer une erreur
try {
  await dangerousOperation();
} catch (error) {
  Sentry.captureException(error);
  throw error;
}

// Capturer un message
Sentry.captureMessage('Something important happened', 'info');

// Ajouter du contexte
Sentry.setUser({ id: user.id, email: user.email });
Sentry.setContext('match', { matchId: match.id });
```

#### 5. Alertes

Configure les alertes dans Sentry :

**Settings → Alerts → New Alert Rule**

Exemples :
- Alerte si erreur rate > 1%
- Alerte si nouvelle erreur apparaît
- Alerte si temps de réponse > 2s

### Debugging avec Sentry

Quand une erreur apparaît :

1. **Voir le stack trace complet**
2. **Voir les breadcrumbs** (actions avant l'erreur)
3. **Voir le contexte** (user, request, environment)
4. **Assigner à quelqu'un**
5. **Marquer comme resolved** quand fixé

---

## Code Coverage

### C'est Quoi ?

Le **code coverage** mesure le pourcentage de code couvert par les tests.

### Voir le Coverage

#### En local

```bash
cd backend
npm run test:cov

# Ouvrir le rapport
open coverage/lcov-report/index.html
```

#### Sur GitHub

Automatique sur chaque PR ! Un commentaire apparaît avec :
- Coverage total
- Coverage par fichier
- Différence avec la branch de base

#### Sur Codecov

1. Créer un compte sur [codecov.io](https://codecov.io)
2. Lier ton repo GitHub
3. Copier le token
4. Ajouter le secret :

```bash
gh secret set CODECOV_TOKEN
```

Maintenant, tu as un dashboard complet sur Codecov !

### Améliorer le Coverage

#### 1. Identifier les fichiers non couverts

```bash
npm run test:cov

# Regarder la colonne "% Stmts"
# Fichiers < 70% = besoin de tests
```

#### 2. Écrire des tests

**Exemple de test NestJS :**

```typescript
// players.service.spec.ts
import { Test } from '@nestjs/testing';
import { PlayersService } from './players.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PlayersService', () => {
  let service: PlayersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PlayersService, PrismaService],
    }).compile();

    service = module.get(PlayersService);
    prisma = module.get(PrismaService);
  });

  it('should return all players', async () => {
    const mockPlayers = [{ id: '1', name: 'Mbappé' }];
    jest.spyOn(prisma.player, 'findMany').mockResolvedValue(mockPlayers);

    const result = await service.findAll({});

    expect(result.data).toEqual(mockPlayers);
    expect(prisma.player.findMany).toHaveBeenCalled();
  });
});
```

#### 3. Objectif de coverage

**Notre objectif : 70% minimum**

Le workflow CI/CD échoue si coverage < 70%.

---

## Healthchecks

### Endpoints Disponibles

#### 1. Health Check Complet

```bash
curl http://localhost:3000/api/health
```

**Retourne :**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-16T20:00:00.000Z",
  "uptime": 1234.56,
  "responseTime": "5ms",
  "environment": "development",
  "version": "1.0.0",
  "checks": {
    "database": "up",
    "memory": {
      "rss": "122 MB",
      "heapTotal": "103 MB",
      "heapUsed": "36 MB"
    }
  }
}
```

#### 2. Readiness Check

```bash
curl http://localhost:3000/api/health/ready
```

**Utilisé par :** Railway, Kubernetes pour savoir si l'app est prête

**Retourne :**
```json
{
  "status": "ready",
  "ready": true,
  "timestamp": "2025-10-16T20:00:00.000Z",
  "checks": {
    "database": "up"
  }
}
```

#### 3. Liveness Check

```bash
curl http://localhost:3000/api/health/live
```

**Utilisé par :** Railway, Kubernetes pour savoir si l'app est vivante

**Retourne :**
```json
{
  "status": "alive",
  "alive": true,
  "timestamp": "2025-10-16T20:00:00.000Z",
  "uptime": 1234.56
}
```

### Utilisation

#### Dans Railway

**Service → Settings → Healthcheck**

```
Path: /api/health
Port: 3000
Interval: 30s
Timeout: 10s
```

#### Monitoring Externe (UptimeRobot)

1. Créer un compte sur [uptimerobot.com](https://uptimerobot.com)
2. Add New Monitor
3. Monitor Type: **HTTP(S)**
4. URL: `https://arcane-api.up.railway.app/api/health`
5. Interval: **5 minutes**
6. Alert When: **Down**
7. Alert Contacts: Ton email + Slack

**Tu seras notifié immédiatement si l'API tombe !**

---

## Rate Limiting

### C'est Quoi ?

Le **rate limiting** limite le nombre de requêtes par utilisateur pour protéger contre les abus.

### Configuration Actuelle

**Défaut :** 100 requêtes par minute par IP

Configurable dans `.env` :
```env
RATE_LIMIT_TTL=60000  # 60 secondes
RATE_LIMIT_MAX=100    # 100 requêtes max
```

### Tester le Rate Limiting

```bash
# Faire 110 requêtes rapidement
for i in {1..110}; do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/health
done

# Les dernières devraient retourner 429 (Too Many Requests)
```

### Personnaliser par Endpoint

```typescript
// Dans un controller
import { Throttle } from '@nestjs/throttler';

@Controller('players')
export class PlayersController {
  // Override pour cet endpoint seulement
  @Get()
  @Throttle({ default: { limit: 10, ttl: 60000 } })  // 10 req/min
  async findAll() {
    // ...
  }
}
```

### Désactiver pour un Endpoint

```typescript
import { SkipThrottle } from '@nestjs/throttler';

@Get('public-stats')
@SkipThrottle()  // Pas de rate limit
async getPublicStats() {
  // ...
}
```

### Headers de Rate Limiting

Chaque réponse inclut des headers :

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1697558400
```

---

## Security (Helmet)

### C'est Quoi ?

**Helmet** ajoute automatiquement des headers de sécurité HTTP.

### Headers Ajoutés

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HTTPS seulement)
- Et 10+ autres !

### Vérifier les Headers

```bash
curl -I http://localhost:3000/api/health
```

**Tu devrais voir :**
```
X-DNS-Prefetch-Control: off
X-Frame-Options: SAMEORIGIN
Strict-Transport-Security: max-age=15552000; includeSubDomains
X-Download-Options: noopen
X-Content-Type-Options: nosniff
X-XSS-Protection: 0
```

### Tester la Sécurité

Utilise [securityheaders.com](https://securityheaders.com) :

1. Entre ton URL production
2. Scan
3. Tu devrais avoir un score **A** ou **A+**

---

## Monitoring

### Uptime Monitoring

**Recommandé : Better Stack (ex-Logtail)**

1. Créer un compte sur [betterstack.com](https://betterstack.com)
2. Add New Monitor
3. URL: `https://arcane-api.up.railway.app/api/health`
4. Frequency: **1 minute**
5. Alert: **Email + Slack**

### Logs Centralisés

**Railway Logs** (inclus) :

```bash
# Voir les logs en temps réel
railway logs --tail

# Filtrer par niveau
railway logs --level error

# Logs des 24h dernières
railway logs --since 24h
```

### Metrics Application

**Dans Railway Dashboard :**
- CPU Usage
- Memory Usage
- Network I/O
- Request Rate
- Response Time

**Alertes à configurer :**
- CPU > 80% pendant 5 min
- Memory > 80% pendant 5 min
- Error rate > 1% pendant 5 min

---

## Best Practices

### Développement Quotidien

```bash
# 1. Toujours partir de develop à jour
git checkout develop && git pull

# 2. Créer une branch feature
git checkout -b feature/nom-descriptif

# 3. Commits fréquents avec messages clairs
git commit -m "feat: add user avatar upload"

# 4. Tester en local avant de push
npm run test
npm run lint

# 5. Push et créer PR
git push -u origin feature/nom-descriptif
gh pr create

# 6. Attendre review et checks
# 7. Merge et supprimer branch
gh pr merge --squash --delete-branch
```

### Avant Chaque Déploiement

```bash
# ✅ Tests passent
npm run test

# ✅ Linter OK
npm run lint

# ✅ Build OK
npm run build

# ✅ Migrations testées
npm run prisma:migrate

# ✅ Pas d'erreurs Sentry en staging
# → Checker sentry.io

# ✅ Smoke tests OK en staging
gh workflow run smoke-tests.yml -f environment=staging
```

### Sécurité

```bash
# ✅ Jamais commit .env
git status  # Vérifier avant commit

# ✅ Auditer les dépendances régulièrement
npm audit

# ✅ Mettre à jour les dépendances de sécurité immédiatement
gh pr list --label security

# ✅ Vérifier les secrets
gh secret list --env production
```

### Performance

```bash
# ✅ Monitorer les temps de réponse
# → Railway Metrics

# ✅ Optimiser les requêtes lentes
# → Sentry Performance

# ✅ Utiliser les indexes Prisma
# → prisma/schema.prisma

# ✅ Cacher les requêtes fréquentes
# → Redis (à venir)
```

---

## Cheat Sheet

### Commandes Essentielles

```bash
# Git
git checkout develop && git pull
git checkout -b feature/nom
git commit -m "feat: description"
git push -u origin feature/nom

# GitHub CLI
gh pr create
gh pr list
gh pr merge --squash
gh run list
gh run watch
gh workflow run nom-workflow.yml

# Tests
npm run test
npm run test:cov
npm run test:e2e
npm run lint

# Railway
railway status
railway logs --tail
railway restart
railway rollback

# Health checks
curl localhost:3000/api/health
curl localhost:3000/api/health/ready
curl localhost:3000/api/health/live

# Prisma
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

### Liens Utiles

- **Repo GitHub:** https://github.com/ab1530/arcane-foot
- **Railway Dashboard:** https://railway.app
- **Sentry:** https://sentry.io
- **Codecov:** https://codecov.io
- **Better Stack:** https://betterstack.com

---

## Questions Fréquentes

### Comment voir si mon déploiement a fonctionné ?

```bash
gh run list --workflow=deploy-production.yml
gh run view <run-id>
```

### Comment rollback si problème ?

```bash
railway rollback --environment production
```

### Comment ajouter un secret ?

```bash
gh secret set NOM_SECRET --env production
```

### Les tests échouent en CI mais passent en local ?

```bash
# Vérifier les versions Node.js
# CI utilise Node 20.x

# Vérifier les variables d'environnement
# CI utilise des secrets GitHub
```

### Dependabot crée trop de PRs ?

Édite `.github/dependabot.yml` :
```yaml
open-pull-requests-limit: 5  # Réduis le nombre
```

### Comment voir le coverage d'un fichier spécifique ?

```bash
npm run test:cov
open coverage/lcov-report/index.html
# Navigue vers le fichier
```

---

**Besoin d'aide ?** Ouvre une issue sur GitHub ou consulte la documentation :
- [docs/GIT_WORKFLOW.md](./GIT_WORKFLOW.md)
- [docs/DEPLOYMENT.md](./DEPLOYMENT.md)
- [docs/GITHUB_SETUP.md](./GITHUB_SETUP.md)
