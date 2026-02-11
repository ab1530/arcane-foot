#!/bin/bash
set -e

###############################################################################
# ARCANE Football - GitLab CI/CD Quick Start
#
# Ce script vous aide à configurer et tester GitLab CI/CD rapidement
###############################################################################

echo "🚀 ARCANE Football - GitLab Quick Start"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

###############################################################################
# Étape 1 : Vérifier les remotes Git
###############################################################################

echo "🔍 Step 1/6: Vérification des remotes Git"
echo ""

if git remote get-url gitlab > /dev/null 2>&1; then
    GITLAB_URL=$(git remote get-url gitlab)
    echo -e "${GREEN}✅ GitLab remote configuré${NC}: $GITLAB_URL"
else
    echo -e "${YELLOW}⚠️  GitLab remote NON configuré${NC}"
    echo ""
    read -p "   Voulez-vous le configurer maintenant ? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "   URL GitLab (ex: git@gitlab.com:user/project.git): " GITLAB_URL
        git remote add gitlab "$GITLAB_URL"
        echo -e "${GREEN}✅ GitLab remote ajouté${NC}"
    else
        echo -e "${RED}❌ GitLab remote requis pour continuer${NC}"
        exit 1
    fi
fi
echo ""

###############################################################################
# Étape 2 : Vérifier le .gitlab-ci.yml
###############################################################################

echo "🔍 Step 2/6: Vérification du .gitlab-ci.yml"
echo ""

if [ -f ".gitlab-ci.yml" ]; then
    echo -e "${GREEN}✅ .gitlab-ci.yml trouvé${NC}"
    
    # Compter les stages
    STAGES_COUNT=$(grep -c "^  - " .gitlab-ci.yml || echo "0")
    echo "   📊 Nombre de stages: $STAGES_COUNT"
    
    # Vérifier la version améliorée
    if [ -f ".gitlab-ci.improved.yml" ]; then
        echo -e "${GREEN}✅ Version améliorée disponible (.gitlab-ci.improved.yml)${NC}"
        echo ""
        read -p "   Voulez-vous utiliser la version améliorée ? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cp .gitlab-ci.yml .gitlab-ci.yml.backup
            cp .gitlab-ci.improved.yml .gitlab-ci.yml
            echo -e "${GREEN}✅ Version améliorée activée (backup créé)${NC}"
        fi
    fi
else
    echo -e "${RED}❌ .gitlab-ci.yml NON trouvé${NC}"
    echo "   Créez ce fichier avant de continuer"
    exit 1
fi
echo ""

###############################################################################
# Étape 3 : Vérifier les scripts de déploiement
###############################################################################

echo "🔍 Step 3/6: Vérification des scripts de déploiement"
echo ""

DEPLOY_DIR="scripts/deploy"

if [ -d "$DEPLOY_DIR" ]; then
    echo -e "${GREEN}✅ Dossier $DEPLOY_DIR trouvé${NC}"
    
    if [ -f "$DEPLOY_DIR/deploy-staging.sh" ]; then
        echo -e "${GREEN}✅ deploy-staging.sh trouvé${NC}"
        chmod +x "$DEPLOY_DIR/deploy-staging.sh"
    else
        echo -e "${YELLOW}⚠️  deploy-staging.sh manquant${NC}"
    fi
    
    if [ -f "$DEPLOY_DIR/deploy-production.sh" ]; then
        echo -e "${GREEN}✅ deploy-production.sh trouvé${NC}"
        chmod +x "$DEPLOY_DIR/deploy-production.sh"
    else
        echo -e "${YELLOW}⚠️  deploy-production.sh manquant${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Dossier $DEPLOY_DIR manquant${NC}"
    echo "   Création du dossier..."
    mkdir -p "$DEPLOY_DIR"
fi
echo ""

###############################################################################
# Étape 4 : Tester la syntaxe du pipeline
###############################################################################

echo "🔍 Step 4/6: Validation de la syntaxe du pipeline"
echo ""

# Vérifier si gitlab-ci-lint est installé
if command -v glab > /dev/null 2>&1; then
    echo "Validation avec glab CLI..."
    glab ci lint .gitlab-ci.yml || echo "⚠️ Validation a échoué (non-bloquant)"
else
    echo -e "${YELLOW}⚠️  glab CLI non installé (optionnel)${NC}"
    echo "   Installez avec: brew install glab (macOS)"
    echo "   Ou validez manuellement sur: https://gitlab.com/-/ci/lint"
fi
echo ""

###############################################################################
# Étape 5 : Préparer le premier test
###############################################################################

echo "🔍 Step 5/6: Préparation du premier test"
echo ""

# Vérifier si on est sur une branche propre
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Modifications non commitées détectées${NC}"
    echo ""
    git status --short
    echo ""
    read -p "   Voulez-vous commiter ces changements pour tester le pipeline ? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .gitlab-ci.yml scripts/
        git commit -m "ci: Setup GitLab CI/CD pipeline for testing"
        echo -e "${GREEN}✅ Changements commitées${NC}"
    else
        echo "   Continuez sans commiter..."
    fi
fi
echo ""

###############################################################################
# Étape 6 : Push vers GitLab
###############################################################################

echo "🚀 Step 6/6: Push vers GitLab et déclenchement du pipeline"
echo ""

CURRENT_BRANCH=$(git branch --show-current)
echo "Branche actuelle: $CURRENT_BRANCH"
echo ""

read -p "Voulez-vous pusher vers GitLab maintenant ? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Pushing to GitLab..."
    git push gitlab "$CURRENT_BRANCH"
    
    echo ""
    echo -e "${GREEN}✅ Push réussi !${NC}"
    echo ""
    echo "📊 Surveillez votre pipeline ici :"
    echo "   https://gitlab.com/ab1530/arcane-foot/-/pipelines"
    echo ""
    echo "💡 Prochaines étapes :"
    echo "   1. Ouvrez GitLab dans votre navigateur"
    echo "   2. Allez dans CI/CD → Pipelines"
    echo "   3. Cliquez sur le pipeline en cours"
    echo "   4. Surveillez chaque job"
    echo ""
else
    echo "   Annulé. Push manuellement avec: git push gitlab $CURRENT_BRANCH"
fi

###############################################################################
# Résumé final
###############################################################################

echo ""
echo "========================================="
echo "✨ Quick Start Terminé !"
echo "========================================="
echo ""
echo "📚 Prochaines étapes recommandées :"
echo ""
echo "1. 🔐 Configurer les variables CI/CD dans GitLab"
echo "   → Settings → CI/CD → Variables"
echo "   → Voir GITLAB_MIGRATION_GUIDE.md (Étape 2)"
echo ""
echo "2. 🐳 Activer le Container Registry"
echo "   → Settings → General → Visibility → Container Registry"
echo ""
echo "3. 🏃 Activer/Installer un GitLab Runner"
echo "   → Settings → CI/CD → Runners"
echo ""
echo "4. 🧪 Tester le premier pipeline"
echo "   → Push vers develop ou créer une MR"
echo ""
echo "📖 Documentation complète : GITLAB_MIGRATION_GUIDE.md"
echo ""
echo "🙋 Besoin d'aide ? Créez une issue sur GitLab"
echo ""
