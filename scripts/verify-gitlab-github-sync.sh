#!/bin/bash

###############################################################################
# ARCANE Football - Vérification GitLab vs GitHub
# Compare l'état exact entre les deux remotes
###############################################################################

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

clear
echo -e "${BOLD}🔍 Audit GitLab vs GitHub${NC}"
echo "================================================================"
echo ""

###############################################################################
# Fetch des deux remotes
###############################################################################

echo -e "${BLUE}📥 Récupération des données des remotes...${NC}"
echo ""

echo "Fetching GitHub (origin)..."
git fetch origin --quiet
echo -e "${GREEN}✅ GitHub à jour${NC}"

echo "Fetching GitLab (gitlab)..."
git fetch gitlab --quiet
echo -e "${GREEN}✅ GitLab à jour${NC}"

echo ""

###############################################################################
# Comparaison des branches principales
###############################################################################

echo "================================================================"
echo -e "${BOLD}📊 COMPARAISON DES BRANCHES${NC}"
echo "================================================================"
echo ""

function compare_branch() {
    local branch=$1
    
    # Vérifier si la branche existe sur les deux remotes
    local github_exists=$(git rev-parse --verify origin/$branch 2>/dev/null)
    local gitlab_exists=$(git rev-parse --verify gitlab/$branch 2>/dev/null)
    
    if [ -z "$github_exists" ]; then
        echo -e "   ${YELLOW}⚠️  $branch n'existe pas sur GitHub${NC}"
        return
    fi
    
    if [ -z "$gitlab_exists" ]; then
        echo -e "   ${RED}❌ $branch n'existe pas sur GitLab${NC}"
        return
    fi
    
    # Comparer les commits
    local github_commit=$(git rev-parse origin/$branch)
    local gitlab_commit=$(git rev-parse gitlab/$branch)
    
    if [ "$github_commit" == "$gitlab_commit" ]; then
        echo -e "   ${GREEN}✅ $branch : Identique${NC}"
        echo "      Commit: ${github_commit:0:8}"
    else
        echo -e "   ${RED}❌ $branch : DIFFÉRENT${NC}"
        echo "      GitHub : ${github_commit:0:8}"
        echo "      GitLab : ${gitlab_commit:0:8}"
        
        # Voir combien de commits de différence
        local commits_ahead=$(git rev-list --count gitlab/$branch..origin/$branch)
        local commits_behind=$(git rev-list --count origin/$branch..gitlab/$branch)
        
        if [ $commits_ahead -gt 0 ]; then
            echo -e "      ${YELLOW}→ GitHub a $commits_ahead commit(s) de plus${NC}"
        fi
        if [ $commits_behind -gt 0 ]; then
            echo -e "      ${YELLOW}→ GitLab a $commits_behind commit(s) de plus${NC}"
        fi
    fi
    echo ""
}

# Comparer les branches principales
echo "Branches principales :"
echo ""
compare_branch "develop"
compare_branch "main"
compare_branch "staging"

###############################################################################
# Liste de toutes les branches
###############################################################################

echo "================================================================"
echo -e "${BOLD}📋 TOUTES LES BRANCHES${NC}"
echo "================================================================"
echo ""

echo "Sur GitHub (origin) :"
git branch -r | grep "origin/" | grep -v "HEAD" | sed 's/origin\///' | sed 's/^/   /'
echo ""

echo "Sur GitLab (gitlab) :"
git branch -r | grep "gitlab/" | grep -v "HEAD" | sed 's/gitlab\///' | sed 's/^/   /'
echo ""

###############################################################################
# Comparaison des fichiers (sur develop)
###############################################################################

echo "================================================================"
echo -e "${BOLD}📁 COMPARAISON DES FICHIERS (develop)${NC}"
echo "================================================================"
echo ""

# Checkout temporaire pour comparer
CURRENT_BRANCH=$(git branch --show-current)

echo "Comparaison des fichiers entre origin/develop et gitlab/develop..."
echo ""

# Lister les différences de fichiers
DIFF_FILES=$(git diff --name-only origin/develop gitlab/develop 2>/dev/null)

if [ -z "$DIFF_FILES" ]; then
    echo -e "${GREEN}✅ Tous les fichiers sont identiques !${NC}"
else
    echo -e "${YELLOW}⚠️  Différences détectées dans ces fichiers :${NC}"
    echo ""
    echo "$DIFF_FILES" | while read file; do
        echo "   - $file"
    done
fi

echo ""

###############################################################################
# Statistiques globales
###############################################################################

echo "================================================================"
echo -e "${BOLD}📊 STATISTIQUES${NC}"
echo "================================================================"
echo ""

# Nombre de commits sur chaque remote (develop)
GITHUB_COMMITS=$(git rev-list --count origin/develop 2>/dev/null || echo "0")
GITLAB_COMMITS=$(git rev-list --count gitlab/develop 2>/dev/null || echo "0")

echo "Nombre de commits sur develop :"
echo "   GitHub : $GITHUB_COMMITS commits"
echo "   GitLab : $GITLAB_COMMITS commits"

if [ "$GITHUB_COMMITS" == "$GITLAB_COMMITS" ]; then
    echo -e "   ${GREEN}✅ Même nombre de commits${NC}"
else
    DIFF=$((GITHUB_COMMITS - GITLAB_COMMITS))
    if [ $DIFF -gt 0 ]; then
        echo -e "   ${YELLOW}⚠️  GitHub a $DIFF commit(s) de plus${NC}"
    else
        DIFF=$((-DIFF))
        echo -e "   ${YELLOW}⚠️  GitLab a $DIFF commit(s) de plus${NC}"
    fi
fi

echo ""

###############################################################################
# Résumé et actions recommandées
###############################################################################

echo "================================================================"
echo -e "${BOLD}🎯 RÉSUMÉ ET ACTIONS${NC}"
echo "================================================================"
echo ""

# Vérifier si tout est synchronisé
GITHUB_DEVELOP=$(git rev-parse origin/develop 2>/dev/null)
GITLAB_DEVELOP=$(git rev-parse gitlab/develop 2>/dev/null)
GITHUB_MAIN=$(git rev-parse origin/main 2>/dev/null)
GITLAB_MAIN=$(git rev-parse gitlab/main 2>/dev/null)

ALL_SYNCED=true

if [ "$GITHUB_DEVELOP" != "$GITLAB_DEVELOP" ]; then
    ALL_SYNCED=false
fi

if [ "$GITHUB_MAIN" != "$GITLAB_MAIN" ]; then
    ALL_SYNCED=false
fi

if [ "$ALL_SYNCED" = true ]; then
    echo -e "${GREEN}${BOLD}🎉 PARFAIT ! GitLab et GitHub sont 100% synchronisés !${NC}"
    echo ""
    echo "✅ develop : Identique"
    echo "✅ main    : Identique"
    echo ""
    echo "🚀 Tu peux maintenant tester le pipeline en toute confiance !"
    echo ""
    echo "Lance : ./scripts/test-first-pipeline.sh"
else
    echo -e "${YELLOW}${BOLD}⚠️  GitLab et GitHub ne sont PAS identiques${NC}"
    echo ""
    echo "Actions recommandées :"
    echo ""
    
    if [ "$GITHUB_DEVELOP" != "$GITLAB_DEVELOP" ]; then
        echo "📌 develop est différent :"
        echo "   Synchroniser : git push gitlab develop --force"
        echo ""
    fi
    
    if [ "$GITHUB_MAIN" != "$GITLAB_MAIN" ]; then
        echo "📌 main est différent :"
        echo "   Synchroniser : git push gitlab main --force"
        echo ""
    fi
    
    echo "Ou synchroniser tout :"
    echo "   git push gitlab --all --force"
    echo ""
    echo -e "${RED}⚠️  ATTENTION : --force écrase l'historique GitLab${NC}"
    echo "   Utilise seulement si tu es sûr !"
fi

echo ""
echo "================================================================"
echo ""
