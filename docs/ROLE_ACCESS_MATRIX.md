## Matrice d'accès mobile par rôle (étape 1)

| Rôle | Tabs attendus (ROLE_CONFIG) | Écrans réellement visibles aujourd’hui | Écart constaté / besoins |
| --- | --- | --- | --- |
| Super Admin / Admin | Dashboard + (écrans admin spécifiques) | Même tab bar générique (Dashboard, AI, Marketplace, Coaching, Passport, Profile) | Pas d’accès dédié aux vues admin ni de restrictions ; doit pouvoir naviguer vers Analytics, Users, Clubs, Settings depuis une pile admin. |
| Scout | Home, Players, Reports (avec outils AI/Gamification) | Même tab bar générique ; accès Marketplace (alors que scouts devraient plutôt gérer leur propre listing, pas la vue club/agent) | Besoin d’un onglet « Reports », « Calendar/Matches », « AI ». Doit cacher Marketplace côté “club”. |
| Agent | Home, Players, Marketplace | Voit encore Players/Reports/AIHub identiques ; pas d’onglets « Portefeuille » ou « Deals » spécifiques. | Doit avoir Marketplace (recherche de scouts), gestion d’offres, portefeuille joueurs. Les onglets Calendar/Reports doivent être en lecture seule ou cachés. |
| Analyst | Home, Analytics | Tab bar générique idem (AIHub, Marketplace, etc.) | Devrait prioriser Dashboard/Analytics/Reports ; masquer Marketplace/Coaching. |
| Player | Home, Passport, Gamification | Tab bar complète (inclut AIHub, Marketplace…) | Doit être limité à Profil/Passport/Training/Gamification ; pas de Marketplace ni Reports. |
| Club Contact | Home, Clubs, Marketplace | Tab bar générique | Doit accéder à Marketplace + modules Clubs/Offers, mais pas aux outils scouts. |
| Public | Home | Non applicable (exclu de l’app authentifiée) | Doit être redirigé vers onboarding / login. |

### Écrans principaux à cartographier

- **DashboardScreen** (Home) : utilisé par tout le monde mais devrait être contextualisé.
- **AIScreen** (AIHub tab) : devrait être réservé aux rôles avec `permissions.canAccessAI`.
- **MarketplaceScreen** : devrait être visible uniquement pour les rôles avec `canManageMarketplace` (Agent, Admin, Club Contact) et en lecture seule pour Scout (pour gérer son propre listing via un autre écran).
- **CoachingHubScreen / PassportScreen** : plutôt orientés joueurs/coaches ; inutiles pour Admin/Agent.
- **ProfileScreen** : commun mais certaines actions (paramètres, logout) doivent être tout en bas (padding ajouté).

### Conclusion Étape 1

La navigation actuelle ne tient aucun compte de `user.role`. Tous les utilisateurs voient la même barre d’onglets + raccourcis. Pour coller aux attentes :

1. **Créer une configuration de tabs par rôle** en s’appuyant sur `ROLE_CONFIG` (mobileTabs attendu) et en ajoutant les écrans spécifiques (Calendar, Reports, Deals, Portfolio…).
2. **Mettre à jour `MainTabNavigator`** pour charger dynamiquement les tabs selon `user.role`.
3. **Adapter les raccourcis (Command Center) et les boutons d’action** pour ne proposer que les actions autorisées.
4. **Côté composants**, masquer/mettre en lecture seule les sections non permises (ex. creation de rapports pour Agent).

Étape 2 = implémentation de la navigation conditionnelle et des garde-fous UI. Étape 3 = validation backend/QA (guards + scénarios de tests).***
