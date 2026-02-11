# ARCANE FOOTBALL DATA ENRICHMENT PIPELINE PLAN

## Executive Summary

Ce document presente un plan complet pour alimenter la plateforme Arcane Football avec des donnees football reelles issues de sources ouvertes et legales. L'objectif est de peupler les tables `players`, `clubs`, `competitions` et `matches` avec des donnees europeennes (professionnelles et amateurs) utilisables immediatement pour les modules Players, Clubs, Matches, Analytics et Scouting.

---

## 1. Sources de Donnees Recommandees

### 1.1 Sources Gratuites/Open Source (Priorite 1)

#### **A. Football-Data.org API**
- **URL**: https://www.football-data.org/
- **Couverture**: Top 5 ligues europeennes (EPL, Bundesliga, Serie A, La Liga, Ligue 1) + competitions internationales
- **Rate Limits**: 10 requetes/minute (gratuit), 10 competitions max
- **Cout**: Gratuit (tier basique), 12 EUR/mois (tier tiers competitions)
- **Donnees disponibles**:
  - Competitions (ligues, coupes)
  - Clubs avec logos
  - Matchs (calendrier, scores, statistiques)
  - Joueurs (effectifs par club)
- **Endpoints cles**:
  ```
  GET /v4/competitions
  GET /v4/competitions/{id}/teams
  GET /v4/competitions/{id}/matches
  GET /v4/teams/{id}
  GET /v4/teams/{id}/matches
  ```
- **Format**: JSON
- **Documentation**: https://www.football-data.org/documentation/quickstart

#### **B. API-Football (RapidAPI)**
- **URL**: https://www.api-football.com/
- **Couverture**: 900+ ligues mondiales (pros + amateurs)
- **Rate Limits**: 100 requetes/jour (gratuit)
- **Cout**: Gratuit (100 req/j), $25/mois (3000 req/j), $100/mois (15000 req/j)
- **Donnees disponibles**:
  - Competitions (toutes divisions)
  - Clubs avec logos/stades
  - Joueurs (profils complets: age, poste, statistiques)
  - Matchs avec statistiques detaillees
  - Transferts et valuations
- **Endpoints cles**:
  ```
  GET /leagues
  GET /teams?league={id}&season={year}
  GET /players/squads?team={id}
  GET /fixtures?league={id}&season={year}
  GET /players?id={id}&season={year}
  ```
- **Format**: JSON
- **Documentation**: https://www.api-football.com/documentation-v3

#### **C. TheSportsDB API**
- **URL**: https://www.thesportsdb.com/
- **Couverture**: Donnees visuelles (logos, images joueurs, stades)
- **Rate Limits**: 1 requete/2 secondes (gratuit)
- **Cout**: Gratuit (avec attribution), $3/mois (Patreon pour rate limits augmentes)
- **Donnees disponibles**:
  - Logos clubs HD
  - Photos joueurs
  - Images stades
  - Badges competitions
- **Endpoints cles**:
  ```
  GET /api/v1/json/{API_KEY}/searchteams.php?t={teamName}
  GET /api/v1/json/{API_KEY}/lookupplayer.php?id={id}
  GET /api/v1/json/{API_KEY}/lookupteam.php?id={id}
  ```
- **Format**: JSON
- **Documentation**: https://www.thesportsdb.com/api.php

#### **D. OpenLigaDB (Allemagne)**
- **URL**: https://www.openligadb.de/
- **Couverture**: Bundesliga, 2. Bundesliga, 3. Liga, Regionalliga
- **Rate Limits**: Aucune limite stricte
- **Cout**: 100% gratuit
- **Donnees disponibles**:
  - Competitions allemandes
  - Matchs avec scores
  - Clubs
- **Endpoints cles**:
  ```
  GET /getavailableleagues
  GET /getmatchdata/{leagueShortcut}/{season}
  GET /getavailableteams/{leagueShortcut}/{season}
  ```
- **Format**: JSON
- **Documentation**: https://github.com/OpenLigaDB/OpenLigaDB-Samples

#### **E. Football.Data.Co.UK (Datasets CSV)**
- **URL**: https://www.football-data.co.uk/
- **Couverture**: Donnees historiques (1993-present) pour 50+ ligues
- **Rate Limits**: Aucune (fichiers statiques)
- **Cout**: 100% gratuit
- **Donnees disponibles**:
  - Resultats matchs (historique complet)
  - Statistiques par match (corners, fautes, cartons)
  - Donnees betting (cotes)
- **Format**: CSV
- **Documentation**: https://www.football-data.co.uk/notes.txt

### 1.2 Sources Payantes (Scale Production - Phase 2)

#### **A. Sportradar API**
- **URL**: https://sportradar.com/
- **Couverture**: Donnees professionnelles mondiales
- **Cout**: Sur devis (estimé 500-5000 EUR/mois selon volume)
- **Avantages**: Donnees officielles, live updates, statistiques avancees

#### **B. Opta Sports**
- **URL**: https://www.statsperform.com/opta/
- **Couverture**: Statistiques avancees (xG, heat maps, passes completed)
- **Cout**: Sur devis (estimé 1000+ EUR/mois)
- **Avantages**: Donnees analytiques professionnelles

### 1.3 Sources Amateurs Europeennes

#### **France**
- **FFF API**: Pas d'API publique, mais competitions N2/N3 via Football-Data.co.uk
- **Footeo Scraping**: LEGAL avec respect robots.txt (clubs amateurs)
- **Dataset manual**: Creation manuelle via recherche publique

#### **Espagne**
- **Tercera Division**: Donnees partielles via API-Football
- **RFEF Website**: Donnees publiques (scraping legal avec precautions)

#### **Allemagne**
- **Regionalliga**: Couverte par OpenLigaDB
- **Oberliga**: Dataset manuel requis

### 1.4 Recommandations de Priorisation

**Phase 1 (Immediate - Gratuit)**:
1. Football-Data.org (Top 5 ligues)
2. API-Football (100 req/jour - bootstrap initial)
3. TheSportsDB (logos et visuels)
4. OpenLigaDB (Allemagne)
5. Football.Data.Co.UK (historique)

**Phase 2 (3-6 mois - Budget limite)**:
1. API-Football tier payant ($25/mois)
2. Agregation manuelle donnees amateurs (via recherche publique)

**Phase 3 (Scale - Production)**:
1. Sportradar ou Opta (donnees officielles)
2. Webhooks temps reel

---

## 2. Schema Base de Donnees - Analyse & Optimisations

### 2.1 Schema Prisma Actuel (Analyse)

D'apres `/Users/lakhdari/Desktop/AppFoot/backend/prisma/schema.prisma`:

**Tables principales**:
- `clubs` (id, name, shortName, logo, country, city, stadium, founded, website)
- `competitions` (id, name, shortName, country, level, type, season, logo)
- `venues` (id, name, address, city, country, latitude, longitude, capacity, surfaceType)
- `players` (id, userId, clubId, position, height, weight, dateOfBirth, nationality, jerseyNumber, status, marketValue, statsJson)
- `matches` (id, homeClubId, awayClubId, scheduledAt, venueId, competitionId, season, status, homeScore, awayScore)

### 2.2 Champs Manquants pour Enrichissement

#### **Table `clubs`**
```prisma
model Club {
  // ... champs existants

  // NOUVEAUX CHAMPS PROPOSES
  leagueId          String?           // Lien vers competition actuelle
  league            Competition?      @relation("ClubLeague", fields: [leagueId], references: [id])
  externalId        String?           @unique // ID API externe (API-Football, Football-Data)
  externalSource    String?           // "api-football", "football-data", "openligadb"
  lastSyncAt        DateTime?         // Derniere synchronisation

  @@index([externalId])
  @@index([leagueId])
}
```

#### **Table `competitions`**
```prisma
model Competition {
  // ... champs existants

  // NOUVEAUX CHAMPS PROPOSES
  externalId        String?   @unique
  externalSource    String?
  startDate         DateTime?
  endDate           DateTime?
  currentMatchday   Int?
  lastSyncAt        DateTime?

  // Relations
  clubs             Club[]    @relation("ClubLeague")

  @@index([externalId])
}
```

#### **Table `players`**
```prisma
model Player {
  // ... champs existants

  // NOUVEAUX CHAMPS PROPOSES
  externalId        String?   @unique
  externalSource    String?
  photoUrl          String?   // Photo profil joueur
  lastSyncAt        DateTime?

  // Statistiques enrichies (dans statsJson)
  // {
  //   "season": "2024-2025",
  //   "appearances": 25,
  //   "goals": 12,
  //   "assists": 8,
  //   "minutesPlayed": 2100,
  //   "yellowCards": 3,
  //   "redCards": 0,
  //   "rating": 7.8
  // }

  @@index([externalId])
}
```

### 2.3 Indexes Recommandes pour Performance

```prisma
// Optimisation recherche multi-criteres
@@index([country, city]) // clubs
@@index([season, country]) // competitions
@@index([scheduledAt, status]) // matches
@@index([position, nationality]) // players
@@index([externalSource, externalId]) // tous les modeles
```

### 2.4 Migration Prisma Proposee

```bash
# Creer nouvelle migration
npx prisma migrate dev --name add_external_sync_fields

# Generer client
npx prisma generate
```

---

## 3. Architecture de la Pipeline de Donnees

### 3.1 Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                     SOURCES DE DONNEES                          │
├─────────────────────────────────────────────────────────────────┤
│  Football-Data.org  │  API-Football  │  OpenLigaDB  │  TheSportsDB │
└──────────┬──────────┴────────┬───────┴──────┬───────┴──────┬─────┘
           │                   │              │              │
           v                   v              v              v
┌─────────────────────────────────────────────────────────────────┐
│                   INGESTION LAYER (NestJS)                      │
├─────────────────────────────────────────────────────────────────┤
│  - FootballDataService                                          │
│  - ApiFootballService                                           │
│  - OpenLigaDBService                                            │
│  - TheSportsDBService                                           │
│                                                                 │
│  Responsabilites:                                               │
│  - Authentification APIs                                        │
│  - Rate limiting / retry logic                                  │
│  - Pagination automatique                                       │
│  - Cache Redis (optionnel)                                      │
└──────────┬──────────────────────────────────────────────────────┘
           │
           v
┌─────────────────────────────────────────────────────────────────┐
│                TRANSFORMATION LAYER (DTO Mappers)               │
├─────────────────────────────────────────────────────────────────┤
│  - Normalisation noms (accents, formats)                        │
│  - Mapping IDs externes vers IDs internes                       │
│  - Validation donnees (class-validator)                         │
│  - Deduplication (matching fuzzy)                               │
│  - Enrichissement croise (merge multiple sources)               │
└──────────┬──────────────────────────────────────────────────────┘
           │
           v
┌─────────────────────────────────────────────────────────────────┐
│                  UPSERT LAYER (Prisma Client)                   │
├─────────────────────────────────────────────────────────────────┤
│  - Batch upserts (max 1000 records)                             │
│  - Transaction atomiques                                        │
│  - Conflict resolution (lastSyncAt comparison)                  │
│  - Error handling & rollback                                    │
└──────────┬──────────────────────────────────────────────────────┘
           │
           v
┌─────────────────────────────────────────────────────────────────┐
│               POSTGRESQL (via Prisma/Supabase)                  │
├─────────────────────────────────────────────────────────────────┤
│  Tables: clubs, competitions, venues, players, matches          │
└──────────┬──────────────────────────────────────────────────────┘
           │
           v
┌─────────────────────────────────────────────────────────────────┐
│                    MONITORING & LOGGING                         │
├─────────────────────────────────────────────────────────────────┤
│  - Sentry (erreurs)                                             │
│  - Logs NestJS (Winston)                                        │
│  - Metriques: records synced, erreurs, duree                    │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Modules NestJS Proposes

```
backend/src/modules/
├── data-sync/
│   ├── data-sync.module.ts
│   ├── data-sync.service.ts
│   ├── data-sync.controller.ts (endpoints admin)
│   ├── services/
│   │   ├── football-data.service.ts
│   │   ├── api-football.service.ts
│   │   ├── openligadb.service.ts
│   │   └── thesportsdb.service.ts
│   ├── mappers/
│   │   ├── club.mapper.ts
│   │   ├── competition.mapper.ts
│   │   ├── player.mapper.ts
│   │   ├── match.mapper.ts
│   │   └── normalizer.util.ts
│   ├── dto/
│   │   ├── external-club.dto.ts
│   │   ├── external-player.dto.ts
│   │   └── sync-config.dto.ts
│   └── cron/
│       └── data-sync.cron.ts
```

### 3.3 Flow de Synchronisation

1. **Competitions** (1x par saison)
   - Recuperer liste competitions actives
   - Upsert dans `competitions` table
   - Stocker `externalId` pour mapping

2. **Clubs** (1x par semaine)
   - Pour chaque competition, recuperer clubs
   - Enrichir avec logos (TheSportsDB)
   - Upsert dans `clubs` table

3. **Players** (1x par semaine)
   - Pour chaque club, recuperer effectif
   - Creer `User` si inexistant (PLAYER role)
   - Upsert dans `players` table

4. **Matches** (daily)
   - Recuperer calendrier competitions
   - Upsert matchs futurs (status: SCHEDULED)
   - Update scores matchs termines (status: COMPLETED)

---

## 4. Exemples de Datasets JSON

### 4.1 Competition (Ligue 1)

```json
{
  "id": "cuid_generated",
  "name": "Ligue 1",
  "shortName": "L1",
  "country": "FR",
  "level": "professional",
  "type": "league",
  "season": "2024-2025",
  "logo": "https://media.api-sports.io/football/leagues/61.png",
  "externalId": "61",
  "externalSource": "api-football",
  "startDate": "2024-08-15T00:00:00Z",
  "endDate": "2025-05-25T00:00:00Z",
  "currentMatchday": 12,
  "lastSyncAt": "2025-11-03T20:00:00Z"
}
```

### 4.2 Club (Paris Saint-Germain)

```json
{
  "id": "cuid_generated",
  "name": "Paris Saint-Germain",
  "shortName": "PSG",
  "logo": "https://media.api-sports.io/football/teams/85.png",
  "country": "FR",
  "city": "Paris",
  "stadium": "Parc des Princes",
  "founded": 1970,
  "website": "https://www.psg.fr",
  "leagueId": "cuid_ligue1",
  "externalId": "85",
  "externalSource": "api-football",
  "lastSyncAt": "2025-11-03T20:00:00Z"
}
```

### 4.3 Player (Kylian Mbappe)

```json
{
  "id": "cuid_generated",
  "userId": "cuid_user",
  "clubId": "cuid_psg",
  "position": "Forward",
  "height": 178,
  "weight": 73,
  "preferredFoot": "Right",
  "nationality": "FR",
  "dateOfBirth": "1998-12-20T00:00:00Z",
  "jerseyNumber": 7,
  "status": "ACTIVE",
  "marketValue": 180000000,
  "contractUntil": "2029-06-30T00:00:00Z",
  "photoUrl": "https://media.api-sports.io/football/players/276.png",
  "externalId": "276",
  "externalSource": "api-football",
  "lastSyncAt": "2025-11-03T20:00:00Z",
  "statsJson": {
    "season": "2024-2025",
    "appearances": 25,
    "goals": 18,
    "assists": 12,
    "minutesPlayed": 2150,
    "yellowCards": 2,
    "redCards": 0,
    "rating": 8.4
  }
}
```

### 4.4 Match (PSG vs OM)

```json
{
  "id": "cuid_generated",
  "homeClubId": "cuid_psg",
  "awayClubId": "cuid_om",
  "competitionId": "cuid_ligue1",
  "scheduledAt": "2025-11-15T21:00:00Z",
  "matchDate": "2025-11-15T00:00:00Z",
  "matchTime": "21:00",
  "timezone": "Europe/Paris",
  "venueId": "cuid_parc_des_princes",
  "season": "2024-2025",
  "round": "Matchday 12",
  "status": "SCHEDULED",
  "homeScore": null,
  "awayScore": null,
  "referee": "Clement Turpin",
  "attendance": null
}
```

### 4.5 Dataset Complet - Ligue 1 (Schema)

```json
{
  "metadata": {
    "source": "api-football",
    "syncedAt": "2025-11-03T20:00:00Z",
    "league": "Ligue 1",
    "season": "2024-2025",
    "totalClubs": 18,
    "totalPlayers": 540,
    "totalMatches": 306
  },
  "competition": { /* ... */ },
  "clubs": [
    { /* PSG */ },
    { /* OM */ },
    { /* OL */ }
    // ... 15 autres clubs
  ],
  "players": [
    { /* Mbappe */ },
    { /* Griezmann */ }
    // ... 538 autres joueurs
  ],
  "matches": [
    { /* PSG vs OM */ }
    // ... 305 autres matchs
  ]
}
```

---

## 5. Script d'Import TypeScript

### 5.1 Service Principal: DataSyncService

```typescript
// backend/src/modules/data-sync/data-sync.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FootballDataService } from './services/football-data.service';
import { ApiFootballService } from './services/api-football.service';
import { ClubMapper } from './mappers/club.mapper';
import { PlayerMapper } from './mappers/player.mapper';
import { MatchMapper } from './mappers/match.mapper';

@Injectable()
export class DataSyncService {
  private readonly logger = new Logger(DataSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly footballDataService: FootballDataService,
    private readonly apiFootballService: ApiFootballService,
    private readonly clubMapper: ClubMapper,
    private readonly playerMapper: PlayerMapper,
    private readonly matchMapper: MatchMapper,
  ) {}

  /**
   * Synchronise toutes les competitions principales
   */
  async syncCompetitions(source: 'football-data' | 'api-football' = 'api-football'): Promise<void> {
    this.logger.log(`Starting competition sync from ${source}`);

    try {
      const externalCompetitions = await this.apiFootballService.getCompetitions();
      const competitions = [];

      for (const extComp of externalCompetitions) {
        competitions.push({
          name: extComp.name,
          shortName: extComp.shortName,
          country: extComp.country,
          level: 'professional',
          type: extComp.type,
          season: extComp.season,
          logo: extComp.logo,
          externalId: extComp.id.toString(),
          externalSource: source,
          startDate: extComp.startDate,
          endDate: extComp.endDate,
          currentMatchday: extComp.currentMatchday,
          lastSyncAt: new Date(),
        });
      }

      // Batch upsert (max 50 competitions)
      await this.batchUpsertCompetitions(competitions);

      this.logger.log(`Successfully synced ${competitions.length} competitions`);
    } catch (error) {
      this.logger.error(`Error syncing competitions: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Synchronise tous les clubs d'une competition
   */
  async syncClubs(competitionExternalId: string, source: string): Promise<void> {
    this.logger.log(`Starting clubs sync for competition ${competitionExternalId}`);

    try {
      // Recuperer competition locale
      const competition = await this.prisma.competition.findUnique({
        where: { externalId: competitionExternalId },
      });

      if (!competition) {
        throw new Error(`Competition ${competitionExternalId} not found in database`);
      }

      // Recuperer clubs depuis API
      const externalClubs = await this.apiFootballService.getTeams(competitionExternalId);
      const clubs = [];

      for (const extClub of externalClubs) {
        const mappedClub = this.clubMapper.fromExternal(extClub, source);
        mappedClub.leagueId = competition.id; // Lien avec competition
        clubs.push(mappedClub);
      }

      // Batch upsert (max 100 clubs)
      await this.batchUpsertClubs(clubs, 100);

      this.logger.log(`Successfully synced ${clubs.length} clubs`);
    } catch (error) {
      this.logger.error(`Error syncing clubs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Synchronise les joueurs d'un club
   */
  async syncPlayers(clubExternalId: string, source: string): Promise<void> {
    this.logger.log(`Starting players sync for club ${clubExternalId}`);

    try {
      // Recuperer club local
      const club = await this.prisma.club.findUnique({
        where: { externalId: clubExternalId },
      });

      if (!club) {
        throw new Error(`Club ${clubExternalId} not found in database`);
      }

      // Recuperer joueurs depuis API
      const externalPlayers = await this.apiFootballService.getPlayers(clubExternalId);
      const players = [];

      for (const extPlayer of externalPlayers) {
        // Creer ou recuperer User pour ce joueur
        const user = await this.findOrCreatePlayerUser(extPlayer);

        const mappedPlayer = this.playerMapper.fromExternal(extPlayer, source);
        mappedPlayer.userId = user.id;
        mappedPlayer.clubId = club.id;
        players.push(mappedPlayer);
      }

      // Batch upsert (max 100 players)
      await this.batchUpsertPlayers(players, 100);

      this.logger.log(`Successfully synced ${players.length} players`);
    } catch (error) {
      this.logger.error(`Error syncing players: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Synchronise les matchs d'une competition
   */
  async syncMatches(competitionExternalId: string, source: string): Promise<void> {
    this.logger.log(`Starting matches sync for competition ${competitionExternalId}`);

    try {
      const competition = await this.prisma.competition.findUnique({
        where: { externalId: competitionExternalId },
      });

      if (!competition) {
        throw new Error(`Competition ${competitionExternalId} not found`);
      }

      // Recuperer matchs depuis API
      const externalMatches = await this.apiFootballService.getFixtures(competitionExternalId);
      const matches = [];

      for (const extMatch of externalMatches) {
        // Trouver clubs locaux via externalId
        const homeClub = await this.prisma.club.findUnique({
          where: { externalId: extMatch.homeTeamId.toString() },
        });
        const awayClub = await this.prisma.club.findUnique({
          where: { externalId: extMatch.awayTeamId.toString() },
        });

        if (!homeClub || !awayClub) {
          this.logger.warn(`Skipping match: clubs not found (home: ${extMatch.homeTeamId}, away: ${extMatch.awayTeamId})`);
          continue;
        }

        const mappedMatch = this.matchMapper.fromExternal(extMatch, source);
        mappedMatch.homeClubId = homeClub.id;
        mappedMatch.awayClubId = awayClub.id;
        mappedMatch.competitionId = competition.id;
        matches.push(mappedMatch);
      }

      // Batch upsert (max 500 matches)
      await this.batchUpsertMatches(matches, 500);

      this.logger.log(`Successfully synced ${matches.length} matches`);
    } catch (error) {
      this.logger.error(`Error syncing matches: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Batch upsert competitions (transaction atomique)
   */
  private async batchUpsertCompetitions(competitions: any[], batchSize = 50): Promise<void> {
    for (let i = 0; i < competitions.length; i += batchSize) {
      const batch = competitions.slice(i, i + batchSize);

      await this.prisma.$transaction(
        batch.map((comp) =>
          this.prisma.competition.upsert({
            where: { externalId: comp.externalId },
            update: { ...comp, updatedAt: new Date() },
            create: comp,
          })
        )
      );

      this.logger.debug(`Upserted batch ${i / batchSize + 1} (${batch.length} competitions)`);
    }
  }

  /**
   * Batch upsert clubs
   */
  private async batchUpsertClubs(clubs: any[], batchSize = 100): Promise<void> {
    for (let i = 0; i < clubs.length; i += batchSize) {
      const batch = clubs.slice(i, i + batchSize);

      await this.prisma.$transaction(
        batch.map((club) =>
          this.prisma.club.upsert({
            where: { externalId: club.externalId },
            update: { ...club, updatedAt: new Date() },
            create: club,
          })
        ),
        {
          timeout: 30000, // 30s timeout
        }
      );

      this.logger.debug(`Upserted batch ${i / batchSize + 1} (${batch.length} clubs)`);
    }
  }

  /**
   * Batch upsert players
   */
  private async batchUpsertPlayers(players: any[], batchSize = 100): Promise<void> {
    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize);

      await this.prisma.$transaction(
        batch.map((player) =>
          this.prisma.player.upsert({
            where: { externalId: player.externalId },
            update: { ...player, updatedAt: new Date() },
            create: player,
          })
        ),
        {
          timeout: 30000,
        }
      );

      this.logger.debug(`Upserted batch ${i / batchSize + 1} (${batch.length} players)`);
    }
  }

  /**
   * Batch upsert matches
   */
  private async batchUpsertMatches(matches: any[], batchSize = 500): Promise<void> {
    for (let i = 0; i < matches.length; i += batchSize) {
      const batch = matches.slice(i, i + batchSize);

      // Matches n'ont pas d'externalId unique, on utilise combinaison homeClubId + awayClubId + scheduledAt
      await this.prisma.$transaction(
        batch.map((match) =>
          this.prisma.match.upsert({
            where: {
              // Composite unique constraint (a ajouter au schema)
              homeClubId_awayClubId_scheduledAt: {
                homeClubId: match.homeClubId,
                awayClubId: match.awayClubId,
                scheduledAt: match.scheduledAt,
              },
            },
            update: { ...match, updatedAt: new Date() },
            create: match,
          })
        ),
        {
          timeout: 60000, // 60s timeout pour gros batch
        }
      );

      this.logger.debug(`Upserted batch ${i / batchSize + 1} (${batch.length} matches)`);
    }
  }

  /**
   * Trouve ou cree un User pour un joueur externe
   */
  private async findOrCreatePlayerUser(externalPlayer: any): Promise<any> {
    const email = `player_${externalPlayer.id}@arcane-sync.internal`;

    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          firstName: externalPlayer.firstName,
          lastName: externalPlayer.lastName,
          role: 'PLAYER',
          isActive: true,
          emailVerified: false,
        },
      });
    }

    return user;
  }

  /**
   * Full sync: competitions + clubs + players + matches
   */
  async fullSync(competitionIds: string[]): Promise<void> {
    this.logger.log('Starting full sync process');

    try {
      // 1. Sync competitions
      await this.syncCompetitions('api-football');

      // 2. Pour chaque competition, sync clubs
      for (const compId of competitionIds) {
        await this.syncClubs(compId, 'api-football');
      }

      // 3. Pour chaque club, sync players (avec rate limiting)
      const clubs = await this.prisma.club.findMany({
        where: { externalSource: 'api-football' },
      });

      for (const club of clubs) {
        await this.syncPlayers(club.externalId, 'api-football');
        await this.sleep(1000); // 1s delay entre chaque club (rate limiting)
      }

      // 4. Pour chaque competition, sync matches
      for (const compId of competitionIds) {
        await this.syncMatches(compId, 'api-football');
      }

      this.logger.log('Full sync completed successfully');
    } catch (error) {
      this.logger.error(`Full sync failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

### 5.2 API Football Service

```typescript
// backend/src/modules/data-sync/services/api-football.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiFootballService {
  private readonly logger = new Logger(ApiFootballService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://v3.football.api-sports.io';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('API_FOOTBALL_KEY');
  }

  /**
   * Recupere les competitions majeures
   */
  async getCompetitions(): Promise<any[]> {
    const leagues = [
      { id: 61, name: 'Ligue 1', country: 'FR' },
      { id: 39, name: 'Premier League', country: 'GB' },
      { id: 78, name: 'Bundesliga', country: 'DE' },
      { id: 135, name: 'Serie A', country: 'IT' },
      { id: 140, name: 'La Liga', country: 'ES' },
    ];

    const results = [];

    for (const league of leagues) {
      try {
        const data = await this.fetchApi(`/leagues?id=${league.id}&season=2024`);
        if (data.response && data.response.length > 0) {
          const comp = data.response[0];
          results.push({
            id: comp.league.id,
            name: comp.league.name,
            shortName: league.name,
            country: comp.country.code,
            type: comp.league.type,
            season: '2024-2025',
            logo: comp.league.logo,
            startDate: comp.seasons[0]?.start,
            endDate: comp.seasons[0]?.end,
            currentMatchday: comp.seasons[0]?.current ? 12 : null,
          });
        }
      } catch (error) {
        this.logger.error(`Failed to fetch league ${league.id}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Recupere les equipes d'une competition
   */
  async getTeams(leagueId: string): Promise<any[]> {
    const data = await this.fetchApi(`/teams?league=${leagueId}&season=2024`);

    return data.response.map((item: any) => ({
      id: item.team.id,
      name: item.team.name,
      shortName: item.team.code,
      logo: item.team.logo,
      country: item.team.country,
      city: item.venue?.city,
      stadium: item.venue?.name,
      founded: item.team.founded,
    }));
  }

  /**
   * Recupere les joueurs d'une equipe
   */
  async getPlayers(teamId: string): Promise<any[]> {
    const data = await this.fetchApi(`/players/squads?team=${teamId}`);

    if (!data.response || data.response.length === 0) {
      return [];
    }

    return data.response[0].players.map((player: any) => ({
      id: player.id,
      firstName: player.name.split(' ')[0],
      lastName: player.name.split(' ').slice(1).join(' '),
      position: player.position,
      age: player.age,
      nationality: player.nationality,
      photoUrl: player.photo,
    }));
  }

  /**
   * Recupere les matchs d'une competition
   */
  async getFixtures(leagueId: string): Promise<any[]> {
    const data = await this.fetchApi(`/fixtures?league=${leagueId}&season=2024`);

    return data.response.map((item: any) => ({
      homeTeamId: item.teams.home.id,
      awayTeamId: item.teams.away.id,
      scheduledAt: new Date(item.fixture.date),
      status: this.mapStatus(item.fixture.status.short),
      homeScore: item.goals.home,
      awayScore: item.goals.away,
      referee: item.fixture.referee,
      venue: item.fixture.venue.name,
      round: item.league.round,
    }));
  }

  /**
   * Fetch API avec retry logic
   */
  private async fetchApi(endpoint: string, retries = 3): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            'x-rapidapi-key': this.apiKey,
            'x-rapidapi-host': 'v3.football.api-sports.io',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.errors && Object.keys(data.errors).length > 0) {
          throw new Error(`API Error: ${JSON.stringify(data.errors)}`);
        }

        return data;
      } catch (error) {
        this.logger.warn(`Attempt ${attempt}/${retries} failed: ${error.message}`);

        if (attempt === retries) {
          throw error;
        }

        // Exponential backoff
        await this.sleep(1000 * Math.pow(2, attempt));
      }
    }
  }

  private mapStatus(apiStatus: string): string {
    const statusMap = {
      'TBD': 'SCHEDULED',
      'NS': 'SCHEDULED',
      '1H': 'LIVE',
      'HT': 'LIVE',
      '2H': 'LIVE',
      'ET': 'LIVE',
      'P': 'LIVE',
      'FT': 'COMPLETED',
      'AET': 'COMPLETED',
      'PEN': 'COMPLETED',
      'PST': 'POSTPONED',
      'CANC': 'CANCELLED',
    };

    return statusMap[apiStatus] || 'SCHEDULED';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

### 5.3 Mapper Exemple: Club

```typescript
// backend/src/modules/data-sync/mappers/club.mapper.ts

import { Injectable } from '@nestjs/common';
import { NormalizerUtil } from './normalizer.util';

@Injectable()
export class ClubMapper {
  constructor(private normalizer: NormalizerUtil) {}

  fromExternal(external: any, source: string): any {
    return {
      name: this.normalizer.normalizeName(external.name),
      shortName: external.shortName || external.name.substring(0, 10),
      logo: external.logo,
      country: external.country,
      city: external.city,
      stadium: external.stadium,
      founded: external.founded,
      website: null, // Non fourni par API-Football
      externalId: external.id.toString(),
      externalSource: source,
      lastSyncAt: new Date(),
    };
  }
}
```

### 5.4 Normalizer Utility

```typescript
// backend/src/modules/data-sync/mappers/normalizer.util.ts

import { Injectable } from '@nestjs/common';

@Injectable()
export class NormalizerUtil {
  /**
   * Normalise les noms (accents, majuscules, espaces)
   */
  normalizeName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ') // Multiples espaces -> 1 espace
      .replace(/['']/g, "'"); // Apostrophes uniformes
  }

  /**
   * Matching fuzzy pour deduplication
   */
  fuzzyMatch(str1: string, str2: string): boolean {
    const s1 = this.normalizeName(str1.toLowerCase());
    const s2 = this.normalizeName(str2.toLowerCase());

    // Levenshtein distance simplifiée
    const threshold = 0.85;
    const similarity = this.similarity(s1, s2);

    return similarity >= threshold;
  }

  private similarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) {
      return 1.0;
    }

    const editDistance = this.levenshtein(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshtein(s1: string, s2: string): number {
    const costs: number[] = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) {
        costs[s2.length] = lastValue;
      }
    }
    return costs[s2.length];
  }
}
```

---

## 6. Plan de Synchronisation et Automatisation

### 6.1 Strategie Cron (NestJS @nestjs/schedule)

```typescript
// backend/src/modules/data-sync/cron/data-sync.cron.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSyncService } from '../data-sync.service';

@Injectable()
export class DataSyncCron {
  private readonly logger = new Logger(DataSyncCron.name);

  constructor(private dataSyncService: DataSyncService) {}

  /**
   * Sync competitions (1x par mois)
   * Tous les 1er du mois a 02:00
   */
  @Cron('0 2 1 * *')
  async syncCompetitionsMonthly() {
    this.logger.log('Starting monthly competitions sync');
    try {
      await this.dataSyncService.syncCompetitions('api-football');
    } catch (error) {
      this.logger.error('Monthly competitions sync failed', error.stack);
    }
  }

  /**
   * Sync clubs (1x par semaine)
   * Tous les lundis a 03:00
   */
  @Cron('0 3 * * 1')
  async syncClubsWeekly() {
    this.logger.log('Starting weekly clubs sync');
    try {
      const competitions = ['61', '39', '78', '135', '140']; // Top 5 ligues
      for (const compId of competitions) {
        await this.dataSyncService.syncClubs(compId, 'api-football');
      }
    } catch (error) {
      this.logger.error('Weekly clubs sync failed', error.stack);
    }
  }

  /**
   * Sync players (1x par semaine)
   * Tous les lundis a 04:00
   */
  @Cron('0 4 * * 1')
  async syncPlayersWeekly() {
    this.logger.log('Starting weekly players sync');
    try {
      // Recuperer tous les clubs avec externalId
      const clubs = await this.dataSyncService['prisma'].club.findMany({
        where: { externalSource: 'api-football' },
        select: { externalId: true },
      });

      for (const club of clubs) {
        await this.dataSyncService.syncPlayers(club.externalId, 'api-football');
        await this.sleep(2000); // 2s delay (rate limiting)
      }
    } catch (error) {
      this.logger.error('Weekly players sync failed', error.stack);
    }
  }

  /**
   * Sync matches (daily)
   * Tous les jours a 06:00
   */
  @Cron('0 6 * * *')
  async syncMatchesDaily() {
    this.logger.log('Starting daily matches sync');
    try {
      const competitions = ['61', '39', '78', '135', '140'];
      for (const compId of competitions) {
        await this.dataSyncService.syncMatches(compId, 'api-football');
      }
    } catch (error) {
      this.logger.error('Daily matches sync failed', error.stack);
    }
  }

  /**
   * Update live matches (every 5 minutes during match hours)
   * De 18:00 a 23:00, toutes les 5 minutes
   */
  @Cron('*/5 18-23 * * *')
  async updateLiveMatches() {
    this.logger.log('Updating live matches');
    try {
      // Recuperer matchs en cours
      const liveMatches = await this.dataSyncService['prisma'].match.findMany({
        where: {
          status: 'LIVE',
          scheduledAt: {
            gte: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4h ago
          },
        },
      });

      // Update scores (via API)
      for (const match of liveMatches) {
        // TODO: Implementer update live
      }
    } catch (error) {
      this.logger.error('Live matches update failed', error.stack);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

### 6.2 Configuration Environment (.env)

```bash
# Data Sync APIs
API_FOOTBALL_KEY=your_api_key_here
FOOTBALL_DATA_KEY=your_api_key_here
THESPORTSDB_KEY=your_api_key_here

# Sync Settings
DATA_SYNC_ENABLED=true
DATA_SYNC_BATCH_SIZE=100
DATA_SYNC_RATE_LIMIT_MS=1000
```

### 6.3 Controller Admin (Triggers Manuels)

```typescript
// backend/src/modules/data-sync/data-sync.controller.ts

import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DataSyncService } from './data-sync.service';

@ApiTags('Data Sync')
@ApiBearerAuth()
@Controller('admin/data-sync')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DataSyncController {
  constructor(private dataSyncService: DataSyncService) {}

  @Post('competitions')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Sync competitions manually' })
  async syncCompetitions(@Body('source') source: string) {
    await this.dataSyncService.syncCompetitions(source);
    return { message: 'Competitions sync started' };
  }

  @Post('clubs')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Sync clubs for a competition' })
  async syncClubs(
    @Body('competitionId') competitionId: string,
    @Body('source') source: string,
  ) {
    await this.dataSyncService.syncClubs(competitionId, source);
    return { message: 'Clubs sync started' };
  }

  @Post('players')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Sync players for a club' })
  async syncPlayers(
    @Body('clubId') clubId: string,
    @Body('source') source: string,
  ) {
    await this.dataSyncService.syncPlayers(clubId, source);
    return { message: 'Players sync started' };
  }

  @Post('matches')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Sync matches for a competition' })
  async syncMatches(
    @Body('competitionId') competitionId: string,
    @Body('source') source: string,
  ) {
    await this.dataSyncService.syncMatches(competitionId, source);
    return { message: 'Matches sync started' };
  }

  @Post('full')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Full sync (competitions + clubs + players + matches)' })
  async fullSync(@Body('competitionIds') competitionIds: string[]) {
    await this.dataSyncService.fullSync(competitionIds);
    return { message: 'Full sync started' };
  }
}
```

### 6.4 Monitoring et Alertes

```typescript
// backend/src/modules/data-sync/data-sync.monitor.ts

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as Sentry from '@sentry/node';

@Injectable()
export class DataSyncMonitor {
  private readonly logger = new Logger(DataSyncMonitor.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Log et metrics de synchronisation
   */
  async logSyncMetrics(
    entity: string,
    recordsSynced: number,
    duration: number,
    errors: number,
  ): Promise<void> {
    this.logger.log(
      `Sync completed: ${entity} | Records: ${recordsSynced} | Duration: ${duration}ms | Errors: ${errors}`,
    );

    // Envoyer metrics a Sentry (custom breadcrumb)
    Sentry.addBreadcrumb({
      category: 'data-sync',
      message: `Synced ${recordsSynced} ${entity}`,
      level: 'info',
      data: {
        entity,
        recordsSynced,
        duration,
        errors,
      },
    });

    // Si trop d'erreurs, alerter
    if (errors > 10) {
      Sentry.captureMessage(`High error rate during ${entity} sync: ${errors} errors`, 'warning');
    }
  }

  /**
   * Verifier fraicheur des donnees
   */
  async checkDataFreshness(): Promise<void> {
    const threshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 jours

    const staleClubs = await this.prisma.club.count({
      where: {
        lastSyncAt: { lt: threshold },
      },
    });

    const stalePlayers = await this.prisma.player.count({
      where: {
        lastSyncAt: { lt: threshold },
      },
    });

    if (staleClubs > 50 || stalePlayers > 200) {
      this.logger.warn(`Stale data detected: ${staleClubs} clubs, ${stalePlayers} players`);
      Sentry.captureMessage('Stale data detected in database', 'warning');
    }
  }
}
```

---

## 7. Performance et Scalabilite

### 7.1 Strategie de Batch

- **Competitions**: 50 records/transaction
- **Clubs**: 100 records/transaction
- **Players**: 100 records/transaction
- **Matches**: 500 records/transaction

**Rationale**:
- Prisma a une limite de ~1000 operations/transaction
- Balance entre vitesse et memoire
- Timeout adapt (30-60s)

### 7.2 Indexation Base de Donnees

```sql
-- Indexes pour recherche rapide
CREATE INDEX idx_clubs_external ON clubs(external_source, external_id);
CREATE INDEX idx_players_external ON players(external_source, external_id);
CREATE INDEX idx_competitions_external ON competitions(external_source, external_id);
CREATE INDEX idx_matches_scheduled ON matches(scheduled_at, status);
CREATE INDEX idx_clubs_league ON clubs(league_id);

-- Composite index pour upsert matches
CREATE UNIQUE INDEX idx_matches_unique ON matches(home_club_id, away_club_id, scheduled_at);
```

### 7.3 Cache Strategy (Redis - Optionnel)

```typescript
// backend/src/modules/data-sync/cache/redis-cache.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
    });
  }

  /**
   * Cache API responses (TTL: 1 heure)
   */
  async cacheApiResponse(key: string, data: any, ttl = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(data));
  }

  async getCachedApiResponse(key: string): Promise<any | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Invalider cache apres sync
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
      this.logger.log(`Invalidated ${keys.length} cache keys matching ${pattern}`);
    }
  }
}
```

### 7.4 Rate Limiting Implementation

```typescript
// Decorator pour rate limiting
export function RateLimit(requestsPerMinute: number) {
  let lastRequestTime = 0;
  const minDelay = 60000 / requestsPerMinute;

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;

      if (timeSinceLastRequest < minDelay) {
        const delay = minDelay - timeSinceLastRequest;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      lastRequestTime = Date.now();
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// Usage
class ApiFootballService {
  @RateLimit(10) // 10 requetes/minute
  async getCompetitions() {
    // ...
  }
}
```

### 7.5 Optimisation Prisma

```typescript
// prisma/schema.prisma - Optimisations

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "fullTextIndex"] // PostgreSQL full-text search
  binaryTargets   = ["native", "linux-musl-openssl-3.0.x"] // Multi-platform
}

// Full-text search index
model Club {
  // ...
  @@index([name(ops: ILike)]) // Index pour recherche case-insensitive
}
```

---

## 8. Next Steps et Roadmap

### Phase 1: Bootstrap Initial (Semaine 1-2)

**Priorite: HIGH**

1. **Setup infrastructure**:
   - [ ] Creer module `data-sync` NestJS
   - [ ] Configurer APIs keys (.env)
   - [ ] Installer dependances (axios, retry logic)

2. **Implementer services de base**:
   - [ ] `FootballDataService` (Top 5 ligues)
   - [ ] `ApiFootballService` (primary source)
   - [ ] `TheSportsDBService` (logos)

3. **Creer mappers**:
   - [ ] `ClubMapper`
   - [ ] `PlayerMapper`
   - [ ] `MatchMapper`
   - [ ] `NormalizerUtil`

4. **Premier import manuel**:
   - [ ] Script TypeScript standalone
   - [ ] Importer Ligue 1 complete (18 clubs, ~540 joueurs)
   - [ ] Valider qualite donnees

**Livrable**: Base de donnees avec 1 ligue complete (Ligue 1)

---

### Phase 2: Automatisation (Semaine 3-4)

**Priorite: HIGH**

1. **Implementer DataSyncService complet**:
   - [ ] Methodes sync pour chaque entite
   - [ ] Batch upserts avec transactions
   - [ ] Error handling robuste

2. **Setup Cron jobs**:
   - [ ] Cron mensuel: competitions
   - [ ] Cron hebdomadaire: clubs + players
   - [ ] Cron daily: matches
   - [ ] Cron 5min: live scores

3. **Creer endpoints admin**:
   - [ ] `POST /admin/data-sync/competitions`
   - [ ] `POST /admin/data-sync/clubs`
   - [ ] `POST /admin/data-sync/players`
   - [ ] `POST /admin/data-sync/matches`
   - [ ] `POST /admin/data-sync/full`

4. **Tester avec Top 5 ligues**:
   - [ ] Ligue 1, EPL, Bundesliga, Serie A, La Liga
   - [ ] Total: ~100 clubs, ~3000 joueurs

**Livrable**: Pipeline automatisee pour Top 5 ligues

---

### Phase 3: Enrichissement Amateur (Semaine 5-6)

**Priorite: MEDIUM**

1. **Sources amateurs**:
   - [ ] OpenLigaDB (Regionalliga Allemagne)
   - [ ] API-Football tier payant (Tercera Espagne)
   - [ ] Dataset manuel France (N2/N3)

2. **Enrichissement visuel**:
   - [ ] Logos HD tous clubs (TheSportsDB)
   - [ ] Photos joueurs (API-Football)
   - [ ] Images stades

3. **Qualite donnees**:
   - [ ] Deduplication intelligente (fuzzy matching)
   - [ ] Validation champs obligatoires
   - [ ] Normalisation accents/formats

**Livrable**: +50 clubs amateurs, donnees visuelles completes

---

### Phase 4: Optimisation Performance (Semaine 7-8)

**Priorite: MEDIUM**

1. **Cache layer**:
   - [ ] Redis pour API responses
   - [ ] Invalidation intelligente
   - [ ] TTL adaptatifs

2. **Indexation avancee**:
   - [ ] Full-text search PostgreSQL
   - [ ] Indexes composites
   - [ ] EXPLAIN ANALYZE queries lentes

3. **Monitoring**:
   - [ ] DataSyncMonitor complet
   - [ ] Alertes Sentry
   - [ ] Dashboard metrics (Grafana?)

**Livrable**: Pipeline optimisee (< 5min pour sync complet)

---

### Phase 5: Scale Production (Semaine 9+)

**Priorite: LOW (future)**

1. **Upgrade sources payantes**:
   - [ ] Sportradar API (donnees officielles)
   - [ ] Opta Sports (statistiques avancees)

2. **Webhooks temps reel**:
   - [ ] Ecoute evenements live
   - [ ] Update instantane scores
   - [ ] Notifications push

3. **Multi-regions**:
   - [ ] Donnees Amerique du Sud
   - [ ] Donnees Asie
   - [ ] Competitions internationales (Ligue des Champions, etc.)

**Livrable**: Plateforme mondiale avec donnees temps reel

---

## 9. Commandes Rapides

### 9.1 Installation

```bash
cd backend

# Installer dependances
npm install axios retry-axios

# Configurer .env
echo "API_FOOTBALL_KEY=your_key" >> .env

# Creer module
nest g module modules/data-sync
nest g service modules/data-sync
nest g controller modules/data-sync
```

### 9.2 Execution

```bash
# Sync manuel (via controller)
curl -X POST http://localhost:3000/admin/data-sync/competitions \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"source": "api-football"}'

# Full sync (script standalone)
npx ts-node backend/src/modules/data-sync/scripts/full-sync.ts

# Verifier donnees
npm run prisma:studio
```

### 9.3 Tests

```bash
# Test service
npm run test -- data-sync.service.spec.ts

# Test integration
npm run test:e2e -- data-sync.e2e-spec.ts

# Check qualite donnees
npm run prisma:studio
```

---

## 10. Metriques de Succes

**KPIs Phase 1 (Bootstrap)**:
- [ ] 5 competitions importees (Top 5 ligues)
- [ ] 100+ clubs avec logos
- [ ] 3000+ joueurs avec profils complets
- [ ] 1500+ matchs (saison actuelle)
- [ ] Fraicheur donnees: < 7 jours

**KPIs Phase 2 (Automatisation)**:
- [ ] Cron jobs fonctionnels (0 echec sur 30 jours)
- [ ] Sync complet: < 10 minutes
- [ ] Taux erreur: < 1%
- [ ] Donnees live: < 5 min delay

**KPIs Phase 3 (Enrichissement)**:
- [ ] 150+ clubs (pros + amateurs)
- [ ] 5000+ joueurs
- [ ] Logos HD: 100% clubs
- [ ] Photos joueurs: 80%+ joueurs pros

**KPIs Phase 4 (Performance)**:
- [ ] Sync complet: < 5 minutes
- [ ] Cache hit rate: > 70%
- [ ] Queries DB: < 100ms P95
- [ ] 0 downtime lors syncs

---

## 11. Ressources et Documentation

### APIs Documentation
- Football-Data.org: https://www.football-data.org/documentation/quickstart
- API-Football: https://www.api-football.com/documentation-v3
- TheSportsDB: https://www.thesportsdb.com/api.php
- OpenLigaDB: https://github.com/OpenLigaDB/OpenLigaDB-Samples

### Outils
- Prisma Docs: https://www.prisma.io/docs
- NestJS Schedule: https://docs.nestjs.com/techniques/task-scheduling
- Sentry: https://docs.sentry.io/platforms/node/guides/nestjs/

### Datasets CSV
- Football-Data.co.uk: https://www.football-data.co.uk/data.php
- Kaggle Football: https://www.kaggle.com/datasets?search=football

---

## 12. Budget Estimé

### Phase 1 (Gratuit - 3 mois)
- API-Football: $0 (100 req/jour)
- Football-Data.org: $0 (tier gratuit)
- TheSportsDB: $0 (avec attribution)
- **Total: 0 EUR/mois**

### Phase 2 (Scale - 6 mois)
- API-Football: $25/mois (3000 req/jour)
- TheSportsDB Patreon: $3/mois
- Redis Cloud: $0 (tier gratuit 30MB)
- **Total: 28 EUR/mois**

### Phase 3 (Production - 12 mois+)
- API-Football Pro: $100/mois (15000 req/jour)
- Sportradar (optionnel): 500-1000 EUR/mois
- Redis: $10/mois (1GB)
- **Total: 110-1110 EUR/mois**

---

## 13. Points d'Attention Legaux

### Ce qui est LEGAL et RECOMMANDE:
- Utilisation APIs officielles (Football-Data, API-Football)
- Scraping avec respect robots.txt et rate limits
- Donnees publiques (resultats matchs, classements)
- Attribution sources (TheSportsDB, etc.)

### Ce qui est ILLEGAL ou RISQUE:
- Scraping massif Transfermarkt sans permission
- Scraping sites payants (WhoScored, SofaScore)
- Utilisation donnees Opta/Stats Perform sans licence
- Revente donnees sans droits

### Recommandations:
1. Toujours lire Terms of Service APIs
2. Respecter rate limits strictement
3. Attribuer sources dans UI (footer: "Data provided by API-Football")
4. Ne jamais stocker donnees live betting (legal issues)
5. Pour production, privilegier APIs officielles payantes

---

## Conclusion

Ce plan fournit une roadmap complete pour alimenter Arcane Football avec des donnees reelles de qualite professionnelle. La strategie progressive (gratuit -> payant) permet de valider le produit avant d'investir dans des APIs premium. Les 3000+ joueurs et 150+ clubs europeens (pros + amateurs) seront disponibles dans les 8 semaines, avec une pipeline automatisee et scalable.

**Prochaine action immediate**: Implementer `ApiFootballService` et importer la Ligue 1 en mode test (estimé: 2-3 heures).

---

**Document Version**: 1.0
**Auteur**: Claude (Arcane Football Platform)
**Date**: 2025-11-03
**Status**: Ready for Implementation
