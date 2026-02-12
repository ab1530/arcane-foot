# Scout Marketplace MVP - Architecture

**Date:** 6 Novembre 2025
**Durée estimée:** 8 semaines
**Statut:** 🏗️ En cours de planification

---

## Vue d'Ensemble

Le **Scout Marketplace** est une plateforme B2B qui connecte les scouts professionnels avec les clubs de football. Les scouts peuvent créer des profils professionnels, afficher leurs services, et les clubs peuvent les rechercher, contacter, et engager.

### Value Proposition

**Pour les Scouts:**
- Visibilité accrue auprès des clubs
- Opportunités de mission rémunérées
- Système de réputation (reviews/ratings)
- Gestion centralisée des offres

**Pour les Clubs:**
- Accès à un réseau de scouts vérifiés
- Matching intelligent basé sur besoins
- Transparence des tarifs et expertises
- Historique et reviews

---

## Fonctionnalités Principales

### 1. Scout Listings (Profils Professionnels)

**Informations:**
- Bio professionnelle
- Expertise (ligues, positions, âges)
- Langues parlées
- Disponibilité (zones géographiques)
- Tarifs (hourly rate, par match, par rapport)
- Portfolio (meilleurs rapports, joueurs découverts)
- Statistiques (rapports soumis, joueurs scouted, taux de succès)

**Statut:**
- DRAFT - En cours de création
- ACTIVE - Visible sur marketplace
- PAUSED - Temporairement inactif
- ARCHIVED - Archivé

### 2. Système de Recherche et Matching

**Filtres de Recherche:**
- Expertise géographique (pays, régions)
- Spécialisation (positions, âges)
- Budget (min/max hourly rate)
- Disponibilité
- Rating minimum
- Langues

**Matching Score:**
Algorithme qui calcule un score de compatibilité entre:
- Besoins du club
- Expertise du scout
- Budget
- Disponibilité

### 3. Propositions et Offres

**Flow:**
1. Club envoie une **proposition** au scout
2. Scout **accepte** / **refuse** / **contre-propose**
3. Une fois accepté → devient un **contrat**
4. Après mission → **review** mutuelle

**Types de Propositions:**
- MATCH_ASSIGNMENT - Scouting d'un match spécifique
- PLAYER_REPORT - Rapport sur un joueur spécifique
- RETAINER - Mission continue (ex: 10 matchs/mois)
- CONSULTATION - Conseil stratégique

### 4. Système de Reviews et Ratings

**Review après mission:**
- Rating 1-5 étoiles
- Commentaire écrit
- Tags (ponctuel, professionnel, insights, communication)
- Vérification (seuls les clients ayant travaillé ensemble)

**Agrégation:**
- Average rating
- Total reviews
- Completion rate
- Response time

### 5. Système de Favoris et Shortlists

**Pour les Clubs:**
- Sauvegarder scouts favoris
- Créer des shortlists pour projets
- Comparer scouts side-by-side
- Recevoir notifications quand scout disponible

---

## Modèle de Données

### Tables Prisma

#### scout_listings
```prisma
model scout_listings {
  id                 String              @id
  userId             String              @unique
  bio                String?
  headline           String              // "Senior Scout - LaLiga & Bundesliga"
  expertise          Json                // {leagues: [], positions: [], ageGroups: []}
  languages          String[]
  availability       Json                // {countries: [], travelRadius: 500}
  hourlyRate         Float?
  matchRate          Float?
  reportRate         Float?
  currency           String              @default("EUR")
  portfolio          Json?               // {topReports: [], playersDiscovered: []}
  stats              Json?               // {reportsCount, avgRating, successRate}
  status             ScoutListingStatus  @default(DRAFT)
  isVerified         Boolean             @default(false)
  verifiedAt         DateTime?
  featuredUntil      DateTime?           // Pour listings premium
  createdAt          DateTime            @default(now())
  updatedAt          DateTime

  users              users               @relation(fields: [userId], references: [id], onDelete: Cascade)
  marketplace_offers marketplace_offers[]
  marketplace_reviews marketplace_reviews[]
  scout_favorites    scout_favorites[]

  @@index([status])
  @@index([isVerified])
  @@index([userId])
}

enum ScoutListingStatus {
  DRAFT
  ACTIVE
  PAUSED
  ARCHIVED
}
```

#### marketplace_offers
```prisma
model marketplace_offers {
  id                String                 @id
  scoutListingId    String
  clubId            String
  offerType         OfferType
  title             String                 // "LaLiga Match Scout - Valencia vs Real"
  description       String
  budget            Float
  currency          String                 @default("EUR")
  startDate         DateTime?
  endDate           DateTime?
  location          String?
  requirements      Json?                  // {matchId?, playerId?, criteria}
  status            OfferStatus            @default(PENDING)
  sentAt            DateTime               @default(now())
  respondedAt       DateTime?
  acceptedAt        DateTime?
  completedAt       DateTime?
  cancelledAt       DateTime?
  cancellationReason String?
  matchingScore     Float?                 // 0-100 compatibility score
  metadata          Json?

  scout_listings    scout_listings         @relation(fields: [scoutListingId], references: [id], onDelete: Cascade)
  clubs             clubs                  @relation(fields: [clubId], references: [id], onDelete: Cascade)
  marketplace_reviews marketplace_reviews[]

  @@index([scoutListingId])
  @@index([clubId])
  @@index([status])
  @@index([offerType])
  @@index([startDate])
}

enum OfferType {
  MATCH_ASSIGNMENT
  PLAYER_REPORT
  RETAINER
  CONSULTATION
}

enum OfferStatus {
  PENDING
  VIEWED
  ACCEPTED
  REJECTED
  COUNTER_OFFERED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

#### marketplace_reviews
```prisma
model marketplace_reviews {
  id                String               @id
  offerId           String
  scoutListingId    String
  clubId            String
  rating            Int                  // 1-5
  comment           String?
  tags              String[]             // ["punctual", "professional", "insightful"]
  reviewedAt        DateTime             @default(now())
  isVerified        Boolean              @default(false)

  marketplace_offers marketplace_offers   @relation(fields: [offerId], references: [id], onDelete: Cascade)
  scout_listings    scout_listings       @relation(fields: [scoutListingId], references: [id], onDelete: Cascade)
  clubs             clubs                @relation(fields: [clubId], references: [id], onDelete: Cascade)

  @@unique([offerId, clubId])
  @@index([scoutListingId])
  @@index([clubId])
  @@index([rating])
}
```

#### scout_favorites
```prisma
model scout_favorites {
  id             String          @id
  clubId         String
  scoutListingId String
  notes          String?
  tags           String[]
  addedAt        DateTime        @default(now())

  clubs          clubs           @relation(fields: [clubId], references: [id], onDelete: Cascade)
  scout_listings scout_listings  @relation(fields: [scoutListingId], references: [id], onDelete: Cascade)

  @@unique([clubId, scoutListingId])
  @@index([clubId])
  @@index([scoutListingId])
}
```

---

## API Endpoints

### Scout Listings

```typescript
// Scouts
POST   /marketplace/listings              # Créer listing
GET    /marketplace/listings/my           # Mon listing
PATCH  /marketplace/listings/:id          # Modifier listing
DELETE /marketplace/listings/:id          # Archiver listing
POST   /marketplace/listings/:id/activate # Activer
POST   /marketplace/listings/:id/pause    # Mettre en pause

// Clubs (recherche)
GET    /marketplace/listings              # Rechercher scouts
GET    /marketplace/listings/:id          # Détails scout
POST   /marketplace/listings/match        # Matching score pour besoins
```

### Offers

```typescript
// Clubs
POST   /marketplace/offers                # Envoyer proposition
GET    /marketplace/offers/sent           # Mes propositions envoyées
PATCH  /marketplace/offers/:id            # Modifier proposition
DELETE /marketplace/offers/:id            # Annuler proposition

// Scouts
GET    /marketplace/offers/received       # Propositions reçues
POST   /marketplace/offers/:id/accept     # Accepter
POST   /marketplace/offers/:id/reject     # Refuser
POST   /marketplace/offers/:id/counter    # Contre-proposition
POST   /marketplace/offers/:id/complete   # Marquer complété
```

### Reviews

```typescript
POST   /marketplace/reviews               # Créer review
GET    /marketplace/reviews/listing/:id   # Reviews d'un scout
GET    /marketplace/reviews/my            # Mes reviews reçues
```

### Favorites

```typescript
POST   /marketplace/favorites             # Ajouter favori
GET    /marketplace/favorites/my          # Mes favoris
DELETE /marketplace/favorites/:id         # Retirer favori
PATCH  /marketplace/favorites/:id         # Modifier notes/tags
```

---

## Algorithme de Matching

### Calcul du Score (0-100)

```typescript
interface ClubNeeds {
  leagues: string[];        // ["LaLiga", "Bundesliga"]
  positions: string[];      // ["GK", "CB"]
  ageGroup: string;         // "U21" | "SENIOR"
  budget: number;
  location: string;         // Country
}

interface MatchingScore {
  leagueMatch: number;      // 0-30 points
  positionMatch: number;    // 0-20 points
  budgetMatch: number;      // 0-20 points
  locationMatch: number;    // 0-15 points
  ratingBonus: number;      // 0-10 points
  verifiedBonus: number;    // 0-5 points
  total: number;            // 0-100
}

function calculateMatchingScore(
  scoutListing: ScoutListing,
  clubNeeds: ClubNeeds
): MatchingScore {
  let score = {
    leagueMatch: 0,
    positionMatch: 0,
    budgetMatch: 0,
    locationMatch: 0,
    ratingBonus: 0,
    verifiedBonus: 0,
    total: 0,
  };

  // 1. League expertise (30 points max)
  const commonLeagues = intersection(
    scoutListing.expertise.leagues,
    clubNeeds.leagues
  );
  score.leagueMatch = (commonLeagues.length / clubNeeds.leagues.length) * 30;

  // 2. Position expertise (20 points max)
  const commonPositions = intersection(
    scoutListing.expertise.positions,
    clubNeeds.positions
  );
  score.positionMatch = (commonPositions.length / clubNeeds.positions.length) * 20;

  // 3. Budget compatibility (20 points max)
  if (scoutListing.hourlyRate <= clubNeeds.budget) {
    const budgetRatio = scoutListing.hourlyRate / clubNeeds.budget;
    score.budgetMatch = (1 - Math.abs(budgetRatio - 0.7)) * 20;
  }

  // 4. Location (15 points max)
  if (scoutListing.availability.countries.includes(clubNeeds.location)) {
    score.locationMatch = 15;
  }

  // 5. Rating bonus (10 points max)
  if (scoutListing.stats?.avgRating) {
    score.ratingBonus = (scoutListing.stats.avgRating / 5) * 10;
  }

  // 6. Verification bonus (5 points max)
  if (scoutListing.isVerified) {
    score.verifiedBonus = 5;
  }

  score.total = Object.values(score).reduce((a, b) => a + b, 0);
  return score;
}
```

---

## User Flows

### Flow 1: Scout crée son listing

```
1. Scout va sur /marketplace/profile
2. Remplit formulaire:
   - Headline, bio
   - Expertise (ligues, positions, âges)
   - Langues
   - Disponibilité (pays)
   - Tarifs
   - Portfolio (optional)
3. Preview du profil
4. Publie (status = ACTIVE)
5. Listing visible pour clubs
```

### Flow 2: Club recherche un scout

```
1. Club va sur /marketplace
2. Filtre par:
   - Ligue (LaLiga)
   - Position (GK, CB)
   - Budget (max 150€/h)
   - Pays (Espagne)
3. Voit liste de scouts triés par matching score
4. Clique sur scout → voit profil détaillé
5. Peut:
   - Ajouter aux favoris
   - Envoyer proposition
   - Voir reviews
```

### Flow 3: Club envoie proposition

```
1. Club remplit formulaire:
   - Type (Match Assignment)
   - Description
   - Budget
   - Date/lieu
   - Requis spécifiques
2. Preview proposition
3. Envoie → Scout reçoit notification
4. Scout voit proposition dans /offers/received
5. Scout peut:
   - Accepter → Status IN_PROGRESS
   - Refuser
   - Contre-proposer (modify budget/terms)
```

### Flow 4: Mission complétée + Review

```
1. Scout marque mission comme complétée
2. Club confirme complétion
3. Les deux reçoivent invitation à review
4. Chacun laisse:
   - Rating 1-5
   - Commentaire
   - Tags
5. Review publiée sur profil scout
6. Stats mises à jour automatiquement
```

---

## Règles de Business

### Vérification des Scouts

Pour être vérifié (badge ✓):
- Minimum 5 rapports soumis sur plateforme
- Minimum 3 reviews positives (≥4 étoiles)
- Email vérifié
- Profil 100% complété
- Aucune plainte active

### Système de Tarification

**Pour Scouts (gratuit):**
- Création listing: Gratuit
- Recevoir propositions: Gratuit
- 5% commission sur transactions via plateforme

**Pour Clubs:**
- Recherche: Gratuit pour BASIC+
- Envoyer propositions: FREE = 3/mois, BASIC = 10/mois, PRO = illimité
- Featured listings: PRO uniquement

### Sécurité et Prévention Fraude

- Email verification requis
- Clubs doivent avoir tier BASIC+ pour envoyer propositions
- Reviews uniquement après transaction complétée
- Flag system pour comportements suspects
- Modération manuelle des listings (admin approval)

---

## Métriques à Tracker

### Pour le Business:
- Total listings actifs
- Total propositions envoyées/mois
- Taux d'acceptation propositions
- Taux de complétion missions
- Average rating
- Revenue (5% commission)

### Pour les Scouts:
- Profile views
- Propositions reçues
- Taux d'acceptation
- Earnings
- Average rating
- Total missions complétées

### Pour les Clubs:
- Propositions envoyées
- Taux d'acceptation
- Spend total
- Scouts favoris
- Taux de satisfaction

---

## Plan d'Implémentation (8 semaines)

### Semaine 1-2: Backend Core
- ✅ Schéma Prisma
- ✅ Migrations
- ✅ DTOs TypeScript
- ✅ Service layer (CRUD listings)
- ✅ Service layer (Offers management)

### Semaine 3-4: API + Matching
- ✅ REST Controllers
- ✅ Algorithme matching
- ✅ Reviews system
- ✅ Favorites system
- ✅ Tests unitaires

### Semaine 5-6: Frontend UI
- ✅ Page marketplace search
- ✅ Scout listing detail page
- ✅ Create/Edit listing form
- ✅ Offer submission form
- ✅ Offers dashboard (sent/received)
- ✅ Reviews interface

### Semaine 7-8: Polish + Deploy
- ✅ Notifications (email + push)
- ✅ Analytics dashboard
- ✅ Admin moderation panel
- ✅ Tests E2E
- ✅ Documentation
- ✅ Staging deployment

---

## Évolutions Futures (Post-MVP)

**Phase 2 (Q2 2026):**
- Système de paiement intégré (Stripe Connect)
- Chat direct scouts-clubs
- Contracts management (PDF generation)
- Calendar integration
- Advanced analytics pour scouts

**Phase 3 (Q3 2026):**
- Scout teams/agencies
- Bulk proposals (scout packages)
- Video portfolios
- AI-powered scout recommendations
- Mobile app

---

## Questions Ouvertes

1. **Vérification des scouts:** Manuel par admin ou automatique?
   → **Décision:** Automatique basé sur règles + flag manual review

2. **Pricing:** Commission fixe 5% ou variable par tier?
   → **Décision:** Fixe 5% pour MVP, variable plus tard

3. **Paiements:** Via plateforme (Stripe Connect) ou externe?
   → **Décision:** MVP = externe (clubs paient scouts directement), Phase 2 = intégré

4. **Exclusivité:** Scouts peuvent-ils être sur autres marketplaces?
   → **Décision:** Non-exclusif, liberté totale

---

**Next Steps:**
1. Créer les migrations Prisma ✅ À FAIRE MAINTENANT
2. Implémenter services backend
3. Créer controllers API
4. Builder le frontend

