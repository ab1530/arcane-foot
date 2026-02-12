# ✅ CHECKLIST PRÉ-DÉMO CLIENT - 28 OCTOBRE 2025

**Temps requis:** 20-30 minutes avant la démo
**Objectif:** Assurer que tout fonctionne parfaitement pour la présentation client

---

## 📋 PHASE 1: ENVIRONNEMENT (10 min avant)

### Backend (/Users/lakhdari/Desktop/AppFoot/backend)

- [ ] **Terminal 1 - Backend démarré**
  ```bash
  cd /Users/lakhdari/Desktop/AppFoot/backend
  npm run start:dev
  ```
  - Attendre le message: `Nest application successfully started on port 3000`
  - Vérifier qu'il n'y a pas d'erreurs de connexion DB

- [ ] **Test Health Check**
  ```bash
  curl http://localhost:3000/api/health
  ```
  - Doit retourner `status: "healthy"`

### Frontend (/Users/lakhdari/Desktop/AppFoot/web)

- [ ] **Terminal 2 - Frontend démarré**
  ```bash
  cd /Users/lakhdari/Desktop/AppFoot/web
  npm run dev
  ```
  - Attendre le message: `Ready in XXs` avec URL `http://localhost:3000` (ou 3002)
  - Noter le port affiché

- [ ] **Ouvrir le navigateur**
  - Aller sur `http://localhost:3000` (ou le port indiqué)
  - Vérifier que la landing page s'affiche correctement

### Base de données

- [ ] **Vérifier les données de test**
  ```bash
  # Dans /backend
  npx prisma studio --port 5556
  ```
  - Ouvrir http://localhost:5556
  - Vérifier la présence de: Players, Clubs, Matches, Camps, Users

---

## 🧪 PHASE 2: TESTS FONCTIONNELS (10 min avant)

### Authentification

- [ ] **Tester le login**
  - Page: `/login`
  - Email de test: `scout@arcane-football.com`
  - Password: `Scout123!` (ou ton mot de passe de test)
  - Vérifier que la redirection vers `/dashboard` fonctionne

- [ ] **Vérifier le token**
  - Ouvrir DevTools > Application/Storage > Local Storage
  - Vérifier la présence de `auth_token`

### Dashboard

- [ ] **Dashboard s'affiche**
  - Stats cards chargent (4 cards avec animated counters)
  - Graphiques apparaissent (Line, Bar, Pie, Area charts)
  - Aucune erreur dans la console

### Navigation

- [ ] **Sidebar fonctionne**
  - Cliquer sur "Players" → Liste s'affiche
  - Cliquer sur "Calendar" → Calendrier s'affiche
  - Cliquer sur "Camps" → Liste des camps s'affiche

- [ ] **Search global (Cmd+K)**
  - Appuyer sur Cmd+K (Mac) ou Ctrl+K (Windows)
  - Modal de recherche s'ouvre
  - Tester une recherche (ex: "Cristiano")

### Pages Critiques pour la Démo

- [ ] **Players (`/players`)**
  - Liste affiche des joueurs
  - Filtres fonctionnent (Position, Nationalité)
  - Cliquer sur un joueur → Detail page se charge

- [ ] **Calendar (`/calendar`)**
  - Liste des matchs s'affiche
  - Switcher entre vues: Liste / Semaine / Carte
  - Filtres fonctionnent (Statut, Date)

- [ ] **Camps (`/camps`)**
  - Liste des camps s'affiche
  - Détail d'un camp accessible
  - Formulaire d'inscription visible

- [ ] **Reports (`/reports`)**
  - Liste des rapports s'affiche
  - Filtres par status fonctionnent
  - Détail rapport accessible

---

## 🎨 PHASE 3: APPARENCE & UX (5 min avant)

### Design

- [ ] **Palette ARCANE visible**
  - Background dark (#080C1D)
  - Accent jaune néon (#E4FF3B)
  - Glassmorphism sur les cards

- [ ] **Animations fonctionnent**
  - Hover effects sur les cards
  - Page transitions fluides
  - Framer Motion animations visibles

### Responsive (si démo sur mobile/tablette)

- [ ] **Tester sur mobile**
  - Ouvrir DevTools > Toggle device toolbar
  - Tester iPhone 14 Pro viewport
  - Vérifier que le menu mobile fonctionne

---

## 🚨 PHASE 4: TROUBLESHOOTING PRÉVENTIF

### Si le backend ne démarre pas:

```bash
# 1. Vérifier que le port 3000 n'est pas utilisé
lsof -i :3000
# Si occupé: kill <PID>

# 2. Vérifier les variables d'environnement
cat backend/.env | grep DATABASE_URL

# 3. Restart Prisma
npx prisma generate
npx prisma db push
```

### Si le frontend ne démarre pas:

```bash
# 1. Clear cache Next.js
rm -rf web/.next
npm run dev

# 2. Vérifier API URL
cat web/.env.local | grep NEXT_PUBLIC_API_URL
# Doit être: http://localhost:3000
```

### Si pas de données dans la DB:

```bash
# Seed la database
cd backend
npm run prisma:seed
```

### Si erreurs 401 Unauthorized:

- Supprimer le token dans localStorage (DevTools)
- Re-login avec les credentials de test
- Vérifier JWT_SECRET dans backend/.env

---

## 🎬 PHASE 5: PRÉPARATION DÉMO (2 min avant)

### Navigateur

- [ ] **Nettoyer le navigateur**
  - Fermer tous les onglets inutiles
  - Garder uniquement: `http://localhost:3000` sur la landing page
  - Ouvrir un 2ème onglet sur `/login` (pour switcher rapidement)

- [ ] **DevTools fermés** (sauf si tu veux montrer les requêtes API)

- [ ] **Zoom navigateur à 100%**

### Écran

- [ ] **Mode présentation**
  - Activer "Ne pas déranger" (Mac/Windows)
  - Masquer notifications
  - Fermer Slack, Mail, Discord

- [ ] **Vérifier la connexion internet**
  - Ping google.com
  - S'assurer que la connexion est stable

### Documents Démo

- [ ] **Ouvrir DEMO_GUIDE.md** dans un éditeur à côté
  - Pour suivre le script si besoin
  - Garder les talking points sous les yeux

- [ ] **Préparer les credentials de test**
  - Email: `scout@arcane-football.com`
  - Password: `Scout123!`
  - Les noter sur un post-it ou les avoir en mémoire

---

## 📞 PHASE 6: PENDANT LA DÉMO

### Best Practices

- [ ] **Toujours narrer ce que tu fais**
  - "Je vais maintenant me connecter en tant que scout..."
  - "Regardez comment le filtre fonctionne en temps réel..."

- [ ] **Gérer les erreurs avec élégance**
  - Si bug: "C'est l'environnement de dev, en production nous avons Sentry qui alerte instantanément"
  - Si loading lent: "C'est le dev mode, en prod c'est optimisé avec cache et CDN"

- [ ] **Insister sur les points forts** (voir DEMO_GUIDE.md):
  - Design premium et moderne
  - Architecture scalable (NestJS + Next.js)
  - Monitoring complet (Sentry)
  - SEO optimisé
  - 26 pages fonctionnelles
  - 100+ API endpoints

---

## ⚡ RACCOURCIS CLAVIER UTILES

| Raccourci | Action |
|-----------|--------|
| `Cmd/Ctrl + K` | Ouvrir la recherche globale |
| `Cmd/Ctrl + R` | Refresh la page si bug |
| `Cmd/Ctrl + Shift + R` | Hard refresh (clear cache) |
| `Cmd/Ctrl + Option + I` | Ouvrir DevTools |
| `Cmd/Ctrl + T` | Nouvel onglet |
| `Cmd/Ctrl + W` | Fermer onglet |

---

## 🎯 CHECKLIST FINALE (1 min avant)

- [ ] Backend running ✅
- [ ] Frontend running ✅
- [ ] Login fonctionne ✅
- [ ] Dashboard charge ✅
- [ ] Navigateur propre ✅
- [ ] Mode "Ne pas déranger" activé ✅
- [ ] DEMO_GUIDE.md ouvert à côté ✅
- [ ] Connexion internet stable ✅
- [ ] Micro et caméra testés (si visio) ✅
- [ ] Partage d'écran testé (si visio) ✅

---

## 📊 MÉTRIQUES À MENTIONNER

Quand le client demande des chiffres:

- **26 pages complètes** fonctionnelles
- **100+ API endpoints** RESTful
- **35 composants** réutilisables
- **13 sprints** complétés en méthodologie agile
- **~32k lignes** de code frontend TypeScript
- **~11k lignes** de code backend
- **5 tiers** d'abonnement (monétisation)
- **3 outils IA** (ArkaneIndex, ArkaneGPT, ArkaneScoutAI)
- **100% TypeScript** - Type safety complète
- **Monitoring 24/7** avec Sentry et Analytics

---

## 🔗 LIENS UTILES PENDANT LA DÉMO

Si le client veut voir la documentation:

- **PROJECT_STATUS.md** - État complet du projet (13 sprints)
- **FEATURES_SUMMARY.md** - Documentation features (1-11)
- **DEVOPS.md** - Setup monitoring et DevOps
- **DEMO_GUIDE.md** - Script complet 30 minutes
- **ASSETS_NEEDED.md** - Assets PWA à générer

---

## 🚀 APRÈS LA DÉMO

- [ ] **Email de suivi dans les 2h**
  - Remercier pour le temps
  - Récapituler les points forts
  - Proposer un call de suivi dans 48h

- [ ] **Envoyer la documentation**
  - PROJECT_STATUS.md
  - FEATURES_SUMMARY.md
  - Lien vers une version de démo hébergée (si disponible)

- [ ] **Proposer une offre commerciale**
  - Basée sur leurs besoins exprimés pendant la démo
  - Timeline de déploiement
  - Support et maintenance

---

**🎉 BONNE CHANCE POUR TA DÉMO!**

**Dernière mise à jour:** 28 Octobre 2025
**Créé par:** ARCANE Football Team
