# 🚀 ARCANE QA AGENTS - DÉMARRAGE RAPIDE

## Installation en 3 commandes

```bash
# 1. Installer
cd qa-agents && npm install

# 2. Créer dossiers
mkdir -p logs reports reports/history

# 3. Lancer
npm run qa:autonomy
```

---

## ✅ Checklist Première Utilisation

### Prérequis
- [ ] Node.js >= 20 installé
- [ ] TypeScript >= 5 installé
- [ ] Backend, Web, Mobile en état fonctionnel
- [ ] Variables d'environnement configurées

### Setup
- [ ] Dossier `qa-agents` créé
- [ ] Dépendances installées (`npm install`)
- [ ] Dossiers `logs`, `reports` créés
- [ ] Fichier `.env` configuré (optionnel)

### Premier Test
- [ ] Exécuter `npm run qa:autonomy`
- [ ] Vérifier rapport généré dans `reports/`
- [ ] Consulter logs dans `logs/`
- [ ] Vérifier corrections appliquées (`git status`)

---

## 📋 Commandes Essentielles

```bash
# Exécution complète
npm run qa:autonomy

# Mode watch (dev)
npm run qa:watch

# Voir le rapport
npm run qa:report

# Nettoyer logs
npm run qa:clean

# Build TypeScript
npm run qa:build
```

---

## 🎯 Cas d'Usage Communs

### Avant un commit

```bash
# Tester + corriger automatiquement
npm run qa:autonomy

# Voir ce qui a changé
git status

# Commit avec les corrections
git add .
git commit -m "feat: nouvelle fonctionnalité + auto-fixes QA"
```

### Avant un merge

```bash
# Tester sur la branche
git checkout develop
npm run qa:autonomy

# Si succès → merge
git merge feature/ma-branche
```

### Debug rapide

```bash
# Lancer QA
npm run qa:autonomy

# Voir les erreurs
tail -50 logs/qa-agent.log

# Voir les corrections
tail -50 logs/fix-agent.log
```

---

## 🔴 Que faire si...

### "Module not found"
```bash
cd qa-agents
npm install
```

### "Permission denied"
```bash
chmod +x orchestrator.ts
```

### "Agent timeout"
```bash
# Augmenter timeout dans agents.config.ts
agents['qa-agent'].timeout = 600000; // 10min
```

### "No report generated"
```bash
# Vérifier dossiers
ls -la reports/

# Recréer si nécessaire
mkdir -p reports reports/history
```

---

## 📊 Interpréter les Résultats

### Taux de succès > 90%
✅ **Excellent** - Système stable, continuer

### Taux de succès 70-90%
⚠️ **Attention** - Quelques erreurs, vérifier le rapport

### Taux de succès < 70%
❌ **Critique** - Problèmes majeurs, intervention requise

---

## 🤖 Agents Actifs par Défaut

| Agent | Description | Durée moyenne |
|-------|-------------|---------------|
| QA-Agent | Tests complets | 2-3 min |
| Fix-Agent | Corrections auto | 30s-1min |
| API-Agent | Endpoints | 1-2 min |
| Web-Agent | Next.js | 2-3 min |
| Mobile-Agent | Expo/RN | 3-4 min |
| AI-Agent | FastAPI | 1 min |
| DevOps-Agent | Infra | 2-5 min |
| Reporter-Agent | Rapport | 10s |

**Total**: ~10-15 minutes

---

## 🎓 Ressources

- [Architecture complète](./AGENTS_ARCHITECTURE.md)
- [README détaillé](./README.md)
- [Configuration](./agents.config.ts)
- [Documentation projet](../README.md)

---

## 📞 Besoin d'aide?

1. Consulter les logs: `tail -f logs/orchestrator.log`
2. Lire le README: `cat README.md`
3. Contacter l'équipe: lakhdari@arcane-football.com

---

*🤖 Arcane QA Autonomy System - Prêt en 3 minutes*
