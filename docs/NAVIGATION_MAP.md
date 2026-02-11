## Arcane Navigation Map (Web ↔ Mobile)

| Section Web (Next.js)             | Entrée Mobile (React Native)                                     | Flag / Notes                    |
|----------------------------------|------------------------------------------------------------------|---------------------------------|
| Dashboard / Analytics            | Onglet **Accueil** (+ Command Center raccourcis)                 | Toujours actif                  |
| AI Suite (ArkaneGPT, SmartScout, Auto-Scout, Market Value) | Onglet **AI Hub** + écrans stack (`AI`, `ArcaneGPT`, `SmartScout`, `AutoScout`, `MarketValue*`) | `FEATURE_FLAGS.aiHubTab`        |
| Marketplace / Club Requests      | Onglet **Marketplace** (scouts, favoris, offres)                 | `FEATURE_FLAGS.marketplaceTab`  |
| Coaching Hub / Reservations      | Onglet **Coaching** (Hub + bookings)                            | `FEATURE_FLAGS.coachingTab`     |
| Passport / Playstyle DNA         | Onglet **Passport**                                              | `FEATURE_FLAGS.passportTab`     |
| Profil / Settings / Support      | Onglet **Profil**                                                | `FEATURE_FLAGS.profileTab`      |
| Joueurs                          | Command Center → “Joueurs”                                       | `FEATURE_FLAGS.shortcuts.players` |
| Analytique (détails)             | Command Center → “Analytique” (ouvre écran stack)                | `FEATURE_FLAGS.shortcuts.analytics` |
| Matches                          | Command Center → “Matches”                                       | `FEATURE_FLAGS.shortcuts.matches` |
| Scouting Reports                 | Command Center → “Rapports”                                      | `FEATURE_FLAGS.shortcuts.reports` |
| Voice-to-Report                  | Command Center → “Voice Report”                                  | `FEATURE_FLAGS.shortcuts.voiceToReport` |

### Command Center
- Accessible depuis l’onglet Accueil (icône grille + FAB flottant).  
- Permet de réduire le nombre d’onglets tout en gardant les flux avancés (Players, Reports, etc.).  
- Les raccourcis obéissent aux feature flags (`src/constants/features.ts`).

### Feature Flags
- `FEATURE_FLAGS` centralise les modules prêts pour la démo / production.  
- Les presets (`demo`, `staging`, `production`) peuvent être sélectionnés via `EXPO_PUBLIC_FEATURE_PRESET` (ex. `EXPO_PUBLIC_FEATURE_PRESET=staging npm start`).  
- Pour masquer un module non finalisé, basculer le flag correspondant à `false` ou créer un preset dédié.  
- Les flags contrôlent à la fois les onglets et les raccourcis du Command Center.
