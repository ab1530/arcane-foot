# Scripts de Déploiement Railway

Ce dossier contient des scripts pour automatiser le déploiement sur Railway en gérant les secrets de manière sécurisée.

## 📋 Scripts Disponibles

### 1. `mask-secrets.sh` - Masquer les secrets
Masque automatiquement tous les secrets sensibles dans `RAILWAY_ENV_CONFIG.md` avant de committer.

**Usage:**
```bash
bash scripts/mask-secrets.sh
```

**Ce qu'il fait:**
- Crée un backup de `RAILWAY_ENV_CONFIG.md`
- Remplace tous les secrets par des placeholders
- Vous permet de commit/push en toute sécurité

### 2. `restore-secrets.sh` - Restaurer les secrets
Restaure les vraies valeurs des secrets depuis le backup.

**Usage:**
```bash
bash scripts/restore-secrets.sh
```

**Ce qu'il fait:**
- Restaure le fichier depuis le backup
- Supprime le fichier de backup

### 3. `deploy-to-railway.sh` - Déploiement complet (RECOMMANDÉ)
Script tout-en-un qui gère le processus complet de déploiement.

**Usage:**
```bash
bash scripts/deploy-to-railway.sh "votre message de commit"
```

**Ce qu'il fait:**
1. Masque automatiquement les secrets
2. Affiche les changements à committer
3. Demande confirmation
4. Commit et push vers develop
5. Restaure les secrets localement

**Exemple:**
```bash
bash scripts/deploy-to-railway.sh "feat: Add new payment gateway"
```

## 🚀 Workflow Recommandé

### Pour un déploiement rapide:
```bash
# 1. Faites vos changements de code
# 2. Utilisez le script de déploiement
bash scripts/deploy-to-railway.sh "feat: Update backend API"
```

### Pour un contrôle manuel:
```bash
# 1. Masquer les secrets
bash scripts/mask-secrets.sh

# 2. Vérifier les changements
git status
git diff

# 3. Committer et pusher
git add .
git commit -m "feat: Your changes"
git push origin develop

# 4. Restaurer les secrets localement
bash scripts/restore-secrets.sh
```

## 📁 Fichiers Importants

### `.env.railway.template`
Contient les vraies valeurs des secrets pour Railway. Ce fichier est automatiquement ignoré par Git (`.gitignore`).

**Structure:**
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=...
STRIPE_SECRET_KEY=sk_test_...
# etc.
```

### `RAILWAY_ENV_CONFIG.md`
Documentation des variables d'environnement Railway avec placeholders. Ce fichier PEUT être commité car les secrets sont masqués.

### `*.backup`
Fichiers de backup créés automatiquement par `mask-secrets.sh`. Ignorés par Git.

## ⚠️ Sécurité

### ✅ Fichiers SAFE à commit:
- `RAILWAY_ENV_CONFIG.md` (avec secrets masqués)
- `scripts/*.sh`
- `Procfile`
- `start.sh`

### ❌ Fichiers à NE JAMAIS commit:
- `.env`
- `.env.railway.template`
- `*.backup`
- Tout fichier contenant des vrais secrets

## 🔧 Configuration Railway

Après le push, Railway va automatiquement:

1. **Détecter le push** sur la branche `develop`
2. **Installer les dépendances** (`npm install`)
3. **Générer Prisma Client** (via `postinstall`)
4. **Builder l'application** (`npm run build`)
5. **Lancer le script de démarrage** (`bash start.sh`):
   - Exécuter les migrations Prisma
   - Démarrer l'application

## 📊 Vérifier le Déploiement

### Sur Railway Dashboard:
1. Allez sur https://railway.app
2. Sélectionnez "Arcane Platform"
3. Choisissez l'environnement (Staging/Production)
4. Cliquez sur "Deployments"
5. Vérifiez les logs du dernier déploiement

### Via CLI (si installé):
```bash
railway logs
railway status
```

## 🐛 Dépannage

### Le build échoue
- Vérifiez que toutes les variables d'environnement sont configurées sur Railway
- Consultez les logs Railway pour l'erreur exacte
- Vérifiez que `DATABASE_URL` utilise l'URL interne Railway

### Les secrets ne sont pas masqués
- Réexécutez `bash scripts/mask-secrets.sh`
- Vérifiez le contenu de `RAILWAY_ENV_CONFIG.md`
- Ne commitez PAS si vous voyez encore des vraies valeurs

### Le backup est perdu
- Les vraies valeurs sont toujours dans `.env.railway.template`
- Copiez manuellement les valeurs nécessaires

## 💡 Tips

1. **Toujours utiliser `deploy-to-railway.sh`** pour éviter les erreurs
2. **Vérifier git status** avant de push pour s'assurer qu'aucun secret n'est exposé
3. **Garder `.env.railway.template` à jour** avec les dernières valeurs
4. **Surveiller les logs Railway** après chaque déploiement
