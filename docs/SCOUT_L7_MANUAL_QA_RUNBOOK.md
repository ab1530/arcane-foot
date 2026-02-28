# Scout L7 - Manual QA Runbook (15-20 min)

Date: 2026-02-25

Objectif: exécuter rapidement la partie restante du lot L7 (QA device/staging + rollout flags), avec une procédure reproductible.

## 1) Préparation (2 min)

Depuis la racine du repo:

```bash
cd /Users/lakhdari/Desktop/AppFoot
```

Configurer les flags L7 en mode nominal:

```bash
VOICE_GUARD=true SCOUT_NEW_FLOW=true SCOUT_PROFILE_SCREEN=true ./scripts/qa/scout-l7-set-flags.sh
```

## 2) Validation automatisée ciblée (3-5 min)

Exécuter les tests ciblés L7:

```bash
./scripts/qa/scout-l7-smoke.sh
```

Critère attendu:
- backend suites ciblées: PASS
- mobile suites ciblées: PASS

## 3) Smoke API voice guard (2-3 min)

Pré-requis:
- backend en cours d’exécution.
- 2 comptes scouts de test:
  - un certifié (`currentLevel >= 5`)
  - un non certifié (`currentLevel < 5`)

Commande:

```bash
RUN_API_SMOKE=1 \
API_BASE_URL=http://localhost:3000/api \
SCOUT_CERTIFIED_EMAIL="<email_scout_certifie>" \
SCOUT_UNCERTIFIED_EMAIL="<email_scout_non_certifie>" \
SCOUT_PASSWORD="<password>" \
./scripts/qa/scout-l7-smoke.sh
```

Critères attendus:
- scout non certifié: HTTP `403`
- scout certifié: pas `401/403` (code attendu possible: `200`, `400`, `413`, `429`, `500`)

Optionnel (contrôle rôle):

```bash
RUN_API_SMOKE=1 \
API_BASE_URL=http://localhost:3000/api \
SCOUT_CERTIFIED_EMAIL="<email_scout_certifie>" \
SCOUT_UNCERTIFIED_EMAIL="<email_scout_non_certifie>" \
SCOUT_PASSWORD="<password>" \
NON_SCOUT_EMAIL="<email_agent_ou_player>" \
NON_SCOUT_PASSWORD="<password_non_scout>" \
./scripts/qa/scout-l7-smoke.sh
```

Critère attendu:
- non scout: HTTP `403`

## 4) QA manuelle mobile (8-10 min)

### Scénario A - Flags ON

Précondition:

```bash
VOICE_GUARD=true SCOUT_NEW_FLOW=true SCOUT_PROFILE_SCREEN=true ./scripts/qa/scout-l7-set-flags.sh
```

Checks:
1. Compte SCOUT: menu `Profil scout` visible dans Profil.
2. Ouvrir `Profil scout`: sections visibles (crédibilité, rôle/statut, zones couverture, spécialités, expérience).
3. Passer en édition, modifier champs, enregistrer, recharger écran.
4. Vérifier persistance des valeurs.
5. Activer puis mettre en pause listing, vérifier badge/statut.

### Scénario B - Profil scout OFF

Précondition:

```bash
VOICE_GUARD=true SCOUT_NEW_FLOW=true SCOUT_PROFILE_SCREEN=false ./scripts/qa/scout-l7-set-flags.sh
```

Checks:
1. Compte SCOUT: entrée `Profil scout` absente du menu Profil.
2. Navigation existante vers l’écran profil scout non accessible.

### Scénario C - Nouveau flux scout OFF

Précondition:

```bash
VOICE_GUARD=true SCOUT_NEW_FLOW=false SCOUT_PROFILE_SCREEN=true ./scripts/qa/scout-l7-set-flags.sh
```

Checks:
1. Command Center: raccourcis `Matches`, `Rapports`, `Voice Report` absents.
2. Dashboard: cartes `Calendar` et `Reports` masquées.

## 5) Validation staging/production-like (2 min)

Appliquer les mêmes 3 scénarios sur environnement staging (sans changer le code), puis valider:
- comportement identique des flags,
- persistance réelle backend,
- absence de régression role-based.

## 6) Template de résultat QA

Copier ce bloc dans ton compte-rendu:

```md
## Scout L7 QA result (YYYY-MM-DD)

- Scénario A (all ON): PASS|FAIL
- Scénario B (profile OFF): PASS|FAIL
- Scénario C (new flow OFF): PASS|FAIL
- API smoke guard: PASS|FAIL
- Device iOS: PASS|FAIL
- Device Android: PASS|FAIL

### Notes
- ...
```

## 7) Rollout recommandé après QA OK

1. Staging: `VOICE_GUARD=true`, `SCOUT_NEW_FLOW=true`, `SCOUT_PROFILE_SCREEN=true`.
2. Production canary (petite cohorte scouts).
3. Production full rollout.
4. Rollback rapide:
   - masquer profil scout: `SCOUT_PROFILE_SCREEN=false`
   - couper nouveau flux scout: `SCOUT_NEW_FLOW=false`
   - bypass temporaire guard voice: `VOICE_GUARD=false`
