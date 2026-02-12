# Configuration GitHub - Arcane Platform

Ce guide explique comment configurer correctement ton repository GitHub avec toutes les bonnes pratiques.

## 1. Protection des Branches

### Configurer la protection de `main`

1. Va sur **GitHub.com** → Ton repo `ab1530/arcane-foot`
2. Clique sur **Settings** (en haut à droite)
3. Dans le menu latéral, clique sur **Branches**
4. Clique sur **Add branch protection rule**

**Configuration pour `main` :**

```
Branch name pattern: main

☑️ Require a pull request before merging
  ☑️ Require approvals (1)
  ☑️ Dismiss stale pull request approvals when new commits are pushed
  ☑️ Require review from Code Owners (optionnel)

☑️ Require status checks to pass before merging
  ☑️ Require branches to be up to date before merging
  Status checks à sélectionner :
    - Lint & Test Backend
    - Security Scan
    - Build

☑️ Require conversation resolution before merging

☑️ Require linear history

☑️ Do not allow bypassing the above settings

☐ Allow force pushes (JAMAIS coché pour main)
☐ Allow deletions (JAMAIS coché pour main)
```

5. Clique sur **Create** ou **Save changes**

### Configurer la protection de `staging`

**Configuration pour `staging` :**

```
Branch name pattern: staging

☑️ Require a pull request before merging
  ☑️ Require approvals (1)

☑️ Require status checks to pass before merging
  ☑️ Require branches to be up to date before merging
  Status checks :
    - Lint & Test Backend
    - Security Scan

☑️ Require linear history

☐ Allow force pushes (Non recommandé)
```

### Configurer la protection de `develop`

**Configuration pour `develop` :**

```
Branch name pattern: develop

☑️ Require a pull request before merging

☑️ Require status checks to pass before merging
  Status checks :
    - Lint & Test Backend

☐ Require approvals (optionnel pour develop)
```

## 2. Créer les Environments

Les environments permettent de gérer les secrets et les déploiements par environnement.

### Créer l'environment `development`

1. Va dans **Settings** → **Environments**
2. Clique sur **New environment**
3. Nom : `development`
4. Clique sur **Configure environment**

**Configuration :**
```
☐ Required reviewers (pas nécessaire pour dev)

Deployment branches :
  ☑️ Selected branches
  Branches : develop
```

**Secrets à ajouter :**
```
DATABASE_URL (dev database)
JWT_SECRET (dev secret)
SENTRY_DSN (dev project)
```

### Créer l'environment `staging`

1. New environment : `staging`

**Configuration :**
```
☐ Required reviewers (optionnel)

Deployment branches :
  ☑️ Selected branches
  Branches : staging
```

**Secrets :**
```
DATABASE_URL (staging database sur Railway/Supabase)
JWT_SECRET (staging secret - différent de prod)
RAILWAY_TOKEN ou RENDER_API_KEY
SENTRY_DSN (staging project)
```

### Créer l'environment `production`

1. New environment : `production`

**Configuration :**
```
☑️ Required reviewers
  Ajoute ton email : abdallah.lakhdari@epitech.eu

Deployment branches :
  ☑️ Protected branches only (main seulement)

⏱️ Wait timer : 5 minutes (optionnel, temps de réflexion)
```

**Secrets :**
```
DATABASE_URL (prod database)
JWT_SECRET (prod secret - TRÈS FORT)
JWT_REFRESH_SECRET
RAILWAY_TOKEN ou RENDER_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
FCM_SERVER_KEY
SUPABASE_SERVICE_KEY
SENTRY_DSN (production project)
SLACK_WEBHOOK (notifications)
```

## 3. Configurer les Secrets

### Secrets Globaux (Repository-level)

Ces secrets sont disponibles dans tous les workflows.

1. **Settings** → **Secrets and variables** → **Actions**
2. Clique sur **New repository secret**

**Secrets à créer :**

```
CODECOV_TOKEN
  → Pour le reporting de code coverage
  → Obtenir sur codecov.io après avoir lié le repo

DOCKER_USERNAME
  → Ton username Docker Hub (optionnel)

DOCKER_PASSWORD
  → Token Docker Hub (optionnel)

GITHUB_TOKEN
  → Créé automatiquement par GitHub (pas besoin de créer)
```

### Secrets par Environment

Déjà configurés dans la section "Environments" ci-dessus.

## 4. Activer GitHub Features

### Activer Dependabot

1. **Settings** → **Security** → **Code security and analysis**
2. Active :
   - ☑️ **Dependabot alerts**
   - ☑️ **Dependabot security updates**
   - ☑️ **Grouped security updates**

### Activer Secret Scanning

```
☑️ Secret scanning
☑️ Push protection (empêche de push des secrets)
```

### Activer Code Scanning (Security)

```
☑️ Code scanning
  → Setup avec CodeQL (GitHub recommandé)
```

## 5. Configurer les Notifications

### Slack Integration (optionnel)

1. Sur Slack, installe l'app **GitHub**
2. Dans un channel, tape `/github subscribe ab1530/arcane-foot`
3. Configure les notifications :
```
/github subscribe ab1530/arcane-foot deployments reviews commits:main
```

4. Ajoute le **Webhook URL** dans les secrets :
   - Settings → Secrets → `SLACK_WEBHOOK`

### Email Notifications

1. **Settings** → **Notifications** (profil utilisateur)
2. Configure :
   - ☑️ Pull request reviews
   - ☑️ Pull request pushes
   - ☑️ Comments on Issues and Pull Requests
   - ☑️ GitHub Actions workflow runs

## 6. Collaborateurs et Équipe

### Ajouter des collaborateurs

1. **Settings** → **Collaborators**
2. Clique sur **Add people**
3. Entre l'email ou username

**Rôles disponibles :**
- **Read** : Voir le code seulement
- **Triage** : Gérer issues et PRs
- **Write** : Push du code
- **Maintain** : Gérer repo settings (limité)
- **Admin** : Accès complet

### Créer une équipe (si organisation)

1. Sur ton organisation → **Teams**
2. **New team** : `arcane-developers`
3. Ajoute les membres
4. Donne accès au repo avec le rôle approprié

## 7. Configurer CODEOWNERS (optionnel)

Créer le fichier `.github/CODEOWNERS` pour définir qui doit review quoi.

```bash
# Backend
/backend/ @ab1530

# Mobile
/mobile/ @ab1530

# Infrastructure
/infra/ @ab1530
/.github/ @ab1530

# Documentation
/docs/ @ab1530
*.md @ab1530
```

**Bénéfices :**
- Assignation automatique des reviewers
- Protection des fichiers critiques

## 8. Labels pour Issues et PRs

Créer des labels personnalisés pour organiser le travail.

1. **Issues** → **Labels** → **New label**

**Labels recommandés :**

```
Type:
  🐛 bug (rouge)
  ✨ feature (bleu)
  📝 documentation (vert)
  🔧 chore (gris)
  🚀 enhancement (violet)

Priority:
  🔴 priority: high (rouge)
  🟠 priority: medium (orange)
  🟢 priority: low (vert)

Status:
  🚧 in progress (jaune)
  👀 needs review (bleu)
  ⏸️ on hold (gris)
  ✅ done (vert)

Area:
  🔐 area: auth
  👤 area: players
  📊 area: analytics
  📱 area: mobile
  🏗️ area: infrastructure
```

## 9. Projects (Kanban Board)

Créer un board pour organiser le travail.

1. **Projects** (tab en haut) → **New project**
2. Nom : `Arcane MVP Development`
3. Template : **Board**

**Colonnes recommandées :**
```
📋 Backlog
🎯 To Do
🚧 In Progress
👀 In Review
✅ Done
```

**Ajouter les issues :**
- Drag & drop des issues dans les colonnes
- Automatiser avec GitHub Actions (optionnel)

## 10. Wiki (optionnel)

Activer le Wiki pour la documentation.

1. **Settings** → **Features** → ☑️ **Wikis**
2. Créer des pages :
   - Home
   - Architecture
   - API Documentation
   - Deployment Guide

## 11. Actions Permissions

Configurer les permissions des GitHub Actions.

1. **Settings** → **Actions** → **General**

**Configuration recommandée :**

```
Actions permissions :
  ☑️ Allow all actions and reusable workflows

Workflow permissions :
  ☑️ Read and write permissions
  ☑️ Allow GitHub Actions to create and approve pull requests
```

## 12. Branch Default

Définir `develop` comme branche par défaut pour les nouvelles PRs.

1. **Settings** → **Branches**
2. **Default branch** : Change de `main` à `develop`
3. Clique sur **Update**

**Pourquoi ?**
- Les nouvelles PRs cibleront `develop` par défaut
- `main` reste réservé pour la production

## Vérification Finale

Checklist de configuration :

- [ ] Branch protection sur `main` (stricte)
- [ ] Branch protection sur `staging`
- [ ] Branch protection sur `develop`
- [ ] Environment `development` créé
- [ ] Environment `staging` créé
- [ ] Environment `production` créé (avec reviewers)
- [ ] Secrets configurés par environment
- [ ] Dependabot activé
- [ ] Secret scanning activé
- [ ] Code scanning activé (CodeQL)
- [ ] Default branch = `develop`
- [ ] Labels créés
- [ ] CODEOWNERS configuré (optionnel)
- [ ] Notifications configurées

## Commandes Utiles

```bash
# Vérifier les protections via CLI
gh api repos/ab1530/arcane-foot/branches/main/protection

# Lister les environments
gh api repos/ab1530/arcane-foot/environments

# Lister les secrets
gh secret list

# Ajouter un secret
gh secret set NOM_SECRET

# Trigger un workflow manuellement
gh workflow run deploy-production.yml
```

## Prochaines Étapes

Une fois la configuration GitHub terminée :
1. ✅ Tester un workflow complet (feature → develop → staging → main)
2. ✅ Vérifier que les protections fonctionnent
3. ✅ Configurer Sentry, Codecov, etc.
4. ✅ Former l'équipe sur le workflow

## Ressources

- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
