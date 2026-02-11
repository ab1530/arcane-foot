# 🚀 Guide de Migration GitHub → GitLab

Guide complet pour une transition professionnelle et sans risque de GitHub vers GitLab.

---

## 📊 État Actuel

### ✅ Ce qui existe déjà
- ✅ Repository GitHub (origin)
- ✅ Repository GitLab configuré (remote 'gitlab')
- ✅ `.gitlab-ci.yml` complet (4 stages: build, test, qa, deploy)
- ✅ Scripts de déploiement (`scripts/deploy/`)
- ✅ GitHub Actions (backend-ci, mobile-ci, docker-build, deploy-production)

### 🎯 Objectif
Migrer **progressivement** de GitHub vers GitLab sans interruption de service.

---

## 📋 Plan de Migration (8 Étapes)

### Phase 1 : Préparation (Jour 1)
### Phase 2 : Configuration GitLab (Jour 2-3)
### Phase 3 : Tests & Validation (Jour 4-5)
### Phase 4 : Dual-Running (Jour 6-10)
### Phase 5 : Bascule Finale (Jour 11+)

---

## 🔧 ÉTAPE 1 : Configuration GitLab Project

### 1.1 Accéder à GitLab
```bash
# Ouvrir dans le navigateur
https://gitlab.com/ab1530/arcane-foot
```

### 1.2 Activer GitLab CI/CD
1. Aller dans **Settings → CI/CD**
2. Expand **"General pipelines"**
3. Activer **"Public pipelines"** (ou Private selon besoin)
4. **Auto DevOps** → Désactiver (on utilise notre `.gitlab-ci.yml`)

### 1.3 Configurer le Runner
GitLab fournit des runners partagés gratuitement, mais pour de meilleures performances :

**Option A : Utiliser les Shared Runners (Gratuit)**
- Déjà activé par défaut
- Limité à 400 minutes/mois (plan gratuit)
- Suffisant pour commencer

**Option B : Installer votre propre Runner (Recommandé)**
```bash
# Sur votre serveur ou machine locale
# 1. Installer GitLab Runner
curl -L https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh | sudo bash
sudo apt-get install gitlab-runner

# 2. Obtenir le token de registration
# GitLab → Settings → CI/CD → Runners → New project runner

# 3. Enregistrer le runner
sudo gitlab-runner register
# URL: https://gitlab.com
# Token: <votre-token-du-gitlab>
# Description: arcane-football-runner
# Tags: docker, linux
# Executor: docker
# Default image: node:20-bullseye
```

---

## 🔐 ÉTAPE 2 : Configurer les Variables d'Environnement

### 2.1 Variables GitLab CI/CD
Aller dans **Settings → CI/CD → Variables** et ajouter :

#### Variables de Base (Protected + Masked)
```plaintext
# Database
DATABASE_URL              = postgresql://user:pass@host:5432/db
STAGING_DATABASE_URL      = postgresql://user:pass@staging-host:5432/db  
PROD_DATABASE_URL         = postgresql://user:pass@prod-host:5432/db

# JWT
JWT_SECRET                = <votre-secret-jwt>
JWT_EXPIRES_IN            = 7d


# Supabase
SUPABASE_URL              = https://xxx.supabase.co
SUPABASE_SERVICE_KEY      = <votre-service-key>
SUPABASE_STORAGE_BUCKET   = arcane-media

# Stripe
STRIPE_SECRET_KEY         = sk_live_xxx
STRIPE_WEBHOOK_SECRET     = whsec_xxx

# OpenAI
OPENAI_API_KEY            = sk-xxx

# Sentry
SENTRY_DSN                = https://xxx@sentry.io/xxx

# Firebase
FIREBASE_PROJECT_ID       = arcane-football
FIREBASE_CLIENT_EMAIL     = xxx@arcane-football.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY      = -----BEGIN PRIVATE KEY-----\nxxx\n-----END PRIVATE KEY-----

# Email (si vous utilisez)
SENDGRID_API_KEY          = SG.xxx
SMTP_HOST                 = smtp.sendgrid.net
SMTP_USER                 = apikey
SMTP_PASS                 = <sendgrid-api-key>
```

#### Variables de Déploiement (Protected + Masked)
```plaintext
# Docker Registry (GitLab Container Registry)
CI_REGISTRY               = registry.gitlab.com
CI_REGISTRY_USER          = gitlab-ci-token
CI_REGISTRY_PASSWORD      = <auto-généré-par-gitlab>

# Staging Deployment
STAGING_HOST              = staging.arcane-football.com
STAGING_SSH_USER          = deploy
STAGING_SSH_KEY           = <contenu-de-votre-clé-ssh-privée>

# Production Deployment
PROD_HOST                 = arcane-football.com
PROD_SSH_USER             = deploy  
PROD_SSH_KEY              = <contenu-de-votre-clé-ssh-privée>

# Notifications (optionnel)
SLACK_WEBHOOK_URL         = https://hooks.slack.com/services/xxx
DISCORD_WEBHOOK_URL       = https://discord.com/api/webhooks/xxx
```

### 2.2 Comment obtenir `STAGING_SSH_KEY` et `PROD_SSH_KEY`

```bash
# Sur votre machine locale
ssh-keygen -t ed25519 -C "gitlab-ci@arcane-football.com" -f ~/.ssh/gitlab_ci_deploy

# Copier la clé PRIVÉE vers GitLab CI/CD Variables
cat ~/.ssh/gitlab_ci_deploy
# Copier tout le contenu (y compris BEGIN/END)

# Copier la clé PUBLIQUE vers le serveur
ssh-copy-id -i ~/.ssh/gitlab_ci_deploy.pub deploy@staging.arcane-football.com
ssh-copy-id -i ~/.ssh/gitlab_ci_deploy.pub deploy@arcane-football.com
```

---

## 🔗 ÉTAPE 3 : Activer le Container Registry

### 3.1 Activer le Registry
1. Aller dans **Settings → General → Visibility**
2. **Container Registry** → Activer
3. **Packages & Registries** → Activer

### 3.2 Tester le Registry localement
```bash
# Login au GitLab Container Registry
docker login registry.gitlab.com

# Username: votre-email-gitlab
# Password: votre-personal-access-token (créer dans Settings → Access Tokens)

# Test push
docker tag mon-image:latest registry.gitlab.com/ab1530/arcane-foot/backend:test
docker push registry.gitlab.com/ab1530/arcane-foot/backend:test

# Si ça marche, vous êtes prêt ! ✅
```

---

## 🚦 ÉTAPE 4 : Premier Test du Pipeline GitLab

### 4.1 Vérifier le `.gitlab-ci.yml`
Le fichier existe déjà à la racine du projet. Vérifions qu'il est correct :

```bash
# Valider la syntaxe
cd /Users/lakhdari/Desktop/AppFoot
cat .gitlab-ci.yml

# Ou utiliser l'outil GitLab CI Lint
# GitLab → CI/CD → Pipelines → "CI Lint" (bouton en haut à droite)
```

### 4.2 Pousser une branche de test
```bash
# Créer une branche de test
git checkout -b test/gitlab-ci-setup

# Faire un petit changement (ex: ajouter un commentaire)
echo "# Test GitLab CI" >> README.md

# Commit et push vers GitLab
git add .
git commit -m "test: Validate GitLab CI/CD pipeline"
git push gitlab test/gitlab-ci-setup
```

### 4.3 Surveiller le Pipeline
1. Aller dans **CI/CD → Pipelines**
2. Cliquer sur le pipeline en cours
3. Observer chaque stage :
   - ✅ `build_backend` → Doit compiler le backend
   - ✅ `build_web` → Doit compiler le frontend
   - ✅ `unit_test_backend` → Tests unitaires backend
   - ✅ `unit_test_web` → Tests unitaires web
   - ⏸️ `deploy_staging` → Manuel (ne s'exécute pas automatiquement)

### 4.4 Débugger si des jobs échouent

**Si `build_backend` échoue :**
```bash
# Vérifier que les dépendances sont à jour
cd backend
npm ci
npm run build

# Si ça marche localement mais pas sur GitLab :
# → Vérifier les variables d'environnement
# → Vérifier la version de Node (doit être 20.x)
```

**Si `unit_test_backend` échoue :**
```bash
# Problème commun : DATABASE_URL
# → Ajouter DATABASE_URL dans GitLab CI/CD Variables
# → Ou vérifier que PostgreSQL service est bien configuré dans .gitlab-ci.yml
```

**Si Docker build échoue :**
```bash
# Vérifier que CI_REGISTRY_PASSWORD est bien configuré
# → GitLab → Settings → CI/CD → Variables → CI_REGISTRY_PASSWORD
```

---

## 🔄 ÉTAPE 5 : Configuration du Mirroring (Optionnel)

Pour garder GitHub et GitLab synchronisés automatiquement :

### 5.1 Activer le Push Mirroring (GitLab → GitHub)
**GitLab vers GitHub (Recommandé) :**
1. GitLab → **Settings → Repository → Mirroring repositories**
2. **Git repository URL** : `https://oauth2:<github-token>@github.com/ab1530/arcane-foot.git`
3. **Mirror direction** : Push
4. **Authentication method** : Password
5. Cocher **"Only mirror protected branches"** (main, develop)
6. Cliquer **"Mirror repository"**

### 5.2 Créer un GitHub Personal Access Token
1. GitHub → **Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. **Generate new token**
3. Scopes : `repo` (full control)
4. Copier le token
5. Utiliser dans l'URL du mirroring

### 5.3 Tester le Mirroring
```bash
# Push vers GitLab
git push gitlab develop

# Attendre 1-2 minutes
# Vérifier que GitHub s'est mis à jour automatiquement
git fetch origin
git log origin/develop
```

---

## 🧪 ÉTAPE 6 : Tester le Déploiement Staging

### 6.1 Configuration de l'environnement Staging

**Option A : Railway (Recommandé pour commencer)**
```bash
# 1. Créer un compte Railway.app
# 2. Créer un nouveau projet "arcane-football-staging"
# 3. Connecter le repo GitLab
# 4. Déployer backend + web + PostgreSQL

# 5. Obtenir le token Railway
# Railway → Project Settings → Tokens → Create Token

# 6. Ajouter dans GitLab CI/CD Variables
RAILWAY_TOKEN = <votre-railway-token>
```

**Option B : Render.com**
```bash
# 1. Créer un compte Render.com
# 2. Créer un Web Service pour backend
# 3. Créer un Web Service pour web
# 4. Créer une PostgreSQL database

# 5. Obtenir les URLs de déploiement
# 6. Configurer dans GitLab Variables
```

**Option C : Serveur VPS (Pour les experts)**
```bash
# 1. Louer un VPS (DigitalOcean, OVH, Hetzner)
# 2. Installer Docker + Docker Compose
# 3. Configurer les SSH keys (voir étape 2.2)
# 4. Utiliser les scripts deploy-staging.sh
```

### 6.2 Premier Déploiement Manuel
```bash
# Sur GitLab, aller dans CI/CD → Pipelines
# Sélectionner le pipeline de la branche 'develop'
# Cliquer sur le stage "deploy_staging"
# Cliquer sur le bouton "Play" ▶️

# Surveiller les logs de déploiement
# Vérifier que tout se passe bien
```

### 6.3 Vérifier le Déploiement
```bash
# Test de santé du backend
curl https://staging.arcane-football.com/health

# Réponse attendue : {"status":"ok"}

# Test du frontend
curl -I https://staging.arcane-football.com/

# Réponse attendue : HTTP/2 200
```

---

## 🎭 ÉTAPE 7 : Dual-Running (GitHub + GitLab en parallèle)

Pendant 1-2 semaines, faire tourner les deux pipelines en parallèle :

### 7.1 Workflow Dual-Running
```bash
# 1. Développer normalement sur develop
git checkout develop
git pull gitlab develop

# 2. Faire vos changements
git add .
git commit -m "feat: nouvelle fonctionnalité"

# 3. Pousser vers LES DEUX remotes
git push gitlab develop  # Pipeline GitLab se déclenche
git push origin develop  # Pipeline GitHub se déclenche

# 4. Surveiller les deux pipelines
# - GitLab : https://gitlab.com/ab1530/arcane-foot/-/pipelines
# - GitHub : https://github.com/ab1530/arcane-foot/actions
```

### 7.2 Comparer les Résultats
Créer un tableau de suivi :

| Feature | GitHub Actions | GitLab CI | Notes |
|---------|---------------|-----------|-------|
| Build Backend | ✅ 2m 30s | ✅ 2m 15s | GitLab plus rapide |
| Unit Tests | ✅ 1m 45s | ✅ 1m 50s | Équivalent |
| E2E Tests | ❌ (skip) | ✅ 3m 20s | GitLab plus complet |
| Docker Build | ✅ 4m 10s | ✅ 3m 45s | GitLab plus rapide |
| Deploy Staging | ⚠️ Manuel | ✅ Auto | GitLab meilleur |

### 7.3 Identifier les Problèmes
- Noter tous les échecs sur GitLab
- Comparer avec GitHub pour voir ce qui fonctionne
- Ajuster le `.gitlab-ci.yml` si nécessaire

---

## ✅ ÉTAPE 8 : Bascule Finale vers GitLab

Quand vous êtes confiant (après 1-2 semaines de dual-running) :

### 8.1 Désactiver GitHub Actions
```bash
# Méthode 1 : Renommer les workflows (non destructif)
cd .github/workflows
mkdir disabled
mv *.yml disabled/

git add .
git commit -m "ci: Disable GitHub Actions, GitLab CI is now primary"
git push gitlab main
git push origin main
```

### 8.2 Mettre à jour la Documentation
```bash
# Mettre à jour README.md
echo "## CI/CD

Ce projet utilise **GitLab CI/CD** pour l'intégration continue.

Pipeline : https://gitlab.com/ab1530/arcane-foot/-/pipelines
" >> README.md

git add README.md
git commit -m "docs: Update CI/CD documentation (GitLab)"
git push gitlab main
```

### 8.3 Rediriger l'équipe
```markdown
# Annoncer à l'équipe (Slack, Discord, Email)

📢 **Migration CI/CD terminée !**

À partir de maintenant :
- ✅ **Push principal** : `git push gitlab <branch>`
- ✅ **Pipelines** : https://gitlab.com/ab1530/arcane-foot/-/pipelines
- ✅ **Container Registry** : registry.gitlab.com/ab1530/arcane-foot
- ⚠️ GitHub reste disponible en lecture seule (mirroring automatique)

Questions ? Voir le guide : GITLAB_MIGRATION_GUIDE.md
```

### 8.4 Configurer GitLab comme Remote Principal
```bash
# Pour tous les développeurs
git remote rename origin github
git remote rename gitlab origin

# Maintenant "origin" pointe vers GitLab
git push origin develop  # → Push vers GitLab
git push github develop  # → Push vers GitHub (optionnel)
```

---

## 📊 CHECKLIST FINALE

### ✅ Avant la Bascule
- [ ] GitLab CI/CD fonctionne sans erreurs (>95% de succès)
- [ ] Toutes les variables d'environnement sont configurées
- [ ] Les déploiements staging fonctionnent
- [ ] Les déploiements production ont été testés (dry-run)
- [ ] L'équipe est formée sur GitLab
- [ ] La documentation est mise à jour
- [ ] Un plan de rollback est prêt

### ✅ Pendant la Période de Dual-Running
- [ ] Dual-running actif depuis >1 semaine
- [ ] Aucun incident critique sur GitLab
- [ ] GitLab a des performances égales ou meilleures que GitHub
- [ ] Tous les développeurs sont à l'aise avec GitLab

### ✅ Après la Bascule
- [ ] GitHub Actions désactivé
- [ ] Mirroring GitHub→GitLab actif (lecture seule)
- [ ] Équipe notifiée
- [ ] Documentation à jour
- [ ] Monitoring en place (Sentry, logs)

---

## 🔥 Troubleshooting

### Pipeline bloqué "Pending"
**Cause** : Pas de runner disponible  
**Solution** : Vérifier Settings → CI/CD → Runners → Activer Shared Runners

### Erreur "Cannot connect to the Docker daemon"
**Cause** : Docker-in-Docker mal configuré  
**Solution** : Vérifier que `docker:24.0.6-dind` est dans `services` du job

### Tests qui passent sur GitHub mais échouent sur GitLab
**Cause** : Variables d'environnement manquantes  
**Solution** : Comparer les env vars entre GitHub Secrets et GitLab CI/CD Variables

### Déploiement échoue avec "Permission denied"
**Cause** : Clé SSH mal configurée  
**Solution** : Vérifier que `STAGING_SSH_KEY` contient la clé PRIVÉE complète

### "Insufficient balance" sur GitLab
**Cause** : Quota CI/CD épuisé (400 min/mois sur plan gratuit)  
**Solution** : 
- Installer un self-hosted runner (gratuit)
- Upgrader vers GitLab Premium ($19/user/mois)

---

## 📚 Ressources

### Documentation GitLab
- **CI/CD Guide** : https://docs.gitlab.com/ee/ci/
- **Variables** : https://docs.gitlab.com/ee/ci/variables/
- **Docker Registry** : https://docs.gitlab.com/ee/user/packages/container_registry/
- **Deployments** : https://docs.gitlab.com/ee/ci/environments/

### Communauté
- **GitLab Forum** : https://forum.gitlab.com/
- **Discord ARCANE Football** : (votre discord)
- **Stack Overflow** : https://stackoverflow.com/questions/tagged/gitlab-ci

---

## 🎉 Félicitations !

Vous avez maintenant un pipeline CI/CD professionnel sur GitLab ! 🚀

**Prochaines étapes recommandées :**
1. Activer le **Code Quality** report (GitLab Premium)
2. Configurer **Security Scanning** (SAST, DAST)
3. Mettre en place **Auto DevOps** pour les review apps
4. Intégrer **Jira/Trello** pour le tracking

**Questions ?** Créer une issue sur GitLab.
