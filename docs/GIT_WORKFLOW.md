# Git Workflow - Arcane Platform

## Stratégie de Branches

Nous utilisons une stratégie Git Flow adaptée avec 3 branches principales :

```
main (production)
  ├── staging (pré-production)
  └── develop (développement)
      └── feature/* (fonctionnalités)
```

## Branches Principales

### `main` - Production
- **Objectif** : Code stable en production
- **Protection** : Oui (PR obligatoire, reviews, CI passing)
- **Déploiement** : Automatique vers production (Railway/Render)
- **Merge depuis** : `staging` uniquement
- **Tags** : Chaque release est taguée (v1.0.0, v1.1.0, etc.)

### `staging` - Pré-production
- **Objectif** : Tests finaux avant production
- **Protection** : Oui (PR obligatoire, CI passing)
- **Déploiement** : Automatique vers staging environment
- **Merge depuis** : `develop` uniquement
- **Durée de vie** : Permanent

### `develop` - Développement
- **Objectif** : Intégration continue des features
- **Protection** : Oui (PR obligatoire, CI passing)
- **Déploiement** : Optionnel vers dev environment
- **Merge depuis** : `feature/*` branches
- **Durée de vie** : Permanent

### `feature/*` - Fonctionnalités
- **Objectif** : Développement de nouvelles features
- **Naming** : `feature/auth-module`, `feature/player-crud`
- **Créée depuis** : `develop`
- **Merge vers** : `develop` via Pull Request
- **Durée de vie** : Temporaire (supprimée après merge)

### `hotfix/*` - Corrections urgentes
- **Objectif** : Fix urgent en production
- **Naming** : `hotfix/fix-auth-bug`
- **Créée depuis** : `main`
- **Merge vers** : `main` ET `develop`
- **Durée de vie** : Temporaire

## Workflow Quotidien

### 1. Créer une nouvelle feature

```bash
# Partir de develop à jour
git checkout develop
git pull origin develop

# Créer ta branch feature
git checkout -b feature/nom-de-la-feature

# Travailler sur ta feature
git add .
git commit -m "feat: description de la feature"

# Pousser ta branch
git push -u origin feature/nom-de-la-feature
```

### 2. Créer une Pull Request

```bash
# Sur GitHub, créer une PR de feature/nom-de-la-feature vers develop
# Remplir le template de PR
# Attendre la review et les checks CI
```

### 3. Merge dans develop

```bash
# Après approbation, merge via GitHub (Squash and merge recommandé)
# Supprimer la branch feature après merge
git branch -d feature/nom-de-la-feature
```

### 4. Release vers staging

```bash
# Sur develop, créer PR vers staging
git checkout develop
git pull origin develop

# Sur GitHub : Create Pull Request develop → staging
# Titre : "Release v1.1.0 to staging"
# Après tests OK, merge
```

### 5. Release vers production

```bash
# Sur staging, créer PR vers main
git checkout staging
git pull origin staging

# Sur GitHub : Create Pull Request staging → main
# Titre : "Release v1.1.0 to production"
# Après validation finale, merge

# Créer un tag
git checkout main
git pull origin main
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin v1.1.0
```

### 6. Hotfix urgent

```bash
# Partir de main
git checkout main
git pull origin main
git checkout -b hotfix/fix-critical-bug

# Fix le bug
git add .
git commit -m "fix: correction bug critique"
git push -u origin hotfix/fix-critical-bug

# Créer PR vers main (fast-track)
# Après merge, créer PR de main vers develop pour sync
```

## Conventions de Commits

Utiliser [Conventional Commits](https://www.conventionalcommits.org/) :

```
feat: ajout d'une nouvelle fonctionnalité
fix: correction de bug
docs: modification de documentation
style: formatage du code (pas de changement logique)
refactor: refactoring du code
test: ajout ou modification de tests
chore: tâches de maintenance (deps, config)
perf: amélioration de performance
ci: modification des workflows CI/CD
```

**Exemples :**
```bash
git commit -m "feat: add player search endpoint"
git commit -m "fix: resolve JWT token expiration issue"
git commit -m "docs: update API documentation"
git commit -m "test: add unit tests for auth service"
```

## Protection des Branches

### Configuration sur GitHub

**Pour `main` :**
- ✅ Require pull request before merging
- ✅ Require approvals (1 minimum)
- ✅ Require status checks to pass (CI, tests)
- ✅ Require conversation resolution before merging
- ✅ Do not allow bypassing the above settings
- ✅ Require linear history (no merge commits)
- ❌ Allow force pushes (JAMAIS sur main)

**Pour `staging` :**
- ✅ Require pull request before merging
- ✅ Require status checks to pass
- ✅ Require linear history

**Pour `develop` :**
- ✅ Require pull request before merging
- ✅ Require status checks to pass

## Pull Request Template

Utiliser le template automatique dans `.github/PULL_REQUEST_TEMPLATE.md`

## Commandes Utiles

```bash
# Voir toutes les branches
git branch -a

# Supprimer une branch locale
git branch -d feature/nom-branch

# Supprimer une branch remote
git push origin --delete feature/nom-branch

# Mettre à jour develop
git checkout develop
git pull origin develop

# Rebaser ta feature sur develop
git checkout feature/ma-feature
git rebase develop

# Voir l'historique
git log --oneline --graph --all

# Annuler le dernier commit (garder les changements)
git reset --soft HEAD~1

# Stash tes changements temporairement
git stash
git stash pop
```

## CI/CD par Branche

| Branche | CI Tests | CI Build | Deploy | Environnement |
|---------|----------|----------|--------|---------------|
| `feature/*` | ✅ | ✅ | ❌ | - |
| `develop` | ✅ | ✅ | ⚠️ (optionnel) | Dev |
| `staging` | ✅ | ✅ | ✅ Auto | Staging |
| `main` | ✅ | ✅ | ✅ Auto | Production |

## Bonnes Pratiques

1. **Commits atomiques** : 1 commit = 1 changement logique
2. **Messages clairs** : Utiliser conventional commits
3. **PRs petites** : Max 500 lignes changed (plus facile à review)
4. **Tests inclus** : Toujours ajouter des tests avec ta feature
5. **Rebase avant merge** : Garder un historique propre
6. **Review rapide** : Reviewer les PRs dans les 24h
7. **Branch à jour** : Toujours pull avant de créer une branch
8. **Supprimer branches** : Nettoyer après merge

## En cas de problème

### Merge conflict
```bash
# Sur ta feature branch
git checkout feature/ma-feature
git pull origin develop
# Résoudre les conflits manuellement
git add .
git commit -m "chore: resolve merge conflicts"
git push
```

### Commit sur mauvaise branch
```bash
# Annuler le commit (garder changements)
git reset --soft HEAD~1

# Stash les changements
git stash

# Aller sur bonne branch
git checkout bonne-branch

# Récupérer les changements
git stash pop

# Commit sur bonne branch
git commit -m "message"
```

### Besoin de rollback
```bash
# Identifier le commit à rollback
git log --oneline

# Créer un revert commit (safe)
git revert <commit-hash>
git push

# OU via GitHub : Revert button sur le commit
```

## Ressources

- [Git Flow Cheatsheet](https://danielkummer.github.io/git-flow-cheatsheet/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
