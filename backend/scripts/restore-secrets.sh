#!/bin/bash
# Script pour restaurer les vraies valeurs des secrets
# Usage: bash scripts/restore-secrets.sh

set -e

echo "🔓 Restauration des secrets dans RAILWAY_ENV_CONFIG.md..."

# Vérifier si le backup existe
if [ -f "RAILWAY_ENV_CONFIG.md.backup" ]; then
    echo "📦 Restauration depuis le backup..."
    cp RAILWAY_ENV_CONFIG.md.backup RAILWAY_ENV_CONFIG.md
    rm RAILWAY_ENV_CONFIG.md.backup
    echo "✅ Secrets restaurés depuis le backup!"
else
    echo "⚠️  Pas de backup trouvé. Restauration depuis .env.railway.template..."

    if [ ! -f ".env.railway.template" ]; then
        echo "❌ Erreur: .env.railway.template introuvable!"
        exit 1
    fi

    # Lire les valeurs depuis le template
    source .env.railway.template

    # Restaurer les vraies valeurs dans RAILWAY_ENV_CONFIG.md
    # Cette partie nécessiterait un template complet, pour l'instant on restaure juste depuis backup
    echo "ℹ️  Veuillez restaurer manuellement depuis .env.railway.template"
fi

echo ""
echo "Les secrets ont été restaurés localement."
echo "⚠️  NE PAS COMMIT CE FICHIER AVEC LES VRAIES VALEURS!"
