# 🎯 Guide de Mise à Jour du Pricing Stripe

**Date**: 6 Novembre 2025
**Objectif**: Implémenter le nouveau modèle de pricing (+150% MRR)
**Durée estimée**: 30-45 minutes

## 📊 Résumé des Changements

| Tier | Ancien Prix | Nouveau Prix | Augmentation |
|------|-------------|--------------|--------------|
| FREE | €0 | €0 | - |
| BASIC | €9.99/mois | €19.99/mois | +100% |
| GOLD | €29.99/mois | €49.99/mois | +67% |
| PRO | €99.99/mois | €149/mois | +49% |
| ENTERPRISE | €299.99/mois | €999/mois | +233% |

**Impact attendu**: +150% MRR immédiatement

---

## 🚀 Étapes de Mise à Jour

### 1. Connexion au Dashboard Stripe

1. Aller sur [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Sélectionner le bon compte (Production ou Test)
3. Aller dans **Products** → **Product Catalog**

### 2. Créer les Nouveaux Produits (si pas encore créés)

Pour chaque tier (BASIC, GOLD, PRO, ENTERPRISE), créer un produit :

**Exemple pour GOLD :**

```
Product Name: Arcane Football - Gold Plan
Description: Pour les scouts professionnels avec IA et analytics avancés
Statement Descriptor: ARCANE GOLD
```

### 3. Créer les Prix Mensuels

Pour chaque produit créé :

1. Cliquer sur **Add pricing**
2. Configurer :
   - **Price**: Entrer le nouveau prix (ex: 49.99 pour GOLD)
   - **Billing period**: Recurring → Monthly
   - **Currency**: EUR
   - **Price description**: "Gold Plan - Mensuel"
3. Cliquer sur **Add price**
4. **IMPORTANT**: Copier le `Price ID` (format: `price_xxxxx`)

**Prix à créer :**
- BASIC Monthly: €19.99 → `price_BASIC_MONTHLY_19_99`
- GOLD Monthly: €49.99 → `price_GOLD_MONTHLY_49_99`
- PRO Monthly: €149 → `price_PRO_MONTHLY_149`
- ENTERPRISE Monthly: €999 → `price_ENTERPRISE_MONTHLY_999`

### 4. Créer les Prix Annuels (avec remise 17%)

Répéter l'étape 3 avec :
- **Billing period**: Recurring → Yearly
- **Prix avec remise** :
  - BASIC Yearly: €199.99 (vs €239.88)
  - GOLD Yearly: €499.99 (vs €599.88)
  - PRO Yearly: €1,488 (vs €1,788)
  - ENTERPRISE Yearly: €9,999 (vs €11,988)

### 5. Mettre à Jour le Code Backend

Ouvrir `/backend/src/modules/subscriptions/subscription-pricing.config.ts` et mettre à jour les Price IDs :

```typescript
[SubscriptionTier.GOLD]: {
  // ... autres champs
  stripePriceIdMonthly: 'price_GOLD_MONTHLY_49_99', // Remplacer par le vrai ID
  stripePriceIdYearly: 'price_GOLD_YEARLY_499_99',   // Remplacer par le vrai ID
  stripeProductId: 'prod_xxxxx',                     // Optionnel
}
```

**Répéter pour BASIC, PRO, ENTERPRISE**

### 6. Mettre à Jour les Variables d'Environnement (Optionnel)

Si vous utilisez des variables d'environnement pour les Price IDs :

```bash
# .env.production
STRIPE_PRICE_BASIC_MONTHLY=price_xxxxx
STRIPE_PRICE_BASIC_YEARLY=price_xxxxx
STRIPE_PRICE_GOLD_MONTHLY=price_xxxxx
STRIPE_PRICE_GOLD_YEARLY=price_xxxxx
STRIPE_PRICE_PRO_MONTHLY=price_xxxxx
STRIPE_PRICE_PRO_YEARLY=price_xxxxx
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxxxx
STRIPE_PRICE_ENTERPRISE_YEARLY=price_xxxxx
```

---

## 📧 Communication aux Utilisateurs Existants

### Stratégie de Grandfathering (Recommandée)

Pour éviter le churn des utilisateurs existants :

**Option A: Grandfathering Total (3 mois)**
```
Subject: Nouveaux Prix Arcane Football - Vous êtes protégé

Chers utilisateurs,

À partir du 1er décembre 2025, nous mettons à jour nos tarifs pour mieux refléter la valeur de notre plateforme.

✅ BONNE NOUVELLE : En tant qu'utilisateur existant, vous conservez votre prix actuel pendant 3 mois !

Anciens prix (jusqu'au 28 février 2026) :
- BASIC : €9.99/mois → Nouveaux prix : €19.99/mois
- GOLD : €29.99/mois → Nouveaux prix : €49.99/mois
- PRO : €99.99/mois → Nouveaux prix : €149/mois

Pourquoi cette augmentation ?
- Nouvelles fonctionnalités IA
- Analytics avancés
- Support amélioré
- Infrastructure renforcée

Questions ? Contactez-nous à support@arcane.football

L'équipe Arcane Football
```

**Option B: Grandfathering Permanent**
- Les utilisateurs existants conservent leur prix actuel à vie
- Plus fidélisant mais moins rentable

### Email de Migration Technique

Envoyer 1 semaine avant le changement à tous les users payants :

```
Subject: Action requise : Mise à jour de votre abonnement Arcane

Cher [firstName],

Nous mettons à jour nos plans tarifaires le 1er décembre.

Votre abonnement actuel : [TIER] à €[OLD_PRICE]/mois
Nouveau prix (à partir du 1er mars) : €[NEW_PRICE]/mois

Vous n'avez rien à faire ! Votre abonnement continuera automatiquement.

💎 En remerciement de votre fidélité :
- Prix actuel conservé jusqu'au 28 février 2026
- Accès anticipé aux nouvelles fonctionnalités
- 1 mois offert si vous passez à l'annuel avant le 30 novembre

Passer à l'annuel (économisez 17%) : [LINK]

Merci de votre confiance,
L'équipe Arcane
```

---

## 🧪 Tests à Effectuer

### 1. Tests en Mode Test Stripe

Avant de déployer en production :

1. Créer les produits dans **Test mode**
2. Tester l'inscription à chaque tier
3. Tester l'upgrade/downgrade
4. Tester la cancellation
5. Vérifier les webhooks

### 2. Tests de Non-Régression

```bash
# Backend tests
npm run test src/modules/subscriptions
npm run test src/modules/stripe

# Tester l'endpoint pricing
curl http://localhost:3000/api/subscriptions/pricing

# Devrait retourner les nouveaux prix
```

### 3. Vérifier les Webhooks Stripe

Endpoints à configurer :
```
https://api.arcane.football/api/webhooks/stripe
```

Events à écouter :
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

---

## 📈 Suivi Post-Déploiement

### Métriques à Surveiller (Semaine 1)

| Métrique | Cible | Alerte si |
|----------|-------|-----------|
| Conversion FREE→BASIC | >5% | <2% |
| Upgrade BASIC→GOLD | >15% | <8% |
| Churn rate | <5% | >10% |
| MRR increase | +150% | <+100% |
| Support tickets pricing | <50 | >100 |

### Dashboard Stripe à Vérifier

1. **MRR Evolution** : Dashboard → Metrics → MRR
2. **Active Subscriptions** : Customers → Subscriptions
3. **Failed Payments** : Payments → Failed
4. **Churn Rate** : Reports → Retention

---

## 🚨 Rollback Plan (Si Problème)

Si le churn dépasse 15% dans les 48h :

### Option 1: Rollback Immédiat

```bash
# 1. Réactiver les anciens prix dans Stripe
# 2. Mettre à jour le code avec les anciens Price IDs
# 3. Redéployer
# 4. Envoyer email d'excuses
```

### Option 2: Pricing Intermédiaire

Proposer des prix intermédiaires :
- BASIC : €14.99 (+50% au lieu de +100%)
- GOLD : €39.99 (+33% au lieu de +67%)
- PRO : €124.99 (+25% au lieu de +49%)

---

## ✅ Checklist Finale

Avant de déployer en production :

- [ ] Tous les produits créés dans Stripe Production
- [ ] Tous les Price IDs copiés et mis à jour dans le code
- [ ] Tests passés en Test mode
- [ ] Email de communication préparé
- [ ] Webhooks configurés
- [ ] Monitoring Sentry/DataDog en place
- [ ] Équipe support briefée
- [ ] Grandfathering configuré (si applicable)
- [ ] FAQ mise à jour
- [ ] Backup de la DB
- [ ] Plan de rollback prêt

---

## 📞 Support

En cas de problème :
- **Technique** : dev@arcane.football
- **Stripe Support** : [https://support.stripe.com](https://support.stripe.com)
- **Escalation** : CEO/CTO

---

## 💡 Notes Importantes

1. **Ne jamais supprimer les anciens prix** : Les abonnements existants les utilisent
2. **Archiver** les anciens prix après migration complète (3-6 mois)
3. **Stripe facturation automatique** : Se produit aux dates anniversaires
4. **Prorata automatique** : Stripe gère automatiquement les upgrades/downgrades
5. **TVA** : Stripe Tax peut gérer automatiquement (à configurer)

---

**Date de mise à jour du guide**: 6 Novembre 2025
**Prochaine révision**: 1er Mars 2026
**Version**: 1.0
