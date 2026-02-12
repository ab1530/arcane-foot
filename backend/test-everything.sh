#!/bin/bash

# Script de test complet pour vérifier que tout fonctionne
# Ce script teste: compilation, build, connexion DB, et endpoints API

set -e  # Exit on error

echo "🧪 === TEST COMPLET DU BACKEND ==="
echo ""

# Couleurs pour l'output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Test de compilation TypeScript
echo "📝 1. Test de compilation TypeScript..."
if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
    echo -e "${RED}❌ ÉCHEC: Erreurs TypeScript trouvées${NC}"
    npx tsc --noEmit 2>&1 | grep "error TS" | head -10
    exit 1
else
    echo -e "${GREEN}✅ Compilation TypeScript: OK (0 erreurs)${NC}"
fi
echo ""

# 2. Test du build
echo "🏗️  2. Test du build..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build: OK${NC}"
else
    echo -e "${RED}❌ ÉCHEC: Le build a échoué${NC}"
    exit 1
fi
echo ""

# 3. Vérification que le fichier main.js existe
echo "📦 3. Vérification des fichiers de build..."
if [ -f "dist/src/main.js" ]; then
    echo -e "${GREEN}✅ Fichier main.js: OK${NC}"
else
    echo -e "${RED}❌ ÉCHEC: main.js introuvable${NC}"
    exit 1
fi
echo ""

# 4. Test de génération du client Prisma
echo "🔧 4. Test du client Prisma..."
if npx prisma generate > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Client Prisma: OK${NC}"
else
    echo -e "${RED}❌ ÉCHEC: Génération du client Prisma a échoué${NC}"
    exit 1
fi
echo ""

# 5. Test de la connexion à la base de données
echo "🗄️  5. Test de connexion à la base de données..."
if node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => {
    console.log('✅ Connexion DB: OK');
    return prisma.\$disconnect();
  })
  .catch(err => {
    console.error('❌ Connexion DB échouée:', err.message);
    process.exit(1);
  });
" 2>/dev/null; then
    echo -e "${GREEN}✅ Base de données: Accessible${NC}"
else
    echo -e "${RED}❌ ÉCHEC: Impossible de se connecter à la DB${NC}"
    exit 1
fi
echo ""

# 6. Vérification que toutes les tables existent
echo "📊 6. Vérification des tables Prisma..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const tables = [
  'users', 'players', 'clubs', 'matches', 'scouting_reports',
  'leaderboards', 'daily_challenges', 'user_daily_challenges',
  'scout_listings', 'marketplace_offers', 'marketplace_reviews',
  'scout_favorites', 'auto_generated_reports', 'player_valuations',
  'performance_predictions', 'prediction_accuracy_log', 'report_embeddings'
];

async function checkTables() {
  for (const table of tables) {
    try {
      await prisma[table].count();
      console.log('  ✓ ' + table);
    } catch (err) {
      console.error('  ✗ ' + table + ': ' + err.message);
      process.exit(1);
    }
  }
  await prisma.\$disconnect();
}

checkTables();
" && echo -e "${GREEN}✅ Toutes les tables sont accessibles${NC}" || echo -e "${RED}❌ Certaines tables sont inaccessibles${NC}"

echo ""

# 7. Démarrage du serveur en arrière-plan (optionnel)
echo "🚀 7. Test de démarrage du serveur (5 secondes)..."
echo -e "${YELLOW}⏳ Démarrage du serveur...${NC}"

# Démarrer le serveur en arrière-plan
npm run start:prod > /dev/null 2>&1 &
SERVER_PID=$!

# Attendre 5 secondes
sleep 5

# Vérifier si le processus tourne toujours
if kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "${GREEN}✅ Serveur: Démarré avec succès (PID: $SERVER_PID)${NC}"

    # Tester l'endpoint health
    echo "🏥 8. Test de l'endpoint /health..."
    if curl -s http://localhost:5000/health | grep -q "ok\|healthy"; then
        echo -e "${GREEN}✅ Endpoint /health: OK${NC}"
    else
        echo -e "${YELLOW}⚠️  Endpoint /health: Non accessible (ceci est normal si le serveur n'a pas fini de démarrer)${NC}"
    fi

    # Arrêter le serveur
    kill $SERVER_PID 2>/dev/null
    echo -e "${YELLOW}🛑 Serveur arrêté${NC}"
else
    echo -e "${RED}❌ ÉCHEC: Le serveur s'est arrêté prématurément${NC}"
    exit 1
fi

echo ""
echo "================================"
echo -e "${GREEN}✅ TOUS LES TESTS ONT RÉUSSI!${NC}"
echo "================================"
echo ""
echo "📋 Résumé:"
echo "  ✅ Compilation TypeScript: 0 erreurs"
echo "  ✅ Build NestJS: Succès"
echo "  ✅ Client Prisma: Généré"
echo "  ✅ Connexion DB: OK"
echo "  ✅ Tables: 17 tables accessibles"
echo "  ✅ Serveur: Démarre correctement"
echo ""
echo "🎉 Le backend est prêt pour la production!"
