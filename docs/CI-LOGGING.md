# Système de Logging GitLab CI

Ce document décrit le système de logging mis en place pour les pipelines GitLab CI.

## Vue d'ensemble

Le système de logging capture automatiquement tous les logs de tous les jobs du pipeline et les rend disponibles via les artifacts GitLab CI.

## Fonctionnalités

### 1. Logging Automatique

Chaque job du pipeline utilise le template `.setup_logging` qui :
- Crée automatiquement un fichier de log pour le job
- Capture toutes les sorties stdout/stderr
- Enregistre les timestamps de début et fin
- Inclut les métadonnées du pipeline (ID, commit, branche)

### 2. Artifacts de Logs

Les logs sont sauvegardés dans les artifacts avec :
- **Nom**: `pipeline-logs-{PIPELINE_ID}-{COMMIT_SHA}`
- **Durée de rétention**: 2 semaines
- **Format**: Fichiers texte (.log) + rapport markdown

### 3. Agrégation des Logs

Un job dédié `aggregate_logs` s'exécute après tous les tests pour :
- Collecter tous les logs de tous les jobs
- Créer un rapport de synthèse
- Inclure les rapports de couverture de tests
- Générer un fichier JSON pour l'automatisation

## Structure des Artifacts

```
aggregated_logs/
├── pipeline_summary.md           # Résumé du pipeline
├── build_backend_*.log          # Logs du build backend
├── build_web_*.log              # Logs du build web
├── unit_test_backend_*.log      # Logs des tests backend
├── unit_test_web_*.log          # Logs des tests web
├── qa_job_*.log                 # Logs des tests QA
├── qa_report.md                 # Rapport QA détaillé
├── analysis_report.json         # Rapport JSON automatisé
└── coverage/                    # Rapports de couverture
    ├── backend/
    └── web/
```

## Utilisation

### Télécharger les Logs du Pipeline

1. Aller dans votre pipeline GitLab CI
2. Naviguer vers le job `aggregate_logs`
3. Cliquer sur "Download" dans la section Artifacts
4. Extraire l'archive

### Analyser les Logs Localement

Un script d'analyse est fourni :

```bash
# Télécharger et extraire les artifacts
# Puis lancer l'analyse
./scripts/analyze-ci-logs.sh aggregated_logs
```

Le script fournira :
- Résumé global du pipeline
- Analyse des erreurs et warnings
- Métriques de performance
- Résultats des tests
- Top des erreurs les plus fréquentes
- Tailles des fichiers de log

### Logs Backend (NestJS)

Le backend utilise Winston pour le logging structuré :

```typescript
import { LoggerService } from './logger/logger.service';

@Injectable()
export class MyService {
  constructor(private readonly logger: LoggerService) {}

  myMethod() {
    // Logs standard
    this.logger.log('Message informatif', 'MyService');
    this.logger.error('Erreur détectée', trace, 'MyService');
    this.logger.warn('Avertissement', 'MyService');
    this.logger.debug('Debug info', 'MyService');

    // Logs personnalisés
    this.logger.logHttpRequest('POST', '/api/users', 200, 150, 'user-id');
    this.logger.logDatabaseQuery('SELECT * FROM users', 50);
    this.logger.logPerformance('data-processing', 1200);
    this.logger.logBusinessEvent('user-registered', { userId: '123' });
    this.logger.logSecurity('unauthorized-access', 'high', { ip: '1.2.3.4' });
  }
}
```

Les logs sont sauvegardés dans `backend/logs/` :
- `error.log` - Erreurs uniquement
- `combined.log` - Tous les logs
- `http.log` - Requêtes HTTP
- `debug.log` - Logs de debug (dev seulement)

### Logs Mobile (React Native)

Le mobile utilise le service de logging personnalisé :

```typescript
import { logger } from './services/logger.service';

// Logs standard
logger.debug('Debug message', 'Component');
logger.info('Info message', 'Component');
logger.warn('Warning message', 'Component');
logger.error('Error message', 'Component', data, error);
logger.fatal('Fatal error', 'Component', data, error);

// Logs personnalisés
logger.logApiRequest('POST', '/api/users', 200, 150);
logger.logApiError('GET', '/api/data', error);
logger.logNavigation('HomeScreen', { userId: '123' });
logger.logPerformance('image-load', 500);
logger.logUserAction('button-click', { buttonId: 'submit' });

// Gestion des logs
const logs = logger.getInMemoryLogs();
const content = await logger.getLogFileContent();
const files = await logger.getAllLogFiles();
const exportPath = await logger.exportLogs();
await logger.clearLogs();
```

Les logs sont sauvegardés localement et peuvent être exportés pour debugging.

## Optimisations de Performance

### Variables d'environnement

```yaml
# Compression rapide
FF_USE_FASTZIP: "true"
ARTIFACT_COMPRESSION_LEVEL: "fast"
CACHE_COMPRESSION_LEVEL: "fast"

# Node.js optimisé
NODE_OPTIONS: "--max-old-space-size=4096"
NPM_CONFIG_LOGLEVEL: "error"
NPM_CONFIG_PROGRESS: "false"

# Exécution parallèle
JEST_MAX_WORKERS: "4"
PLAYWRIGHT_WORKERS: "2"
```

### Cache Intelligent

Le cache est basé sur les `package-lock.json` pour une invalidation précise :

```yaml
cache:
  key:
    files:
      - backend/package-lock.json
      - web/package-lock.json
  paths:
    - web/node_modules
    - backend/node_modules
  policy: pull-push
```

## Bonnes Pratiques

1. **Consultez toujours les logs en cas d'échec**
   - Téléchargez les artifacts `aggregate_logs`
   - Utilisez le script d'analyse pour un aperçu rapide

2. **Logs structurés**
   - Utilisez les méthodes de logging appropriées
   - Incluez du contexte pertinent
   - Évitez de logger des informations sensibles

3. **Performance**
   - Les logs sont écrits de manière asynchrone
   - La rotation automatique empêche les fichiers trop volumineux
   - Les vieux logs sont automatiquement nettoyés

4. **Debugging**
   - Niveau de log `debug` en développement
   - Niveau de log `info` en production
   - Utilisez `LOG_LEVEL` pour ajuster

## Dépannage

### Les logs ne sont pas capturés

Vérifiez que le job utilise `extends: .setup_logging` :

```yaml
my_job:
  extends: .setup_logging
  script:
    - echo "Message" | tee -a $LOG_FILE
```

### Les artifacts sont trop volumineux

Ajustez la durée de rétention ou excluez certains fichiers :

```yaml
artifacts:
  expire_in: 1 week  # Au lieu de 2 weeks
  paths:
    - logs/
  exclude:
    - logs/debug.log  # Exclure les logs de debug
```

### Erreur de mémoire Node.js

Augmentez la limite de mémoire :

```yaml
variables:
  NODE_OPTIONS: "--max-old-space-size=8192"  # 8GB au lieu de 4GB
```

## Intégration Continue

Le système de logging s'intègre naturellement avec le workflow CI/CD :

1. **Build** → Logs de compilation
2. **Test** → Logs de tests + couverture
3. **QA** → Logs E2E + rapport QA
4. **Logs** → Agrégation de tous les logs
5. **Deploy** → Utilise les logs pour validation

## Support

Pour toute question ou problème :
1. Consultez d'abord les logs du pipeline
2. Utilisez le script d'analyse
3. Vérifiez la configuration GitLab CI
4. Contactez l'équipe DevOps

## Exemples de Commandes Utiles

```bash
# Analyser les logs d'un pipeline spécifique
./scripts/analyze-ci-logs.sh pipeline-123-abc/aggregated_logs

# Chercher une erreur spécifique
grep -r "specific error" aggregated_logs/

# Compter les erreurs par job
for f in aggregated_logs/*.log; do echo "$f:"; grep -c "ERROR" "$f"; done

# Extraire les temps d'exécution
grep "started at\|finished at" aggregated_logs/*.log

# Trouver les jobs les plus lents
du -h aggregated_logs/*.log | sort -rh | head -5
```

## Roadmap

- [ ] Intégration avec un système de monitoring (Grafana/Prometheus)
- [ ] Alertes automatiques sur erreurs critiques
- [ ] Dashboard de visualisation des logs
- [ ] Rétention à long terme dans S3
- [ ] Analyse ML pour détecter les patterns d'erreurs
