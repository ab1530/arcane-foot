#!/bin/bash

###############################################################################
# ARCANE Football - Configuration Interactive du GitLab Runner
# Ce script te guide pas à pas pour configurer ton runner
###############################################################################

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

clear
echo -e "${BOLD}🚀 ARCANE Football - Configuration du Runner GitLab${NC}"
echo "================================================================"
echo ""

###############################################################################
# Étape 1 : Vérifications préalables
###############################################################################

echo -e "${BLUE}📋 Étape 1/5 : Vérifications préalables${NC}"
echo ""

# Vérifier GitLab Runner
if ! command -v gitlab-runner &> /dev/null; then
    echo -e "${RED}❌ GitLab Runner n'est pas installé${NC}"
    echo ""
    echo "Installation avec Homebrew :"
    echo "  brew install gitlab-runner"
    exit 1
fi

echo -e "${GREEN}✅ GitLab Runner installé :${NC} $(gitlab-runner --version | head -1)"

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas installé${NC}"
    echo ""
    echo "Installation : https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo -e "${GREEN}✅ Docker installé :${NC} $(docker --version)"

# Vérifier que Docker tourne
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas démarré${NC}"
    echo ""
    echo "Lance Docker Desktop et réessaye"
    exit 1
fi

echo -e "${GREEN}✅ Docker est démarré${NC}"
echo ""

###############################################################################
# Étape 2 : Récupérer le token GitLab
###############################################################################

echo -e "${BLUE}📋 Étape 2/5 : Token d'enregistrement GitLab${NC}"
echo ""
echo "🔗 Ouvre cette page dans ton navigateur :"
echo -e "${BOLD}   https://gitlab.com/ab1530/arcane-foot/-/settings/ci_cd${NC}"
echo ""
echo "Puis :"
echo "  1. Section 'Runners' → Expand"
echo "  2. Cliquer sur 'New project runner'"
echo "  3. Remplir :"
echo "     - Tags: macos, intel, docker"
echo "     - Description: ARCANE Runner - macOS Intel"
echo "     - [x] Run untagged jobs"
echo "  4. Cliquer 'Create runner'"
echo "  5. COPIER le token (glrt-xxxxxxxxxxxxx)"
echo ""
read -p "Colle ton token GitLab ici : " GITLAB_TOKEN

if [ -z "$GITLAB_TOKEN" ]; then
    echo -e "${RED}❌ Token vide, réessaye${NC}"
    exit 1
fi

if [[ ! $GITLAB_TOKEN =~ ^glrt- ]]; then
    echo -e "${YELLOW}⚠️  Le token ne commence pas par 'glrt-', es-tu sûr ?${NC}"
    read -p "Continuer quand même ? (y/n) : " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${GREEN}✅ Token reçu${NC}"
echo ""

###############################################################################
# Étape 3 : Configuration du Runner
###############################################################################

echo -e "${BLUE}📋 Étape 3/5 : Configuration du Runner${NC}"
echo ""
echo "Je vais maintenant configurer ton runner avec les paramètres optimaux."
echo ""

# Image Docker à utiliser
DOCKER_IMAGE="node:20-bullseye"

echo "🐳 Image Docker par défaut : ${DOCKER_IMAGE}"
echo "   (Node.js 20 sur Debian Bullseye - parfait pour ton projet)"
echo ""

read -p "Utiliser cette image ? (y/n) : " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Autres images populaires :"
    echo "  1. node:20-alpine (plus léger, mais peut avoir des incompatibilités)"
    echo "  2. node:20-bullseye (recommandé)"
    echo "  3. node:18-bullseye (version LTS précédente)"
    echo ""
    read -p "Ton choix (1/2/3) : " -n 1 -r
    echo
    case $REPLY in
        1) DOCKER_IMAGE="node:20-alpine" ;;
        2) DOCKER_IMAGE="node:20-bullseye" ;;
        3) DOCKER_IMAGE="node:18-bullseye" ;;
        *) echo "Choix invalide, j'utilise node:20-bullseye" ;;
    esac
fi

echo -e "${GREEN}✅ Image sélectionnée : ${DOCKER_IMAGE}${NC}"
echo ""

###############################################################################
# Étape 4 : Enregistrement
###############################################################################

echo -e "${BLUE}📋 Étape 4/5 : Enregistrement du Runner${NC}"
echo ""
echo "🚀 Enregistrement en cours..."
echo ""

# Enregistrement avec tous les paramètres
gitlab-runner register \
  --non-interactive \
  --url "https://gitlab.com" \
  --token "$GITLAB_TOKEN" \
  --executor "docker" \
  --docker-image "$DOCKER_IMAGE" \
  --description "ARCANE Runner - macOS Intel" \
  --tag-list "macos,intel,docker" \
  --run-untagged="true" \
  --locked="false" \
  --access-level="not_protected" \
  --docker-privileged="true" \
  --docker-volumes "/var/run/docker.sock:/var/run/docker.sock" \
  --docker-volumes "/cache"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Runner enregistré avec succès !${NC}"
else
    echo ""
    echo -e "${RED}❌ Erreur lors de l'enregistrement${NC}"
    exit 1
fi

echo ""

###############################################################################
# Étape 5 : Démarrage du Runner
###############################################################################

echo -e "${BLUE}📋 Étape 5/5 : Démarrage du Runner${NC}"
echo ""

# Démarrer le runner
echo "🚀 Démarrage du runner..."
gitlab-runner start

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Runner démarré !${NC}"
else
    echo -e "${YELLOW}⚠️  Le runner est peut-être déjà démarré${NC}"
fi

echo ""

# Vérifier le statut
echo "🔍 Vérification du statut..."
gitlab-runner list

echo ""
echo "================================================================"
echo -e "${GREEN}${BOLD}🎉 Configuration terminée !${NC}"
echo "================================================================"
echo ""
echo "📊 Résumé :"
echo "   - Runner enregistré sur GitLab"
echo "   - Image Docker : $DOCKER_IMAGE"
echo "   - Tags : macos, intel, docker"
echo "   - Status : Démarré"
echo ""
echo "🔗 Vérifie sur GitLab :"
echo "   https://gitlab.com/ab1530/arcane-foot/-/settings/ci_cd"
echo "   Section 'Runners' → Tu devrais voir ton runner en ligne"
echo ""
echo "🚀 Prochaine étape :"
echo "   1. Configurer les variables d'environnement"
echo "   2. Tester le pipeline"
echo ""
echo "📖 Guide complet : ENVIRONMENTS_SETUP_GUIDE.md"
echo ""
