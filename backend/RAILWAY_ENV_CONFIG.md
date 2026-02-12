# Configuration des Variables d'Environnement Railway

## 🎯 Instructions

Allez sur Railway → Projet "Arcane Platform" → Sélectionnez l'environnement (Staging ou Production) → Variables

⚠️ **IMPORTANT**: Ce fichier contient des placeholders pour les secrets. Utilisez les vraies valeurs depuis votre fichier `.env` local lors de la configuration sur Railway.

---

## 📋 VARIABLES OBLIGATOIRES

### 1. DATABASE
```bash
# URL interne Railway (utilisez celle-ci pour le déploiement sur Railway)
DATABASE_URL=postgresql://postgres:VYPFvkvdppkRQuPYhYuZMMlGnCXwjMsk@postgres.railway.internal:5432/railway
```

### 2. JWT AUTHENTICATION
```bash
# ⚠️ IMPORTANT: Utilisez vos JWT secrets réels (disponibles dans votre .env local)
JWT_SECRET=VOTRE_JWT_SECRET_ICI
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=VOTRE_JWT_REFRESH_SECRET_ICI
JWT_REFRESH_EXPIRES_IN=30d
```

### 3. SUPABASE STORAGE
```bash
# ⚠️ IMPORTANT: Utilisez vos clés Supabase réelles (disponibles dans votre .env local)
SUPABASE_URL=https://VOTRE_PROJET.supabase.co
SUPABASE_SERVICE_KEY=VOTRE_SUPABASE_SERVICE_KEY_ICI
SUPABASE_STORAGE_BUCKET=arcane-media
```

### 4. STRIPE PAYMENTS
```bash
# ⚠️ IMPORTANT: Utilisez vos clés Stripe réelles (disponibles dans votre .env local)
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_STRIPE_ICI
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID_BASIC=price_basic_monthly
STRIPE_PRICE_ID_PRO=price_pro_monthly
STRIPE_PRICE_ID_ENTERPRISE=price_enterprise_monthly
```

### 5. FIREBASE CLOUD MESSAGING
**IMPORTANT**: Pour Firebase, vous devez ajouter les variables individuellement:

```bash
# ⚠️ IMPORTANT: Utilisez vos identifiants Firebase réels (disponibles dans votre .env local)
FIREBASE_PROJECT_ID=votre-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@votre-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY_ID=votre_private_key_id
```

**FIREBASE_PRIVATE_KEY** (format spécial - attention aux retours à la ligne):
```bash
# ⚠️ ATTENTION: Copiez la clé privée complète depuis votre fichier firebase-service-account.json
# Assurez-vous qu'elle contient les \n littéraux (pas de vrais retours à la ligne)
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n[VOTRE_CLE_PRIVEE_ICI]\n-----END PRIVATE KEY-----\n
```

### 6. SENTRY MONITORING

```bash
# ⚠️ IMPORTANT: Utilisez votre DSN Sentry réel (disponible dans votre .env local)
# Pour STAGING: utilisez le DSN de staging
# Pour PRODUCTION: utilisez le DSN de production
SENTRY_DSN=https://VOTRE_SENTRY_DSN_ICI@o000000000000000.ingest.de.sentry.io/000000000000000
SENTRY_ENVIRONMENT=staging  # ou "production" selon l'environnement
```

### 7. CONFIGURATION API

**Pour STAGING:**
```bash
NODE_ENV=development
API_PORT=3000
FRONTEND_URL=https://staging.arcane.com
ALLOWED_ORIGINS=https://staging.arcane.com
```

**Pour PRODUCTION:**
```bash
NODE_ENV=production
API_PORT=3000
FRONTEND_URL=https://arcane.com
ALLOWED_ORIGINS=https://arcane.com,https://www.arcane.com
```

---

## 📝 VARIABLES OPTIONNELLES

### RATE LIMITING
```bash
RATE_LIMIT_TTL=900
RATE_LIMIT_MAX=100
```

### LOGGING
```bash
LOG_LEVEL=info
```

### SWAGGER (documentation API)
```bash
ENABLE_SWAGGER=true
ENABLE_CORS=true
```

---

## 🔧 CONFIGURATION RAILWAY (Railpack)

Railway utilise **Railpack** comme builder. Les fichiers suivants sont configurés:

- **Procfile** - Commande de démarrage: `bash start.sh`
- **start.sh** - Script qui exécute les migrations puis démarre l'app
- **package.json** - Script `postinstall` pour générer Prisma Client
- **.npmrc** - Configuration npm pour Railway

Railway va automatiquement:
1. Installer les dépendances avec `npm install`
2. Exécuter `postinstall` → génère Prisma Client
3. Exécuter `npm run build` → build NestJS
4. Exécuter `bash start.sh` → migrations + démarrage

## ✅ CHECKLIST DE DÉPLOIEMENT

### Avant le déploiement:
- [ ] Toutes les variables obligatoires sont configurées
- [ ] La clé privée Firebase est correctement formatée (avec \n)
- [ ] SENTRY_ENVIRONMENT correspond à l'environnement Railway (staging/production)
- [ ] FRONTEND_URL et ALLOWED_ORIGINS sont corrects
- [ ] DATABASE_URL pointe vers la bonne base de données (postgres.railway.internal)
- [ ] Le service Railway est bien lié à la branche `develop`

### Après le déploiement:
- [ ] Le service démarre sans erreur
- [ ] Les logs Railway montrent "Nest application successfully started"
- [ ] La route de santé répond: `https://your-app.railway.app/health`
- [ ] La documentation Swagger est accessible (si activée): `https://your-app.railway.app/api`

---

## 🚨 NOTES IMPORTANTES

### Firebase Private Key
⚠️ La clé privée Firebase DOIT contenir les `\n` littéraux (pas de vrais retours à la ligne).
Sur Railway, copiez-collez la valeur EXACTEMENT comme ci-dessus.

### Webhook Stripe
Une fois déployé, vous devrez configurer le webhook Stripe:
1. Allez sur https://dashboard.stripe.com/webhooks
2. Créez un nouveau webhook pointant vers: `https://your-app.railway.app/payments/webhook`
3. Copiez le signing secret et mettez-le dans `STRIPE_WEBHOOK_SECRET`

### Supabase Bucket
Assurez-vous que le bucket `arcane-media` existe dans votre projet Supabase et qu'il a les bonnes permissions:
- Public: `false`
- Allowed MIME types: `image/*,video/*,audio/*,application/pdf`

---

## 🔍 DÉPANNAGE

Si le déploiement échoue:

1. **Erreur Prisma**: Vérifiez que `DATABASE_URL` est correct
2. **Erreur Firebase**: Vérifiez le format de `FIREBASE_PRIVATE_KEY`
3. **Erreur Stripe**: Vérifiez que `STRIPE_SECRET_KEY` commence par `sk_test_` ou `sk_live_`
4. **Erreur Sentry**: Vérifiez que `SENTRY_DSN` est une URL valide

Pour voir les logs détaillés sur Railway:
```
Railway Dashboard → Votre service → Deployments → Cliquez sur le dernier déploiement → View Logs
```
