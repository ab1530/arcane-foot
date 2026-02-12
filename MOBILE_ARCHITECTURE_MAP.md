# MOBILE ARCHITECTURE MAP - ARCANE FOOTBALL

**Repository**: `/Users/lakhdari/Desktop/AppFoot/mobile`
**Version**: 1.0.0
**Platform**: React Native (Expo SDK 54)
**Date**: 2025-11-16

---

## TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [Navigation System](#navigation-system)
3. [Screens Catalog (46+ Screens)](#screens-catalog)
4. [Components Library](#components-library)
5. [API Services](#api-services)
6. [State Management](#state-management)
7. [Mobile-Specific Features](#mobile-specific-features)
8. [Design System](#design-system)
9. [Technology Stack](#technology-stack)

---

## PROJECT OVERVIEW

Arcane Football Mobile est une application React Native complète de gestion et scouting de football, offrant:

- **Gestion de joueurs** avec passports digitaux
- **Intelligence Artificielle** pour scouting et analyses
- **Marketplace** de scouts professionnels
- **Coaching Hub** avec réservations de sessions
- **Gamification** complète (achievements, badges, leaderboards)
- **Voice-to-Report** pour rapports vocaux
- **Notifications Push** via Firebase Cloud Messaging
- **Multi-langue** (FR/EN)
- **Multi-rôles** (8 rôles utilisateurs)

---

## NAVIGATION SYSTEM

### Architecture de Navigation

```
RootNavigator
├── Auth Stack (non-authenticated)
│   ├── Login
│   └── Signup
└── Main (authenticated)
    └── AppNavigator
        ├── MainTabNavigator (Bottom Tabs)
        │   ├── Home Tab
        │   ├── AI Hub Tab
        │   ├── Marketplace Tab
        │   ├── Coaching Tab
        │   ├── Passport Tab
        │   └── Profile Tab
        └── Modal/Stack Screens (42+ screens)
```

### Navigateurs Principaux

#### 1. **RootNavigator** (`/src/navigation/RootNavigator.tsx`)
- Point d'entrée de la navigation
- Gère l'authentification (Auth vs Main)
- Loading state avec spinner

#### 2. **AppNavigator** (`/src/navigation/AppNavigator.tsx`)
- Contient MainTabNavigator + tous les screens modaux
- 42 routes configurées
- Styled headers avec design system

#### 3. **MainTabNavigator** (`/src/navigation/MainTabNavigator.tsx`)
- Bottom tabs avec 6 onglets principaux
- Feature flags pour activer/désactiver tabs
- Animated tab buttons avec haptics
- Command Center FAB (Floating Action Button)
- Global Search modal
- Notifications Center modal

#### 4. **TabNavigator** (Role-based) (`/src/navigation/TabNavigator.tsx`)
- Navigation basée sur les rôles utilisateurs
- Configuration dynamique selon UserRole
- 8 configurations différentes (SUPER_ADMIN, ADMIN, SCOUT, ANALYST, AGENT, PLAYER, CLUB_CONTACT, PUBLIC)

### Main Tabs Configuration

```typescript
// Feature flags contrôlent l'affichage des tabs
const FEATURE_FLAGS = {
  aiHubTab: true,
  marketplaceTab: true,
  coachingTab: true,
  passportTab: true,
  profileTab: true,
  shortcuts: {
    players: true,
    analytics: true,
    matches: true,
    reports: true,
    voiceToReport: true,
    marketplace: true,
  },
}
```

**Tabs disponibles**:
1. **Home** - Écran d'accueil avec hero, stats, services
2. **AI Hub** - Centre IA avec 7 features AI
3. **Marketplace** - Marché des scouts professionnels
4. **Coaching** - Réservation de sessions de coaching
5. **Passport** - Passeport digital du joueur
6. **Profile** - Profil utilisateur et paramètres

### Navigation Types

**Fichier**: `/src/types/navigation.ts`

```typescript
export type AppStackParamList = {
  MainTabs: undefined;
  Dashboard: undefined;
  Analytics: undefined;
  Market: undefined;
  Camps: undefined;
  AI: undefined;
  ArcaneGPT: undefined;
  ArcaneIndex: undefined;
  ArkaneMatch: undefined;
  SmartScout: undefined;
  AutoScout: undefined;
  AutoScoutHistory: undefined;
  MarketValue: { playerId?: string };
  MarketValueDetail: { playerId: string };
  Players: undefined;
  PlayerDetail: { playerId: string };
  PlayerPassport: { playerId: string; player?: any };
  Matches: undefined;
  Kanban: undefined;
  CreateReport: { playerId?: string };
  CampDetail: { id: string };
  CreateCamp: undefined;
  ClubDetail: { clubId: string };
  Clubs: undefined;
  Reports: undefined;
  Calendar: undefined;
  ReportDetail: { reportId: string };
  Membership: undefined;
  About: undefined;
  Contact: undefined;
  Services: undefined;
  Passport: undefined;
  VoiceToReport: undefined;
  Settings: undefined;
  ScoutingReports: undefined;
  CreateScoutingReport: undefined;
  PlayerComparison: undefined;
  Marketplace: undefined;
  ScoutDetail: { listingId: string };
};

export type MainTabParamList = {
  Home: undefined;
  AIHub: undefined;
  Marketplace: undefined;
  Coaching: undefined;
  Passport: undefined;
  Profile: undefined;
};
```

---

## SCREENS CATALOG

### Répertoire complet: 46+ Écrans

#### Auth Screens (2)

| Screen | Path | Description | Navigation |
|--------|------|-------------|------------|
| **LoginScreen** | `/screens/auth/LoginScreen.tsx` | Connexion email/password | → Main après login |
| **SignupScreen** | `/screens/auth/SignupScreen.tsx` | Inscription multi-rôles | → Main après signup |

#### Home & Dashboard (2)

| Screen | Path | Description | Features |
|--------|------|-------------|----------|
| **HomeScreen** | `/screens/home/HomeScreen.tsx` | Page d'accueil animée | Hero section, stats cards, services, CTA |
| **DashboardScreen** | `/screens/dashboard/DashboardScreen.tsx` | Dashboard principal | Stats, activités récentes, quick actions |

#### AI Screens (13)

| Screen | Path | Description | API Endpoint |
|--------|------|-------------|--------------|
| **AIScreen** | `/screens/ai/AIScreen.tsx` | Hub IA central | `/ai/*` |
| **ArcaneGPTScreen** | `/screens/ai/ArcaneGPTScreen.tsx` | Chat GPT footballistique | `/ai/summary` |
| **ArcaneIndexScreen** | `/screens/ai/ArcaneIndexScreen.tsx` | Recherche avancée joueurs | `/ai/index/:playerId` |
| **ArkaneMatchScreen** | `/screens/ai/ArkaneMatchScreen.tsx` | Recherche conversationnelle scouts | `/arkane-match/chat` |
| **SmartScoutScreen** | `/screens/ai/SmartScoutScreen.tsx` | Suggestions intelligentes rapports | `/smart-scout/*` |
| **AutoScoutScreen** | `/screens/ai/AutoScoutScreen.tsx` | Génération rapports IA | `/auto-scout/generate` |
| **AutoScoutHistoryScreen** | `/screens/ai/AutoScoutHistoryScreen.tsx` | Historique rapports générés | `/auto-scout/player/:id/history` |
| **MarketValueScreen** | `/screens/ai/MarketValueScreen.tsx` | Évaluation marché joueur | `/market-value/:playerId` |
| **MarketValueDetailScreen** | `/screens/ai/MarketValueDetailScreen.tsx` | Détails valeur marché | `/market-value/:playerId/details` |
| **PlayStyleDNAScreen** | `/screens/ai/PlayStyleDNAScreen.tsx` | ADN style de jeu | `/playstyle-dna/:playerId` |
| **StyleExplorerScreen** | `/screens/ai/StyleExplorerScreen.tsx` | Explorateur styles de jeu | - |
| **PerformancePredictorScreen** | `/screens/ai/PerformancePredictorScreen.tsx` | Prédiction performances | `/performance-predictor/predict` |
| **PlayStyleComparisonScreen** | `/screens/ai/PlayStyleComparisonScreen.tsx` | Comparaison joueurs | - |

#### Players Screens (4)

| Screen | Path | Description | Navigation |
|--------|------|-------------|------------|
| **PlayersScreen** | `/screens/players/PlayersScreen.tsx` | Liste joueurs avec filtres | → PlayerDetail |
| **PlayerDetailScreen** | `/screens/players/PlayerDetailScreen.tsx` | Fiche détaillée joueur | Stats, info, actions |
| **PlayerPassport** | `/screens/players/PlayerPassport.tsx` | Passeport digital joueur | QR code, validations |
| **PlayerComparisonScreen** | `/screens/players/PlayerComparisonScreen.tsx` | Comparaison 2+ joueurs | Radar charts, stats |

#### Reports Screens (4)

| Screen | Path | Description | Features |
|--------|------|-------------|----------|
| **ReportsScreen** | `/screens/reports/ReportsScreen.tsx` | Liste rapports scouting | Filtres, recherche |
| **ReportDetailScreen** | `/screens/reports/ReportDetailScreen.tsx` | Détail rapport | PDF export, partage |
| **CreateReportScreen** | `/screens/reports/CreateReportScreen.tsx` | Création rapport manuel | Formulaire complet |
| **VoiceToReportScreen** | `/screens/reports/VoiceToReportScreen.tsx` | Rapport vocal → texte | Audio recording, transcription |

#### Scouting Screens (2)

| Screen | Path | Description | API |
|--------|------|-------------|-----|
| **ScoutingReportsScreen** | `/screens/scouting/ScoutingReportsScreen.tsx` | Rapports de scouting | `/scouting-reports` |
| **CreateScoutingReportScreen** | `/screens/scouting/CreateScoutingReportScreen.tsx` | Nouveau rapport scouting | POST `/scouting-reports` |

#### Marketplace Screens (3)

| Screen | Path | Description | Features |
|--------|------|-------------|----------|
| **MarketplaceScreen** | `/screens/marketplace/MarketplaceScreen.tsx` | Liste scouts disponibles | Filtres expertise, tarifs |
| **ScoutDetailScreen** | `/screens/marketplace/ScoutDetailScreen.tsx` | Profil détaillé scout | Reviews, portfolio, contact |
| **FilterBottomSheet** | `/screens/marketplace/FilterBottomSheet.tsx` | Filtres avancés marketplace | Bottom sheet modal |

#### Coaching Screens (5)

| Screen | Path | Description | Features |
|--------|------|-------------|----------|
| **CoachingHubScreen** | `/screens/coaching/CoachingHubScreen.tsx` | Centre coaching principal | Liste coachs, sessions à venir |
| **CoachProfileScreen** | `/screens/coaching/CoachProfileScreen.tsx` | Profil coach détaillé | Expertise, reviews, calendrier |
| **BookSessionScreen** | `/screens/coaching/BookSessionScreen.tsx` | Réservation session | Sélection date/heure, paiement |
| **MyBookingsScreen** | `/screens/coaching/MyBookingsScreen.tsx` | Mes réservations | À venir, passées, annulées |
| **FilterModal** | `/screens/coaching/FilterModal.tsx` | Filtres coachs | Expertise, langues, tarifs |
| **ReviewModal** | `/screens/coaching/ReviewModal.tsx` | Laisser un avis | Rating, commentaire |

#### Gamification Screens (5)

| Screen | Path | Description | Features |
|--------|------|-------------|----------|
| **GamificationHubScreen** | `/screens/gamification/GamificationHubScreen.tsx` | Hub gamification central | XP, niveau, challenges |
| **AchievementsScreen** | `/screens/gamification/AchievementsScreen.tsx` | Liste achievements | Débloqués, verrouillés, progression |
| **BadgesScreen** | `/screens/gamification/BadgesScreen.tsx` | Collection badges | Raretés, pinnés |
| **LeaderboardsScreen** | `/screens/gamification/LeaderboardsScreen.tsx` | Classements | All-time, weekly, monthly |
| **AchievementDetailsModal** | `/screens/gamification/AchievementDetailsModal.tsx` | Détail achievement | Modal avec confetti |
| **DailyChallengeModal** | `/screens/gamification/DailyChallengeModal.tsx` | Challenge du jour | Progression, récompense |

#### Kanban Screen (1)

| Screen | Path | Description | Features |
|--------|------|-------------|----------|
| **KanbanScreen** | `/screens/kanban/KanbanScreen.tsx` | Board Kanban joueurs | Drag & drop, colonnes custom |

#### Calendar & Matches (2)

| Screen | Path | Description | Features |
|--------|------|-------------|----------|
| **CalendarScreen** | `/screens/calendar/CalendarScreen.tsx` | Calendrier événements | Matches, sessions, camps |
| **CalendarScreenNew** | `/screens/calendar/CalendarScreenNew.tsx` | Nouveau calendrier (v2) | Timeline améliorée |
| **MatchesScreen** | `/screens/matches/MatchesScreen.tsx` | Liste matches | Live, à venir, terminés |

#### Camps (1)

| Screen | Path | Description | Features |
|--------|------|-------------|----------|
| **CampsScreen** | `/screens/camps/CampsScreen.tsx` | Stages/camps disponibles | Inscription, détails |

#### Clubs (2)

| Screen | Path | Description | Navigation |
|--------|------|-------------|------------|
| **ClubsListScreen** | `/screens/clubs/ClubsListScreen.tsx` | Liste clubs | → ClubDetail |
| **ClubDetailScreen** | `/screens/clubs/ClubDetailScreen.tsx` | Fiche club | Effectif, stade, historique |

#### Info & Settings (4)

| Screen | Path | Description | Content |
|--------|------|-------------|---------|
| **AboutScreen** | `/screens/info/AboutScreen.tsx` | À propos Arcane | Mission, équipe, contact |
| **ContactScreen** | `/screens/info/ContactScreen.tsx` | Formulaire contact | Email, téléphone, message |
| **ServicesScreen** | `/screens/info/ServicesScreen.tsx` | Services offerts | Descriptions détaillées |
| **SettingsScreen** | `/screens/settings/SettingsScreen.tsx` | Paramètres application | Langue, notifications, compte |

#### Analytics & Market (2)

| Screen | Path | Description | Features |
|--------|------|-------------|----------|
| **AnalyticsScreen** | `/screens/analytics/AnalyticsScreen.tsx` | Analytics globales | Graphiques, tendances |
| **MarketScreen** | `/screens/market/MarketScreen.tsx` | Marché joueurs | Offres, demandes clubs |

#### Membership & Passport (2)

| Screen | Path | Description | Features |
|--------|------|-------------|----------|
| **MembershipScreen** | `/screens/membership/MembershipScreen.tsx` | Abonnements premium | Plans, pricing, Stripe |
| **PassportScreen** | `/screens/passport/PassportScreen.tsx` | Mon passeport | QR code personnel, stats |

#### Profile (1)

| Screen | Path | Description | Features |
|--------|------|-------------|----------|
| **ProfileScreen** | `/screens/profile/ProfileScreen.tsx` | Profil utilisateur | Édition, logout, stats |

---

## COMPONENTS LIBRARY

### Organisation des Composants

```
/src/components/
├── ui/                          # Composants UI de base (17)
├── auto-scout/                  # AutoScout feature (7)
├── players/                     # Player components (2)
├── marketplace/                 # Marketplace components (4)
├── playstyle-dna/              # PlayStyle DNA (5)
├── charts/                      # Graphiques (3)
├── search/                      # Recherche globale (1)
├── smart-scout/                # SmartScout (4)
├── voice/                       # Voice recording (6)
├── market-value/               # Market value (5)
├── notifications/              # Notifications center (1)
├── performance-predictor/      # Performance AI (7)
└── arkane-match/               # ArkaneMatch chat (5)
```

### Composants UI de Base (17 composants)

**Localisation**: `/src/components/ui/`

| Composant | Fichier | Description | Usage |
|-----------|---------|-------------|-------|
| **GradientText** | `GradientText.tsx` | Texte avec gradient | Titres accrocheurs |
| **GlassCard** | `GlassCard.tsx` | Card effet glassmorphism | Conteneurs modernes |
| **Icon** | `Icon.tsx` | Icônes Ionicons typées | Toute l'app |
| **AnimatedBadge** | `AnimatedBadge.tsx` | Badge animé | Notifications, statuts |
| **AnimatedCounter** | `AnimatedCounter.tsx` | Compteur animé | Stats numériques |
| **Avatar** | `Avatar.tsx` | Avatar utilisateur | Profils, listes |
| **LoadingSpinner** | `LoadingSpinner.tsx` | Spinner chargement | États loading |
| **Badge** | `Badge.tsx` | Badge statique | Tags, labels |
| **Button** | `Button.tsx` | Bouton custom | Actions principales |
| **EmptyState** | `EmptyState.tsx` | État vide | Listes vides |
| **Input** | `Input.tsx` | Champ de saisie | Formulaires |
| **Skeleton** | `Skeleton.tsx` | Loading skeleton | Chargement contenus |
| **PremiumCard** | `PremiumCard.tsx` | Card premium feature | Paywall, upsells |

**Export central**: `/src/components/ui/index.ts`

### Auto-Scout Components (7)

| Composant | Description | Props principales |
|-----------|-------------|-------------------|
| **TemplateCard** | Card template de rapport | `template`, `onSelect` |
| **TemplateSelector** | Sélecteur templates | `templates`, `onTemplateSelect` |
| **GenerationProgress** | Barre progression génération | `progress`, `status` |
| **ReportPreview** | Prévisualisation rapport | `report`, `onEdit` |
| **ReportSection** | Section rapport (technique, physique, etc.) | `title`, `content`, `editable` |
| **QualityScoreBadge** | Badge qualité rapport (A-F) | `score`, `variant` |
| **PlayerConfig** | Config joueur pour génération | `player`, `onChange` |

### Marketplace Components (4)

| Composant | Description | API Integration |
|-----------|-------------|-----------------|
| **ScoutCard** | Card scout listing | Affiche scout avec expertise |
| **ExpertiseBadge** | Badge expertise (position, ligue) | Style par type |
| **StatsCard** | Stats scout (reviews, découvertes) | Formatage nombres |
| **FilterChip** | Chip filtre actif | Toggle on/off |

### PlayStyle DNA Components (5)

| Composant | Description | Visualisation |
|-----------|-------------|---------------|
| **DNARadarChart** | Radar chart style de jeu | 8 axes (attacking, defending, etc.) |
| **StyleCard** | Card style dominant | Badge rareté + description |
| **RecommendationCard** | Recommandation joueur similaire | Match score + raisons |
| **StyleBadge** | Badge style (Playmaker, Box-to-Box, etc.) | Couleur par style |
| **SimilarPlayerCard** | Card joueur similaire | Photo + stats clés |

### Charts Components (3)

| Composant | Librairie | Types de graphiques |
|-----------|-----------|---------------------|
| **PieChart** | react-native-chart-kit | Camembert |
| **LineChart** | react-native-chart-kit | Lignes + aires |
| **BarChart** | react-native-chart-kit | Barres horizontales/verticales |

### Search Components (1)

| Composant | Description | Features |
|-----------|-------------|----------|
| **GlobalSearch** | Modal recherche universelle | Players, clubs, scouts, reports |

### Smart Scout Components (4)

| Composant | Description | AI Integration |
|-----------|-------------|----------------|
| **AutocompleteSuggestion** | Suggestion autocomplétion | API suggestions temps réel |
| **InsightCard** | Card insight IA | Recommandation contextualisée |
| **RatingSlider** | Slider notation joueur | 0-10 avec haptic feedback |
| **SimilarReportCard** | Rapport similaire suggéré | Matching score |

### Voice Components (6)

| Composant | Description | Features |
|-----------|-------------|----------|
| **RecordButton** | Bouton enregistrement | Animation pulse, haptics |
| **AudioPlayer** | Lecteur audio | Play/pause, timeline |
| **WaveformDisplay** | Forme d'onde audio | Visualisation en temps réel |
| **RecordingTimer** | Chronomètre enregistrement | Format MM:SS |
| **TranscriptionCard** | Card transcription | Éditable, copie |
| **ExtractedDataCard** | Données extraites du vocal | Structuration automatique |

### Market Value Components (5)

| Composant | Description | Data Source |
|-----------|-------------|-------------|
| **ValuationCard** | Card valeur estimée | API prediction |
| **TrendChart** | Graphique tendance valeur | Historique 6-12 mois |
| **FactorBar** | Barre facteur contribution | Âge, stats, ligue, etc. |
| **ConfidenceIndicator** | Indicateur confiance prédiction | 0-100% |
| **ComparablePlayerCard** | Joueur comparable | Market value similaire |

### Notifications Components (1)

| Composant | Description | Integration |
|-----------|-------------|-------------|
| **NotificationsCenter** | Centre notifications modal | Firebase FCM + API |

### Performance Predictor Components (7)

| Composant | Description | Visualisation |
|-----------|-------------|---------------|
| **PredictionCard** | Card prédiction performance | Rating prédit + confiance |
| **FormationView** | Vue formation tactique | 11 joueurs positionnés |
| **KeyFactorItem** | Facteur clé prédiction | Icône + impact (%) |
| **RecommendationCard** | Recommandation coach | Suggestions tactiques |
| **ConfidenceInterval** | Intervalle confiance | Min-Max avec moyenne |
| **RatingDistribution** | Distribution ratings possibles | Histogramme probabilités |
| **AccuracyMetricCard** | Métrique précision modèle | Historique prédictions |

### ArkaneMatch Components (5)

| Composant | Description | Features |
|-----------|-------------|----------|
| **ChatMessage** | Message chat IA/User | Bubble style, timestamp |
| **MessageInput** | Input message + bouton | Auto-resize, suggestions |
| **SuggestionChips** | Chips suggestions rapides | Quick queries |
| **TypingIndicator** | Animation "typing..." | 3 dots animés |
| **ScoutMiniCard** | Mini card scout résultat | Quick preview + CTA |

---

## API SERVICES

### Architecture API

**Base Client**: `/src/services/api.ts` (770 lignes)
- Axios instance configurée
- Interceptors auth + logging
- Error handling 401 (token expiry)
- Request/Response normalization

### Services Spécialisés

#### 1. Auto-Scout Service

**Fichier**: `/src/services/api/auto-scout.ts`

**Endpoints**:
```typescript
POST   /auto-scout/generate           // Générer rapport
GET    /auto-scout/templates          // Templates disponibles
GET    /auto-scout/player/:id/history // Historique joueur
POST   /auto-scout/regenerate/:id     // Régénérer rapport
GET    /auto-scout/cost-estimate      // Estimation coût
GET    /auto-scout/preview/:playerId  // Prévisualiser
POST   /auto-scout/enhance/:id        // Améliorer rapport
GET    /auto-scout/analytics          // Analytics usage
DELETE /auto-scout/reports/:id        // Supprimer rapport
```

**Types**: `/src/types/auto-scout.ts`
- `GenerateReportDto`
- `GeneratedReport`
- `ReportTemplate`
- `AutoScoutHistoryItem`

#### 2. Coaching Service

**Fichier**: `/src/services/api/coaching.ts`

**Endpoints**:
```typescript
// Coaches
GET    /coaching/coaches              // Liste coachs
GET    /coaching/coaches/:id          // Profil coach
PUT    /coaching/coaches/:id/profile  // Update profil
POST   /coaching/coaches/become-coach // Devenir coach

// Sessions
POST   /coaching/bookings             // Réserver session
GET    /coaching/bookings/my          // Mes sessions
GET    /coaching/bookings/:id         // Détail session
PUT    /coaching/bookings/:id         // Modifier session
DELETE /coaching/bookings/:id         // Annuler session

// Availability
GET    /coaching/availability/:coachId // Disponibilités coach

// Reviews
POST   /coaching/reviews              // Créer avis
GET    /coaching/reviews/:coachId     // Avis coach
GET    /coaching/reviews/:coachId/stats // Stats avis
```

**Types**: `/src/types/coaching.ts`
- `Coach`, `CoachProfile`, `CoachFilters`
- `Session`, `SessionStatus`, `BookSessionRequest`
- `Review`, `CreateReviewRequest`, `ReviewStats`
- `AvailabilitySlot`

#### 3. Gamification Service

**Fichier**: `/src/services/api/gamification.ts`

**Endpoints**:
```typescript
GET  /gamification/achievements        // Achievements user
GET  /gamification/leaderboard/:type   // Classement
GET  /gamification/badges               // Collection badges
POST /gamification/badge/:id/pin       // Épingler badge
GET  /gamification/profile              // Profil gamification
GET  /gamification/daily-challenge     // Challenge du jour
POST /gamification/daily-challenge/claim // Réclamer récompense
GET  /gamification/stats                // Stats détaillées
```

**Types**: `/src/types/gamification.ts`
- `Achievement`, `AchievementCategory`, `AchievementRarity`
- `Badge`, `BadgeRarity`
- `DailyChallenge`, `ChallengeType`
- `LeaderboardEntry`, `LeaderboardType`
- `GamificationStats`, `UserXP`

#### 4. Marketplace Service

**Fichier**: `/src/services/marketplace.api.ts`

**Endpoints**:
```typescript
// Search & Discovery
GET    /marketplace/listings           // Rechercher scouts
GET    /marketplace/listings/:id       // Détail listing
POST   /marketplace/listings/match     // Matching scores

// Listing Management (scouts)
GET    /marketplace/listings/my        // Mon listing
POST   /marketplace/listings           // Créer listing
PATCH  /marketplace/listings           // Modifier listing
PATCH  /marketplace/listings/activate  // Activer listing
PATCH  /marketplace/listings/pause     // Mettre en pause
DELETE /marketplace/listings           // Supprimer listing

// Offers (clubs ↔ scouts)
POST   /marketplace/offers             // Envoyer offre
GET    /marketplace/offers/sent        // Offres envoyées
GET    /marketplace/offers/received    // Offres reçues
PATCH  /marketplace/offers/:id/accept  // Accepter offre
PATCH  /marketplace/offers/:id/reject  // Refuser offre
PATCH  /marketplace/offers/:id/complete // Terminer offre
PATCH  /marketplace/offers/:id/cancel  // Annuler offre

// Reviews
POST   /marketplace/reviews            // Créer avis
GET    /marketplace/reviews/listing/:id // Avis d'un listing

// Favorites (clubs)
POST   /marketplace/favorites          // Ajouter favori
GET    /marketplace/favorites/my       // Mes favoris
DELETE /marketplace/favorites/:id      // Retirer favori
PATCH  /marketplace/favorites/:id      // Modifier favori
```

**Types**: `/src/types/marketplace.ts`
- `MarketplaceListing`, `SearchListingsFilters`
- `MarketplaceOffer`, `OfferStatus`
- `MarketplaceReview`
- `MarketplaceFavorite`
- `MatchingScore`

#### 5. Players Service

**Main API Client** (`/src/services/api.ts`)

**Endpoints**:
```typescript
GET    /players                   // Liste joueurs (paginated)
GET    /players/:id               // Détail joueur
GET    /players/:id/stats         // Stats joueur
POST   /players                   // Créer joueur
PATCH  /players/:id               // Modifier joueur
DELETE /players/:id               // Supprimer joueur
```

**Filters**:
```typescript
{
  position?: string;
  status?: string;
  nationality?: string;
  clubId?: string;
  search?: string;
  page?: number;
  limit?: number;
}
```

#### 6. Scouting Reports Service

**Endpoints**:
```typescript
GET    /scouting-reports          // Liste rapports
GET    /scouting-reports/:id      // Détail rapport
POST   /scouting-reports          // Créer rapport
PATCH  /scouting-reports/:id      // Modifier rapport
DELETE /scouting-reports/:id      // Supprimer rapport
POST   /scouting-reports/:id/submit  // Soumettre rapport
POST   /scouting-reports/:id/review  // Reviewer rapport
```

#### 7. Voice-to-Report Service

**Fichier**: `/src/services/api/voice-to-report.ts`

**Endpoints**:
```typescript
POST   /voice-to-report/transcribe     // Transcrire audio → texte
POST   /voice-to-report/extract-data   // Extraire données structurées
POST   /voice-to-report/generate-report // Générer rapport depuis vocal
```

**Types**: `/src/types/voice-to-report.ts`

#### 8. AI Services

**Regroupés dans**: `/src/services/api.ts`

**Endpoints**:
```typescript
// ArkaneGPT
POST   /ai/summary                      // Chat GPT

// Arcane Index
GET    /ai/index/:playerId              // Index joueur

// ArkaneMatch
POST   /arkane-match/chat               // Chat recherche scouts
GET    /arkane-match/conversations/:id  // Conversation
DELETE /arkane-match/conversations/:id  // Clear conversation
GET    /arkane-match/info               // Info ArkaneMatch

// Market Value
GET    /market-value/:playerId          // Valeur marché joueur

// Performance Predictor
POST   /performance-predictor/predict   // Prédire performance

// PlayStyle DNA
GET    /playstyle-dna/:playerId         // ADN style de jeu

// Smart Scout
POST   /smart-scout/autocomplete        // Suggestions temps réel
POST   /smart-scout/insights            // Insights contextuels
```

#### 9. Autres Services

**Analytics**:
```typescript
GET /analytics/overview              // Vue d'ensemble
GET /analytics/players               // Analytics joueurs
GET /analytics/clubs                 // Analytics clubs
GET /analytics/scouting-reports      // Analytics rapports
GET /analytics/activity-trends       // Tendances activité
```

**Matches**:
```typescript
GET    /matches                     // Liste matches
GET    /matches/:id                 // Détail match
GET    /matches/upcoming            // Matches à venir
GET    /matches/live                // Matches en direct
POST   /matches                     // Créer match
PUT    /matches/:id                 // Modifier match
DELETE /matches/:id                 // Supprimer match
PATCH  /matches/:id/assign-scout    // Assigner scout
PATCH  /matches/:id/score           // Mettre à jour score
```

**Clubs**:
```typescript
GET /clubs                          // Liste clubs
GET /clubs/:id                      // Détail club
```

**Camps**:
```typescript
GET    /camps                       // Liste camps
GET    /camps/:id                   // Détail camp
GET    /camps/my/registrations      // Mes inscriptions
POST   /camps                       // Créer camp
PUT    /camps/:id                   // Modifier camp
POST   /camps/:id/register          // S'inscrire
DELETE /camps/registrations/:id     // Annuler inscription
```

**Notifications**:
```typescript
GET    /notifications/user/:userId  // Notifications user
PATCH  /notifications/:id/read      // Marquer lu
DELETE /notifications/:id           // Supprimer notification

// FCM Push
POST   /notifications/register-device    // Enregistrer device
POST   /notifications/unregister-device  // Désenregistrer device
POST   /notifications/send               // Envoyer notification
POST   /notifications/send-multiple      // Envoyer multiple
POST   /notifications/send-topic         // Envoyer à topic
POST   /notifications/subscribe-topic    // S'abonner topic
POST   /notifications/unsubscribe-topic  // Se désabonner topic
POST   /notifications/match/:id/reminder // Rappel match
POST   /notifications/report/:id/notify  // Notif rapport
```

**Kanban**:
```typescript
GET    /kanban/boards               // Liste boards
GET    /kanban/boards/:id           // Détail board
POST   /kanban/boards               // Créer board
PATCH  /kanban/boards/:id           // Modifier board
DELETE /kanban/boards/:id           // Supprimer board

POST   /kanban/boards/:id/columns   // Créer colonne
PATCH  /kanban/columns/:id          // Modifier colonne
DELETE /kanban/columns/:id          // Supprimer colonne

POST   /kanban/cards                // Créer card
GET    /kanban/cards/:id            // Détail card
PATCH  /kanban/cards/:id            // Modifier card
POST   /kanban/cards/:id/move       // Déplacer card
DELETE /kanban/cards/:id            // Supprimer card
GET    /kanban/cards/:id/activities // Activités card
```

**Passport**:
```typescript
GET    /passport/:token             // Get passport par token
GET    /passport/token/:token       // Get passport par token alt
POST   /passport                    // Créer passport
GET    /passport/player/:playerId   // Get passport joueur
GET    /passport/me                 // Mon passport
PUT    /passport/player/:playerId/verify // Vérifier passport
DELETE /passport/player/:playerId   // Supprimer passport
```

**Subscriptions**:
```typescript
GET  /subscriptions/pricing         // Pricing plans
GET  /subscriptions/me              // Mon abonnement
POST /subscriptions                 // Créer/Modifier abonnement
PUT  /subscriptions/cancel          // Annuler abonnement
PUT  /subscriptions/reactivate      // Réactiver abonnement
PUT  /subscriptions/change-tier     // Changer de plan
```

**Auth**:
```typescript
POST /auth/login                    // Connexion
POST /auth/signup                   // Inscription
GET  /auth/me                       // User actuel
PATCH /auth/profile                 // Modifier profil
```

**Contact**:
```typescript
POST /contact                       // Envoyer message contact
```

### API Client Features

**Interceptors**:
- **Request**: Ajoute token Bearer automatiquement
- **Response**: Log des appels API (endpoint, méthode, durée, status)
- **Error**: Gestion 401 (auto-logout), logging détaillé

**Normalization**:
```typescript
normalizePaginated<T>(payload): PaginatedResponse<T>
// Normalise réponses API vers format uniforme
// Supporte: array direct, { items, meta }, { data, meta }
```

**Logger Service** (`/src/services/logger.service.ts`):
```typescript
logger.info(message, data?)
logger.warn(message, data?)
logger.error(message, error, data?)
logApiCall(endpoint, method, duration, status)
```

---

## STATE MANAGEMENT

### Contexts

#### 1. AuthContext

**Fichier**: `/src/contexts/AuthContext.tsx`

**État géré**:
```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}
```

**Persistence**: AsyncStorage
- `AUTH_TOKEN`: Token JWT
- `USER_DATA`: Objet User sérialisé

**Auto-login**: Charge token/user au démarrage

#### 2. ThemeContext

**Fichier**: `/src/contexts/ThemeContext.tsx`

**État géré**:
```typescript
interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
}
```

**Modes**: Light / Dark (système)

#### 3. LocalizationContext

**Fichier**: `/src/contexts/LocalizationContext.tsx`

**Langues supportées**: FR, EN

**État géré**:
```typescript
interface LocalizationContextType {
  locale: 'fr' | 'en';
  setLocale: (locale: 'fr' | 'en') => void;
  t: (key: string) => string; // Translation function
}
```

**Fichiers traductions**:
- `/src/i18n/locales/fr.ts`
- `/src/i18n/locales/en.ts`

### Custom Hooks

**Localisation**: `/src/hooks/`

| Hook | Fichier | Description | État retourné |
|------|---------|-------------|---------------|
| **usePlayers** | `usePlayers.ts` | Gestion joueurs | `players`, `loading`, `error`, `fetchPlayers` |
| **useReports** | `useReports.ts` | Gestion rapports | `reports`, `createReport`, `deleteReport` |
| **useMarket** | `useMarket.ts` | Marché joueurs | `listings`, `filters`, `applyFilters` |
| **useNotifications** | `useNotifications.ts` | Notifications | `notifications`, `unreadCount`, `markAsRead` |
| **useCamps** | `useCamps.ts` | Camps/stages | `camps`, `myCamps`, `registerForCamp` |
| **useCalendar** | `useCalendar.ts` | Calendrier | `events`, `addEvent`, `deleteEvent` |
| **useAnalytics** | `useAnalytics.ts` | Analytics | `stats`, `trends`, `refresh` |
| **useCoaching** | `useCoaching.ts` | Coaching hub | `coaches`, `sessions`, `bookSession` |
| **useGamification** | `useGamification.ts` | Gamification | `achievements`, `xp`, `leaderboard` |
| **usePassport** | `usePassport.ts` | Passeports | `passport`, `createPassport`, `verify` |
| **useDebounce** | `useDebounce.ts` | Debounce valeur | `debouncedValue` |

### Exemple useGamification

```typescript
export const useGamification = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userXP, setUserXP] = useState<UserXP | null>(null);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAchievements = async () => {
    const data = await gamificationService.getAchievements();
    setAchievements(data);
  };

  const fetchUserXP = async () => {
    const data = await gamificationService.getUserXP();
    setUserXP(data);
  };

  const fetchDailyChallenge = async () => {
    const data = await gamificationService.getDailyChallenge();
    setDailyChallenge(data);
  };

  const completeChallenge = async () => {
    await gamificationService.completeChallenge();
    await fetchDailyChallenge();
    await fetchUserXP();
  };

  return {
    achievements,
    userXP,
    dailyChallenge,
    loading,
    fetchAchievements,
    fetchUserXP,
    fetchDailyChallenge,
    completeChallenge,
  };
};
```

### React Query (TanStack Query)

**Package**: `@tanstack/react-query` v5.90.6

**Usage potentiel**: Pas encore implémenté à grande échelle, mais disponible pour:
- Cache API responses
- Invalidation automatique
- Optimistic updates
- Infinite scroll

---

## MOBILE-SPECIFIC FEATURES

### 1. Push Notifications (Firebase FCM)

**Packages**:
- `expo-notifications` v0.32.12
- `expo-device` v8.0.9

**Service**: `/src/services/notificationService.ts`

**Fonctionnalités**:
- Demande permissions iOS/Android
- Enregistrement token FCM
- Réception notifications foreground/background
- Notification listeners
- Badge count
- Redirection deeplink

**Endpoints utilisés**:
```typescript
POST /notifications/register-device
POST /notifications/unregister-device
POST /notifications/send
POST /notifications/subscribe-topic
```

**Composant**: `NotificationsCenter` (`/src/components/notifications/NotificationsCenter.tsx`)

### 2. Voice Recording (Voice-to-Report)

**Packages**:
- `expo-av` v16.0.7
- `expo-file-system` v19.0.17

**Service**: `/src/services/api/voice-to-report.ts`

**Flow**:
1. Demande permission micro
2. Enregistrement audio (format m4a)
3. Upload vers serveur
4. Transcription (Whisper AI)
5. Extraction données structurées
6. Génération rapport

**Composants**:
- `RecordButton` - Bouton enregistrement
- `AudioPlayer` - Lecteur audio
- `WaveformDisplay` - Visualisation onde
- `TranscriptionCard` - Affichage transcription
- `ExtractedDataCard` - Données extraites

### 3. QR Code Scanning (Player Passport)

**Package**: `react-native-qrcode-svg` v6.3.20

**Usage**: Génération QR codes pour passeports joueurs

**Composant**: `PassportScreen`

**Fonctionnalités**:
- Génération QR code unique par joueur
- Partage QR code
- Scan QR code (validation identité)

### 4. Haptic Feedback

**Package**:
- `expo-haptics` v15.0.7
- `react-native-haptic-feedback` v2.3.3

**Usage**: Feedback tactile sur toutes les interactions

**Helpers**: `/src/utils/haptics.ts`

```typescript
lightImpact()     // Light tap
mediumImpact()    // Medium tap
heavyImpact()     // Strong tap
notificationSuccess()
notificationWarning()
notificationError()
selectionAsync()  // Selection changed
```

**Utilisé dans**:
- Boutons
- Swipes
- Toggles
- Navigation tabs
- Modals

### 5. Offline Support

**Package**: `@react-native-async-storage/async-storage` v2.2.0

**Données persistées**:
- Token authentification
- User data
- Langue préférée
- Thème (dark/light)
- Cache API responses (potentiel)

**Storage Keys** (`/src/constants/config.ts`):
```typescript
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@arcane/auth_token',
  USER_DATA: '@arcane/user_data',
  LOCALE: '@arcane/locale',
  THEME: '@arcane/theme',
};
```

### 6. Animations

**Package**: `react-native-reanimated` v4.1.1

**Features**:
- **Shared Values**: État partagé natif
- **Animated Styles**: Styles interpolés
- **Spring Animations**: Animations physiques
- **Gesture Handler**: Gestures fluides
- **Layout Animations**: Entering/Exiting

**Exemples d'usage**:
- Tab bar animations
- Hero section entrance
- Card expansions
- Drag & drop (Kanban)
- Pull to refresh

**Composants animés**:
```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
```

### 7. Maps Integration

**Package**: `react-native-maps` v1.26.18

**Usage**: Affichage clubs, camps, événements sur carte

**Potentiel usage**:
- Localisation camps
- Disponibilité scouts par région
- Carte clubs/stades

### 8. Charts & Visualizations

**Packages**:
- `react-native-chart-kit` v6.12.0
- `victory-native` v41.20.2
- `@shopify/react-native-skia` v2.3.10

**Charts disponibles**:
- Line charts (tendances)
- Bar charts (comparaisons)
- Pie charts (distributions)
- Radar charts (PlayStyle DNA)

### 9. Clipboard

**Package**: `expo-clipboard` v8.0.7

**Usage**: Copier vers presse-papier
- Liens rapports
- Codes passeports
- Stats joueurs
- Informations contact

### 10. Status Bar

**Package**: `expo-status-bar` v3.0.8

**Gestion**: Adapte couleur selon thème (light/dark)

---

## DESIGN SYSTEM

### Architecture Design

**Localisation**: `/src/design/`

```
/design/
├── theme.ts              # Configuration theme centrale
├── components/           # Design system components
│   ├── Avatar.tsx
│   ├── Badge.tsx
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Tabs.tsx
│   └── Typography.tsx
├── tokens.ts             # Design tokens
├── typography.ts         # Typography system
└── constants.ts          # Constants
```

### Theme Configuration

**Fichier**: `/src/design/theme.ts`

**Structure**:
```typescript
export const theme = {
  colors: {
    brand: {
      primary: '#3B82F6',      // Blue 500
      primaryLight: '#60A5FA', // Blue 400
      primaryDark: '#2563EB',  // Blue 600
      accent: '#8B5CF6',       // Purple 500
      accentLight: '#A78BFA',  // Purple 400
    },
    semantic: {
      success: '#10B981',      // Green 500
      warning: '#F59E0B',      // Amber 500
      error: '#EF4444',        // Red 500
      info: '#3B82F6',         // Blue 500
    },
    text: {
      primary: '#F9FAFB',      // Gray 50
      secondary: '#D1D5DB',    // Gray 300
      tertiary: '#9CA3AF',     // Gray 400
      inverse: '#FFFFFF',
      muted: '#6B7280',        // Gray 500
    },
    background: {
      primary: '#0F172A',      // Slate 900
      secondary: '#1E293B',    // Slate 800
      tertiary: '#334155',     // Slate 700
      overlay: 'rgba(0,0,0,0.7)',
    },
    surface: {
      glass: 'rgba(255,255,255,0.05)',
      glassLight: 'rgba(255,255,255,0.1)',
      border: 'rgba(255,255,255,0.1)',
      borderLight: 'rgba(255,255,255,0.2)',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    fonts: {
      regular: 'System',
      medium: 'System',
      semiBold: 'System',
      bold: 'System',
    },
    sizes: {
      xs: 11,
      sm: 13,
      base: 15,
      lg: 17,
      xl: 20,
      h6: 17,
      h5: 20,
      h4: 24,
      h3: 28,
      h2: 32,
      h1: 40,
      display3: 48,
      display2: 56,
      display1: 64,
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  radius: {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  animations: {
    springs: {
      bouncy: {
        damping: 15,
        stiffness: 150,
        mass: 1,
      },
      smooth: {
        damping: 20,
        stiffness: 100,
        mass: 1,
      },
    },
    timings: {
      fast: 200,
      normal: 300,
      slow: 500,
    },
  },
  layout: {
    safeArea: {
      top: 44,
      bottom: 34,
    },
  },
};
```

### Design Components

#### Avatar

**Props**:
```typescript
interface AvatarProps {
  source?: string;        // URI or require()
  name: string;           // Fallback initials
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away';
  badge?: number;         // Notification badge
}
```

**Sizes**: 24, 32, 40, 56, 80 px

#### Badge

**Variants**:
```typescript
type Variant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'gradient';
type Size = 'sm' | 'md' | 'lg';
```

**Features**: Rounded, icon support

#### Button

**Variants**:
```typescript
type Variant = 'primary' | 'secondary' | 'ghost' | 'gradient' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'xl';
```

**Props**:
```typescript
interface ButtonProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  onPress?: () => void;
  children: ReactNode;
}
```

**Features**:
- Gradient backgrounds
- Loading states
- Icon support (left/right)
- Haptic feedback
- Press animations

#### Card

**Variants**:
```typescript
type Variant = 'default' | 'glass' | 'gradient' | 'elevated' | 'bordered';
type Size = 'sm' | 'md' | 'lg';
```

**Props**:
```typescript
interface CardProps {
  variant?: Variant;
  size?: Size;
  glowOnPress?: boolean;
  onPress?: () => void;
  children: ReactNode;
  style?: ViewStyle;
}
```

**Features**:
- Glassmorphism effect
- Glow on press
- Multiple variants
- Shadow/elevation

#### Typography

**Components**:
```typescript
<Display variant="display1" | "display2" | "display3">
<Heading variant="h1" | "h2" | "h3" | "h4" | "h5" | "h6">
<Text variant="body" | "body-lg" | "body-sm">
<Caption color="primary" | "secondary" | "muted">
```

**Props**:
```typescript
interface TypographyProps {
  variant?: Variant;
  weight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'black';
  color?: 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'muted';
  align?: 'left' | 'center' | 'right';
  style?: TextStyle;
  children: ReactNode;
}
```

#### Input

**Types**:
```typescript
type InputType = 'text' | 'email' | 'password' | 'number' | 'phone';
```

**Props**:
```typescript
interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  type?: InputType;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  icon?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}
```

**Features**:
- Floating labels
- Error states
- Icon support
- Secure text entry (password)

#### Tabs

**Props**:
```typescript
interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: number;
}
```

**Features**:
- Animated indicator
- Icon + badge support
- Smooth transitions

### Icons System

**Package**: `@expo/vector-icons` (Ionicons)

**Type Safety**: `/src/constants/icons.ts`

```typescript
export type IconName =
  | 'home'
  | 'people'
  | 'football'
  | 'analytics'
  | 'search'
  | 'notifications'
  | 'personCircle'
  | 'ai'
  | 'chat'
  | 'document'
  | 'cash'
  | 'trophy'
  | 'star'
  | 'heart'
  | 'settings'
  | 'calendar'
  | 'mic'
  | 'camera'
  | 'location'
  | 'mail'
  | 'call'
  | 'checkmark'
  | 'close'
  | 'arrowBack'
  | 'arrowForward'
  | 'chevronForward'
  | 'qrCode'
  | 'fitness'
  | 'pricetag'
  | 'grid'
  | 'documentText'
  | 'scale'
  | 'chatOutline'
  // ... 50+ icônes
```

**Composant Icon**:
```typescript
<Icon
  name="football"
  size="md"        // xs | sm | md | lg | xl
  color="#3B82F6"
/>
```

---

## TECHNOLOGY STACK

### Core Framework

| Technology | Version | Description |
|-----------|---------|-------------|
| **React Native** | 0.81.5 | Framework mobile |
| **Expo** | ~54.0.18 | Toolchain |
| **React** | 19.1.0 | UI library |
| **TypeScript** | ~5.9.2 | Type safety |

### Navigation

| Package | Version | Usage |
|---------|---------|-------|
| `@react-navigation/native` | 7.1.19 | Core navigation |
| `@react-navigation/native-stack` | 7.3.28 | Stack navigator |
| `@react-navigation/bottom-tabs` | 7.7.1 | Bottom tabs |
| `@react-navigation/stack` | 7.6.1 | Stack transitions |

### UI & Design

| Package | Version | Purpose |
|---------|---------|---------|
| `react-native-reanimated` | ~4.1.1 | Animations |
| `react-native-gesture-handler` | ~2.28.0 | Gestures |
| `expo-linear-gradient` | ~15.0.7 | Gradients |
| `expo-blur` | ~15.0.7 | Blur effects |
| `@expo/vector-icons` | 15.0.3 | Icons |
| `react-native-svg` | 15.14.0 | SVG support |
| `lottie-react-native` | 7.3.4 | Lottie animations |

### State & Data

| Package | Version | Purpose |
|---------|---------|---------|
| `axios` | 1.13.1 | HTTP client |
| `@tanstack/react-query` | 5.90.6 | Server state |
| `zustand` | 5.0.8 | Client state |
| `@react-native-async-storage/async-storage` | 2.2.0 | Persistence |

### Mobile Features

| Package | Version | Feature |
|---------|---------|---------|
| `expo-notifications` | 0.32.12 | Push notifications |
| `expo-haptics` | ~15.0.7 | Haptic feedback |
| `expo-av` | 16.0.7 | Audio/Video |
| `expo-clipboard` | 8.0.7 | Clipboard |
| `expo-device` | 8.0.9 | Device info |
| `expo-file-system` | 19.0.17 | File system |
| `react-native-qrcode-svg` | 6.3.20 | QR codes |
| `react-native-maps` | 1.26.18 | Maps |

### Charts & Visualizations

| Package | Version | Charts |
|---------|---------|--------|
| `react-native-chart-kit` | 6.12.0 | Line, Bar, Pie |
| `victory-native` | 41.20.2 | Victory charts |
| `@shopify/react-native-skia` | 2.3.10 | Skia rendering |

### Testing

| Package | Version | Purpose |
|---------|---------|---------|
| `jest` | 29.7.0 | Test runner |
| `jest-expo` | ~51.0.3 | Expo preset |
| `@testing-library/react-native` | 12.9.0 | Testing utilities |
| `@testing-library/jest-native` | 5.4.3 | Native matchers |
| `axios-mock-adapter` | 2.1.0 | API mocking |

### Development

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ~5.9.2 | Type checking |
| `eslint` | 9.14.0 | Linting |
| `@typescript-eslint/parser` | 8.18.2 | TS linting |
| `babel-preset-expo` | 54.0.6 | Babel config |

### Additional Libraries

| Package | Version | Usage |
|---------|---------|-------|
| `lucide-react-native` | 0.553.0 | Alternative icons |
| `react-native-toast-message` | 2.3.3 | Toast notifications |
| `react-native-safe-area-context` | ~5.6.0 | Safe areas |
| `react-native-screens` | ~4.16.0 | Native screens |
| `@react-native-picker/picker` | 2.11.4 | Picker component |
| `@react-native-community/slider` | 5.1.0 | Slider component |

---

## PROJECT STRUCTURE

```
/mobile/
├── App.tsx                          # Entry point
├── index.ts                         # Expo entry
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── jest.config.js                   # Jest config
├── jest.setup.js                    # Jest setup
├── metro.config.js                  # Metro bundler config
├── app.json                         # Expo config
│
├── /src/
│   ├── /components/                 # 70+ components
│   │   ├── /ui/                     # Design system (17)
│   │   ├── /auto-scout/             # AutoScout (7)
│   │   ├── /players/                # Players (2)
│   │   ├── /marketplace/            # Marketplace (4)
│   │   ├── /playstyle-dna/         # PlayStyle DNA (5)
│   │   ├── /charts/                 # Charts (3)
│   │   ├── /search/                 # Search (1)
│   │   ├── /smart-scout/           # SmartScout (4)
│   │   ├── /voice/                  # Voice (6)
│   │   ├── /market-value/          # Market Value (5)
│   │   ├── /notifications/         # Notifications (1)
│   │   ├── /performance-predictor/ # Performance (7)
│   │   └── /arkane-match/          # ArkaneMatch (5)
│   │
│   ├── /screens/                    # 46+ screens
│   │   ├── /auth/                   # Login, Signup
│   │   ├── /home/                   # HomeScreen
│   │   ├── /dashboard/              # DashboardScreen
│   │   ├── /ai/                     # 13 AI screens
│   │   ├── /players/                # 4 players screens
│   │   ├── /reports/                # 4 reports screens
│   │   ├── /scouting/               # 2 scouting screens
│   │   ├── /marketplace/            # 3 marketplace screens
│   │   ├── /coaching/               # 5 coaching screens
│   │   ├── /gamification/           # 5 gamification screens
│   │   ├── /kanban/                 # KanbanScreen
│   │   ├── /calendar/               # 2 calendar screens
│   │   ├── /camps/                  # CampsScreen
│   │   ├── /clubs/                  # 2 clubs screens
│   │   ├── /info/                   # About, Contact, Services
│   │   ├── /settings/               # SettingsScreen
│   │   ├── /analytics/              # AnalyticsScreen
│   │   ├── /market/                 # MarketScreen
│   │   ├── /membership/             # MembershipScreen
│   │   ├── /passport/               # PassportScreen
│   │   ├── /profile/                # ProfileScreen
│   │   └── /matches/                # MatchesScreen
│   │
│   ├── /navigation/                 # Navigation system
│   │   ├── RootNavigator.tsx        # Auth/Main router
│   │   ├── AppNavigator.tsx         # Stack navigator (42 routes)
│   │   ├── MainTabNavigator.tsx     # Bottom tabs (6 tabs)
│   │   ├── TabNavigator.tsx         # Role-based tabs
│   │   ├── ReportsNavigator.tsx     # Reports stack
│   │   ├── /components/             # Nav components
│   │   └── /config/                 # Nav config
│   │       └── navigationConfig.ts  # Role configs
│   │
│   ├── /services/                   # API services
│   │   ├── api.ts                   # Main API client (770 lines)
│   │   ├── toast.ts                 # Toast service
│   │   ├── logger.service.ts        # Logger
│   │   ├── notificationService.ts   # Push notifications
│   │   ├── passportService.ts       # Passport service
│   │   ├── marketplace.api.ts       # Marketplace API
│   │   └── /api/                    # Specialized APIs
│   │       ├── auto-scout.ts        # AutoScout API
│   │       ├── coaching.ts          # Coaching API
│   │       ├── gamification.ts      # Gamification API
│   │       ├── players.ts           # Players API
│   │       ├── scouting-reports.ts  # Reports API
│   │       ├── voice-to-report.ts   # Voice API
│   │       ├── performance-predictor.ts
│   │       ├── playstyle-dna.ts
│   │       ├── market-value.ts
│   │       ├── smart-scout.ts
│   │       ├── events.ts
│   │       └── kanban.ts
│   │
│   ├── /contexts/                   # React contexts
│   │   ├── AuthContext.tsx          # Auth state
│   │   ├── ThemeContext.tsx         # Theme state
│   │   └── LocalizationContext.tsx  # i18n state
│   │
│   ├── /hooks/                      # Custom hooks (14)
│   │   ├── usePlayers.ts
│   │   ├── useReports.ts
│   │   ├── useMarket.ts
│   │   ├── useNotifications.ts
│   │   ├── useCamps.ts
│   │   ├── useCalendar.ts
│   │   ├── useAnalytics.ts
│   │   ├── useCoaching.ts
│   │   ├── useGamification.ts
│   │   ├── usePassport.ts
│   │   └── useDebounce.ts
│   │
│   ├── /types/                      # TypeScript types
│   │   ├── index.ts                 # Main types
│   │   ├── navigation.ts            # Navigation types
│   │   ├── auto-scout.ts
│   │   ├── coaching.ts
│   │   ├── gamification.ts
│   │   ├── marketplace.ts
│   │   ├── passport.ts
│   │   ├── notifications.ts
│   │   ├── performance-predictor.ts
│   │   ├── playstyle-dna.ts
│   │   ├── market-value.ts
│   │   ├── smart-scout.ts
│   │   ├── arkane-match.ts
│   │   └── voice-to-report.ts
│   │
│   ├── /design/                     # Design system
│   │   ├── theme.ts                 # Theme config
│   │   ├── tokens.ts                # Design tokens
│   │   ├── typography.ts            # Typography system
│   │   ├── constants.ts             # Constants
│   │   └── /components/             # Design components
│   │       ├── Avatar.tsx
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       ├── Tabs.tsx
│   │       └── Typography.tsx
│   │
│   ├── /i18n/                       # Internationalization
│   │   ├── index.ts
│   │   └── /locales/
│   │       ├── en.ts                # English
│   │       └── fr.ts                # French
│   │
│   ├── /constants/                  # Constants
│   │   ├── config.ts                # App config
│   │   ├── icons.ts                 # Icon types
│   │   └── features.ts              # Feature flags
│   │
│   ├── /utils/                      # Utilities
│   │   ├── logger.ts                # Logger utility
│   │   ├── haptics.ts               # Haptics helpers
│   │   └── date.ts                  # Date formatting
│   │
│   └── /assets/                     # Static assets
│       ├── notification-icon.png
│       └── ...
│
├── /assets/                         # Expo assets
│   ├── icon.png
│   ├── splash.png
│   └── adaptive-icon.png
│
└── /__tests__/                      # Tests (not in /src/)
```

---

## FEATURE FLAGS

**Fichier**: `/src/constants/features.ts`

```typescript
export const FEATURE_FLAGS = {
  aiHubTab: true,               // AI Hub tab in MainTabNavigator
  marketplaceTab: true,         // Marketplace tab
  coachingTab: true,            // Coaching tab
  passportTab: true,            // Passport tab
  profileTab: true,             // Profile tab
  shortcuts: {
    players: true,              // Players shortcut in Command Center
    analytics: true,            // Analytics shortcut
    matches: true,              // Matches shortcut
    reports: true,              // Reports shortcut
    voiceToReport: true,        // Voice-to-Report shortcut
    marketplace: true,          // Marketplace shortcut
  },
};
```

**Presets**:
- `demo`: Tous activés
- `staging`: Coaching + tous shortcuts
- `production`: Configuration production

**Helper**:
```typescript
isFeatureEnabled(flag: FeatureFlagKey): boolean
```

**Usage**:
```typescript
{FEATURE_FLAGS.coachingTab && (
  <Tab.Screen name="Coaching" component={CoachingHubScreen} />
)}
```

---

## USER ROLES SYSTEM

### Rôles Disponibles

**Enum**: `/src/types/index.ts`

```typescript
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
  SCOUT = 'SCOUT',
  ANALYST = 'ANALYST',
  PLAYER = 'PLAYER',
  CLUB_CONTACT = 'CLUB_CONTACT',
  PUBLIC = 'PUBLIC',
}
```

### Navigation par Rôle

**Configuration**: `/src/navigation/config/navigationConfig.ts`

| Rôle | Tabs Principaux | Description |
|------|----------------|-------------|
| **SUPER_ADMIN** | Dashboard, Users, Analytics, System, Profile | Administration globale |
| **ADMIN** | Dashboard, Squad, Reports, Analytics, More | Administration club |
| **SCOUT** | Dashboard, Players, Reports, Calendar, Profile | Scouting professionnel |
| **ANALYST** | Dashboard, Analytics, Predictions, Compare, Profile | Analyse données |
| **AGENT** | Portfolio, Transfers, Network, Calendar, Profile | Gestion joueurs |
| **PLAYER** | Dashboard, Passport, Coaching, Camps, Profile | Joueur |
| **CLUB_CONTACT** | Dashboard, Camps, Events, Calendar, Profile | Organisation événements |
| **PUBLIC** | Home, Players, Clubs, Pricing, Login | Non authentifié |

---

## API CONFIGURATION

### Environment Variables

**Fichier**: `/src/constants/config.ts`

```typescript
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
export const API_TIMEOUT = 10000; // 10 secondes

export const STORAGE_KEYS = {
  AUTH_TOKEN: '@arcane/auth_token',
  USER_DATA: '@arcane/user_data',
  LOCALE: '@arcane/locale',
  THEME: '@arcane/theme',
};
```

### Request Flow

1. **AuthContext** charge token depuis AsyncStorage
2. **API Client** ajoute token dans header `Authorization: Bearer <token>`
3. **Request Interceptor** ajoute timestamp pour durée
4. **Response Interceptor** log API call (endpoint, méthode, durée, status)
5. **Error Interceptor** gère 401 (auto-logout)

### Logging

**Service**: `/src/services/logger.service.ts`

```typescript
logger.info('User logged in', { userId: user.id });
logger.warn('API rate limit approaching');
logger.error('Failed to fetch players', error, { filters });
logApiCall('/players', 'GET', 234, 200);
```

**Output**:
```
[INFO] User logged in { userId: '123' }
[WARN] API rate limit approaching
[ERROR] Failed to fetch players: Network Error { filters: {...} }
[API] GET /players - 234ms - 200
```

---

## TESTING STRATEGY

### Test Files

**Location**: Colocated with source files

**Patterns**:
```
LoginScreen.test.tsx
PlayerCard.spec.tsx
useMarket.spec.ts
api.test.ts
```

### Test Coverage

**Current Coverage** (examples):
- Auth: LoginScreen, SignupScreen
- Dashboard: DashboardScreen
- Players: PlayersScreen, PlayerCard
- Market: MarketScreen
- AI: ArcaneGPTScreen, ArcaneIndexScreen, AutoScoutScreen
- Search: GlobalSearch
- Notifications: NotificationsCenter
- Services: API client

### Jest Configuration

**Fichier**: `jest.config.js`

```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
  ],
};
```

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run lint          # ESLint
```

---

## BUILD & DEPLOYMENT

### Development

```bash
npm start             # Start Expo dev server
npm run android       # Run on Android
npm run ios           # Run on iOS
npm run web           # Run on web
```

### Production Build

**EAS Build** (Expo Application Services)

```bash
eas build --platform android
eas build --platform ios
eas build --platform all
```

### Environment Configuration

**app.json**:
```json
{
  "expo": {
    "name": "Arcane Football",
    "slug": "arcane-football",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0F172A"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.arcane.football"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0F172A"
      },
      "package": "com.arcane.football"
    },
    "plugins": [
      "expo-router",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#3B82F6"
        }
      ]
    ]
  }
}
```

---

## KEY METRICS

### Project Size

- **Total Screens**: 46+
- **Total Components**: 70+
- **API Endpoints**: 100+
- **Services**: 20+
- **Custom Hooks**: 14
- **Navigation Routes**: 42
- **Feature Flags**: 7
- **User Roles**: 8
- **Languages**: 2 (FR, EN)

### Code Organization

- **TypeScript Coverage**: 100%
- **Design System**: Centralisé
- **Component Reusability**: Élevé
- **API Client**: Centralisé avec interceptors
- **State Management**: Contexts + Custom Hooks
- **Testing**: Jest + React Native Testing Library

### Dependencies

- **Total Dependencies**: 35
- **Dev Dependencies**: 9
- **React Native Version**: 0.81.5
- **Expo SDK**: 54

---

## FUTURE ENHANCEMENTS

### Planned Features

1. **Offline Mode Complet**
   - Cache API responses
   - Sync when back online
   - Offline indicators

2. **Real-time Updates**
   - WebSocket integration
   - Live match scores
   - Real-time notifications

3. **Advanced Analytics**
   - More AI features
   - Custom dashboards
   - Data visualization

4. **Social Features**
   - Player/Scout chat
   - Team messaging
   - Activity feed

5. **Enhanced Gamification**
   - More achievements
   - Seasons/Leagues
   - Tournaments

6. **Accessibility**
   - VoiceOver support
   - High contrast mode
   - Font scaling

7. **Performance**
   - React Query migration
   - Image optimization
   - Bundle size reduction

---

## CONCLUSION

L'application mobile Arcane Football est une plateforme complète et moderne de gestion footballistique, offrant:

**Points Forts**:
- Architecture navigation robuste et extensible
- Design system cohérent et réutilisable
- API bien structurée avec typage fort
- Features mobiles natives (push, voice, haptics)
- Gamification engageante
- Multi-rôles flexible
- AI intégration poussée

**Technologies Modernes**:
- React Native + Expo (latest)
- TypeScript strict
- Reanimated 3 pour animations fluides
- Design glassmorphism moderne
- Feature flags pour déploiement progressif

**Scalabilité**:
- Séparation claire des responsabilités
- Services API modulaires
- Composants réutilisables
- Types centralisés
- Configuration par rôle

Cette architecture permet d'ajouter facilement de nouvelles features, rôles, ou écrans tout en maintenant une base de code maintenable et testable.

---

**Document généré le**: 2025-11-16
**Par**: Claude Code (Anthropic)
**Version**: 1.0.0
