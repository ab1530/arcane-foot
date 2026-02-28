# Scout L7 - QA + Rollout Flags

## Scope
Ce document couvre le lot L7:
- écran Profil scout mobile,
- QA de non-régression minimale,
- rollout par feature flags.

Runbook exécutable associé:
- `docs/SCOUT_L7_MANUAL_QA_RUNBOOK.md`
- `scripts/qa/scout-l7-set-flags.sh`
- `scripts/qa/scout-l7-smoke.sh`

## Feature Flags

### Mobile (Expo)
- `EXPO_PUBLIC_SCOUT_PROFILE_SCREEN_ENABLED`
  - `true`: entrée "Profil scout" visible dans Profil (rôles SCOUT/ADMIN/SUPER_ADMIN).
  - `false`: entrée masquée et écran indisponible.
- `EXPO_PUBLIC_SCOUT_NEW_FLOW_ENABLED`
  - `true`: raccourcis scout (Matches / Rapports / Voice Report) actifs.
  - `false`: raccourcis masqués pour rollback rapide du flux scout mobile.

### Backend
- `VOICE_CERTIFIED_GUARD_ENABLED`
  - `true`: accès voice-to-report réservé aux scouts certifiés.
  - `false`: guard bypass (usage temporaire uniquement).

## QA Checklist (mobile)

1. Profil scout visible
- Précondition: `EXPO_PUBLIC_SCOUT_PROFILE_SCREEN_ENABLED=true`.
- Ouvrir Profil avec un compte SCOUT.
- Vérifier la présence du menu `Profil scout`.
- Ouvrir l'écran et vérifier:
  - bloc crédibilité,
  - sections `Rôle & statut`, `Zones de couverture`, `Spécialités de scouting`, `Expérience & crédibilité`.

2. Edition et persistance
- Passer en mode édition.
- Modifier titre + bio + pays/ligues + rayon + langues.
- Enregistrer.
- Recharger l'écran.
- Vérifier que les valeurs sont persistées.

3. Activation / pause listing
- Depuis l'écran profil scout, activer puis mettre en pause.
- Vérifier que le badge de statut change correctement.

4. Guard rôle
- Tester avec un rôle non `SCOUT`.
- Vérifier que l'édition est bloquée (mode lecture uniquement).

5. Flag OFF profil scout
- Précondition: `EXPO_PUBLIC_SCOUT_PROFILE_SCREEN_ENABLED=false`.
- Vérifier que l'entrée menu n'apparaît plus.

6. Flag OFF nouveau flux scout
- Précondition: `EXPO_PUBLIC_SCOUT_NEW_FLOW_ENABLED=false`.
- Vérifier absence des raccourcis `Matches`, `Rapports`, `Voice Report` dans Command Center.
- Vérifier que les cartes dashboard `Calendar` et `Reports` sont masquées.

## Rollout recommandé

1. Stage 1
- `EXPO_PUBLIC_SCOUT_PROFILE_SCREEN_ENABLED=true`
- `EXPO_PUBLIC_SCOUT_NEW_FLOW_ENABLED=true`
- `VOICE_CERTIFIED_GUARD_ENABLED=true`
- QA manuelle complète + smoke API.

2. Stage 2
- Activation production progressive par cohortes scouts.
- Monitoring erreurs mobile + feedback terrain.

3. Rollback rapide
- Pour masquer l'écran profil scout: `EXPO_PUBLIC_SCOUT_PROFILE_SCREEN_ENABLED=false`.
- Pour couper les entrées du nouveau flux scout: `EXPO_PUBLIC_SCOUT_NEW_FLOW_ENABLED=false`.
- Pour bypass temporaire voice guard: `VOICE_CERTIFIED_GUARD_ENABLED=false`.
