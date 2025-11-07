# 📅 Module Calendrier Arcane Agency - Spécifications Complètes

**Module** : ARCANE AGENCY - Calendar
**Version** : 1.0
**Date** : 2025-10-27
**Status** : En développement

---

## 🎯 Objectif

Fournir un **calendrier partagé intelligent** pour la gestion centralisée des matchs de scouting, avec assignation automatisée de scouts, synchronisation calendriers externes, et propositions IA.

---

## 🏗️ Architecture

### Stack Technique

| Composant | Technologie |
|-----------|-------------|
| **Frontend** | React + Next.js 15 + TypeScript |
| **Backend API** | NestJS (TypeScript) |
| **Base de données** | Supabase (PostgreSQL) |
| **Calendrier Externe** | Google Calendar API + Microsoft Graph API |
| **Cartographie** | Google Maps API |
| **IA Planning** | Arkane Planner (FastAPI + GPT-5) |
| **Notifications** | Supabase Realtime + Expo Push |

---

## 📊 Schéma Base de Données

### Tables Principales

#### 1. `matches`
Entité centrale du calendrier représentant un match à observer.

```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY,
  home_team_id UUID REFERENCES clubs(id),
  away_team_id UUID REFERENCES clubs(id),
  competition_id UUID REFERENCES competitions(id),
  venue_id UUID REFERENCES venues(id),
  match_date DATE NOT NULL,
  match_time TIME NOT NULL,
  status VARCHAR(50) CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
  home_score INTEGER,
  away_score INTEGER,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Champs clés** :
- `status` : Statut du match (prévu → confirmé → terminé)
- `venue_id` : Lien vers le stade (géolocalisation)
- `organization_id` : Isolation multi-tenant

#### 2. `match_assignments`
Assignation de scouts à des matchs spécifiques.

```sql
CREATE TABLE match_assignments (
  id UUID PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  scout_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) CHECK (status IN ('assigned', 'confirmed', 'completed', 'cancelled')),
  role VARCHAR(50) CHECK (role IN ('primary_scout', 'assistant', 'analyst')),
  target_player_names TEXT[],
  arrival_time TIME,
  seating_section VARCHAR(50),
  completed_at TIMESTAMP,
  report_submitted BOOLEAN DEFAULT FALSE,
  assigned_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(match_id, scout_id)
);
```

**Champs clés** :
- `target_player_names` : Liste des joueurs à observer (tableau PostgreSQL)
- `report_submitted` : Vérifie si le rapport est rendu
- `role` : Type d'assignation (scout principal, assistant, analyste vidéo)

#### 3. `calendar_sync_settings`
Configuration de synchronisation calendrier externe par utilisateur.

```sql
CREATE TABLE calendar_sync_settings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) UNIQUE,
  google_calendar_enabled BOOLEAN DEFAULT FALSE,
  google_refresh_token TEXT,
  outlook_calendar_enabled BOOLEAN DEFAULT FALSE,
  outlook_refresh_token TEXT,
  auto_sync BOOLEAN DEFAULT TRUE,
  sync_frequency_minutes INTEGER DEFAULT 30,
  last_synced_at TIMESTAMP
);
```

#### 4. `calendar_events`
Log de synchronisation entre matchs Arcane et événements calendriers externes.

```sql
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY,
  match_id UUID REFERENCES matches(id),
  user_id UUID REFERENCES users(id),
  google_event_id VARCHAR(255),
  outlook_event_id VARCHAR(255),
  sync_status VARCHAR(50) CHECK (sync_status IN ('pending', 'synced', 'failed')),
  last_synced_at TIMESTAMP
);
```

### Relations

```
organizations (1) ──< (N) users
organizations (1) ──< (N) matches

matches (1) ──< (N) match_assignments
users (1) ──< (N) match_assignments

matches (N) ──> (1) clubs (home_team)
matches (N) ──> (1) clubs (away_team)
matches (N) ──> (1) competitions
matches (N) ──> (1) venues

users (1) ──< (1) calendar_sync_settings
matches (1) ──< (N) calendar_events
```

---

## 🎨 Interface Utilisateur

### Pages

#### 1. **Page Calendrier** (`/calendar`)

**Layout** :
- Header : Logo Arcane + Titre + Actions (Sync, Nouveau Match)
- Filtres : Recherche, Statut, Compétition, Scout, Date
- Toggle Vue : Liste / Semaine / Carte
- Contenu : Affichage des matchs selon la vue sélectionnée

**Vues Disponibles** :

##### A. Vue Liste (Implémentée ✅)
- Affichage vertical des matchs sous forme de cards
- Informations par match :
  - Teams (domicile vs extérieur)
  - Compétition + Badge statut
  - Date, heure, stade
  - Scouts assignés (avatars + noms)
  - Joueurs cibles
  - Actions : Détails, Itinéraire Google Maps
- Animations Framer Motion (stagger)

##### B. Vue Semaine (À implémenter)
- Grille calendrier 7 jours
- Matchs positionnés par date/heure
- Drag & drop pour réassignation
- Couleurs par statut

##### C. Vue Carte (À implémenter)
- Intégration Google Maps
- Markers par stade (latitude/longitude)
- Clustering si plusieurs matchs dans même ville
- Info window : détails match + assignation rapide
- Itinéraire automatique

### Composants Réutilisables

#### `MatchCard`
```tsx
<MatchCard
  match={match}
  onAssignScout={handleAssign}
  onViewDetails={handleDetails}
  showActions={true}
/>
```

#### `ScoutAssignmentModal`
Modal pour assigner un scout avec :
- Liste scouts disponibles (status badge)
- Sélection rôle (primary/assistant)
- Champ joueurs cibles
- Heure d'arrivée
- Notes

#### `FilterPanel`
Panel de filtres avec :
- Recherche full-text
- Dropdown statut, compétition, scout
- Date picker

---

## 🔗 API Endpoints (NestJS)

### Matches

```typescript
GET    /api/calendar/matches
POST   /api/calendar/matches
GET    /api/calendar/matches/:id
PATCH  /api/calendar/matches/:id
DELETE /api/calendar/matches/:id
```

**Query Params `GET /matches`** :
- `date_from` : Date début (ISO 8601)
- `date_to` : Date fin
- `status` : Filtrer par statut
- `competition_id` : Filtrer par compétition
- `scout_id` : Matchs assignés à un scout
- `organization_id` : Isolation multi-tenant

**Response** :
```json
{
  "matches": [
    {
      "id": "uuid",
      "homeTeam": { "id": "uuid", "name": "Bayern Munich", "logo": "url" },
      "awayTeam": { "id": "uuid", "name": "Dortmund", "logo": "url" },
      "competition": { "id": "uuid", "name": "Bundesliga", "logo": "url" },
      "date": "2025-11-15",
      "time": "18:30",
      "venue": {
        "id": "uuid",
        "name": "Allianz Arena",
        "address": "...",
        "location": { "lat": 48.2188, "lng": 11.6247 }
      },
      "status": "confirmed",
      "assignedScouts": [
        {
          "id": "uuid",
          "name": "Emma Rodriguez",
          "avatar": "url",
          "role": "primary_scout",
          "targetPlayers": ["Joshua Kimmich"]
        }
      ],
      "createdBy": { "id": "uuid", "name": "John Doe" },
      "createdAt": "2025-10-20T10:00:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

### Assignments

```typescript
POST   /api/calendar/assignments
GET    /api/calendar/assignments/:id
PATCH  /api/calendar/assignments/:id
DELETE /api/calendar/assignments/:id
```

**POST Body** :
```json
{
  "matchId": "uuid",
  "scoutId": "uuid",
  "role": "primary_scout",
  "targetPlayerNames": ["Kimmich", "Bellingham"],
  "arrivalTime": "17:30",
  "notes": "Arriver 1h avant"
}
```

### Calendar Sync

```typescript
POST   /api/calendar/sync/google/authorize
POST   /api/calendar/sync/google/callback
POST   /api/calendar/sync/outlook/authorize
POST   /api/calendar/sync/outlook/callback
POST   /api/calendar/sync/trigger
GET    /api/calendar/sync/status
```

**Workflow OAuth** :
1. User clique "Sync Google Calendar"
2. Frontend appelle `POST /sync/google/authorize`
3. Backend retourne `authUrl` Google OAuth
4. User consent Google → redirect vers callback
5. Backend échange code contre tokens → stocke dans `calendar_sync_settings`
6. Cron job toutes les 30min : lecture `matches` + création événements Google Calendar

---

## 🤖 Intelligence Artificielle

### Module Arkane Planner

**Objectif** : Proposer automatiquement le meilleur scout pour chaque match.

**Entrées** :
- Match (date, heure, stade, compétition)
- Liste scouts disponibles (avec historique assignments)
- Distances géographiques (domicile scout ↔ stade)
- Historique rapports (qualité, ponctualité)
- Calendrier existant (éviter surcharge)

**Algorithme** :
1. **Filtrage disponibilité** : exclure scouts déjà assignés ce jour-là
2. **Calcul distance** : privilégier scouts proches du stade
3. **Scoring qualité** : analyser notes moyennes rapports précédents
4. **Load balancing** : équilibrer nombre matchs par scout ce mois-ci
5. **Préférences** : si scout a déjà suivi un joueur cible, priorité

**Sortie** :
```json
{
  "recommendations": [
    {
      "scoutId": "uuid",
      "scoutName": "Marcus Silva",
      "score": 92,
      "reasons": [
        "Located 15km from venue",
        "Excellent track record in Bundesliga",
        "Only 2 assignments this week"
      ],
      "availability": "confirmed"
    }
  ]
}
```

**API Endpoint** :
```typescript
POST /api/ai/planner/suggest-scouts
Body: { matchId: "uuid" }
```

---

## 🔔 Notifications

### Événements Déclencheurs

| Événement | Destinataire | Canal | Message |
|-----------|-------------|-------|---------|
| Nouveau match créé | Tous les scouts | In-app + Email | "Nouveau match ajouté : Bayern vs Dortmund (15/11)" |
| Scout assigné | Scout concerné | Push + Email | "Vous êtes assigné au match Bayern vs Dortmund le 15/11 à 18h30" |
| Modification match | Scouts assignés | Push | "Le match Bayern vs Dortmund a été reporté au 20/11" |
| Rappel 24h avant | Scouts assignés | Push + Email | "Rappel : Match demain à 18h30 - Allianz Arena" |
| Rapport manquant | Scout | Push | "N'oubliez pas de soumettre votre rapport pour le match d'hier" |

**Implémentation** :
- Supabase Realtime pour notifications in-app
- Expo Push Notifications pour mobile
- Nodemailer pour emails

---

## 🔐 Sécurité & Permissions (RLS)

### Règles Supabase RLS

**Matches** :
- **SELECT** : Utilisateurs voient seulement matchs de leur `organization_id`
- **INSERT/UPDATE** : Seulement rôles `admin`, `agent`, `staff`
- **DELETE** : Seulement `admin`

**Match Assignments** :
- **SELECT** : Scout voit ses propres assignments + agents voient tous
- **INSERT** : Seulement `admin`, `agent`
- **UPDATE** : Scout peut update statut/notes de ses propres assignments
- **DELETE** : Seulement `admin`, `agent`

**Calendar Sync Settings** :
- **ALL** : User accède seulement ses propres settings (`user_id = auth.uid()`)

---

## 📈 Métriques & Analytics

### Dashboard Calendrier

Afficher statistiques temps réel :
- Nombre matchs planifiés ce mois
- Taux d'assignation scouts (% matchs avec scout assigné)
- Taux de complétion rapports (% scouts ayant soumis rapport)
- Distribution géographique matchs (carte de chaleur)
- Top 5 scouts les plus actifs
- Moyenne temps réponse assignation → confirmation

**Graphique** : Evolution nombre matchs par semaine (ligne)

---

## 🧪 Tests

### Tests Unitaires (Jest)

#### Backend (NestJS)
```typescript
describe('MatchesService', () => {
  it('should create a match with valid data', async () => {
    const dto = { homeTeamId, awayTeamId, date, time };
    const result = await service.createMatch(dto, userId);
    expect(result).toHaveProperty('id');
  });

  it('should throw error if teams are identical', async () => {
    const dto = { homeTeamId: 'uuid1', awayTeamId: 'uuid1' };
    await expect(service.createMatch(dto)).rejects.toThrow();
  });
});
```

#### Frontend (React Testing Library)
```typescript
describe('MatchCard', () => {
  it('renders match details correctly', () => {
    render(<MatchCard match={mockMatch} />);
    expect(screen.getByText('Bayern Munich')).toBeInTheDocument();
    expect(screen.getByText('VS')).toBeInTheDocument();
  });

  it('calls onAssignScout when assign button clicked', () => {
    const handleAssign = jest.fn();
    render(<MatchCard match={mockMatch} onAssignScout={handleAssign} />);
    fireEvent.click(screen.getByText('Assigner Scout'));
    expect(handleAssign).toHaveBeenCalled();
  });
});
```

### Tests E2E (Playwright)

```typescript
test('Complete workflow: Create match → Assign scout → Sync Google Calendar', async ({ page }) => {
  await page.goto('/calendar');

  // Create match
  await page.click('text=Nouveau Match');
  await page.fill('#homeTeam', 'Bayern Munich');
  await page.fill('#awayTeam', 'Dortmund');
  await page.fill('#date', '2025-11-15');
  await page.click('text=Créer');

  // Verify match appears
  await expect(page.locator('text=Bayern Munich VS Dortmund')).toBeVisible();

  // Assign scout
  await page.click('text=Assigner Scout');
  await page.selectOption('#scout', 'Marcus Silva');
  await page.click('text=Confirmer');

  // Verify assignment
  await expect(page.locator('text=Marcus Silva')).toBeVisible();

  // Trigger sync
  await page.click('text=Sync Google Calendar');
  await expect(page.locator('text=Synchronisation réussie')).toBeVisible();
});
```

---

## 🚀 Roadmap

### Phase 1 : MVP (4 semaines) ✅ En cours
- [x] UI Page Calendar (Vue Liste)
- [x] Schéma Supabase complet
- [ ] API NestJS CRUD Matches
- [ ] API NestJS CRUD Assignments
- [ ] Filtres fonctionnels
- [ ] Assignation manuelle scouts

### Phase 2 : Vues & Sync (3 semaines)
- [ ] Vue Semaine (grille calendrier)
- [ ] Vue Carte (Google Maps)
- [ ] OAuth Google Calendar
- [ ] OAuth Outlook
- [ ] Cron sync automatique
- [ ] Notifications Supabase Realtime

### Phase 3 : IA & Analytics (3 semaines)
- [ ] Arkane Planner (suggestions IA)
- [ ] Dashboard métriques
- [ ] Alertes intelligentes (rapports manquants)
- [ ] Optimisation itinéraires (multi-matchs même jour)

### Phase 4 : Avancé (2 semaines)
- [ ] Export PDF calendrier mensuel
- [ ] Mode hors-ligne (PWA)
- [ ] Integration Wyscout (import matchs auto)
- [ ] Multi-langue (FR/EN/ES/DE)

---

## 📚 Documentation Technique

### Variables d'Environnement

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# Google Calendar API
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPXxxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/sync/google/callback

# Microsoft Graph API
MICROSOFT_CLIENT_ID=xxx
MICROSOFT_CLIENT_SECRET=xxx
MICROSOFT_REDIRECT_URI=http://localhost:3000/api/calendar/sync/outlook/callback

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaxxx
```

### Commandes Développement

```bash
# Frontend
cd web
npm run dev

# Backend API
cd api
npm run start:dev

# Migrations Supabase
supabase db push --file docs/supabase-migrations/01_calendar_schema.sql

# Tests
npm run test               # Unit tests
npm run test:e2e          # E2E tests
npm run test:coverage     # Coverage report
```

---

## 🎓 Références

- [Google Calendar API](https://developers.google.com/calendar)
- [Microsoft Graph Calendar](https://learn.microsoft.com/en-us/graph/api/resources/calendar)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Framer Motion](https://www.framer.com/motion/)

---

**Dernière mise à jour** : 2025-10-27
**Mainteneur** : Abdallah Lakhdari (@lakhdari)
