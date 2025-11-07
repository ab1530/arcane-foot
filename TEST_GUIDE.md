# 🧪 Guide de Test - Arcane Football Platform

## 📋 Prérequis

1. **Serveur backend lancé** : `npm run start:dev`
2. **Base de données** : PostgreSQL connectée
3. **Compte admin** : `admin@arcane.com` / `Password123!`

## 🚀 Tests Rapides (Manuel avec curl)

### 1. Test de Santé du Serveur
```bash
curl http://localhost:3000/api/health
```
✅ Attendu : `{"status":"ok"}`

### 2. Test d'Authentification
```bash
# Login admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@arcane.com","password":"Password123!"}'
```
✅ Attendu : Réponse avec `token` et `user`

**Sauvegarder le token pour les tests suivants:**
```bash
export TOKEN="votre_token_ici"
```

### 3. Test Système de Validation

#### Obtenir les joueurs en attente
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/admin/players/pending-validation?limit=5"
```

#### Obtenir les statistiques
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/admin/players/verification-stats
```

#### Valider un joueur (remplacer PLAYER_ID)
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Test validation","notifyPlayer":false}' \
  "http://localhost:3000/api/admin/players/PLAYER_ID/validate"
```

### 4. Test Gamification

#### Profil utilisateur
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/gamification/profile
```

#### Achievements
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/gamification/achievements
```

#### Leaderboard
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/gamification/leaderboard/WEEKLY_OVERALL?limit=10"
```

#### Daily Challenge
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/gamification/daily-challenge
```

### 5. Test AI Intelligence

#### Analyse joueur (remplacer PLAYER_ID)
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/ai/player-analysis/PLAYER_ID
```

#### Prédiction de talent
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/ai/talent-prediction/PLAYER_ID
```

#### Recommandations de clubs
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/ai/match-recommendation/PLAYER_ID
```

#### Détection fraude
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/ai/suspicious-detection/PLAYER_ID
```

### 6. Test APIs Externes

#### OpenLigaDB - Matches
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/external-apis/openliga/matches?league=bl1"
```

#### TheSportsDB - Recherche équipe
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/external-apis/sportsdb/team/search?name=Arsenal"
```

#### Football-Data - Download
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/external-apis/footballdata/download/E0
```

## 🎯 Test Automatisé Complet

### Exécuter le script de test
```bash
cd backend
npx ts-node src/scripts/test-all-systems.ts
```

Ce script va tester:
- ✅ Authentification
- ✅ Système de validation (11 endpoints)
- ✅ Gamification (7 endpoints)
- ✅ AI Intelligence (5 endpoints)
- ✅ APIs Externes (6 endpoints)
- ✅ Performance

## 📊 Vérification de la Documentation API

Ouvrir Swagger UI pour voir tous les endpoints:
```
http://localhost:3000/api/docs
```

### Endpoints par Système:

#### Player Validation (11 endpoints)
- `GET /api/admin/players/pending-validation`
- `GET /api/admin/players/by-status/{status}`
- `POST /api/admin/players/{id}/validate`
- `POST /api/admin/players/{id}/reject`
- `POST /api/admin/players/{id}/mark-suspicious`
- `POST /api/admin/players/{id}/convert-to-agency`
- `GET /api/admin/players/verification-stats`
- `GET /api/admin/players/{id}/validation-history`
- `POST /api/admin/players/bulk-import`
- `POST /api/admin/players/bulk-import-csv`
- `GET /api/admin/players/export-csv`

#### Gamification (10 endpoints)
- `GET /api/gamification/profile`
- `GET /api/gamification/achievements`
- `GET /api/gamification/badges`
- `GET /api/gamification/leaderboard/{category}`
- `GET /api/gamification/daily-challenge`
- `POST /api/gamification/daily-challenge/claim`
- `POST /api/gamification/achievement/{id}/share`
- `POST /api/gamification/badge/{id}/pin`
- `GET /api/gamification/stats`
- `POST /api/gamification/track-action/{action}`

#### AI Intelligence (7 endpoints)
- `POST /api/ai/summary`
- `GET /api/ai/index/{playerId}`
- `POST /api/ai/matchmaking`
- `GET /api/ai/player-analysis/{playerId}`
- `GET /api/ai/talent-prediction/{playerId}`
- `GET /api/ai/match-recommendation/{playerId}`
- `GET /api/ai/suspicious-detection/{playerId}`

#### External APIs (13 endpoints)
- `GET /api/external-apis/openliga/matches`
- `GET /api/external-apis/openliga/live`
- `GET /api/external-apis/openliga/teams/{season}`
- `POST /api/external-apis/openliga/sync`
- `GET /api/external-apis/sportsdb/team/search`
- `GET /api/external-apis/sportsdb/player/search`
- `GET /api/external-apis/sportsdb/team/{id}/events`
- `POST /api/external-apis/sportsdb/sync/logos`
- `POST /api/external-apis/sportsdb/sync/players`
- `GET /api/external-apis/footballdata/download/{league}`
- `POST /api/external-apis/footballdata/sync/current`
- `GET /api/external-apis/footballdata/stats/{league}`
- `POST /api/external-apis/sync/all`

## 🔍 Vérifications de Base de Données

### Vérifier les tables gamification
```sql
SELECT * FROM user_stats LIMIT 5;
SELECT * FROM achievements LIMIT 10;
SELECT * FROM leaderboards ORDER BY rank LIMIT 10;
```

### Vérifier les joueurs PUBLIC
```sql
SELECT
  id,
  "firstName",
  "lastName",
  "verificationStatus",
  "playerType"
FROM players
WHERE "playerType" = 'PUBLIC'
LIMIT 10;
```

### Vérifier les données externes
```sql
SELECT * FROM matches WHERE "externalSource" IS NOT NULL LIMIT 5;
SELECT * FROM clubs WHERE "externalSource" IS NOT NULL LIMIT 5;
```

## 📱 Test d'Interface Admin

### Dashboard Admin
```
http://localhost:3001/admin/player-validation
```

Fonctionnalités à tester:
- ✅ Voir liste des joueurs pending
- ✅ Valider un joueur
- ✅ Rejeter un joueur
- ✅ Voir statistiques en temps réel
- ✅ Export CSV
- ✅ Bulk import

## ⚡ Test de Performance

### Test de charge simple
```bash
# Installer Apache Bench si nécessaire
brew install httpd

# Test 100 requêtes, 10 concurrentes
ab -n 100 -c 10 -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/auth/me
```

Objectifs:
- ✅ Response time < 200ms
- ✅ 0% failed requests
- ✅ > 50 requests/sec

### Test cache Redis
```bash
# Première requête (cache miss)
time curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/gamification/profile

# Deuxième requête (cache hit - devrait être plus rapide)
time curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/gamification/profile
```

## 🐛 Troubleshooting

### Erreur: Cannot find module
```bash
# Nettoyer et réinstaller
rm -rf node_modules dist
npm install
npm run build
```

### Erreur: Database connection
```bash
# Vérifier Prisma
npx prisma db push
npx prisma generate
```

### Erreur: JWT token expired
```bash
# Re-login pour obtenir un nouveau token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@arcane.com","password":"Password123!"}'
```

### Serveur ne démarre pas
```bash
# Vérifier les logs
npm run start:dev

# Vérifier le port
lsof -i :3000
```

## ✅ Checklist de Test Complet

### Système de Validation
- [ ] Login admin fonctionne
- [ ] Peut voir les joueurs pending
- [ ] Peut valider un joueur
- [ ] Peut rejeter un joueur
- [ ] Statistiques s'affichent correctement
- [ ] Export CSV fonctionne
- [ ] Historique de validation accessible

### Gamification
- [ ] Profil utilisateur charge
- [ ] Liste des achievements affichée
- [ ] Badges visibles
- [ ] Leaderboard fonctionne
- [ ] Daily challenge accessible
- [ ] Track action fonctionne

### AI Intelligence
- [ ] Analyse joueur retourne des données
- [ ] Prédiction de talent fonctionne
- [ ] Recommandations de clubs générées
- [ ] Détection fraude opérationnelle

### APIs Externes
- [ ] OpenLigaDB retourne des matches
- [ ] TheSportsDB recherche fonctionne
- [ ] Football-Data download OK
- [ ] Sync manuel fonctionne

### Performance
- [ ] Response time < 200ms
- [ ] Pas d'erreurs 500
- [ ] Cache fonctionne (Redis optionnel)
- [ ] Database queries optimisées

## 📈 Résultats Attendus

### Coverage API
- ✅ 41 nouveaux endpoints créés
- ✅ Tous documentés avec Swagger
- ✅ Authentification JWT sur tous
- ✅ RBAC (Role-Based Access Control)

### Performance
- ✅ < 200ms average response time
- ✅ Gestion de 100+ requêtes/sec
- ✅ 0% erreur rate
- ✅ Cache hit rate > 70% (avec Redis)

### Données
- ✅ 60 joueurs celebrities seedés
- ✅ 20 clubs majeurs disponibles
- ✅ Matches externes synchronisés
- ✅ Logos et images enrichis

---

**Date de création**: 2025-11-04
**Systèmes testés**: 6 systèmes majeurs
**Total endpoints**: 41 nouveaux endpoints
