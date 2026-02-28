# Scripts Utilitaires

Ce dossier contient des scripts utilitaires pour le projet AppFoot.

## Scripts Supabase Migration (sans casse)

Nouveau dossier: `/Users/lakhdari/Desktop/AppFoot/scripts/supabase`

Scripts disponibles:
- `01_export_old_db.sh` - export DB source (`pg_dump`)
- `02_apply_schema_new_db.sh` - applique migrations Prisma sur la nouvelle DB
- `03_restore_new_db.sh` - restore dump vers la nouvelle DB
- `04_compare_counts.sh` - compare volumétrie old/new sur tables critiques
- `05_apply_policies_new_db.sh` - applique `supabase/policies.sql` + `supabase/storage_policies.sql`
- `06_deploy_edge_functions.sh` - déploie `health`, `passport`, `shortlist`
- `07_vercel_env_checklist.sh` - imprime les variables/secrets à poser dans Vercel
- `sync_storage.py` - synchronise Storage old -> new (`--dry-run` par défaut)

Guide détaillé:
- `/Users/lakhdari/Desktop/AppFoot/scripts/supabase/README.md`

## Scripts de Logging CI/CD

### analyze-ci-logs.sh

Analyse les logs d'un pipeline GitLab CI téléchargé.

**Usage:**
```bash
./scripts/analyze-ci-logs.sh <log-directory>
```

**Exemple:**
```bash
# Analyser les logs d'un pipeline téléchargé
./scripts/analyze-ci-logs.sh aggregated_logs

# Analyser les logs d'un pipeline spécifique
./scripts/analyze-ci-logs.sh pipeline-logs-123456
```

**Fonctionnalités:**
- Résumé global du pipeline
- Analyse des erreurs et warnings
- Métriques de performance
- Résultats des tests
- Top des erreurs fréquentes
- Tailles des fichiers de log
- Génération de rapport JSON

### download-gitlab-logs.sh

Télécharge automatiquement les logs d'un pipeline GitLab via l'API.

**Prérequis:**
- Token d'accès GitLab
- ID du projet GitLab
- `curl` et `jq` installés

**Configuration:**

Via variables d'environnement:
```bash
export GITLAB_PROJECT_ID="your-project-id"
export GITLAB_TOKEN="glpat-xxxxxxxxxxxx"
export GITLAB_URL="https://gitlab.com"  # Optionnel
```

Ou créer un fichier `.env.gitlab`:
```bash
GITLAB_PROJECT_ID=12345
GITLAB_TOKEN=glpat-xxxxxxxxxxxx
GITLAB_URL=https://gitlab.com
```

**Usage:**
```bash
# Avec variables d'environnement
export GITLAB_PROJECT_ID=12345
export GITLAB_TOKEN=glpat-xxxx
./scripts/download-gitlab-logs.sh 123456

# Avec options en ligne de commande
./scripts/download-gitlab-logs.sh 123456 -p 12345 -t glpat-xxxx

# Avec répertoire de sortie personnalisé
./scripts/download-gitlab-logs.sh 123456 -o my-logs

# Afficher l'aide
./scripts/download-gitlab-logs.sh --help
```

**Ce que le script télécharge:**
- Logs de tous les jobs du pipeline
- Artifacts du job `aggregate_logs` (si disponible)
- Génère un résumé du pipeline

## Workflow Complet

### 1. Télécharger les logs d'un pipeline

```bash
# Configurer les variables
export GITLAB_PROJECT_ID=12345
export GITLAB_TOKEN=glpat-xxxxxxxxxxxx

# Télécharger les logs du pipeline 123456
./scripts/download-gitlab-logs.sh 123456
```

### 2. Analyser les logs

```bash
# Le script de téléchargement crée un dossier pipeline-logs-123456
cd pipeline-logs-123456

# Analyser les logs
../scripts/analyze-ci-logs.sh .
```

### 3. Consulter les rapports

```bash
# Voir le résumé du pipeline
cat download_summary.md

# Voir le rapport d'analyse
cat analysis_report.json

# Voir les logs d'un job spécifique
cat build_backend_*.log

# Voir les rapports de tests
cat aggregated_logs/qa_report.md
```

## Installation des Dépendances

### macOS
```bash
# jq pour parser le JSON
brew install jq

# curl est préinstallé
```

### Linux (Debian/Ubuntu)
```bash
sudo apt-get update
sudo apt-get install -y curl jq
```

### Linux (RHEL/CentOS)
```bash
sudo yum install -y curl jq
```

## Obtenir un Token GitLab

1. Aller sur GitLab
2. User Settings > Access Tokens
3. Créer un nouveau token avec les scopes:
   - `read_api`
   - `read_repository`
4. Copier le token (commence par `glpat-`)

## Obtenir l'ID du Projet

### Méthode 1: Via l'interface GitLab
1. Aller sur la page du projet
2. L'ID est affiché sous le nom du projet

### Méthode 2: Via l'API
```bash
curl -H "PRIVATE-TOKEN: glpat-xxxx" \
  "https://gitlab.com/api/v4/projects?search=AppFoot" | jq '.[].id'
```

## Exemples d'Utilisation

### Exemple 1: Debug d'un pipeline qui a échoué

```bash
# 1. Télécharger les logs
./scripts/download-gitlab-logs.sh 123456

# 2. Analyser
./scripts/analyze-ci-logs.sh pipeline-logs-123456

# 3. Chercher les erreurs
cd pipeline-logs-123456
grep -r "ERROR" .

# 4. Voir les logs du job qui a échoué
cat unit_test_backend_*.log
```

### Exemple 2: Analyse de performance

```bash
# Télécharger et analyser
./scripts/download-gitlab-logs.sh 123456
./scripts/analyze-ci-logs.sh pipeline-logs-123456

# Voir les temps d'exécution
grep "started at\|finished at" pipeline-logs-123456/*.log

# Analyser les requêtes lentes
grep -i "slow" pipeline-logs-123456/*.log
```

### Exemple 3: Comparer deux pipelines

```bash
# Télécharger deux pipelines
./scripts/download-gitlab-logs.sh 123456 -o pipeline-old
./scripts/download-gitlab-logs.sh 123457 -o pipeline-new

# Analyser les deux
./scripts/analyze-ci-logs.sh pipeline-old
./scripts/analyze-ci-logs.sh pipeline-new

# Comparer les rapports JSON
diff pipeline-old/analysis_report.json pipeline-new/analysis_report.json
```

## Automatisation

### Script pour télécharger automatiquement le dernier pipeline

```bash
#!/bin/bash

# get-latest-pipeline-logs.sh
LATEST_PIPELINE=$(curl -s -H "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/$GITLAB_PROJECT_ID/pipelines" | \
  jq -r '.[0].id')

echo "Latest pipeline: $LATEST_PIPELINE"
./scripts/download-gitlab-logs.sh "$LATEST_PIPELINE"
./scripts/analyze-ci-logs.sh "pipeline-logs-$LATEST_PIPELINE"
```

### Cron job pour surveiller les pipelines

```bash
# Ajouter à crontab -e
# Télécharger les logs toutes les heures
0 * * * * cd /path/to/AppFoot && ./scripts/get-latest-pipeline-logs.sh
```

## Dépannage

### Erreur: "Pipeline not found"
- Vérifier que le pipeline ID est correct
- Vérifier que le token a les permissions nécessaires
- Vérifier que le projet ID est correct

### Erreur: "jq: command not found"
```bash
# macOS
brew install jq

# Linux
sudo apt-get install jq
```

### Les artifacts ne se téléchargent pas
- Vérifier que le job `aggregate_logs` a bien été exécuté
- Vérifier que les artifacts n'ont pas expiré
- Vérifier les permissions du token

### Timeout lors du téléchargement
- Augmenter le timeout dans le script
- Vérifier la connexion réseau
- Télécharger les artifacts manuellement depuis GitLab

## Scripts QA Scout L7

### `qa/scout-l7-set-flags.sh`

Met à jour automatiquement les flags L7 dans:
- `backend/.env.local` (`VOICE_CERTIFIED_GUARD_ENABLED`)
- `mobile/.env.local` (`EXPO_PUBLIC_SCOUT_NEW_FLOW_ENABLED`, `EXPO_PUBLIC_SCOUT_PROFILE_SCREEN_ENABLED`)

Usage:
```bash
VOICE_GUARD=true SCOUT_NEW_FLOW=true SCOUT_PROFILE_SCREEN=true ./scripts/qa/scout-l7-set-flags.sh
```

### `qa/scout-l7-smoke.sh`

Exécute les suites de tests ciblées L7 (backend + mobile), et optionnellement un smoke API du guard voice.

Usage basique:
```bash
./scripts/qa/scout-l7-smoke.sh
```

Usage avec smoke API:
```bash
RUN_API_SMOKE=1 \
API_BASE_URL=http://localhost:3000/api \
SCOUT_CERTIFIED_EMAIL="<email>" \
SCOUT_UNCERTIFIED_EMAIL="<email>" \
SCOUT_PASSWORD="<password>" \
./scripts/qa/scout-l7-smoke.sh
```

## Support

Pour toute question ou problème:
1. Consulter la documentation dans `docs/CI-LOGGING.md`
2. Vérifier les logs d'erreur du script
3. Contacter l'équipe DevOps

## Contribution

Pour ajouter de nouveaux scripts:
1. Créer le script dans `scripts/`
2. Le rendre exécutable: `chmod +x scripts/mon-script.sh`
3. Documenter dans ce README
4. Ajouter des exemples d'utilisation

---

**Dernière mise à jour:** 2025-11-07
