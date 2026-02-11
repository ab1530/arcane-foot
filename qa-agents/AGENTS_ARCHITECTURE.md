# 🤖 ARCANE AUTONOMOUS QA AGENTS SYSTEM - ARCHITECTURE

## 📋 Vue d'ensemble

Système d'agents autonomes pour maintenir la qualité du code et corriger automatiquement les erreurs dans Arcane Football Platform.

## 🏗️ Architecture Hiérarchique

```
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR                              │
│                  (qa_autonomy.ts)                            │
│  - Coordination centrale                                     │
│  - Gestion de la séquence d'exécution                       │
│  - Agrégation des rapports                                  │
│  - Décision d'escalade                                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
    ┌──────────────┴──────────────┬──────────────────┐
    │                              │                   │
    ▼                              ▼                   ▼
┌────────────┐              ┌────────────┐     ┌────────────┐
│ QA-Agent   │              │ Fix-Agent  │     │ Reporter   │
│ (Tests)    │─────────────▶│ (Repairs)  │────▶│ (Docs)     │
└────────────┘              └────────────┘     └────────────┘
    │                              │
    │                              │
    └──────────┬───────────────────┘
               │
    ┌──────────┴──────────────────────────────────┐
    │                                              │
    ▼                   ▼                ▼         ▼
┌─────────┐      ┌──────────┐    ┌─────────┐  ┌──────────┐
│ API     │      │ Web      │    │ Mobile  │  │ AI       │
│ Agent   │      │ Agent    │    │ Agent   │  │ Agent    │
└─────────┘      └──────────┘    └─────────┘  └──────────┘
    │                   │              │            │
    └───────────────────┴──────────────┴────────────┘
                        │
                        ▼
                 ┌──────────────┐
                 │ DevOps Agent │
                 └──────────────┘
```

## 🎯 Agents Spécialisés

### 1. **Orchestrator** (Cerveau central)
**Rôle**: Coordonne tous les agents, gère le workflow et les décisions d'escalade.

**Responsabilités**:
- Lancer les agents dans l'ordre optimal
- Gérer les dépendances entre agents
- Décider des actions correctives
- Générer le rapport final
- Escalader les problèmes critiques

**Décisions autonomes**:
- ✅ Peut lancer/arrêter n'importe quel agent
- ✅ Peut relancer un agent après correction
- ⚠️ Escalade si > 3 tentatives échouées
- ⚠️ Escalade si erreur critique (DB, Auth, Secrets)

---

### 2. **QA-Agent** (Testeur universel)
**Rôle**: Exécute tous les tests du projet et identifie les erreurs.

**Stack de tests**:
- Backend: Jest + Supertest
- Web: Playwright + Jest
- Mobile: Jest Expo + React Native Testing Library
- E2E: Playwright end-to-end

**Actions autonomes**:
```typescript
- Exécuter: npm test (backend)
- Exécuter: npm run test:e2e (web)
- Exécuter: npm test (mobile)
- Analyser les résultats
- Catégoriser les erreurs (syntax, logic, type, import)
- Passer la main au Fix-Agent
```

**Escalade si**:
- ❌ Tests échouent après 2 corrections
- ❌ Erreur de configuration (tsconfig, jest.config)
- ❌ Dépendance manquante critique

---

### 3. **Fix-Agent** (Réparateur automatique)
**Rôle**: Corrige automatiquement les erreurs simples et récurrentes.

**Types de corrections automatiques**:

| Type d'erreur | Action automatique | Exemple |
|---------------|-------------------|---------|
| Import manquant | Ajouter l'import | `import { X } from 'Y'` |
| Typo variable | Corriger le nom | `usre` → `user` |
| Type TS manquant | Ajouter le type | `any` → `User` |
| Route 404 | Créer la route stub | Endpoint manquant |
| Dépendance manquante | `npm install X` | Module non trouvé |
| Format code | `npm run format` | Prettier/ESLint |

**Workflow**:
```
1. Recevoir erreur du QA-Agent
2. Analyser le type d'erreur
3. Appliquer la correction
4. Commit local: "fix(auto): [description]"
5. Relancer le test via QA-Agent
6. Si ✅ → log success
7. Si ❌ → escalade
```

**Ne corrige PAS**:
- ❌ Logique métier complexe
- ❌ Secrets/credentials
- ❌ Migrations DB
- ❌ Configuration Stripe/Supabase

---

### 4. **API-Agent** (Testeur d'endpoints)
**Rôle**: Valide tous les endpoints backend (NestJS + FastAPI).

**Tests automatiques**:
```typescript
// Pour chaque endpoint dans les contrôleurs
- GET /api/players → status 200, schema valide
- POST /api/auth/login → status 200 avec token
- GET /api/gamification/profile → status 200
- POST /api/ai/summary → status 200, AI response
```

**Actions autonomes**:
- Parcourir tous les `*.controller.ts`
- Extraire les routes (@Get, @Post, @Put, @Delete)
- Tester chaque route avec données mock
- Valider le schéma de réponse
- Corriger les routes 404 (créer stub)
- Vérifier les guards JWT

**Corrections automatiques**:
- Route manquante → créer endpoint stub
- Guard manquant → ajouter @UseGuards(JwtAuthGuard)
- DTO invalide → ajouter validation

---

### 5. **Web-Agent** (Testeur Next.js)
**Rôle**: Valide les composants React, hooks, et pages Next.js.

**Tests**:
```typescript
// Composants
- Rendu sans crash
- Props requises présentes
- Hooks React Query fonctionnels
- Navigation Next.js valide

// Pages
- SSR/SSG valide
- API routes répondent
- Tailwind classes appliquées
- shadcn/ui components OK
```

**Corrections autonomes**:
- Hook manquant → ajouter import
- Props TS → typer correctement
- API call fail → ajouter fallback
- CSS manquant → ajouter classes Tailwind

---

### 6. **Mobile-Agent** (Testeur Expo/RN)
**Rôle**: Valide l'app mobile React Native.

**Tests**:
```typescript
// Navigation
- Tous les écrans accessibles
- Navigation params typés
- Stack/Tab navigation OK

// Composants
- Render tests
- Props validation
- Hooks useState/useEffect

// API Integration
- Fetch data OK
- Token storage (SecureStore)
- Image loading
```

**Corrections autonomes**:
- Warning React Native → fix
- Navigation type error → typer
- Hook dependency → ajouter deps
- Import Expo → corriger chemin

---

### 7. **AI-Agent** (Testeur IA)
**Rôle**: Valide la couche AI (FastAPI + NestJS integration).

**Tests**:
```python
# FastAPI endpoints
- POST /summary → 200, summary text
- POST /index → 200, indexed
- POST /matchmaking → 200, matches array

# NestJS AI Service
- AiService.getSummary() → OK
- Fallback OpenAI → OK si FastAPI down
- Timeout handling → OK
```

**Corrections autonomes**:
- Endpoint down → activer fallback OpenAI
- Timeout → augmenter délai
- Schema mismatch → fix types
- Model loading fail → reload

---

### 8. **DevOps-Agent** (Validateur infra)
**Rôle**: Valide Docker, CI/CD, variables d'environnement.

**Tests**:
```yaml
# Docker
- Dockerfile build sans erreur
- docker-compose up OK
- Images optimisées

# GitLab CI
- Pipeline stages valides
- Variables env présentes
- Tests passent dans CI

# Config
- .env.example à jour
- Sentry connecté
- Supabase config OK
```

**Corrections autonomes**:
- Var env manquante → ajouter dans .env.example
- Docker cache → clear + rebuild
- Pipeline syntax → fix YAML
- Sentry DSN → vérifier

---

### 9. **Reporter-Agent** (Documenteur)
**Rôle**: Génère le rapport QA final en Markdown.

**Contenu du rapport**:
```markdown
# ARCANE QA AUTONOMY REPORT

## 📊 Résumé Exécution
- Date: 2025-11-04 18:30:45
- Durée totale: 4m 32s
- Tests exécutés: 342
- Tests passés: ✅ 338 (98.8%)
- Tests échoués: ❌ 4 (1.2%)

## 🤖 Actions Agents

### QA-Agent
- Tests exécutés: 342
- Erreurs détectées: 12
- Escaladées au Fix-Agent: 12

### Fix-Agent
- Corrections appliquées: 8 ✅
- Corrections échouées: 4 ❌
- Fichiers modifiés: [liste]

### API-Agent
- Endpoints testés: 87
- Endpoints OK: ✅ 85
- Endpoints KO: ❌ 2

[... détails pour chaque agent ...]

## 🔧 Correctifs Appliqués

1. **backend/src/modules/gamification/gamification.service.ts**
   - Type: Import manquant
   - Fix: Ajout `import { Logger } from '@nestjs/common'`
   - Status: ✅ Corrigé

2. **web/app/dashboard/page.tsx**
   - Type: Hook dépendance
   - Fix: Ajout `userId` dans deps useEffect
   - Status: ✅ Corrigé

## ⚠️ Problèmes Non Résolus

1. **❌ Critical: Redis connection failed**
   - Agent: DevOps-Agent
   - Fichier: backend/src/modules/cache/redis.service.ts
   - Erreur: ECONNREFUSED localhost:6379
   - Action requise: Démarrer Redis ou désactiver cache
   - Tentatives: 3

2. **❌ API endpoint 404**
   - Agent: API-Agent
   - Route: POST /api/ai/matchmaking
   - Erreur: Route non implémentée
   - Action requise: Implémenter contrôleur
   - Tentatives: 2

## 📈 Métriques

- Taux de succès global: 98.8%
- Corrections automatiques: 8/12 (66.7%)
- Temps moyen correction: 12s
- Agents actifs: 8/8

## 🎯 Actions Recommandées

1. ⚠️ Démarrer Redis pour activer le cache
2. ⚠️ Implémenter route AI matchmaking
3. ✅ Relancer pipeline après corrections
4. ✅ Merge des corrections auto dans develop

---
*Rapport généré automatiquement par Arcane QA Autonomy System*
```

---

## 🔄 Workflow Global

```
1. ORCHESTRATOR démarre
   ↓
2. QA-Agent exécute TOUS les tests
   ↓
3. Si erreurs → Fix-Agent tente corrections
   ↓
4. QA-Agent relance tests sur modules corrigés
   ↓
5. Agents spécialisés (API, Web, Mobile, AI, DevOps)
   exécutent leurs tests spécifiques
   ↓
6. Reporter-Agent agrège tous les résultats
   ↓
7. ORCHESTRATOR décide:
   - ✅ Tout OK → commit auto "chore(qa): auto-fixes"
   - ⚠️ Erreurs mineures → rapport + suggestions
   - ❌ Erreurs critiques → ESCALADE + notification
```

## 🚦 Règles d'Escalade

| Priorité | Type d'erreur | Action | Notification |
|----------|---------------|--------|--------------|
| 🟢 P4 | Warning, style | Auto-fix | Non |
| 🟡 P3 | Tests échoués | Auto-fix + log | Non |
| 🟠 P2 | API 404, types | Tentative fix + rapport | Optionnel |
| 🔴 P1 | DB, Auth, Secrets | ESCALADE immédiate | ✅ OUI |

## 📁 Structure Fichiers

```
qa-agents/
├── AGENTS_ARCHITECTURE.md          # Ce fichier
├── agents.config.ts                # Configuration agents
├── orchestrator.ts                 # Cerveau central
├── agents/
│   ├── qa-agent.ts                 # Testeur universel
│   ├── fix-agent.ts                # Réparateur auto
│   ├── api-agent.ts                # Testeur API
│   ├── web-agent.ts                # Testeur Next.js
│   ├── mobile-agent.ts             # Testeur Expo
│   ├── ai-agent.ts                 # Testeur IA
│   ├── devops-agent.ts             # Validateur infra
│   └── reporter-agent.ts           # Générateur rapports
├── utils/
│   ├── logger.ts                   # Logs structurés
│   ├── git-manager.ts              # Commits auto
│   ├── error-analyzer.ts           # Catégorisation erreurs
│   └── escalation-manager.ts       # Gestion escalades
├── logs/                           # Logs d'exécution
│   ├── qa-agent.log
│   ├── fix-agent.log
│   └── orchestrator.log
└── reports/
    ├── QA_AUTONOMY_REPORT.md       # Rapport principal
    └── history/                     # Historique rapports
        ├── 2025-11-04_18-30.md
        └── 2025-11-04_12-00.md
```

## ⚙️ Modes d'Exécution

### Mode Local
```bash
npm run qa:autonomy
```
- Exécution complète
- Corrections auto-commit
- Rapport généré

### Mode CI/CD (GitLab)
```yaml
qa_autonomy:
  stage: qa
  script:
    - npm run qa:autonomy
  artifacts:
    reports:
      junit: reports/QA_AUTONOMY_REPORT.md
  only:
    - schedules  # Cron quotidien
```

### Mode Watch (Dev)
```bash
npm run qa:watch
```
- Exécution en continu
- Corrections à la volée
- Logs en temps réel

---

## 🎓 Intelligence des Agents

Chaque agent utilise:
- **Pattern matching** pour détecter erreurs récurrentes
- **ML léger** pour prédire les corrections (basé sur historique)
- **Règles heuristiques** pour les décisions complexes
- **Feedback loop** pour améliorer les corrections futures

---

*Architecture Arcane QA Autonomy System v1.0*
