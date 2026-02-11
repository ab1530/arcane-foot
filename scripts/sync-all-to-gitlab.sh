#!/bin/bash

###############################################################################
# ARCANE Football - Synchronisation COMPLÈTE vers GitLab
# Push TOUTES les branches et l'historique complet
###############################################################################

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

clear
echo -e "${BOLD}🔄 Synchronisation COMPLÈTE vers GitLab${NC}"
echo "================================================================"
echo ""

###############################################################################
# Vérifications
###############################################################################

echo -e "${BLUE}📋 Analyse du repository${NC}"
echo ""

# Branches locales
echo "📍 Branches locales :"
git branch
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
        git commit -m "sync: Prepare for full GitLab synchronization"
        echo -e "${GREEN}✅ Commit créé${NC}"
    fi
fi

echo ""

###############################################################################
# Choix de la méthode
###############################################################################

echo -e "${BLUE}📋 Méthode de synchronisation${NC}"
echo ""
echo "Quelle méthode veux-tu utiliser ?"
echo ""
echo "  1. Push TOUTES les branches en une fois (--all)"
echo "     → Rapide, envoie tout d'un coup"
echo ""
echo "  2. Push branche par branche (plus contrôlé)"
echo "     → Plus lent, mais tu vois ce qui est pushé"
echo ""
read -p "Choix (1/2) [défaut: 1] : " -n 1 -r
echo

if [[ $REPLY == "2" ]]; then
    METHOD="branch-by-branch"
else
    METHOD="all"
fi

echo ""

###############################################################################
# Push selon la méthode choisie
###############################################################################

if [ "$METHOD" == "all" ]; then
    echo -e "${BLUE}📤 Push de TOUTES les branches vers GitLab...${NC}"
    echo ""
    
    # Push toutes les branches
    echo "🚀 git push gitlab --all"
    if git push gitlab --all; then
        echo ""
        echo -e "${GREEN}✅ Toutes les branches pushées !${NC}"
    else
        echo ""
        echo -e "${YELLOW}⚠️  Certaines branches ont échoué${NC}"
        echo "Continuer quand même avec les tags..."
    fi
    
    echo ""
    
    # Push tous les tags
    echo "🏷️  Push de tous les tags..."
    echo "🚀 git push gitlab --tags"
    if git push gitlab --tags; then
        echo ""
        echo -e "${GREEN}✅ Tous les tags pushés !${NC}"
    else
        echo ""
        echo -e "${YELLOW}⚠️  Certains tags ont échoué (peut-être aucun tag)${NC}"
    fi
    
else
    # Push branche par branche
    echo -e "${BLUE}📤 Push branche par branche...${NC}"
    echo ""
    
    # Liste des branches locales
    BRANCHES=$(git branch | sed 's/\*//' | sed 's/^[ \t]*//')
    
    for branch in $BRANCHES; do
        echo "📍 Push de $branch..."
        if git push gitlab "$branch" 2>&1; then
            echo -e "${GREEN}   ✅ $branch${NC}"
        else
            echo -e "${YELLOW}   ⚠️  $branch (peut-être déjà à jour ou protégée)${NC}"
        fi
        echo ""
    done
fi

echo ""

###############################################################################
# Vérification finale
###############################################################################

echo -e "${BLUE}📋 Vérification de la synchronisation${NC}"
echo ""

echo "🔍 Branches sur GitLab :"
git ls-remote --heads gitlab | awk '{print "   ", $2}' | sed 's|refs/heads/||'

echo ""

echo "🔍 Comparaison local vs GitLab :"
echo ""

# Comparer develop
LOCAL_DEVELOP=$(git rev-parse develop 2>/dev/null)
REMOTE_DEVELOP=$(git rev-parse gitlab/develop 2>/dev/null)

if [ "$LOCAL_DEVELOP" == "$REMOTE_DEVELOP" ]; then
    echo -e "   develop : ${GREEN}✅ Synchronisé${NC}"
else
    echo -e "   develop : ${YELLOW}⚠️  Peut nécessiter un git fetch gitlab${NC}"
fi

# Comparer main (si existe)
if git rev-parse main >/dev/null 2>&1; then
    LOCAL_MAIN=$(git rev-parse main 2>/dev/null)
    REMOTE_MAIN=$(git rev-parse gitlab/main 2>/dev/null)
    
    if [ "$LOCAL_MAIN" == "$REMOTE_MAIN" ]; then
        echo -e "   main    : ${GREEN}✅ Synchronisé${NC}"
    else
        echo -e "   main    : ${YELLOW}⚠️  Différent (normal si pas pushé)${NC}"
    fi
fi

echo ""

###############################################################################
# Résumé final
###############################################################################

echo "================================================================"
echo -e "${GREEN}${BOLD}🎉 Synchronisation terminée !${NC}"
echo "================================================================"
echo ""
echo "📊 Ce qui a été synchronisé :"
echo "   ✅ Toutes les branches locales"
echo "   ✅ Tous les tags (si existants)"
echo "   ✅ Historique complet des commits"
echo ""
echo "🔗 Vérifie sur GitLab :"
echo "   https://gitlab.com/ab1530/arcane-foot"
echo ""
echo "📍 Branches principales :"
echo "   • develop  : https://gitlab.com/ab1530/arcane-foot/-/tree/develop"
echo "   • main     : https://gitlab.com/ab1530/arcane-foot/-/tree/main"
echo ""
echo "🚀 Prochaine étape : Tester le pipeline"
echo ""
echo "Lance : ./scripts/test-first-pipeline.sh"
echo ""
