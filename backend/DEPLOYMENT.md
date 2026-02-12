# Déploiement sur Railway

## Configuration Railway

### 1. Créer un nouveau projet sur Railway

1. Aller sur [railway.app](https://railway.app)
2. Cliquer sur "New Project"
3. Sélectionner "Deploy from GitHub repo"
4. Autoriser Railway à accéder à votre repository GitHub
5. Sélectionner le repository `AppFoot/backend`

### 2. Configurer la base de données PostgreSQL

1. Dans votre projet Railway, cliquer sur "New"
2. Sélectionner "Database" > "PostgreSQL"
3. Railway va créer automatiquement une base de données PostgreSQL
4. Les variables d'environnement `DATABASE_URL` seront automatiquement injectées

### 3. Configurer les variables d'environnement

Dans les Settings de votre service backend, ajouter les variables suivantes :

#### Core Configuration
```
NODE_ENV=production
PORT=3000
```

#### Database (automatiquement configuré par Railway)
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

#### JWT
```
JWT_SECRET=votre_jwt_secret_super_securise_ici
JWT_EXPIRES_IN=7d
```

#### Sentry
```
SENTRY_DSN=https://be5bdddaa75ae5ffe1be76199acd35ef@o4510215609450496.ingest.de.sentry.io/4510215652835408
SENTRY_ENVIRONMENT=production
```

#### Supabase
```
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_KEY=votre_supabase_key
SUPABASE_BUCKET=your-bucket-name
```

#### Stripe
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Firebase
```
FIREBASE_ADMIN_SDK_JSON_PATH=./firebase-admin-sdk.json
FCM_PROJECT_ID=votre-projet-firebase
```

#### Rate Limiting
```
RATE_LIMIT_TTL=60000
RATE_LIMIT_MAX=100
```

### 4. Ajouter le fichier Firebase Admin SDK

1. Télécharger le fichier JSON de votre projet Firebase
2. Dans Railway, aller dans "Settings" > "Variables"
3. Créer une variable `FIREBASE_CONFIG` avec le contenu du JSON
4. Modifier le code pour lire depuis la variable d'environnement au lieu du fichier

Alternative : Utiliser Railway Volumes pour stocker le fichier JSON

### 5. Configurer le déploiement

Railway devrait automatiquement détecter que c'est un projet Node.js et utiliser les fichiers :
- `railway.json` pour la configuration
- `nixpacks.toml` pour le build
- `package.json` pour les dépendances

### 6. Déployer

1. Railway va automatiquement déployer à chaque push sur la branche principale
2. Vous pouvez aussi déclencher un déploiement manuel via l'interface

### 7. Migrations de base de données

Après le premier déploiement, exécuter les migrations :

1. Dans Railway, ouvrir le terminal du service backend
2. Exécuter :
```bash
npx prisma migrate deploy
```

Ou configurer un script de démarrage qui exécute les migrations automatiquement.

### 8. Webhooks Stripe

1. Dans votre dashboard Stripe, configurer un webhook pointant vers :
   ```
   https://votre-domaine.railway.app/api/payments/webhook
   ```
2. Copier le secret du webhook et l'ajouter dans `STRIPE_WEBHOOK_SECRET`

### 9. Domaine personnalisé (optionnel)

1. Dans Railway, aller dans "Settings" > "Networking"
2. Ajouter un domaine personnalisé
3. Configurer les DNS selon les instructions de Railway

## Scripts utiles

### Générer Prisma Client en production
```bash
npx prisma generate
```

### Exécuter les migrations
```bash
npx prisma migrate deploy
```

### Voir les logs
```bash
railway logs
```

### Se connecter en SSH
Utiliser le terminal intégré dans l'interface Railway

## Vérification post-déploiement

1. **Health Check** : `https://votre-domaine.railway.app/api/health`
2. **API Docs** : `https://votre-domaine.railway.app/api`
3. **Sentry** : Vérifier que les erreurs sont bien capturées

## Rollback

En cas de problème :
1. Dans Railway, aller dans "Deployments"
2. Sélectionner un déploiement précédent
3. Cliquer sur "Redeploy"

## Monitoring

- **Logs** : Disponibles dans l'interface Railway
- **Metrics** : CPU, Memory, Network dans l'interface Railway
- **Errors** : Dashboard Sentry
- **APM** : Sentry Performance Monitoring

## Coûts estimés

- PostgreSQL : $5/mois (Hobby plan)
- Backend service : $5/mois (Hobby plan)
- **Total** : ~$10/mois

Pour un plan gratuit, Railway offre $5 de crédit par mois.

## Support

- [Documentation Railway](https://docs.railway.app)
- [Discord Railway](https://discord.gg/railway)
