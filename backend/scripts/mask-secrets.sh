#!/bin/bash
# Script pour masquer les secrets avant de commit/push
# Usage: bash scripts/mask-secrets.sh

set -e

echo "🔒 Masquage des secrets dans RAILWAY_ENV_CONFIG.md..."

# Backup du fichier original
cp RAILWAY_ENV_CONFIG.md RAILWAY_ENV_CONFIG.md.backup

# Lecture des vraies valeurs depuis .env
source .env 2>/dev/null || echo "⚠️  Fichier .env non trouvé, utilisation des valeurs du template"

# Masquer DATABASE_URL (garder seulement la structure)
sed -i '' 's|DATABASE_URL=postgresql://.*|DATABASE_URL=postgresql://postgres:PASSWORD@postgres.railway.internal:5432/railway|g' RAILWAY_ENV_CONFIG.md

# Masquer JWT secrets
sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=VOTRE_JWT_SECRET_ICI|g" RAILWAY_ENV_CONFIG.md
sed -i '' "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=VOTRE_JWT_REFRESH_SECRET_ICI|g" RAILWAY_ENV_CONFIG.md

# Masquer Supabase
sed -i '' 's|SUPABASE_URL=https://.*\.supabase\.co|SUPABASE_URL=https://VOTRE_PROJET.supabase.co|g' RAILWAY_ENV_CONFIG.md
sed -i '' 's|SUPABASE_SERVICE_KEY=eyJ.*|SUPABASE_SERVICE_KEY=VOTRE_SUPABASE_SERVICE_KEY_ICI|g' RAILWAY_ENV_CONFIG.md

# Masquer Stripe
sed -i '' 's|STRIPE_SECRET_KEY=sk_test_.*|STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_STRIPE_ICI|g' RAILWAY_ENV_CONFIG.md
sed -i '' 's|STRIPE_SECRET_KEY=sk_live_.*|STRIPE_SECRET_KEY=sk_live_VOTRE_CLE_STRIPE_ICI|g' RAILWAY_ENV_CONFIG.md

# Masquer Firebase
sed -i '' 's|FIREBASE_PROJECT_ID=.*|FIREBASE_PROJECT_ID=votre-project-id|g' RAILWAY_ENV_CONFIG.md
sed -i '' 's|FIREBASE_CLIENT_EMAIL=.*@.*\.iam\.gserviceaccount\.com|FIREBASE_CLIENT_EMAIL=firebase-adminsdk@votre-project.iam.gserviceaccount.com|g' RAILWAY_ENV_CONFIG.md
sed -i '' 's|FIREBASE_PRIVATE_KEY_ID=.*|FIREBASE_PRIVATE_KEY_ID=votre_private_key_id|g' RAILWAY_ENV_CONFIG.md
sed -i '' 's|FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----.*-----END PRIVATE KEY-----.*|FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\\n[VOTRE_CLE_PRIVEE_ICI]\\n-----END PRIVATE KEY-----\\n|g' RAILWAY_ENV_CONFIG.md

# Masquer Sentry
sed -i '' 's|SENTRY_DSN=https://.*@o[0-9]*\.ingest.*|SENTRY_DSN=https://VOTRE_SENTRY_DSN_ICI@o000000000000000.ingest.de.sentry.io/000000000000000|g' RAILWAY_ENV_CONFIG.md

echo "✅ Secrets masqués avec succès!"
echo "📄 Backup créé: RAILWAY_ENV_CONFIG.md.backup"
echo ""
echo "Vous pouvez maintenant commit et push en toute sécurité."
echo "Pour restaurer les vraies valeurs: bash scripts/restore-secrets.sh"
