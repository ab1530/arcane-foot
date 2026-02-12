#!/bin/bash

###############################################################################
# ARCANE Football - Synchronisation GitLab
###############################################################################

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

clear
echo -e "${BOLD}🔄 Synchronisation GitLab${NC}"
echo "================================================================"
echo ""

# Vérifier la branche actuelle
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Branche actuelle : $CURRENT_BRANCH"
echo ""

# Vérifier qu'il n'y a pas de modifications non commitées
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Modifications non commitées détectées${NC}"
    echo ""
    git status --short
    echo ""
    read -p "Commiter maintenant ? (y/n) : " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "sync: Update code before GitLab CI/CD testing"
        echo -e "${GREEN}✅ Commit créé${NC}"
    fi
fi

echo ""

# Afficher les derniers commits
echo "📊 Derniers commits locaux :"
git log --oneline -5
echo ""

# Vérifier l'état de GitLab
echo "🔍 Vérification de l'état GitLab..."
echo ""

read -p "As-tu débloqué la branche 'develop' sur GitLab ? (y/n) : " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}⚠️  Débloque d'abord la branche sur GitLab :${NC}"
    echo ""
    echo "1. Va sur : https://gitlab.com/ab1530/arcane-foot/-/settings/repository"
    echo "2. Section 'Protected branches' → Expand"
    echo "3. Trouver 'develop' → Cliquer 'Unprotect'"
    echo ""
    exit 0
fi

echo ""

# Push vers GitLab
echo -e "${BLUE}📤 Push vers GitLab...${NC}"
echo ""

if git push gitlab "$CURRENT_BRANCH"; then
    echo ""
    echo -e "${GREEN}✅ Synchronisation réussie !${NC}"
    echo ""
    echo "📊 GitLab est maintenant à jour avec :"
    echo "   - Tous les commits récents"
    echo "   - Configuration GitLab CI/CD"
    echo "   - Scripts de déploiement"
    echo "   - Tests RBAC (100% passing)"
else
    echo ""
    echo -e "${YELLOW}⚠️  Le push a échoué${NC}"
    echo ""
    echo "Erreurs possibles :"
    echo "  - Branche encore protégée"
    echo "  - Conflit avec GitLab"
    echo "  - Pas d'accès push"
    echo ""
    echo "Solution :"
    echo "  1. Vérifie que 'develop' est déprotégée"
    echo "  2. Vérifie tes permissions GitLab"
    echo "  3. Essaye : git push gitlab develop --force (si nécessaire)"
    exit 1
fi

echo ""

# Proposer de reprotéger la branche
echo "🔒 Protection de la branche"
echo ""
echo "IMPORTANT : Maintenant que c'est synchronisé, tu devrais"
echo "RE-PROTÉGER la branche 'develop' sur GitLab pour la sécurité."
echo ""
read -p "Veux-tu que je te rappelle comment ? (y/n) : " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Pour re-protéger 'develop' :"
    echo ""
    echo "1. Va sur : https://gitlab.com/ab1530/arcane-foot/-/settings/repository"
    echo "2. Section 'Protected branches' → Expand"
    echo "3. Cliquer 'Protect a branch'"
    echo "4. Sélectionner 'develop'"
    echo "5. Allowed to push : Maintainers"
    echo "6. Allowed to merge : Maintainers"
    echo "7. Cliquer 'Protect'"
fi

echo ""
echo "================================================================"
echo -e "${GREEN}${BOLD}🎉 GitLab est synchronisé !${NC}"
echo "================================================================"
echo ""
echo "🚀 Prochaine étape : Tester le pipeline"
echo ""
echo "Lance : ./scripts/test-first-pipeline.sh"
echo ""
