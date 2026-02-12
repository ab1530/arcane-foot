# Diagnostic Railway - Arcane Platform

## ⚠️ Problème Identifié

Vous avez mentionné voir "la même DB d'il y a 13 minutes" dans l'historique des déploiements Railway.

## 🔍 Choses à Vérifier

### 1. Configuration du Service Railway

**Sur le Dashboard Railway:**
- Projet: "Arcane Platform"
- Environnement: Staging OU Production

**Vérifiez ces paramètres:**

#### A. Source & Branche
```
Settings → Source
├── Repository: ab1530/arcane-foot
├── Branch: develop (pour Staging) ou main (pour Production)
└── Root Directory: /backend
```

⚠️ **IMPORTANT**: Le "Root Directory" doit être `/backend` car le backend est dans un sous-dossier!

#### B. Build Configuration
```
Settings → Build
├── Builder: Railpack (ou Nixpacks)
├── Build Command: npm run build (optionnel, détecté automatiquement)
└── Start Command: Voir Procfile (bash start.sh)
```

#### C. Variables d'Environnement
```
Variables → Raw Editor
```

Vérifiez que TOUTES ces variables sont configurées:
- [x] DATABASE_URL
- [x] JWT_SECRET
- [x] JWT_REFRESH_SECRET
- [x] SUPABASE_URL
- [x] SUPABASE_SERVICE_KEY
- [x] STRIPE_SECRET_KEY
- [x] FIREBASE_PROJECT_ID
- [x] FIREBASE_CLIENT_EMAIL
- [x] FIREBASE_PRIVATE_KEY_ID
- [x] FIREBASE_PRIVATE_KEY
- [x] SENTRY_DSN
- [x] NODE_ENV
- [x] API_PORT

### 2. Vérifier les Déploiements

**Dans l'onglet "Deployments":**

Chaque déploiement doit afficher:
```
✅ Build successful
✅ Deploy successful
🔄 Running
```

**Cliquez sur le dernier déploiement et vérifiez:**

#### A. Build Logs
Recherchez ces étapes:
```
1. npm install
2. prisma generate (via postinstall)
3. npm run build
4. Build completed
```

#### B. Deploy Logs
Recherchez ces messages:
```
🚀 Starting Arcane Platform Backend...
📦 Running Prisma migrations...
✅ Migrations completed!
🎯 Starting application...
[Nest] Starting Nest application...
[Nest] Nest application successfully started
```

### 3. Diagnostic du Problème "Même DB"

Si vous voyez toujours la même DB dans les déploiements, cela peut signifier:

#### Scénario A: Le Root Directory n'est pas configuré
**Symptôme:** Railway ne détecte pas les changements dans `/backend`

**Solution:**
```
1. Settings → Source
2. Root Directory: /backend
3. Redéployer
```

#### Scénario B: La branche n'est pas correcte
**Symptôme:** Railway écoute une autre branche (ex: main au lieu de develop)

**Solution:**
```
1. Settings → Source
2. Branch: develop
3. Redéployer
```

#### Scénario C: Le déploiement automatique est désactivé
**Symptôme:** Railway ne détecte pas les nouveaux pushs

**Solution:**
```
1. Settings → Source
2. Watch Paths: /backend/** (ou laisser vide pour tout)
3. Auto-deploy: ON
4. Redéployer manuellement une fois
```

#### Scénario D: Cache du builder
**Symptôme:** Railway utilise le cache de l'ancien build

**Solution:**
```
1. Dans Deployments, cliquer sur le menu (...)
2. "Remove build cache"
3. "Redeploy"
```

## 🎯 Actions Immédiates

### Étape 1: Vérifier la Configuration
```bash
# Sur Railway Dashboard
1. Projet "Arcane Platform"
2. Environnement "Staging"
3. Settings → Source
4. Vérifier Root Directory = /backend
5. Vérifier Branch = develop
```

### Étape 2: Forcer un Nouveau Déploiement
```bash
# Option A: Via l'interface
1. Deployments → Menu (...)
2. "Redeploy"

# Option B: Via un commit vide
git commit --allow-empty -m "chore: Force Railway redeploy"
git push origin develop
```

### Étape 3: Vérifier les Variables
```bash
# Sur Railway Dashboard
1. Variables
2. Comparer avec RAILWAY_ENV_CONFIG.md
3. S'assurer que DATABASE_URL utilise:
   postgresql://postgres:...@postgres.railway.internal:5432/railway
```

## 📊 Commandes de Diagnostic

Si vous avez Railway CLI installé:

```bash
# Se connecter
railway login

# Lier au projet
railway link

# Voir les logs en temps réel
railway logs

# Voir le statut
railway status

# Voir les variables
railway variables

# Redéployer
railway up
```

## 🔧 Solution Rapide

Si rien ne fonctionne, essayez ceci:

```bash
# 1. Supprimer le cache de build sur Railway Dashboard
#    Deployments → Menu → Remove build cache

# 2. Forcer un redéploiement avec un changement visible
echo "" >> backend/README.md
git add backend/README.md
git commit -m "chore: Force Railway rebuild"
git push origin develop

# 3. Surveiller les logs sur Railway Dashboard
```

## 📝 Checklist Finale

Avant de contacter le support Railway:

- [ ] Root Directory = `/backend`
- [ ] Branch = `develop`
- [ ] Toutes les variables d'environnement configurées
- [ ] DATABASE_URL utilise `postgres.railway.internal`
- [ ] Auto-deploy activé
- [ ] Cache de build supprimé
- [ ] Au moins un redéploiement manuel effectué
- [ ] Logs consultés (pas d'erreurs)

## 🆘 Besoin d'Aide?

Si le problème persiste:

1. **Consultez les logs détaillés:**
   - Railway Dashboard → Deployments → Dernier déploiement → View Logs
   - Cherchez les lignes avec `[ERROR]` ou `[WARN]`

2. **Partagez les informations:**
   - Version de Node.js utilisée (dans les logs)
   - Dernière erreur affichée
   - Configuration actuelle du Root Directory

3. **Support Railway:**
   - Discord: https://discord.gg/railway
   - Documentation: https://docs.railway.app
