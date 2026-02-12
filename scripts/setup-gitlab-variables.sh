#!/bin/bash

###############################################################################
# ARCANE Football - Configuration des Variables GitLab
# Guide interactif pour configurer les variables CI/CD
###############################################################################

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

clear
echo -e "${BOLD}🔐 Configuration des Variables GitLab CI/CD${NC}"
echo "================================================================"
echo ""

echo "On va configurer les variables MINIMALES pour faire tourner"
echo "ton premier pipeline de test."
echo ""
echo "📍 Tu dois être sur cette page GitLab :"
echo -e "${BLUE}   https://gitlab.com/ab1530/arcane-foot/-/settings/ci_cd${NC}"
echo ""
echo "Section : ${BOLD}Variables${NC} → Cliquer sur ${BOLD}Expand${NC}"
echo ""

read -p "Es-tu sur cette page ? (y/n) : " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Ouvre cette page et reviens !"
    exit 0
fi

echo ""
echo "================================================================"
echo -e "${BLUE}📝 VARIABLES À CONFIGURER (Minimum Vital)${NC}"
echo "================================================================"
echo ""

echo "Pour CHAQUE variable :"
echo "  1. Cliquer sur 'Add variable'"
echo "  2. Copier-coller Key + Value"
echo "  3. Options :"
echo "     - Type : Variable"
echo "     - Flags : Ne rien cocher pour l'instant (on protègera après)"
echo "  4. Cliquer 'Add variable'"
echo ""
echo "---"
echo ""

echo -e "${BOLD}🗄️  VARIABLES DATABASE (Priorité 1)${NC}"
echo ""
echo "┌─────────────────────────────────────────────────────────┐"
echo "│ Key   : DATABASE_URL                                    │"
echo "│ Value : postgresql://postgres:postgres@localhost:5432/  │"
echo "│         arcane_test?schema=public                       │"
echo "│                                                         │"
echo "│ ⚠️  NOTE : Pour les tests CI, on utilise postgres      │"
echo "│          service. Cette URL est pour les tests.        │"
echo "└─────────────────────────────────────────────────────────┘"
echo ""
read -p "DATABASE_URL configurée ? (y/n) : " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}✅ DATABASE_URL${NC}"
else
    echo -e "${YELLOW}⏭️  Skipped${NC}"
fi

echo ""
echo "---"
echo ""

echo -e "${BOLD}🔑 VARIABLES JWT (Priorité 1)${NC}"
echo ""
echo "┌─────────────────────────────────────────────────────────┐"
echo "│ Key   : JWT_SECRET                                      │"
echo "│ Value : test-secret-key-for-ci-pipelines-change-later  │"
echo "│                                                         │"
echo "│ ⚠️  NOTE : Utilise un vrai secret en production!       │"
echo "└─────────────────────────────────────────────────────────┘"
echo ""
read -p "JWT_SECRET configuré ? (y/n) : " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}✅ JWT_SECRET${NC}"
fi

echo ""
echo "┌─────────────────────────────────────────────────────────┐"
echo "│ Key   : JWT_EXPIRES_IN                                  │"
echo "│ Value : 7d                                              │"
echo "└─────────────────────────────────────────────────────────┘"
echo ""
read -p "JWT_EXPIRES_IN configuré ? (y/n) : " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}✅ JWT_EXPIRES_IN${NC}"
fi

echo ""
echo "---"
echo ""

echo -e "${BOLD}☁️  VARIABLES SUPABASE (Priorité 2)${NC}"
echo ""
echo "┌─────────────────────────────────────────────────────────┐"
echo "│ Key   : SUPABASE_URL                                    │"
echo "│ Value : http://localhost:9999                           │"
echo "│                                                         │"
echo "│ ⚠️  Pour les tests CI seulement. Change avec ta vraie  │"
echo "│     URL Supabase après.                                │"
echo "└─────────────────────────────────────────────────────────┘"
echo ""
read -p "SUPABASE_URL configuré ? (y/n) : " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}✅ SUPABASE_URL${NC}"
fi

echo ""
echo "┌─────────────────────────────────────────────────────────┐"
echo "│ Key   : SUPABASE_SERVICE_KEY                            │"
echo "│ Value : test-service-key-for-ci                         │"
echo "└─────────────────────────────────────────────────────────┘"
echo ""
read -p "SUPABASE_SERVICE_KEY configuré ? (y/n) : " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}✅ SUPABASE_SERVICE_KEY${NC}"
fi

echo ""
echo "┌─────────────────────────────────────────────────────────┐"
echo "│ Key   : SUPABASE_STORAGE_BUCKET                         │"
echo "│ Value : arcane-media                                    │"
echo "└─────────────────────────────────────────────────────────┘"
echo ""
read -p "SUPABASE_STORAGE_BUCKET configuré ? (y/n) : " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}✅ SUPABASE_STORAGE_BUCKET${NC}"
fi

echo ""
echo "---"
echo ""

echo -e "${BOLD}🤖 VARIABLE OPENAI (Priorité 2)${NC}"
echo ""
echo "┌─────────────────────────────────────────────────────────┐"
echo "│ Key   : OPENAI_API_KEY                                  │"
echo "│ Value : sk-dummy-key-for-testing-only                   │"
echo "│                                                         │"
echo "│ ⚠️  Clé factice pour les tests. Change avec ta vraie   │"
echo "│     clé OpenAI après.                                   │"
echo "└─────────────────────────────────────────────────────────┘"
echo ""
read -p "OPENAI_API_KEY configuré ? (y/n) : " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}✅ OPENAI_API_KEY${NC}"
fi

echo ""
echo "---"
echo ""

echo -e "${BOLD}🔧 VARIABLES OPTIONNELLES (Peut attendre)${NC}"
echo ""
echo "Ces variables sont utilisées mais ont des valeurs par défaut :"
echo ""
echo "  • NODE_ENV (défaut: test dans CI)"
echo "  • SENTRY_DSN (optionnel pour l'instant)"
echo "  • STRIPE_SECRET_KEY (optionnel pour tests)"
echo "  • FIREBASE_* (optionnel pour tests)"
echo ""

echo "================================================================"
echo -e "${GREEN}${BOLD}✅ Configuration minimale terminée !${NC}"
echo "================================================================"
echo ""
echo "📊 Tu as configuré le minimum pour :"
echo "   ✅ Build backend (compile)"
echo "   ✅ Tests unitaires (avec database)"
echo "   ✅ Tests E2E (basiques)"
echo ""
echo "🚀 Prochaine étape : TESTER LE PIPELINE !"
echo ""
echo "Lance : ./scripts/test-first-pipeline.sh"
echo ""
