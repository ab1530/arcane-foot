#!/bin/bash
# Script complet pour déployer sur Railway
# Usage: bash scripts/deploy-to-railway.sh "votre message de commit"

set -e

COMMIT_MESSAGE="${1:-feat: Update Railway deployment}"

echo "🚀 Déploiement sur Railway..."
echo ""

# Étape 1: Masquer les secrets
echo "1️⃣  Masquage des secrets..."
bash scripts/mask-secrets.sh

# Étape 2: Vérifier les changements
echo ""
echo "2️⃣  Changements à committer:"
git status --short

# Étape 3: Demander confirmation
echo ""
read -p "Continuer avec le commit et push? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Déploiement annulé. Restauration des secrets..."
    bash scripts/restore-secrets.sh
    exit 1
fi

# Étape 4: Commit et push
echo ""
echo "3️⃣  Commit et push..."
git add .
git commit -m "$COMMIT_MESSAGE

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>" || echo "Rien à committer"

git push origin develop

# Étape 5: Restaurer les secrets localement
echo ""
echo "4️⃣  Restauration des secrets localement..."
bash scripts/restore-secrets.sh

echo ""
echo "✅ Déploiement terminé!"
echo "🔍 Vérifiez le déploiement sur Railway: https://railway.app"
echo ""
echo "Pour voir les logs Railway:"
echo "  railway logs"
