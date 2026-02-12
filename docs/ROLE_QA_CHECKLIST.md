## Checklist QA par rôle (Étape 3)

Chaque scénario suppose que le backend tourne en local (`npm run start:dev` dans `backend/`) et que les utilisateurs de démo/seed existent (`npm run prisma:seed` ou `npm run setup-test-users`). Mot de passe par défaut : `<DEMO_PASSWORD>` pour les seeds principaux, `Test1234!` pour les comptes `*@test.com`.

### 1. Super Admin (`admin@arcane.com`)
- **Mobile** : onglets visibles = Dashboard, AI, Marketplace, Profil. Vérifier accès aux raccourcis Analytics/Reports.  
- **API** :
  ```bash
  # Login
  curl -s -X POST http://localhost:3000/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"admin@arcane.com","password":"<DEMO_PASSWORD>"}' | jq '.accessToken'
  ```
  - Tester un endpoint admin ex. `/player-validation` (doit répondre 200).  
  - Tester `/marketplace/listings` (lecture OK), `/marketplace/offers/sent` (autorisé).  
  - Vérifier qu’il ne reçoit pas 403 côté admin features.

### 2. Scout (`scout1@arcane.com`)
- **Mobile** : onglets = Dashboard, AI, Profil (plus les écrans Reports/Calendar via navigation). Marketplace ne doit pas apparaître dans la barre (le scout gère son propre listing via “My listing”).  
- **API** :
  ```bash
  curl -s -X POST http://localhost:3000/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"scout1@arcane.com","password":"<DEMO_PASSWORD>"}'
  ```
  - `/marketplace/listings` CRUD : `POST /listings` doit fonctionner (SCOUT).  
  - `/marketplace/offers/sent` doit renvoyer 403 (non autorisé).  
  - `/marketplace/offers/received` doit fonctionner (scout recevant une offre).

### 3. Agent (`agent@arcane.com` ou `agent@test.com`)
- **Mobile** : onglets = Dashboard, Marketplace, Profil. Vérifier que les onglets Reports/AI ne sont plus visibles.  
- **API** :
  - `POST /marketplace/offers` doit réussir (roles AGENT/CLUB_CONTACT).  
  - `GET /marketplace/listings/my` doit renvoyer 403 (agent n’est pas scout).  
  - `POST /marketplace/listings` doit renvoyer 403 (guard ajouté).

### 4. Analyst (`analyst@test.com`)
- **Mobile** : onglets = Dashboard, AI, Profil.  
- **API** :
  - `GET /players` doit fonctionner (scouting access).  
  - `POST /marketplace/offers` doit échouer (403).  
  - `POST /marketplace/listings` doit échouer (403).

### 5. Player (`erling.haaland@arcane-demo.com`)
- **Mobile** : onglets = Dashboard (player view), Coaching, Passport, Profil.  
- **API** :
  - `GET /marketplace/listings` (lecture) autorisé.  
  - `POST /marketplace/offers` → 403.  
  - `POST /marketplace/listings` → 403.

### 6. Club Contact (`club@test.com` si disponible, sinon `agent@test.com` avec `clubId`)
- Vérifier qu’il peut créer des offres (`POST /marketplace/offers`) et gérer les favoris (`POST /favorites`).  
- Ne doit pas pouvoir accepter/rejeter une offre (403 sur `/offers/:id/accept`).

### 7. Public / Non authentifié
- Tentative d’accès à n’importe quel endpoint (`GET /marketplace/listings`) sans token → 401.  
- Mobile : application doit forcer la connexion (pas d’accès aux tabs).

### Notes supplémentaires
- `RolesGuard` est désormais appliqué aux actions Marketplace sensibles (listings scouts, matching clubs, offres, favoris).  
- Garder un œil sur `req.user.clubId` côté backend : les comptes Agent/Club doivent avoir cette donnée (seed ou setup-test-users).  
- Pour réinitialiser les comptes tests :
  ```bash
  cd backend
  npm run prisma:seed        # seeds principaux (admin, scouts, agent officiel…)
  npm run setup-test-users   # comptes supplémentaires *@test.com
  ```
