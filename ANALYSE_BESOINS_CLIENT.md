# Analyse des Besoins Client vs État Actuel

## ✅ Fonctionnalités DÉJÀ Implémentées

### Backend (Existant)
- ✅ **Authentification JWT** avec rôles (ADMIN, SCOUT, AGENT, PLAYER, etc.)
- ✅ **Gestion des utilisateurs** (CRUD complet)
- ✅ **Gestion des joueurs** (Player profiles avec stats)
- ✅ **Gestion des clubs** (CRUD complet)
- ✅ **Gestion des matchs** (création, mise à jour, statuts)
- ✅ **Base de données PostgreSQL** avec Prisma ORM
- ✅ **API REST complète** documentée avec Swagger
- ✅ **Upload de médias** (Supabase Storage intégré)
- ✅ **Paiements** (Stripe intégré)
- ✅ **Notifications** (Firebase Cloud Messaging intégré)

### Mobile (Existant)
- ✅ **Écran de connexion/inscription**
- ✅ **Dashboard avec matches**
- ✅ **Liste des matches** avec filtres
- ✅ **Liste des joueurs** avec recherche/filtres
- ✅ **Profil utilisateur**

---

## 🚧 Fonctionnalités À AJOUTER (MVP)

### 1. CALENDRIER PARTAGÉ ⭐ PRIORITÉ 1
**Backend à créer:**
- [ ] Module Calendar/Events
  - CRUD événements
  - Attribution scouts/agents à un match
  - Statuts: prévu/confirmé/terminé
  - API pour sync Google/Outlook

**Frontend Mobile à créer:**
- [ ] Écran Calendrier (vue liste/semaine/carte)
- [ ] Carte interactive avec géolocalisation des stades
- [ ] Attribution des matchs aux scouts
- [ ] Filtres par statut

**Schéma DB (à ajouter):**
```prisma
model Event {
  id          String   @id @default(cuid())
  matchId     String?
  match       Match?   @relation(fields: [matchId], references: [id])
  title       String
  description String?
  startDate   DateTime
  endDate     DateTime
  location    String?
  latitude    Float?
  longitude   Float?
  status      EventStatus @default(PLANNED) // PLANNED, CONFIRMED, COMPLETED
  assignedTo  User[]   @relation("EventAssignments")
  createdBy   String
  creator     User     @relation(fields: [createdBy], references: [id])
}

enum EventStatus {
  PLANNED
  CONFIRMED
  COMPLETED
  CANCELLED
}
```

---

### 2. RAPPORTS DE SCOUTING ⭐ PRIORITÉ 1
**Backend existant mais à enrichir:**
- ✅ Model ScoutingReport existe déjà
- [ ] Ajouter workflow: DRAFT → REVIEW → PUBLISHED
- [ ] Ajouter notes détaillées (technique, physique, tactique, mental, potentiel)
- [ ] Lier médias/vidéos au rapport

**Frontend Mobile à créer:**
- [ ] Formulaire de création de rapport
  - Sélection du match
  - Sélection des joueurs observés
  - Notes 1-10 par catégorie
  - Commentaires libres
  - Upload vidéos/photos
- [ ] Workflow de validation (brouillon/publié)
- [ ] Historique des rapports par joueur

**Schéma DB (à modifier):**
```prisma
model ScoutingReport {
  // ... champs existants
  status          ReportStatus @default(DRAFT)
  technicalRating Int? // 1-10
  physicalRating  Int? // 1-10
  tacticalRating  Int? // 1-10
  mentalRating    Int? // 1-10
  potentialRating Int? // 1-10
  videos          String[] // URLs des vidéos
  photos          String[] // URLs des photos
  reviewedBy      String?
  reviewer        User?    @relation("ReportReviewer", fields: [reviewedBy], references: [id])
  publishedAt     DateTime?
}

enum ReportStatus {
  DRAFT
  REVIEW
  PUBLISHED
  ARCHIVED
}
```

---

### 3. FICHES JOUEURS (KANBAN) ⭐ PRIORITÉ 2
**Backend à créer:**
- [ ] Module PlayerPipeline
  - Statuts de pipeline (nouveau → observation → contact → offre → contrat)
  - Historique des changements
  - Tags personnalisables

**Frontend Mobile à créer:**
- [ ] Vue Kanban (tableau avec colonnes)
- [ ] Drag & drop des cartes de joueurs
- [ ] Détails de chaque carte:
  - Info basiques (déjà existantes)
  - Contrat (date fin, type, clause)
  - Vidéos/liens
  - Tags
  - Historique
- [ ] Filtres et recherche avancée

**Schéma DB (à ajouter):**
```prisma
model PlayerPipeline {
  id          String   @id @default(cuid())
  playerId    String   @unique
  player      Player   @relation(fields: [playerId], references: [id])
  status      PipelineStatus @default(NEW)
  tags        String[]
  priority    Int      @default(0)
  assignedTo  String?
  agent       User?    @relation(fields: [assignedTo], references: [id])
  notes       String?
  updatedAt   DateTime @updatedAt
}

model PlayerStatusHistory {
  id          String   @id @default(cuid())
  playerId    String
  player      Player   @relation(fields: [playerId], references: [id])
  oldStatus   PipelineStatus
  newStatus   PipelineStatus
  changedBy   String
  user        User     @relation(fields: [changedBy], references: [id])
  reason      String?
  createdAt   DateTime @default(now())
}

enum PipelineStatus {
  NEW
  OBSERVATION
  CONTACT
  OFFER
  CONTRACT
  ARCHIVED
}
```

---

### 4. GESTION DES DEMANDES DE CLUBS (MARCHÉ) ⭐ PRIORITÉ 2
**Backend à créer:**
- [ ] Module ClubRequests
  - CRUD demandes
  - Association avec joueurs
  - Filtres par marché/pays/ligue
  - Statuts de suivi

**Frontend Mobile à créer:**
- [ ] Écran "Marché"
- [ ] Liste des demandes de clubs
- [ ] Filtres par pays/ligue/budget
- [ ] Détails d'une demande
- [ ] Association de joueurs à une demande
- [ ] Statistiques par région

**Schéma DB (à ajouter):**
```prisma
model ClubRequest {
  id              String   @id @default(cuid())
  clubId          String
  club            Club     @relation(fields: [clubId], references: [id])
  requestDate     DateTime @default(now())
  position        String   // Position recherchée
  ageMin          Int?
  ageMax          Int?
  budget          Int?     // Budget en euros
  budgetMax       Int?
  market          String   // France, Allemagne, etc.
  league          String   // L1, L2, Bundesliga, etc.
  profileDetails  String?  // Description du profil recherché
  contactName     String?
  contactEmail    String?
  contactPhone    String?
  status          RequestStatus @default(OPEN)
  suggestedPlayers Player[] @relation("RequestSuggestions")
  notes           String?
  createdBy       String
  agent           User     @relation(fields: [createdBy], references: [id])
  updatedAt       DateTime @updatedAt
}

enum RequestStatus {
  OPEN
  IN_PROGRESS
  MATCHED
  CLOSED
  CANCELLED
}
```

---

### 5. ESPACE JOUEUR (PORTAIL) ⭐ PRIORITÉ 3
**Backend à créer:**
- [ ] Endpoint pour joueurs pour mettre à jour leurs stats
- [ ] Upload de vidéos/extraits par les joueurs
- [ ] Système de feedback agents → joueurs
- [ ] Gestion des droits d'accès granulaires

**Frontend Mobile à créer:**
- [ ] Section "Mon Profil Joueur" (si role = PLAYER)
  - Mise à jour stats (minutes, buts, passes)
  - Upload vidéos/photos
  - Voir feedbacks des agents
- [ ] Timeline d'activité
- [ ] Notifications sur feedbacks

**Schéma DB (à ajouter):**
```prisma
model PlayerUpdate {
  id              String   @id @default(cuid())
  playerId        String
  player          Player   @relation(fields: [playerId], references: [id])
  date            DateTime @default(now())
  minutes         Int?
  goals           Int?
  assists         Int?
  matchPlayed     Boolean  @default(false)
  notes           String?
  videos          String[] // URLs
  photos          String[] // URLs
}

model AgentFeedback {
  id          String   @id @default(cuid())
  playerId    String
  player      Player   @relation(fields: [playerId], references: [id])
  agentId     String
  agent       User     @relation(fields: [agentId], references: [id])
  matchId     String?
  match       Match?   @relation(fields: [matchId], references: [id])
  rating      Int?     // 1-10
  comment     String
  isVisible   Boolean  @default(true) // Si visible par le joueur
  createdAt   DateTime @default(now())
}
```

---

### 6. FICHIERS & MÉDIAS ⭐ PRIORITÉ 3
**Backend existant:**
- ✅ Module Media déjà créé avec Supabase Storage
- [ ] Ajouter versioning des fichiers
- [ ] Liens de partage temporaires
- [ ] Conversion vidéo automatique (FFmpeg)

**Frontend Mobile:**
- [ ] Écran "Mes Documents"
- [ ] Upload de fichiers (contrats, mandats, vidéos)
- [ ] Lecteur vidéo intégré
- [ ] Partage sécurisé

---

### 7. COMMUNICATION & TÂCHES ⭐ PRIORITÉ 3
**Backend à créer:**
- [ ] Module Comments/Tasks
  - Commentaires sur rapports/joueurs
  - @mentions
  - Création de tâches
  - Rappels

**Frontend Mobile:**
- [ ] Système de commentaires sur cartes
- [ ] Mentions @user
- [ ] Liste de tâches
- [ ] Notifications push (Firebase déjà intégré ✅)

**Schéma DB (à ajouter):**
```prisma
model Comment {
  id          String   @id @default(cuid())
  content     String
  authorId    String
  author      User     @relation(fields: [authorId], references: [id])
  playerId    String?
  player      Player?  @relation(fields: [playerId], references: [id])
  reportId    String?
  report      ScoutingReport? @relation(fields: [reportId], references: [id])
  mentions    User[]   @relation("CommentMentions")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Task {
  id          String   @id @default(cuid())
  title       String
  description String?
  assignedTo  String
  user        User     @relation(fields: [assignedTo], references: [id])
  dueDate     DateTime?
  priority    TaskPriority @default(MEDIUM)
  status      TaskStatus @default(TODO)
  playerId    String?
  player      Player?  @relation(fields: [playerId], references: [id])
  createdBy   String
  creator     User     @relation("TaskCreator", fields: [createdBy], references: [id])
  createdAt   DateTime @default(now())
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
  CANCELLED
}
```

---

## 🎪 PARTIE 2: ESPACE PUBLIC & CAMPS

### 8. CAMPS & DÉTECTIONS ⭐ NOUVELLE FEATURE
**Backend à créer:**
- [ ] Module TrainingCamps
  - CRUD camps/détections/showcases
  - Inscriptions
  - Paiements en ligne (Stripe ✅ déjà intégré)
  - Gestion des places disponibles
  - Liste de sélection

**Frontend Mobile:**
- [ ] Page publique "Camps" (accessible sans connexion)
- [ ] Détails d'un camp
- [ ] Formulaire d'inscription
- [ ] Paiement intégré
- [ ] Confirmation et QR code

**Schéma DB (à ajouter):**
```prisma
model TrainingCamp {
  id              String   @id @default(cuid())
  name            String
  description     String
  type            CampType // TRAINING, DETECTION, SHOWCASE
  startDate       DateTime
  endDate         DateTime
  location        String
  address         String?
  ageCategory     String   // U17, U19, etc.
  maxParticipants Int
  price           Int      // Prix en centimes
  status          CampStatus @default(UPCOMING)
  partnerClubs    Club[]   @relation("CampPartners")
  registrations   CampRegistration[]
  createdAt       DateTime @default(now())
}

model CampRegistration {
  id                  String   @id @default(cuid())
  campId              String
  camp                TrainingCamp @relation(fields: [campId], references: [id])
  userId              String?
  user                User?    @relation(fields: [userId], references: [id])
  // Infos du joueur
  firstName           String
  lastName            String
  dateOfBirth         DateTime
  nationality         String
  height              Int?
  weight              Int?
  position            String
  preferredFoot       String?
  currentClub         String?
  medicalHistory      String?
  parentalConsent     Boolean  @default(false)
  waiverSigned        Boolean  @default(false)
  // Paiement
  paymentStatus       PaymentStatus @default(PENDING)
  paymentIntentId     String?
  amountPaid          Int?
  paidAt              DateTime?
  // Sélection
  isSelected          Boolean  @default(false)
  selectionNotes      String?
  // Performance
  performanceRating   Int?     // Note après le camp
  performanceNotes    String?
  createdAt           DateTime @default(now())
}

enum CampType {
  TRAINING
  DETECTION
  SHOWCASE
}

enum CampStatus {
  UPCOMING
  ONGOING
  COMPLETED
  CANCELLED
}
```

---

### 9. MEMBERSHIP & ABONNEMENTS ⭐ NOUVELLE FEATURE
**Backend à créer:**
- [ ] Module Subscriptions
  - Niveaux: FREE, BASIC, GOLD
  - Paiements récurrents (Stripe Subscriptions)
  - Gestion des accès par niveau

**Frontend Mobile:**
- [ ] Page "Devenir Membre"
- [ ] Choix du plan
- [ ] Paiement abonnement
- [ ] Espace membre avec carte digitale
- [ ] Gestion de l'abonnement

**Schéma DB (à ajouter):**
```prisma
model Subscription {
  id                  String   @id @default(cuid())
  userId              String   @unique
  user                User     @relation(fields: [userId], references: [id])
  tier                SubscriptionTier @default(FREE)
  status              SubscriptionStatus @default(ACTIVE)
  stripeCustomerId    String?
  stripeSubscriptionId String?
  currentPeriodStart  DateTime?
  currentPeriodEnd    DateTime?
  cancelAtPeriodEnd   Boolean  @default(false)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

enum SubscriptionTier {
  FREE
  BASIC
  GOLD
}

enum SubscriptionStatus {
  ACTIVE
  CANCELLED
  EXPIRED
  PAUSED
}
```

---

### 10. COACHING & FORMATIONS ⭐ NOUVELLE FEATURE
**Backend à créer:**
- [ ] Module Coaching
  - Profils des coachs
  - Réservation de créneaux
  - Paiement des séances
  - Contenu vidéo éducatif

**Frontend Mobile:**
- [ ] Page "Coaching" (Gold members)
- [ ] Liste des coachs disponibles
- [ ] Calendrier de réservation
- [ ] Paiement séance
- [ ] Bibliothèque de vidéos éducatives

**Schéma DB (à ajouter):**
```prisma
model Coach {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  specialty       String   // Mental, Physique, Technique
  bio             String?
  pricePerSession Int      // En centimes
  availability    Json     // Planning hebdomadaire
  sessions        CoachingSession[]
}

model CoachingSession {
  id              String   @id @default(cuid())
  coachId         String
  coach           Coach    @relation(fields: [coachId], references: [id])
  playerId        String
  player          User     @relation(fields: [playerId], references: [id])
  date            DateTime
  duration        Int      // Minutes
  type            SessionType
  notes           String?
  paymentStatus   PaymentStatus @default(PENDING)
  paymentIntentId String?
  amountPaid      Int?
  createdAt       DateTime @default(now())
}

enum SessionType {
  MENTAL
  PHYSICAL
  TECHNICAL
  NUTRITION
}

model EducationalContent {
  id          String   @id @default(cuid())
  title       String
  description String?
  videoUrl    String
  category    String   // Mental, Physique, Nutrition, etc.
  tier        SubscriptionTier @default(FREE) // Niveau requis
  duration    Int?     // Durée en minutes
  views       Int      @default(0)
  createdAt   DateTime @default(now())
}
```

---

## 📊 RÉSUMÉ DES PRIORITÉS

### Phase 1 (4-6 semaines) - MVP CORE
1. ✅ **Calendrier partagé** (Backend + Mobile)
2. ✅ **Rapports de scouting enrichis** (Backend + Mobile)
3. ✅ **Fiches joueurs Kanban** (Backend + Mobile)
4. ✅ **Demandes de clubs** (Backend + Mobile)

### Phase 2 (3-4 semaines) - ESPACE JOUEUR
5. ✅ **Espace joueur** (Backend + Mobile)
6. ✅ **Fichiers & médias avancés** (Backend + Mobile)
7. ✅ **Communication & tâches** (Backend + Mobile)

### Phase 3 (4-5 semaines) - ESPACE PUBLIC
8. ✅ **Camps & détections** (Backend + Mobile)
9. ✅ **Membership & abonnements** (Backend + Mobile)
10. ✅ **Coaching & formations** (Backend + Mobile)

---

## 🛠️ Stack Technique (CONFIRMÉE - On garde ce qu'on a!)

✅ **Backend**: NestJS + PostgreSQL + Prisma
✅ **Mobile**: React Native + Expo
✅ **Paiements**: Stripe (déjà intégré)
✅ **Storage**: Supabase Storage (déjà intégré)
✅ **Notifications**: Firebase (déjà intégré)
✅ **Deployment**: Railway

---

## 📝 Notes importantes

- Tout ce qui est en ✅ existe déjà dans la codebase
- Tout ce qui est en [ ] doit être ajouté
- Les schémas Prisma fournis sont prêts à être ajoutés au schema.prisma existant
- Certaines features (Stripe, Firebase, Supabase) sont déjà intégrées au backend, il suffit de les utiliser côté mobile

**Estimation totale: 11-15 semaines pour le MVP complet**

---

Prêt à commencer ? Par quelle fonctionnalité voulez-vous qu'on commence ?
