# Guide de Validation Manuelle - Mobile App

## État des Serveurs

### ✅ Backend (NestJS)
- **URL**: http://localhost:3000
- **Health**: http://localhost:3000/api/health
- **Status**: ✅ Running (vérifié le 2025-11-03)
- **Base de données**: ✅ Connected

### ✅ Application Mobile (Expo)
- **URL**: http://localhost:8083
- **Metro Bundler**: ✅ Running
- **Port**: 8083

---

## 1. Tests de Recherche Globale (GlobalSearch)

### Accès
1. Lancer l'app mobile sur un simulateur/appareil
2. Appuyer sur l'icône **🔍** dans le header (en haut à droite)

### Scénarios à tester

#### ✅ Test 1.1: Ouverture/Fermeture du modal
- [ ] Le modal s'ouvre en plein écran
- [ ] L'input de recherche est visible avec le placeholder "Search players, clubs, camps..."
- [ ] Appuyer sur ✕ ferme le modal

#### ✅ Test 1.2: Recherche minimale (2 caractères)
- [ ] Taper "J" → Aucune recherche lancée
- [ ] Taper "Jo" → Recherche lancée automatiquement
- [ ] Résultats affichés (joueurs, clubs, camps, rapports)

#### ✅ Test 1.3: Résultats de recherche
- [ ] Taper "test" ou "John"
- [ ] Les résultats sont groupés par catégorie:
  - 👤 Players
  - ⚽ Clubs
  - 🏕️ Camps
  - 📊 Reports
- [ ] Chaque résultat affiche les bonnes informations

#### ✅ Test 1.4: Navigation depuis les résultats
- [ ] Appuyer sur un joueur → Navigation vers PlayerDetail
- [ ] Le modal se ferme automatiquement
- [ ] Les informations du joueur sont affichées correctement

#### ✅ Test 1.5: État vide
- [ ] Taper "xxxnonexistentxxx"
- [ ] Message "No results found for 'xxxnonexistentxxx'" affiché
- [ ] Icône 🔍 visible

#### ✅ Test 1.6: Gestion des erreurs
- [ ] Couper la connexion réseau (mode avion)
- [ ] Effectuer une recherche
- [ ] Message "No results found" affiché (pas de crash)

---

## 2. Tests du Centre de Notifications (NotificationsCenter)

### Accès
1. Appuyer sur l'icône **🔔** dans le header (en haut à droite)

### Scénarios à tester

#### ✅ Test 2.1: Ouverture du modal
- [ ] Le modal s'ouvre en plein écran
- [ ] Header avec "Notifications" visible
- [ ] Bouton ✕ pour fermer visible

#### ✅ Test 2.2: Liste des notifications
- [ ] Les notifications sont affichées avec:
  - Icône selon le type (📊, ⚽, 👤, etc.)
  - Titre en gras si non lu
  - Message
  - Horodatage (ex: "2h ago", "Just now")
- [ ] Badge bleu sur les notifications non lues

#### ✅ Test 2.3: Compteur de non-lus
- [ ] Si notifications non lues → "X unread" affiché sous le titre
- [ ] Le compteur est correct

#### ✅ Test 2.4: Marquer une notification comme lue
- [ ] Appuyer sur une notification non lue
- [ ] Le badge bleu disparaît
- [ ] Le titre n'est plus en gras
- [ ] Le compteur "unread" est mis à jour

#### ✅ Test 2.5: Marquer toutes comme lues
- [ ] Avoir plusieurs notifications non lues
- [ ] Appuyer sur "Mark all read"
- [ ] Alert "Success: X notifications marked as read"
- [ ] Toutes les notifications sont marquées comme lues
- [ ] Le bouton "Mark all read" disparaît

#### ✅ Test 2.6: Supprimer une notification
- [ ] Appuyer sur l'icône 🗑️ d'une notification
- [ ] Alert de confirmation "Delete Notification"
- [ ] Appuyer sur "Delete"
- [ ] La notification disparaît de la liste

#### ✅ Test 2.7: Tout effacer
- [ ] Appuyer sur "Clear all"
- [ ] Alert de confirmation "Clear All Notifications"
- [ ] Appuyer sur "Clear All"
- [ ] Toutes les notifications sont supprimées
- [ ] État vide affiché: 🔔 "No notifications" "You're all caught up!"

#### ✅ Test 2.8: Pull-to-refresh
- [ ] Tirer vers le bas sur la liste
- [ ] Indicateur de chargement affiché
- [ ] Liste rafraîchie avec nouvelles données

#### ✅ Test 2.9: État vide
- [ ] Quand aucune notification
- [ ] Icône 🔔 affichée
- [ ] Texte "No notifications"
- [ ] Sous-texte "You're all caught up!"

---

## 3. Tests de Navigation vers les Nouveaux Écrans

### 3.1 Navigation depuis ProfileScreen

#### ✅ Test 3.1.1: Section "Accès rapide"
1. Aller sur l'onglet Profile (🏠)
2. Vérifier la section "Accès rapide"
   - [ ] Bouton "💎 Abonnement" → NavGui vers MembershipScreen
   - [ ] Bouton "⚽ Clubs" → Navigation vers ClubsListScreen
   - [ ] Bouton "🏆 Services" → Navigation vers ServicesScreen

#### ✅ Test 3.1.2: Section "Support"
1. Dans ProfileScreen
2. Vérifier la section "Support"
   - [ ] Bouton "📧 Nous contacter" → Navigation vers ContactScreen
   - [ ] Bouton "ℹ️ À propos" → Navigation vers AboutScreen

### 3.2 Tests des nouveaux écrans

#### ✅ Test 3.2.1: MembershipScreen
- [ ] Titre "Abonnement" affiché
- [ ] Les différents tiers affichés (Free, Pro, Enterprise)
- [ ] Boutons "Choisir ce plan" visibles
- [ ] Fonctionnalités de chaque tier listées
- [ ] Retour avec le bouton back

#### ✅ Test 3.2.2: ClubsListScreen
- [ ] Titre "Clubs" affiché
- [ ] Liste des clubs visible
- [ ] Chaque club affiche: logo, nom, pays, niveau
- [ ] Appuyer sur un club → Navigation vers ClubDetailScreen

#### ✅ Test 3.2.3: ClubDetailScreen
- [ ] Informations du club affichées:
  - Logo et nom
  - Pays, ville
  - Niveau
  - Description
  - Statistiques
- [ ] Liste des joueurs du club
- [ ] Retour avec le bouton back

#### ✅ Test 3.2.4: AboutScreen
- [ ] Logo de l'app
- [ ] Nom et version de l'app
- [ ] Description de l'entreprise
- [ ] Mission et valeurs
- [ ] Retour avec le bouton back

#### ✅ Test 3.2.5: ContactScreen
- [ ] Formulaire de contact visible:
  - [ ] Champ Nom
  - [ ] Champ Email
  - [ ] Champ Sujet
  - [ ] Champ Message
- [ ] Bouton "Envoyer" visible
- [ ] Validation des champs
- [ ] Retour avec le bouton back

#### ✅ Test 3.2.6: ServicesScreen
- [ ] Liste des services offerts
- [ ] Chaque service affiche:
  - Icône
  - Titre
  - Description
- [ ] Design cohérent avec le reste de l'app
- [ ] Retour avec le bouton back

---

## 4. Tests des Cas d'Erreur

### 4.1 Gestion du réseau

#### ✅ Test 4.1.1: Perte de connexion
1. Activer le mode avion
2. Essayer de:
   - [ ] Rechercher un joueur (GlobalSearch)
   - [ ] Charger les notifications
   - [ ] Naviguer vers ClubsList
3. Vérifier:
   - [ ] Pas de crash de l'app
   - [ ] Messages d'erreur appropriés
   - [ ] États vides affichés correctement

#### ✅ Test 4.1.2: Réseau lent
1. Utiliser Network Link Conditioner (100ms delay)
2. Effectuer les actions ci-dessus
3. Vérifier:
   - [ ] Indicateurs de chargement affichés
   - [ ] L'app reste réactive
   - [ ] Timeout géré gracieusement

### 4.2 Authentification

#### ✅ Test 4.2.1: Token expiré
1. Laisser l'app ouverte longtemps (ou manipuler le token)
2. Effectuer une action nécessitant l'authentification
3. Vérifier:
   - [ ] Message d'erreur approprié
   - [ ] Redirection vers Login (si configuré)
   - [ ] Pas de crash

#### ✅ Test 4.2.2: Non authentifié
1. Supprimer le token (AsyncStorage)
2. Essayer d'accéder à des ressources protégées
3. Vérifier:
   - [ ] Message "Non autorisé" ou redirection Login
   - [ ] Pas de crash

---

## 5. Tests d'Intégration Backend

### 5.1 API Endpoints utilisés

#### ✅ Test 5.1.1: GET /api/players (Search)
```bash
curl -X GET "http://localhost:3000/api/players?search=test&limit=10" \
  -H "Authorization: Bearer <TOKEN>"
```
- [ ] Response 200 OK
- [ ] Format: `{ items: [...], total: X }`

#### ✅ Test 5.1.2: GET /api/clubs (Search)
```bash
curl -X GET "http://localhost:3000/api/clubs?search=test&limit=10" \
  -H "Authorization: Bearer <TOKEN>"
```
- [ ] Response 200 OK
- [ ] Format: `{ items: [...], total: X }`

#### ✅ Test 5.1.3: GET /api/notifications/user/:userId
```bash
curl -X GET "http://localhost:3000/api/notifications/user/<USER_ID>" \
  -H "Authorization: Bearer <TOKEN>"
```
- [ ] Response 200 OK
- [ ] Liste de notifications

#### ✅ Test 5.1.4: PATCH /api/notifications/:id/read
```bash
curl -X PATCH "http://localhost:3000/api/notifications/<NOTIF_ID>/read" \
  -H "Authorization: Bearer <TOKEN>"
```
- [ ] Response 200 OK
- [ ] Notification marquée comme lue

#### ✅ Test 5.1.5: GET /api/clubs/:id
```bash
curl -X GET "http://localhost:3000/api/clubs/<CLUB_ID>" \
  -H "Authorization: Bearer <TOKEN>"
```
- [ ] Response 200 OK
- [ ] Détails du club

### 5.2 Vérification des logs

#### Dans le backend
```bash
tail -f backend/logs/*.log
```
- [ ] Les requêtes de l'app mobile apparaissent
- [ ] Pas d'erreurs 500
- [ ] Les temps de réponse sont acceptables (<500ms)

#### Dans l'app mobile
- [ ] Console React Native: pas d'erreurs
- [ ] Warnings minimaux
- [ ] Logs de l'API client affichés correctement

---

## 6. Checklist Finale

### Fonctionnalités P1 (Haute Priorité)
- [ ] ✅ GlobalSearch: Recherche multi-entités fonctionnelle
- [ ] ✅ NotificationsCenter: Gestion complète des notifications
- [ ] ✅ Navigation: Tous les nouveaux écrans accessibles
- [ ] ✅ ProfileScreen: Liens "Quick Access" et "Support" fonctionnels

### Fonctionnalités P2 (Moyenne Priorité)
- [ ] ✅ ClubsListScreen: Liste et recherche de clubs
- [ ] ✅ ClubDetailScreen: Détails et joueurs d'un club
- [ ] ✅ MembershipScreen: Affichage des tiers d'abonnement
- [ ] ✅ Info screens: About, Contact, Services

### Tests
- [ ] ✅ 127 tests unitaires passent
- [ ] Tests manuels effectués
- [ ] Pas de crash critique
- [ ] Performance acceptable

### Intégration Backend
- [ ] API endpoints fonctionnels
- [ ] Authentification JWT
- [ ] Gestion des erreurs

### UX/UI
- [ ] Design cohérent (thème Arcane)
- [ ] Animations fluides
- [ ] Messages d'erreur clairs
- [ ] États de chargement visibles

---

## 7. Problèmes Connus

### À Documenter
Listez ici tout problème rencontré pendant les tests:

1. **[Type]** Description du problème
   - **Étapes pour reproduire**: ...
   - **Comportement attendu**: ...
   - **Comportement observé**: ...
   - **Priorité**: P0/P1/P2/P3

---

## 8. Prochaines Étapes

Après validation complète:
1. [ ] Corriger les bugs P0 trouvés
2. [ ] Optimiser les performances si nécessaire
3. [ ] Préparer pour production (Option 6)
4. [ ] Documentation finale (Option 2)

---

**Date de dernière mise à jour**: 2025-11-03
**Testé par**: [Nom]
**Version de l'app**: 1.0.0
**Environnement**: Development
