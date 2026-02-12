# 🤖 ARCANE QA AUTONOMY SYSTEM

**Système d'agents autonomes pour la qualité continue du code**

## 🎯 Vision

Un système intelligent qui:
- ✅ Teste automatiquement toutes les couches du projet
- 🔧 Corrige directement les erreurs simples
- 📊 Documente chaque action dans des rapports
- ⚠️ Escal ade uniquement les problèmes critiques

**Objectif**: Intervention humaine uniquement pour les décisions bloquantes.

---

## 🏗️ Architecture

```
Orchestrator (Cerveau)
    ↓
QA-Agent (Tests) → Fix-Agent (Corrections) → Reporter (Docs)
    ↓                    ↓
[API, Web, Mobile, AI, DevOps Agents]
```

Voir [AGENTS_ARCHITECTURE.md](./AGENTS_ARCHITECTURE.md) pour les détails complets.

---

## 🚀 Installation

### Prérequis

```bash
Node.js >= 20
npm >= 10
TypeScript >= 5
```

### Setup

```bash
# 1. Installer dépendances
cd qa-agents
npm install

# 2. Créer dossiers nécessaires
mkdir -p logs reports reports/history

# 3. Configurer environnement
cp .env.example .env
# Éditer .env avec vos valeurs
```

### Variables d'environnement

```env
# Mode d'exécution
QA_MODE=local  # local | ci | watch

# Auto-commit des corrections
QA_AUTO_COMMIT=true

# Notifications (optionnel)
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
QA_NOTIFICATION_EMAIL=qa@arcane.com
SENTRY_DSN=https://...

# Seuils de qualité
MIN_TEST_COVERAGE=70
MAX_BUILD_TIME=300000
```

---

## 📖 Utilisation

### Mode Local (Manuel)

```bash
# Exécution complète
npm run qa:autonomy

# Voir les logs
tail -f logs/orchestrator.log

# Consulter le rapport
cat reports/QA_AUTONOMY_REPORT.md
```

### Mode Watch (Développement)

```bash
# Surveillance continue
npm run qa:watch

# Les agents s'exécutent à chaque changement de fichier
# Corrections appliquées en temps réel
```

### Mode CI/CD (GitLab)

Ajoutez à `.gitlab-ci.yml`:

```yaml
qa_autonomy:
  stage: qa
  image: node:20
  script:
    - cd qa-agents
    - npm install
    - npm run qa:autonomy
  artifacts:
    reports:
      junit: qa-agents/reports/QA_AUTONOMY_REPORT.md
    paths:
      - qa-agents/logs/
      - qa-agents/reports/
  only:
    - develop
    - main
  when: always

# Cron quotidien
qa_autonomy_cron:
  extends: qa_autonomy
  only:
    - schedules
```

---

## 🤖 Agents Disponibles

| Agent | Rôle | Auto-Fix | Priorité |
|-------|------|----------|----------|
| **QA-Agent** | Exécute tous les tests | ❌ | 1 (First) |
| **Fix-Agent** | Corrige les erreurs | ✅ | 2 |
| **API-Agent** | Teste les endpoints | ✅ | 3 |
| **Web-Agent** | Teste Next.js | ✅ | 3 |
| **Mobile-Agent** | Teste Expo/RN | ✅ | 3 |
| **AI-Agent** | Teste FastAPI | ✅ | 4 |
| **DevOps-Agent** | Valide infra | ✅ | 5 |
| **Reporter-Agent** | Génère docs | ❌ | 10 (Last) |

---

## 🔧 Configuration

### agents.config.ts

Fichier central de configuration:

```typescript
import config from './agents.config';

// Activer/désactiver un agent
config.agents['web-agent'].enabled = false;

// Changer timeout
config.agents['qa-agent'].timeout = 600000; // 10min

// Modifier stratégie d'escalade
config.orchestrator.stopOnCriticalError = false;
```

### Personnaliser les corrections

Ajoutez vos propres patterns dans `agents.config.ts`:

```typescript
FIX_PATTERNS.push({
  errorPattern: /Custom error pattern/,
  fixAction: 'CUSTOM_FIX',
  confidence: 0.90,
  examples: ['Example error message'],
});
```

---

## 📊 Rapports

### Rapport Principal

Généré à chaque exécution: `reports/QA_AUTONOMY_REPORT.md`

Contient:
- 📈 Résumé global (tests, erreurs, corrections)
- 🤖 Résultats détaillés par agent
- 🔴 Erreurs critiques avec suggestions
- 🎯 Recommandations d'action
- 📚 Liens et ressources

### Historique

Tous les rapports archivés dans `reports/history/`:

```
reports/history/
├── 2025-11-04_08-30-15.md
├── 2025-11-04_14-15-22.md
└── 2025-11-05_03-00-45.md
```

### Logs

Logs détaillés par agent dans `logs/`:

```
logs/
├── orchestrator.log      # Coordination
├── qa-agent.log          # Tests
├── fix-agent.log         # Corrections
└── reporter-agent.log    # Rapports
```

---

## 🎓 Guide d'Utilisation

### Scénario 1: Je viens de push du code

```bash
# 1. Exécuter QA
npm run qa:autonomy

# 2. Consulter le rapport
cat reports/QA_AUTONOMY_REPORT.md

# 3. Si corrections auto appliquées
git status
git add .
git commit -m "chore(qa): apply auto-fixes"
git push
```

### Scénario 2: J'ai une erreur critique

```bash
# 1. Le rapport montre une erreur critique
cat reports/QA_AUTONOMY_REPORT.md

# 2. Voir les logs détaillés
tail -100 logs/qa-agent.log

# 3. Suivre les recommandations du rapport
# Exemple: "Vérifier DB_URL dans .env"

# 4. Corriger manuellement

# 5. Re-tester
npm run qa:autonomy
```

### Scénario 3: Développement continu

```bash
# Mode watch activé
npm run qa:watch

# Modifier du code...
# → Agents s'exécutent automatiquement
# → Corrections appliquées
# → Notification si erreur critique
```

---

## 🛠️ Troubleshooting

### Agent timeout

```bash
# Augmenter timeout dans agents.config.ts
config.agents['qa-agent'].timeout = 600000; // 10min
```

### Corrections non appliquées

```bash
# Vérifier auto-commit
QA_AUTO_COMMIT=true npm run qa:autonomy

# Vérifier logs
cat logs/fix-agent.log
```

### Tests échouent systématiquement

```bash
# Désactiver temporairement l'agent
config.agents['web-agent'].enabled = false;

# Ou skip certains tests
QA_SKIP_E2E=true npm run qa:autonomy
```

### Erreurs critiques récurrentes

```bash
# Escalade manuelle
npm run qa:escalate

# Notification forcée
npm run qa:notify
```

---

## 📈 Métriques de Qualité

Le système suit ces métriques:

| Métrique | Cible | Minimum | Critique |
|----------|-------|---------|----------|
| Taux de succès | > 95% | > 85% | < 70% |
| Couverture tests | > 85% | > 70% | < 50% |
| Taux auto-fix | > 70% | > 50% | < 30% |
| Temps de build | < 3min | < 5min | > 10min |

---

## 🔐 Sécurité

### Corrections automatiques sécurisées

Le système **NE CORRIGE JAMAIS**:
- ❌ Credentials / Secrets
- ❌ Logique métier complexe
- ❌ Migrations de base de données
- ❌ Configuration Stripe/Payment
- ❌ Modifications de sécurité

### Escalade immédiate pour:
- 🔴 SECURITY_ERROR
- 🔴 SECRETS_EXPOSED
- 🔴 AUTH_ERROR (critique)
- 🔴 MIGRATION_ERROR

---

## 🤝 Contribution

### Ajouter un nouvel agent

1. Créer `agents/custom-agent.ts`:

```typescript
export default class CustomAgent {
  async run() {
    // Votre logique
    return {
      success: true,
      errors: [],
      fixes: [],
      metrics: { /* ... */ },
    };
  }
}
```

2. Ajouter dans `agents.config.ts`:

```typescript
AGENTS_CONFIG['custom-agent'] = {
  name: 'Custom Agent',
  enabled: true,
  priority: 6,
  // ...
};
```

3. Tester:

```bash
npm run qa:autonomy
```

### Ajouter un pattern de correction

Dans `agents.config.ts`:

```typescript
FIX_PATTERNS.push({
  errorPattern: /Your pattern/,
  fixAction: 'YOUR_ACTION',
  confidence: 0.85,
  examples: ['Example 1', 'Example 2'],
});
```

Implémenter dans `agents/fix-agent.ts`:

```typescript
case 'YOUR_ACTION':
  await this.yourCustomFix(error);
  break;
```

---

## 📞 Support

- 📧 Email: lakhdari@arcane-football.com
- 💬 Slack: #arcane-qa-agents
- 📖 Wiki: [wiki.arcane-football.com/qa-agents](https://wiki.arcane-football.com/qa-agents)
- 🐛 Issues: [GitHub Issues](https://github.com/arcane/qa-agents/issues)

---

## 📜 Licence

Propriétaire - Arcane Football Platform © 2025

---

## 🎉 Roadmap

### v1.1 (Q1 2025)
- [ ] Machine Learning pour prédiction d'erreurs
- [ ] Intégration Copilot pour suggestions
- [ ] Dashboard web temps réel
- [ ] Webhook notifications avancées

### v1.2 (Q2 2025)
- [ ] Multi-projet support
- [ ] Agents custom via plugins
- [ ] Analytics avancés
- [ ] Self-healing infrastructure

---

*🤖 Construit avec ❤️ par l'équipe Arcane*
