#!/bin/bash

###############################################################################
# ARCANE Football - Test du Premier Pipeline GitLab
# Guide interactif pour déclencher et surveiller ton premier pipeline
###############################################################################

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

clear
echo -e "${BOLD}🧪 Test du Premier Pipeline GitLab${NC}"
echo "================================================================"
echo ""

###############################################################################
# Vérifications
###############################################################################

echo -e "${BLUE}📋 Vérifications préalables${NC}"
echo ""

# Vérifier qu'on est dans le bon répertoire
if [ ! -f ".gitlab-ci.yml" ]; then
    echo -e "${YELLOW}⚠️  .gitlab-ci.yml non trouvé${NC}"
    echo "Es-tu dans le bon répertoire ?"
    read -p "Continuer quand même ? (y/n) : " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# Vérifier qu'on est sur une branche propre
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Tu as des modifications non commitées${NC}"
    echo ""
    git status --short
    echo ""
    read -p "Veux-tu les commiter maintenant ? (y/n) : " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "ci: Setup GitLab CI/CD for testing"
        echo -e "${GREEN}✅ Changements commitées${NC}"
    fi
fi

echo ""

###############################################################################
# Choix de la stratégie de test
###############################################################################

echo -e "${BLUE}📋 Stratégie de Test${NC}"
echo ""
echo "Quelle approche veux-tu utiliser ?"
echo ""
echo "  1. Branche de test (Recommandé - Safe)"
echo "     → Crée une branche test/gitlab-ci"
echo "     → Push vers GitLab"
echo "     → Surveille le pipeline"
echo ""
echo "  2. Push direct sur develop (Plus rapide mais risqué)"
echo "     → Push directement vers develop"
echo "     → Déclenche le pipeline complet"
echo ""
read -p "Choix (1/2) [défaut: 1] : " -n 1 -r
echo

if [[ $REPLY == "2" ]]; then
    STRATEGY="direct"
    BRANCH="develop"
else
    STRATEGY="test-branch"
    BRANCH="test/gitlab-ci-first-run"
fi

echo ""

###############################################################################
# Option 1 : Branche de test
###############################################################################

if [ "$STRATEGY" == "test-branch" ]; then
    echo -e "${BLUE}📋 Création de la branche de test${NC}"
    echo ""
    
    # Vérifier si la branche existe déjà
    if git rev-parse --verify "$BRANCH" >/dev/null 2>&1; then
        echo "La branche $BRANCH existe déjà"
        read -p "La supprimer et recréer ? (y/n) : " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git branch -D "$BRANCH"
            echo "Branche supprimée"
        fi
    fi
    
    # Créer la branche
    echo "Création de la branche $BRANCH..."
    git checkout -b "$BRANCH" 2>/dev/null || git checkout "$BRANCH"
    
    # Faire un petit changement pour trigger le pipeline
    echo "# Test GitLab CI - $(date)" >> .gitlab-ci-test.md
    git add .gitlab-ci-test.md
    git commit -m "test: Trigger GitLab CI pipeline" --allow-empty
    
    echo -e "${GREEN}✅ Branche créée et commit prêt${NC}"
fi

echo ""

###############################################################################
# Push vers GitLab
###############################################################################

echo -e "${BLUE}📋 Push vers GitLab${NC}"
echo ""
echo "Branch : $BRANCH"
echo "Remote : gitlab"
echo ""
read -p "Push maintenant ? (y/n) : " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Pushing to GitLab..."
    
    if git push gitlab "$BRANCH" 2>&1; then
        echo ""
        echo -e "${GREEN}✅ Push réussi !${NC}"
    else
        echo ""
        echo -e "${YELLOW}⚠️  Le push a échoué${NC}"
        echo ""
        echo "Erreurs possibles :"
        echo "  - Branche protégée sur GitLab"
        echo "  - Pas d'accès push"
        echo "  - Remote 'gitlab' mal configuré"
        echo ""
        echo "Vérifie : git remote -v"
        exit 1
    fi
else
    echo "Push annulé. Lance manuellement avec :"
    echo "  git push gitlab $BRANCH"
    exit 0
fi

echo ""

###############################################################################
# Ouverture du pipeline GitLab
###############################################################################

echo -e "${BLUE}📋 Surveillance du Pipeline${NC}"
echo ""

# Obtenir l'URL du pipeline
GITLAB_PROJECT_URL="https://gitlab.com/ab1530/arcane-foot"
PIPELINE_URL="$GITLAB_PROJECT_URL/-/pipelines"

echo "📊 Ouvre cette page pour surveiller le pipeline :"
echo -e "${BOLD}   $PIPELINE_URL${NC}"
echo ""

# Essayer d'ouvrir automatiquement dans le navigateur
if command -v open &> /dev/null; then
    read -p "Ouvrir automatiquement dans le navigateur ? (y/n) : " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "$PIPELINE_URL"
        echo -e "${GREEN}✅ Navigateur ouvert${NC}"
    fi
fi

echo ""

###############################################################################
# Guide de surveillance
###############################################################################

echo "================================================================"
echo -e "${GREEN}${BOLD}🎉 Pipeline déclenché !${NC}"
echo "================================================================"
echo ""
echo "📊 Ce que tu vas voir sur GitLab :"
echo ""
echo "   Pipeline #XXX (running...)"
echo ""
echo "   Stages :"
echo "   ┌─────────────────────────────────────┐"
echo "   │ 1. 🔍 validate    (~2-3 min)       │"
echo "   │    ├─ lint_backend                 │"
echo "   │    └─ lint_web                     │"
echo "   │                                    │"
echo "   │ 2. 🏗️  build       (~3-4 min)       │"
echo "   │    ├─ build_backend                │"
echo "   │    └─ build_web                    │"
echo "   │                                    │"
echo "   │ 3. 🧪 test        (~2-3 min)       │"
echo "   │    ├─ test_backend_unit            │"
echo "   │    └─ test_web_unit                │"
echo "   │                                    │"
echo "   │ 4. 🔒 security    (~1-2 min)       │"
echo "   │    └─ security_scan_npm            │"
echo "   │                                    │"
echo "   │ 5. 🎭 qa          (~3-5 min)       │"
echo "   │    └─ qa_playwright (peut fail)   │"
echo "   │                                    │"
echo "   │ 6. 📦 package     (~4-6 min)       │"
echo "   │    └─ build_docker_images          │"
echo "   │                                    │"
echo "   │ 7. 🚀 deploy      (manuel)         │"
echo "   │    └─ deploy_staging               │"
echo "   └─────────────────────────────────────┘"
echo ""
echo "⏱️  Temps total estimé : 15-20 minutes"
echo ""
echo "🎯 Résultats possibles :"
echo ""
echo "   ✅ Tout vert → PARFAIT ! Pipeline 100% opérationnel"
echo "   🟡 Quelques warnings → Normal, on affinera après"
echo "   ⚠️  Certains stages échouent → On débuggera ensemble"
echo ""

###############################################################################
# Commandes utiles
###############################################################################

echo "💡 Commandes utiles pendant que ça tourne :"
echo ""
echo "   • Voir les logs du runner :"
echo "     gitlab-runner --debug run"
echo ""
echo "   • Vérifier que le runner tourne :"
echo "     gitlab-runner list"
echo ""
echo "   • Arrêter le runner (si besoin) :"
echo "     gitlab-runner stop"
echo ""

###############################################################################
# Attente des résultats
###############################################################################

echo "================================================================"
echo ""
echo "🕐 Patiente ~15-20 minutes pour les résultats..."
echo ""
read -p "Appuie sur ENTRÉE quand le pipeline est terminé... " 
echo ""

###############################################################################
# Analyse des résultats
###############################################################################

echo -e "${BLUE}📋 Analyse des Résultats${NC}"
echo ""
echo "Questions :"
echo ""
read -p "1. Le pipeline est-il VERT (succès) ? (y/n) : " -n 1 -r
echo
SUCCESS=$REPLY

if [[ $SUCCESS =~ ^[Yy]$ ]]; then
    echo ""
    echo "================================================================"
    echo -e "${GREEN}${BOLD}🎉🎉🎉 FÉLICITATIONS ! 🎉🎉🎉${NC}"
    echo "================================================================"
    echo ""
    echo "Ton pipeline GitLab CI/CD fonctionne PARFAITEMENT ! ✅"
    echo ""
    echo "📊 Ce qui a été validé :"
    echo "   ✅ Runner opérationnel"
    echo "   ✅ Variables configurées correctement"
    echo "   ✅ Build backend réussi"
    echo "   ✅ Build web réussi"
    echo "   ✅ Tests unitaires passent"
    echo "   ✅ Docker images buildées"
    echo ""
    echo "🚀 Prochaines étapes :"
    echo "   1. Merger cette branche (ou la garder comme référence)"
    echo "   2. Configurer le déploiement staging"
    echo "   3. Tester un vrai déploiement"
    echo ""
    echo "📖 Guide complet : ENVIRONMENTS_SETUP_GUIDE.md"
    echo ""
else
    echo ""
    echo "================================================================"
    echo -e "${YELLOW}📊 Débuggage nécessaire${NC}"
    echo "================================================================"
    echo ""
    read -p "2. Quel stage a échoué ? (validate/build/test/security/qa/package) : " FAILED_STAGE
    echo ""
    echo "📝 Notes pour débugger :"
    echo ""
    echo "Sur GitLab, clique sur le job rouge pour voir les logs détaillés."
    echo ""
    
    case $FAILED_STAGE in
        validate|lint)
            echo "❌ Stage VALIDATE échoué"
            echo ""
            echo "Causes possibles :"
            echo "  - Erreurs de linting (code pas clean)"
            echo "  - Problème de dépendances npm"
            echo ""
            echo "Solutions :"
            echo "  - Localement : npm run lint"
            echo "  - Fixer les erreurs"
            echo "  - Re-commit et re-push"
            ;;
        build)
            echo "❌ Stage BUILD échoué"
            echo ""
            echo "Causes possibles :"
            echo "  - Erreurs TypeScript"
            echo "  - Dépendances manquantes"
            echo "  - Variables d'environnement manquantes"
            echo ""
            echo "Solutions :"
            echo "  - Localement : npm run build"
            echo "  - Vérifier les erreurs"
            echo "  - Vérifier les variables GitLab"
            ;;
        test)
            echo "❌ Stage TEST échoué"
            echo ""
            echo "Causes possibles :"
            echo "  - Tests unitaires qui échouent"
            echo "  - DATABASE_URL mal configuré"
            echo "  - Service PostgreSQL pas disponible"
            echo ""
            echo "Solutions :"
            echo "  - Vérifier DATABASE_URL dans Variables GitLab"
            echo "  - Vérifier que .gitlab-ci.yml a le service postgres"
            echo "  - Localement : npm run test"
            ;;
        security)
            echo "⚠️  Stage SECURITY échoué (souvent non-bloquant)"
            echo ""
            echo "C'est normal si tu as des vulnérabilités npm."
            echo "Le pipeline peut continuer quand même."
            ;;
        qa)
            echo "⚠️  Stage QA échoué (peut être non-bloquant)"
            echo ""
            echo "Les tests E2E Playwright peuvent être instables."
            echo "Le pipeline peut continuer quand même."
            ;;
        package)
            echo "❌ Stage PACKAGE échoué"
            echo ""
            echo "Causes possibles :"
            echo "  - Docker build a échoué"
            echo "  - Container Registry pas activé"
            echo "  - Problème de permissions"
            echo ""
            echo "Solutions :"
            echo "  - Activer Container Registry sur GitLab"
            echo "  - Vérifier Settings → General → Container Registry"
            ;;
    esac
    
    echo ""
    echo "📞 Besoin d'aide ? Partage les logs du job qui échoue."
fi

echo ""
echo "================================================================"
echo ""
