# Data Sync Module

Module de synchronisation de données football pour Arcane Football Platform.

## Structure

```
data-sync/
├── data-sync.module.ts          # Module NestJS principal
├── data-sync.service.ts         # Service de synchronisation orchestrateur
├── data-sync.controller.ts      # Endpoints admin pour déclenchement manuel
├── services/
│   └── api-football.service.ts  # Service API-Football avec retry logic
├── mappers/
│   ├── club.mapper.ts           # Mapper clubs API → Prisma
│   ├── player.mapper.ts         # Mapper joueurs API → Prisma
│   ├── competition.mapper.ts    # Mapper competitions API → Prisma
│   └── normalizer.util.ts       # Utilitaires normalisation et fuzzy matching
└── cron/
    └── data-sync.cron.ts        # Cron jobs automatisés
```

## Configuration

### Variables d'environnement

Ajouter dans `.env`:

```bash
API_FOOTBALL_KEY=your_api_key_here
```

Pour obtenir une clé API:
1. S'inscrire sur https://www.api-football.com/
2. Plan gratuit: 100 requêtes/jour
3. Plans payants: $25/mois (3000 req/j), $100/mois (15000 req/j)

## Fonctionnalités

### 1. Synchronisation automatique (Cron Jobs)

- **Competitions** (mensuel): 1er du mois à 02:00 UTC
- **Clubs** (hebdomadaire): Lundis à 03:00 UTC
- **Players** (hebdomadaire): Lundis à 04:00 UTC avec rate limiting (2s entre clubs)
- **Matches** (quotidien): Tous les jours à 06:00 UTC

### 2. Endpoints Admin

Tous les endpoints nécessitent authentification JWT + rôle ADMIN ou SUPER_ADMIN.

#### POST /admin/data-sync/competitions
Synchronise toutes les competitions majeures (Top 5 ligues EU).

**Body:**
```json
{
  "source": "api-football"
}
```

#### POST /admin/data-sync/clubs
Synchronise les clubs d'une competition.

**Body:**
```json
{
  "competitionId": "61",
  "source": "api-football"
}
```

#### POST /admin/data-sync/players
Synchronise les joueurs d'un club.

**Body:**
```json
{
  "clubId": "85",
  "source": "api-football"
}
```

#### POST /admin/data-sync/matches
Synchronise les matchs d'une competition.

**Body:**
```json
{
  "competitionId": "61",
  "source": "api-football"
}
```

#### POST /admin/data-sync/full
Synchronisation complète (SUPER_ADMIN uniquement).

**Body:**
```json
{
  "competitionIds": ["61", "39", "78", "135", "140"]
}
```

### 3. Competitions supportées

- **61**: Ligue 1 (France)
- **39**: Premier League (England)
- **78**: Bundesliga (Germany)
- **135**: Serie A (Italy)
- **140**: La Liga (Spain)

## Fonctionnement technique

### Batch Upserts

- **Competitions**: 50 records/transaction
- **Clubs**: 100 records/transaction
- **Players**: 100 records/transaction
- **Matches**: 500 records/transaction

### Rate Limiting

- **API-Football**: 10 requêtes/minute
- **Retry logic**: 3 tentatives avec exponential backoff (2^attempt secondes)
- **Delay entre clubs**: 2 secondes (lors du sync players)

### Gestion des doublons

- Utilise `externalId` comme clé unique pour upsert
- Normalisation des noms (espaces, apostrophes)
- Fuzzy matching avec algorithme Levenshtein (threshold 85%)

### Création automatique des Users

Lors du sync des joueurs, un User est automatiquement créé:
- Email: `player_{externalId}@arcane-sync.internal`
- Role: `PLAYER`
- firstName/lastName extraits du nom complet

## Utilisation

### Démarrage du serveur

Les cron jobs se lancent automatiquement au démarrage:

```bash
npm run start:dev
```

### Synchronisation manuelle

Via curl (exemple):

```bash
# Sync competitions
curl -X POST http://localhost:3000/admin/data-sync/competitions \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"source": "api-football"}'

# Full sync
curl -X POST http://localhost:3000/admin/data-sync/full \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"competitionIds": ["61", "39", "78", "135", "140"]}'
```

## Logs

Le module utilise le Logger NestJS:

```
[DataSyncService] Starting competition sync from api-football
[DataSyncService] Successfully synced 5 competitions
[DataSyncCron] Starting weekly clubs sync
[ApiFootballService] Attempt 2/3 failed: HTTP 429: Too Many Requests
```

## Monitoring

Logs disponibles via:
- Console (développement)
- Sentry (production) - erreurs automatiquement capturées
- Winston (si configuré)

## Limitations

- **API gratuite**: 100 requêtes/jour
- **Full sync**: ~150 requêtes (5 competitions + 90 clubs + 50 matches)
- **Recommandation**: Utiliser plan payant pour production

## Roadmap

### Phase 2 (optionnel)
- Ajout Football-Data.org API (backup)
- Support ligues amateurs (Regionalliga, Tercera)
- Webhooks temps réel pour live scores
- Cache Redis pour optimiser les requêtes

### Phase 3 (scale)
- Migration vers Sportradar/Opta (données officielles)
- Synchronisation multi-régions (Amérique, Asie)
- Analytics avancées (xG, heat maps)

## Support

En cas de problème:
1. Vérifier les logs (`[DataSyncService]`)
2. Vérifier la clé API (`API_FOOTBALL_KEY`)
3. Vérifier les quotas API restants
4. Vérifier Sentry pour les erreurs

## Licence

Internal use - Arcane Football Platform
