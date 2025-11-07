# Guide Rapide de Test - Mobile App

## ✅ Prérequis

Les serveurs suivants sont **déjà en cours d'exécution**:

1. **Backend (NestJS)** → http://localhost:3000 ✅
2. **Mobile (Expo)** → http://localhost:8083 ✅

## 🚀 Démarrage Rapide

### Option 1: Simulateur iOS (Mac uniquement)

```bash
# Dans le terminal Expo (qui tourne déjà), appuyer sur:
i
```

Cela ouvrira automatiquement le simulateur iOS avec l'app.

### Option 2: Simulateur Android

```bash
# Dans le terminal Expo, appuyer sur:
a
```

### Option 3: Appareil Physique

1. Installer **Expo Go** depuis l'App Store/Play Store
2. Scanner le QR code affiché dans le terminal
3. L'app se chargera sur votre appareil

## 📋 Tests à Effectuer

### 1. Test de la Recherche Globale 🔍

1. Ouvrir l'app
2. Se connecter (ou créer un compte)
3. **Appuyer sur l'icône 🔍** en haut à droite
4. Taper "test" ou "John" dans la barre de recherche
5. Vérifier que les résultats s'affichent (joueurs, clubs, camps)
6. **Appuyer sur un résultat** → Navigation vers la page de détail
7. **Appuyer sur ✕** → Le modal se ferme

**✅ Succès si**:
- Modal s'ouvre/ferme correctement
- Recherche fonctionne (minimum 2 caractères)
- Navigation fonctionne
- Pas de crash

### 2. Test du Centre de Notifications 🔔

1. **Appuyer sur l'icône 🔔** en haut à droite
2. Vérifier que les notifications s'affichent
3. **Appuyer sur une notification non lue** → Elle devient lue
4. **Appuyer sur "Mark all read"** → Toutes marquées comme lues
5. **Appuyer sur 🗑️** → Supprimer une notification
6. **Appuyer sur "Clear all"** → Toutes supprimées
7. **Tirer vers le bas** → Pull-to-refresh

**✅ Succès si**:
- Notifications affichées correctement
- Marquer comme lu fonctionne
- Suppression fonctionne
- Pull-to-refresh fonctionne
- Pas de crash

### 3. Test de Navigation 🧭

#### Depuis l'écran Profile:

1. Aller sur **Profile** (onglet en bas)
2. Section **"Accès rapide"**:
   - Appuyer sur **💎 Abonnement** → Écran Membership s'ouvre
   - Retour → Appuyer sur **⚽ Clubs** → Liste des clubs s'affiche
   - Retour → Appuyer sur **🏆 Services** → Écran Services s'ouvre
3. Section **"Support"**:
   - Appuyer sur **📧 Nous contacter** → Formulaire de contact
   - Retour → Appuyer sur **ℹ️ À propos** → Page À propos

**✅ Succès si**:
- Tous les écrans s'ouvrent correctement
- Bouton retour fonctionne
- Pas de crash

### 4. Test de la Liste des Clubs ⚽

1. Depuis Profile → **⚽ Clubs**
2. Voir la liste des clubs
3. **Appuyer sur un club** → Écran de détail du club
4. Vérifier:
   - Logo et informations du club
   - Liste des joueurs
   - Statistiques

**✅ Succès si**:
- Liste s'affiche
- Détails corrects
- Pas de crash

### 5. Test des Erreurs ⚠️

1. **Activer le mode avion** sur l'appareil
2. Essayer de:
   - Rechercher un joueur (🔍)
   - Ouvrir les notifications (🔔)
   - Naviguer vers Clubs
3. Vérifier:
   - Pas de crash
   - Messages d'erreur appropriés affichés
   - États vides (empty states) visibles

**✅ Succès si**:
- L'app ne crash pas
- Messages d'erreur clairs
- États vides affichés

## 🛠️ Validation Automatique (Backend)

Un script vérifie automatiquement que le backend est opérationnel:

```bash
./scripts/validate-integration.sh
```

**Résultats attendus**: Tous les tests ✅ PASS

## 📝 Rapport de Test

Une fois les tests effectués, remplir le checklist dans `VALIDATION_GUIDE.md`:

```bash
open VALIDATION_GUIDE.md
```

Cochez les éléments au fur et à mesure.

## ⚡ Résumé des Fonctionnalités à Tester

| Fonctionnalité | Écran | Action | Résultat Attendu |
|---|---|---|---|
| **Recherche Globale** | Tout écran | Appuyer sur 🔍 | Modal s'ouvre, recherche fonctionne |
| **Notifications** | Tout écran | Appuyer sur 🔔 | Modal s'ouvre, actions fonctionnent |
| **Clubs Liste** | Profile → Clubs | Navigation | Liste affichée |
| **Club Détail** | Clubs → Appuyer sur club | Navigation | Détails affichés |
| **Membership** | Profile → Abonnement | Navigation | Plans affichés |
| **About** | Profile → À propos | Navigation | Infos affichées |
| **Contact** | Profile → Nous contacter | Navigation | Formulaire affiché |
| **Services** | Profile → Services | Navigation | Services affichés |

## 🐛 Signaler un Bug

Si vous trouvez un problème:

1. Noter les **étapes pour reproduire**
2. **Comportement attendu** vs **comportement observé**
3. **Capturer d'écran** si possible
4. Ajouter à la section **"7. Problèmes Connus"** du `VALIDATION_GUIDE.md`

## 📱 Informations sur l'App

- **Version**: 1.0.0
- **Environnement**: Development
- **Backend URL**: http://localhost:3000
- **Tests Unitaires**: 127/130 passent ✅

## ℹ️ Aide

### L'app ne se charge pas?

```bash
# Vérifier que les serveurs tournent
curl http://localhost:3000/api/health  # Backend
curl http://localhost:8083/status      # Expo

# Si non, redémarrer
cd /Users/lakhdari/Desktop/AppFoot
npm run start:dev  # Backend (dans un terminal)
cd mobile && npx expo start --port 8083  # Mobile (dans un autre)
```

### Erreur de connexion?

- Vérifier que vous êtes **connecté/inscrit**
- Vérifier que le **backend est accessible**
- Vérifier les **logs de la console** React Native

### Metro Bundler ne répond pas?

```bash
# Clear cache et redémarrer
npx expo start --clear --port 8083
```

---

**Prêt à tester!** 🚀

Ouvrez l'app et suivez les tests 1 par 1.

Bonne validation! 👍
