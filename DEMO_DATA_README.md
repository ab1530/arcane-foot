# 🚀 ARCANE DEMO DATA - Guide Complet

## 📊 Vue d'ensemble

Ce package contient toutes les données fictives nécessaires pour une démo client professionnelle d'Arcane.

### 📈 Données générées

- **700+ Utilisateurs** avec différents rôles
- **25 Clubs** européens réalistes
- **200 Joueurs** avec stats complètes et ArkaneIndex
- **100 Matches** (saison 2024-2025)
- **150 Rapports de scouting** détaillés
- **10 Achievements** gamification
- **20 Camps** d'entraînement
- **20 Coaches** certifiés
- **30 Abonnements** Premium

## 🔑 Comptes de démo

### Super Admin
```
Email: admin@arcane.com
Password: <DEMO_PASSWORD>
```

### Admin
```
Email: admin1@arcane.com
Password: <DEMO_PASSWORD>
```

### Scout
```
Email: scout1@arcane.com
Password: <DEMO_PASSWORD>
```

### Agent
```
Email: agent1@arcane.com
Password: <DEMO_PASSWORD>
```

### Analyste
```
Email: analyst1@arcane.com
Password: <DEMO_PASSWORD>
```

### Joueur
```
Email: player1@arcane.com
Password: <DEMO_PASSWORD>
```

### Contact Club (Paris FC)
```
Email: club.paris@arcane.com
Password: <DEMO_PASSWORD>
```

## 🛠️ Installation

### 1. Prérequis

```bash
# Assurez-vous d'avoir PostgreSQL/Supabase configuré
# Variables d'environnement dans backend/.env
DATABASE_URL="postgresql://..."
```

### 2. Installation des dépendances

```bash
cd backend
npm install
```

### 3. Exécution du seed

#### Option A: Seed Prisma (Recommandé)

```bash
# Générer le client Prisma
npx prisma generate

# Exécuter le seed
npx prisma db seed -- --environment demo

# OU directement
npx ts-node prisma/seed-demo.ts
```

#### Option B: Import SQL direct (Supabase)

```bash
# Se connecter à Supabase
psql $DATABASE_URL < backend/data/sql/01_users.sql
psql $DATABASE_URL < backend/data/sql/02_clubs.sql
# ... etc
```

#### Option C: Via l'interface Supabase

1. Aller dans Supabase Dashboard
2. SQL Editor
3. Copier/coller les fichiers SQL

## 📁 Structure des fichiers

```
backend/
├── prisma/
│   └── seed-demo.ts          # Seed principal Prisma
├── data/
│   ├── json/                 # Données JSON brutes
│   │   ├── users.json
│   │   ├── clubs.json
│   │   ├── players.json
│   │   ├── matches.json
│   │   └── ...
│   └── sql/                  # Scripts SQL
│       ├── 01_users.sql
│       ├── 02_clubs.sql
│       └── ...
└── scripts/
    └── generate-demo-data.ts # Générateur de données
```

## 🎯 Scénarios de démo

### 1. 🔍 Workflow Scout

1. Se connecter comme `scout1@arcane.com`
2. Voir le dashboard avec statistiques
3. Consulter les matches assignés
4. Créer un rapport de scouting
5. Utiliser l'AI Auto-Scout
6. Voir les achievements débloqués

### 2. ⚽ Workflow Joueur

1. Se connecter comme `player1@arcane.com`
2. Voir son profil et stats
3. Consulter l'ArkaneIndex
4. Voir les camps disponibles
5. Réserver une session coaching
6. Générer son passeport digital

### 3. 🏢 Workflow Club

1. Se connecter comme `club.paris@arcane.com`
2. Voir les joueurs de l'effectif
3. Parcourir le marketplace scouts
4. Envoyer des offres
5. Gérer les camps
6. Analyser les rapports

### 4. 👔 Workflow Agent

1. Se connecter comme `agent1@arcane.com`
2. Gérer le portfolio joueurs
3. Négocier avec les clubs
4. Voir les valuations AI
5. Planifier les transferts

### 5. 📊 Workflow Admin

1. Se connecter comme `admin@arcane.com`
2. Dashboard système complet
3. Gestion utilisateurs
4. Monitoring AI
5. Analytics avancées
6. Configuration RBAC

## 🎨 Données remarquables

### Joueurs stars (Top ratings)
- Rechercher joueurs avec ArkaneIndex > 85
- Valeur marchande > 10M€
- Moins de 21 ans (U21)

### Matches importants
- Derbies (même ville)
- Matches avec > 40,000 spectateurs
- Scores élevés (> 3 buts)

### Rapports de qualité
- Rating > 85
- Recommandation: BUY_NOW
- Tags: "promising", "exceptional"

### Camps premium
- Prix < 300€
- Avec showcase game
- Places limitées

## 🔧 Personnalisation

### Ajouter plus de données

```typescript
// Modifier backend/prisma/seed-demo.ts

// Exemple: Ajouter plus de joueurs
for (let i = 0; i < 500; i++) { // Au lieu de 200
  // ... code génération joueur
}
```

### Modifier les stats

```typescript
// Dans seed-demo.ts
const arkaneIndex = {
  technical: 90,  // Au lieu de random
  tactical: 85,
  physical: 88,
  mental: 92,
  potential: 95,
  consistency: 87
};
```

## 🐛 Troubleshooting

### Erreur: "relation does not exist"

```bash
# Recréer les tables
npx prisma migrate reset
npx prisma migrate dev
```

### Erreur: "duplicate key"

```bash
# Nettoyer la DB avant seed
npx prisma migrate reset --skip-seed
npx ts-node prisma/seed-demo.ts
```

### Erreur: "permission denied"

```bash
# Vérifier les droits Supabase
# Ou utiliser un utilisateur avec plus de privilèges
```

## 📊 Métriques de démo

### Volume de données
- **Base de données**: ~50 MB
- **Images placeholders**: Hébergées en ligne (UI Avatars)
- **Performance**: < 2s chargement initial

### Répartition par rôle
- Super Admin: 1
- Admins: 3
- Scouts: 50
- Agents: 20
- Analystes: 10
- Joueurs: 200
- Contacts Club: 25

### Distribution géographique
- France: 30%
- Angleterre: 20%
- Espagne: 20%
- Italie: 15%
- Allemagne: 15%

## 🚀 Quick Start

```bash
# 1. Clone le repo
git clone [repo-url]

# 2. Backend setup
cd backend
npm install
cp .env.example .env
# Éditer .env avec vos credentials

# 3. Database setup
npx prisma migrate dev
npx ts-node prisma/seed-demo.ts

# 4. Start backend
npm run start:dev

# 5. Start frontend
cd ../web
npm install
npm run dev

# 6. Start mobile
cd ../mobile
npm install
npx expo start
```

## 📝 Notes importantes

1. **Toutes les données sont fictives** - Aucun vrai joueur ou club
2. **Optimisé pour démo** - Performance et réalisme équilibrés
3. **Multi-lingue ready** - Noms européens variés
4. **RGPD compliant** - Pas de données personnelles réelles
5. **Seed réversible** - Peut être reset à tout moment

## 🎉 Tips pour la démo

### Impressionner avec l'IA
- Montrer l'ArkaneIndex en temps réel
- Générer un rapport avec Auto-Scout
- Afficher les prédictions de performance
- Démontrer la valuation marchande AI

### Montrer la gamification
- Débloquer un achievement en direct
- Montrer le leaderboard
- Progression de niveau
- Badges et récompenses

### Workflow multi-rôles
- Switcher rapidement entre comptes
- Montrer les interactions entre rôles
- Démontrer les permissions RBAC
- Notification temps réel

## 📧 Support

Pour toute question sur les données de démo:
- Email: support@arcane.com
- Docs: /docs/demo-data
- Slack: #demo-support

---

**Dernière mise à jour**: Novembre 2024
**Version**: 1.0.0
**Statut**: Production Ready 🚀