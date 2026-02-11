#!/bin/bash

###############################################################################
# ARCANE Football - Configuration du Runner (Version Corrigée)
###############################################################################

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

clear
echo -e "${BOLD}🚀 ARCANE Football - Configuration du Runner GitLab${NC}"
echo "================================================================"
echo ""

###############################################################################
# Vérifications
###############################################################################

echo -e "${BLUE}📋 Vérifications préalables${NC}"
echo ""

if ! command -v gitlab-runner &> /dev/null; then
    echo -e "${RED}❌ GitLab Runner non installé${NC}"
    exit 1
fi

echo -e "${GREEN}✅ GitLab Runner :${NC} $(gitlab-runner --version | head -1)"

if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas démarré${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker est démarré${NC}"
echo ""

###############################################################################
# Récupérer le token
###############################################################################

echo -e "${BLUE}📋 Token d'enregistrement GitLab${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT : Configure d'ABORD les paramètres sur GitLab${NC}"
echo ""
echo "🔗 Va sur cette page :"
echo -e "${BOLD}   https://gitlab.com/ab1530/arcane-foot/-/settings/ci_cd${NC}"
echo ""
echo "Puis :"
echo "  1. Section 'Runners' → Expand → 'New project runner'"
echo ""
echo "  2. Configure ces paramètres :"
echo "     ┌─────────────────────────────────────────┐"
echo "     │ Operating systems: macOS                │"
echo "     │ Tags: macos, intel, docker              │"
echo "     │ [x] Run untagged jobs                   │"
echo "     │ Description: ARCANE Runner macOS Intel  │"
echo "     └─────────────────────────────────────────┘"
echo ""
echo "  3. Cliquer 'Create runner'"
echo ""
echo "  4. GitLab va te donner un TOKEN (glrt-xxxxx)"
echo ""
read -p "Colle ton token ici : " GITLAB_TOKEN

if [ -z "$GITLAB_TOKEN" ]; then
    echo -e "${RED}❌ Token vide${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Token reçu${NC}"
echo ""

###############################################################################
# Choix de l'image Docker
###############################################################################

echo -e "${BLUE}📋 Configuration Docker${NC}"
echo ""
echo "Quelle image Docker veux-tu utiliser ?"
echo ""
echo "  1. node:20-bullseye (Recommandé - Stable, compatible)"
echo "  2. node:20-alpine (Léger, mais peut avoir des problèmes)"
echo "  3. node:18-bullseye (LTS précédente)"
echo ""
read -p "Choix (1/2/3) [défaut: 1] : " -n 1 -r
echo

case $REPLY in
    2) DOCKER_IMAGE="node:20-alpine" ;;
    3) DOCKER_IMAGE="node:18-bullseye" ;;
    *) DOCKER_IMAGE="node:20-bullseye" ;;
esac

echo -e "${GREEN}✅ Image : ${DOCKER_IMAGE}${NC}"
echo ""

###############################################################################
# Enregistrement (SIMPLIFIÉ pour nouveaux tokens)
###############################################################################

echo -e "${BLUE}📋 Enregistrement du Runner${NC}"
echo ""
echo "🚀 Enregistrement en cours..."
echo ""

# NOUVEAU : Seulement les options autorisées
gitlab-runner register \
  --non-interactive \
  --url "https://gitlab.com" \
  --token "$GITLAB_TOKEN" \
  --executor "docker" \
  --docker-image "$DOCKER_IMAGE" \
  --description "ARCANE Runner - macOS Intel" \
  --docker-privileged="true" \
  --docker-volumes "/var/run/docker.sock:/var/run/docker.sock" \
  --docker-volumes "/cache"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Runner enregistré avec succès !${NC}"
else
    echo ""
    echo -e "${RED}❌ Erreur lors de l'enregistrement${NC}"
    echo ""
    echo "Erreurs possibles :"
    echo "  - Token invalide ou expiré"
    echo "  - Runner déjà enregistré"
    echo "  - Problème de connexion à GitLab"
    exit 1
fi

echo ""

###############################################################################
# Démarrage
###############################################################################

echo -e "${BLUE}📋 Démarrage du Runner${NC}"
echo ""

gitlab-runner start

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Runner démarré !${NC}"
else
    echo -e "${YELLOW}⚠️  Le runner est peut-être déjà démarré${NC}"
fi

echo ""

###############################################################################
# Vérification
###############################################################################

echo "🔍 Statut des runners..."
gitlab-runner list

echo ""
echo "================================================================"
echo -e "${GREEN}${BOLD}🎉 Configuration terminée !${NC}"
echo "================================================================"
echo ""
echo "📊 Ce qui a été configuré :"
echo "   ✅ Runner enregistré sur GitLab"
echo "   ✅ Image Docker : $DOCKER_IMAGE"
echo "   ✅ Docker privileged mode (pour build d'images)"
echo "   ✅ Volumes : /var/run/docker.sock, /cache"
echo "   ✅ Runner démarré"
echo ""
echo "🔗 Vérifie sur GitLab :"
echo "   https://gitlab.com/ab1530/arcane-foot/-/settings/ci_cd"
echo ""
echo "   Tu devrais voir un point vert 🟢 à côté de ton runner"
echo ""
echo "🚀 Prochaines étapes :"
echo "   1. Configurer les variables d'environnement (ÉTAPE CRITIQUE)"
echo "   2. Tester le pipeline avec une branche de test"
echo ""
echo "📖 Guide : ENVIRONMENTS_SETUP_GUIDE.md"
echo ""

# Conseils supplémentaires
echo -e "${YELLOW}💡 Commandes utiles :${NC}"
echo "   • Voir les logs : gitlab-runner --debug run"
echo "   • Arrêter : gitlab-runner stop"
echo "   • Redémarrer : gitlab-runner restart"
echo "   • Liste : gitlab-runner list"
echo ""
