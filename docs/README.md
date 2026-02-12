# Documentation Arcane Platform

Bienvenue dans la documentation complète du projet Arcane ! 🚀

## 📚 Guides Disponibles

### 🔰 Pour Bien Démarrer

1. **[TOOLS_GUIDE.md](./TOOLS_GUIDE.md)** ⭐ **COMMENCE ICI !**
   - Guide complet sur comment utiliser tous les outils
   - Exemples concrets et commandes
   - Questions fréquentes
   - **C'est le guide le plus important !**

2. **[GIT_WORKFLOW.md](./GIT_WORKFLOW.md)**
   - Stratégie de branches (main/staging/develop)
   - Workflow quotidien de développement
   - Conventions de commits
   - Commandes Git utiles

### 🚀 Déploiement & Production

3. **[DEPLOYMENT.md](./DEPLOYMENT.md)**
   - Guide complet de déploiement
   - Configuration par environnement (dev/staging/prod)
   - Procédures de rollback
   - Database migrations
   - Troubleshooting

4. **[GITHUB_SETUP.md](./GITHUB_SETUP.md)**
   - Configuration GitHub (branch protection, environments)
   - Gestion des secrets
   - Activation des features de sécurité
   - Labels, Projects, Wiki

## 🎯 Par Cas d'Usage

### "Je veux créer une nouvelle feature"

1. Lis [GIT_WORKFLOW.md](./GIT_WORKFLOW.md) - Section "Workflow Quotidien"
2. Utilise [TOOLS_GUIDE.md](./TOOLS_GUIDE.md) - Section "Git Workflow"

**Résumé rapide :**
```bash
git checkout develop && git pull
git checkout -b feature/ma-feature
# ... code ...
git commit -m "feat: description"
git push -u origin feature/ma-feature
gh pr create
```

### "Je veux déployer en production"

1. Lis [DEPLOYMENT.md](./DEPLOYMENT.md) - Section "Déploiement Production"
2. Suis le workflow staging → main
3. Vérifie les smoke tests

**Résumé rapide :**
```bash
# 1. Merge develop → staging
gh pr create --base staging --head develop

# 2. Tester en staging
gh workflow run smoke-tests.yml -f environment=staging

# 3. Merge staging → main
gh pr create --base main --head staging

# 4. Auto-déploiement vers production
```

### "Un bug critique en production !"

1. Lis [DEPLOYMENT.md](./DEPLOYMENT.md) - Section "Rollback"
2. Rollback immédiat si nécessaire

**Résumé rapide :**
```bash
# Rollback rapide
railway rollback --environment production

# Ou créer un hotfix
git checkout -b hotfix/fix-critical main
# ... fix ...
gh pr create --base main --title "hotfix: urgent fix"
```

### "Je veux configurer GitHub correctement"

1. Lis [GITHUB_SETUP.md](./GITHUB_SETUP.md)
2. Suis les étapes dans l'ordre

**Checklist :**
- [ ] Branch protection (main/staging/develop)
- [ ] Environments (dev/staging/prod)
- [ ] Secrets configurés
- [ ] Dependabot activé
- [ ] Secret scanning activé

### "Je veux comprendre comment utiliser [outil]"

Lis [TOOLS_GUIDE.md](./TOOLS_GUIDE.md) - Trouve la section de l'outil :

- Git Workflow
- GitHub Actions (CI/CD)
- Dependabot
- Sentry (Error Tracking)
- Code Coverage
- Healthchecks
- Rate Limiting
- Security (Helmet)
- Monitoring

## 🛠️ Outils & Technologies

### Backend
- **NestJS** - Framework Node.js
- **Prisma** - ORM pour PostgreSQL
- **PostgreSQL** - Base de données
- **JWT** - Authentication
- **Helmet** - Security headers
- **Sentry** - Error tracking
- **Throttler** - Rate limiting

### DevOps
- **GitHub Actions** - CI/CD
- **Railway/Render** - Hosting
- **Docker** - Containerization
- **Dependabot** - Dependency updates
- **Codecov** - Code coverage
- **Better Stack** - Uptime monitoring

### Sécurité
- **Helmet.js** - HTTP headers
- **bcrypt** - Password hashing
- **Rate limiting** - Anti-abuse
- **Secret scanning** - GitHub
- **Dependabot** - Security updates

## 📖 Structure de Documentation

```
docs/
├── README.md              ← Tu es ici
├── TOOLS_GUIDE.md         ← Guide d'utilisation des outils (COMMENCE ICI)
├── GIT_WORKFLOW.md        ← Workflow Git quotidien
├── DEPLOYMENT.md          ← Guide de déploiement
└── GITHUB_SETUP.md        ← Configuration GitHub
```

## 🎓 Parcours d'Apprentissage

### Niveau Débutant

1. **Jour 1 :** Lis [TOOLS_GUIDE.md](./TOOLS_GUIDE.md) en entier
2. **Jour 2 :** Pratique le Git Workflow - crée une feature simple
3. **Jour 3 :** Configure GitHub en suivant [GITHUB_SETUP.md](./GITHUB_SETUP.md)
4. **Jour 4 :** Déploie en staging
5. **Jour 5 :** Explore Sentry et monitoring

### Niveau Intermédiaire

1. Configure tous les environments (dev/staging/prod)
2. Mets en place le monitoring (Sentry, Better Stack)
3. Fais un déploiement complet staging → production
4. Pratique un rollback en staging
5. Configure les alertes

### Niveau Avancé

1. Optimise les workflows CI/CD
2. Mets en place des tests E2E complets
3. Configure le cache et performance monitoring
4. Implémente des feature flags
5. Documente et forme l'équipe

## 🔗 Liens Rapides

### Projet
- **Repo GitHub :** https://github.com/ab1530/arcane-foot
- **Projet Board :** https://github.com/ab1530/arcane-foot/projects

### Production (quand configuré)
- **API Production :** https://arcane-api.up.railway.app
- **API Staging :** https://arcane-staging.up.railway.app
- **Health Check :** https://arcane-api.up.railway.app/api/health

### Outils
- **Railway :** https://railway.app
- **Sentry :** https://sentry.io
- **Codecov :** https://codecov.io/gh/ab1530/arcane-foot
- **Better Stack :** https://betterstack.com

## 🆘 Besoin d'Aide ?

### Par Problème

| Problème | Document à Consulter | Section |
|----------|---------------------|---------|
| Comment créer une feature ? | TOOLS_GUIDE.md | Git Workflow |
| Les tests échouent en CI | TOOLS_GUIDE.md | GitHub Actions |
| Comment déployer ? | DEPLOYMENT.md | Déploiement |
| Erreur en production | DEPLOYMENT.md | Troubleshooting |
| Configurer les secrets | GITHUB_SETUP.md | Secrets |
| Comprendre Dependabot | TOOLS_GUIDE.md | Dependabot |
| Voir les erreurs | TOOLS_GUIDE.md | Sentry |
| Rollback nécessaire | DEPLOYMENT.md | Rollback |

### Commandes de Secours

```bash
# Voir le status de tout
git status
gh run list
railway status

# Logs en temps réel
railway logs --tail

# Rollback d'urgence
railway rollback --environment production

# Vérifier la santé de l'API
curl https://arcane-api.up.railway.app/api/health

# Lancer les smoke tests
gh workflow run smoke-tests.yml -f environment=production
```

## 📝 Conventions

### Commits
```
feat: nouvelle fonctionnalité
fix: correction de bug
docs: documentation
chore: maintenance
test: ajout de tests
refactor: refactoring
perf: amélioration performance
ci: modification CI/CD
```

### Branches
```
feature/nom-descriptif
fix/nom-bug
hotfix/nom-urgent
chore/nom-tache
```

### Pull Requests
- Titre : `feat: description courte`
- Description : Utilise le template automatique
- Labels : `feature`, `bug`, `dependencies`, etc.
- Assigné : Toi-même
- Reviewers : Membres de l'équipe

## ✅ Checklist Nouveau Développeur

Quand un nouveau développeur rejoint l'équipe :

- [ ] Lire [TOOLS_GUIDE.md](./TOOLS_GUIDE.md) en entier
- [ ] Lire [GIT_WORKFLOW.md](./GIT_WORKFLOW.md)
- [ ] Clone le repo et setup local
- [ ] Créer sa première feature (simple)
- [ ] Faire sa première PR
- [ ] Comprendre le workflow staging → production
- [ ] Accès Sentry et Railway configurés
- [ ] Accès GitHub avec bonnes permissions

## 🎯 Objectifs de Qualité

### Tests
- **Coverage minimum :** 70%
- **Tests unitaires :** Obligatoires pour toute nouvelle feature
- **Tests E2E :** Pour les flows critiques

### Performance
- **Response time p95 :** < 200ms
- **Error rate :** < 1%
- **Uptime :** > 99.9%

### Sécurité
- **Secrets :** Jamais dans le code
- **Dependencies :** Audit hebdomadaire (Dependabot)
- **Headers :** Score A+ sur securityheaders.com
- **Rate limiting :** Activé partout

### Code Quality
- **Linter :** Pas d'erreurs
- **Format :** Prettier appliqué
- **Conventional Commits :** Respectés
- **PR Reviews :** Minimum 1 reviewer

## 🚦 Status des Environments

### Development (Local)
✅ Configuré
- PostgreSQL via Docker
- Health checks actifs
- Rate limiting actif
- Sentry désactivé (dev)

### Staging
⚠️ À configurer
- [ ] Railway project créé
- [ ] Database Supabase configurée
- [ ] Secrets ajoutés
- [ ] DNS configuré (optionnel)

### Production
⚠️ À configurer
- [ ] Railway project créé
- [ ] Database Supabase configurée
- [ ] Secrets ajoutés
- [ ] DNS configuré
- [ ] Monitoring configuré
- [ ] Alertes configurées

## 📊 Métriques à Suivre

### Développement
- Nombre de PRs ouvertes
- Temps moyen de review
- Coverage du code
- Nombre de bugs par release

### Production
- Uptime
- Response time
- Error rate
- Nombre d'utilisateurs actifs
- CPU/RAM usage

### Sécurité
- Vulnérabilités ouvertes (Dependabot)
- Nombre d'incidents
- Temps de réponse aux incidents

## 🔄 Processus Récurrents

### Quotidien
- Vérifier les PRs Dependabot
- Checker Sentry pour nouvelles erreurs
- Review des PRs de l'équipe

### Hebdomadaire
- Audit npm (automatique via Dependabot)
- Review des metrics production
- Cleanup des branches mergées

### Mensuel
- Review de la documentation
- Update des dépendances majeures
- Analyse des performances
- Retrospective équipe

## 📚 Ressources Externes

### Documentation Officielle
- [NestJS](https://docs.nestjs.com)
- [Prisma](https://www.prisma.io/docs)
- [Railway](https://docs.railway.app)
- [GitHub Actions](https://docs.github.com/en/actions)

### Guides & Tutoriels
- [Conventional Commits](https://www.conventionalcommits.org)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [Semantic Versioning](https://semver.org)
- [The Twelve-Factor App](https://12factor.net)

### Outils de Monitoring
- [Sentry Docs](https://docs.sentry.io)
- [Better Stack Guides](https://betterstack.com/docs)
- [Codecov Docs](https://docs.codecov.com)

---

**Dernière mise à jour :** 2025-10-16

**Maintenu par :** Abdallah Lakhdari (@ab1530)

**Questions ?** Ouvre une issue sur GitHub ou consulte [TOOLS_GUIDE.md](./TOOLS_GUIDE.md)
