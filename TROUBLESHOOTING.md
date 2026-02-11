# Guide de Dépannage - Arcane Football

## Problèmes Résolus

### 1. ✅ Erreur "Unauthorized" dans la console Web

**Problème:** L'application web affichait une erreur "Unauthorized" au chargement.

**Cause:** Le hook `useSubscription` essayait de récupérer les informations d'abonnement sans vérifier si l'utilisateur était connecté.

**Solution appliquée:**
- Modification de `web/src/lib/api-client.ts` pour ignorer silencieusement les erreurs 401 sur les endpoints de subscription
- Modification de `web/src/hooks/useSubscription.ts` pour vérifier la présence du token avant de faire l'appel API

### 2. ✅ Warnings Prisma/OpenTelemetry

**Problème:** Warnings "Critical dependency" liés à @prisma/instrumentation et @opentelemetry

**Solution appliquée:**
- Configuration webpack dans `next.config.ts` pour ignorer ces warnings

### 3. ✅ Warning metadataBase

**Problème:** "metadataBase property in metadata export is not set"

**Solution appliquée:**
- Ajout de `metadataBase` dans `web/src/lib/metadata.ts`

## Comment tester votre stack

### Test rapide
```bash
# Tester tout le stack
./test-stack.sh all

# Tester uniquement l'API
./test-stack.sh api

# Tester uniquement le Web
./test-stack.sh web

# Tester uniquement le Mobile
./test-stack.sh mobile
```

### Démarrage des services

#### 1. API Backend (Port 5000)
```bash
cd backend
npm run start:dev
```

#### 2. Application Web (Port 3000)
```bash
cd web
npm run dev
```

#### 3. Application Mobile (Port 19000)
```bash
cd mobile
npx expo start
```

## Tests manuels recommandés

### Test 1: Vérifier l'API
```bash
# Health check
curl http://localhost:5000/health

# Login
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "scout1@arcane.com", "password": "<DEMO_PASSWORD>"}'
```

### Test 2: Vérifier le Web
1. Ouvrir http://localhost:3000
2. Vérifier qu'il n'y a pas d'erreurs dans la console
3. Naviguer vers /login et /signup
4. Tester la connexion avec les identifiants de test

### Test 3: Vérifier le Mobile
1. Scanner le QR code d'Expo avec l'app Expo Go
2. Vérifier que l'app se charge sans erreur
3. Tester la navigation entre les écrans

## Problèmes courants et solutions

### Problème: Port déjà utilisé
```bash
# Trouver le processus qui utilise le port
lsof -i :5000  # Pour l'API
lsof -i :3000  # Pour le Web

# Tuer le processus
kill -9 <PID>
```

### Problème: Erreur de connexion à la base de données
```bash
# Vérifier que PostgreSQL est lancé
brew services list  # macOS

# Vérifier la connexion
psql -U postgres -d arcane_football_dev
```

### Problème: Modules Node manquants
```bash
# Backend
cd backend
rm -rf node_modules
npm install

# Web
cd web
rm -rf node_modules
npm install

# Mobile
cd mobile
rm -rf node_modules
npm install
```

### Problème: Erreur Prisma
```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

## Variables d'environnement requises

### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/arcane_football_dev"
JWT_SECRET="your-secret-key"
PORT=5000
```

### Web (.env.local)
```env
NEXT_PUBLIC_API_URL="http://localhost:5000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Mobile (.env)
```env
API_URL="http://localhost:5000"
```

## Scripts utiles

### Nettoyer et réinstaller
```bash
# Script pour nettoyer et réinstaller tout
cat > clean-install.sh << 'EOF'
#!/bin/bash
echo "Cleaning and reinstalling..."

# Backend
cd backend
rm -rf node_modules dist
npm install
npx prisma generate

# Web
cd ../web
rm -rf node_modules .next
npm install

# Mobile
cd ../mobile
rm -rf node_modules .expo
npm install

echo "Done! Ready to start development."
EOF

chmod +x clean-install.sh
./clean-install.sh
```

### Démarrer tous les services
```bash
# Script pour démarrer tous les services
cat > start-all.sh << 'EOF'
#!/bin/bash
echo "Starting all services..."

# Start API in background
cd backend && npm run start:dev &

# Wait for API to be ready
sleep 5

# Start Web in background
cd ../web && npm run dev &

# Start Mobile
cd ../mobile && npx expo start

EOF

chmod +x start-all.sh
./start-all.sh
```

## État actuel du projet

✅ **API Backend**: Fonctionnel
- Health check: OK
- Authentification: OK
- Endpoints CRUD: OK

✅ **Application Web**: Fonctionnel
- Erreurs console corrigées
- Connexion à l'API: OK
- Pages principales accessibles

⚠️ **Application Mobile**: À vérifier
- Dépend d'Expo
- Nécessite l'app Expo Go sur le téléphone

## Prochaines étapes recommandées

1. **Tester l'authentification complète**
   - Créer un compte
   - Se connecter
   - Naviguer avec authentification

2. **Vérifier les fonctionnalités AI**
   - Tester les endpoints Gold Tier
   - Vérifier les limites de rate limiting

3. **Optimiser les performances**
   - Activer le cache Redis
   - Configurer les indexes de base de données

4. **Sécurité**
   - Configurer CORS correctement
   - Activer HTTPS en production
   - Configurer les CSP headers

## Support

Si vous rencontrez d'autres problèmes:
1. Vérifiez les logs dans chaque terminal
2. Utilisez le script `./test-stack.sh` pour diagnostiquer
3. Consultez les fichiers de log:
   - Backend: `backend/logs/`
   - Web: Console du navigateur
   - Mobile: Terminal Expo