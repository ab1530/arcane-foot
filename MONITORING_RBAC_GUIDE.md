# RBAC Monitoring Guide

Complete guide for monitoring 403 errors and subscription conversion tracking in AppFoot.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Dashboard Access](#dashboard-access)
4. [Metrics Definitions](#metrics-definitions)
5. [Alert Thresholds](#alert-thresholds)
6. [Troubleshooting](#troubleshooting)
7. [Success Criteria](#success-criteria)
8. [API Reference](#api-reference)

---

## Overview

The RBAC Monitoring System tracks:
- **403 Error Rate**: Percentage of requests blocked due to insufficient subscription tier
- **Conversion Rate**: Percentage of blocked users who upgrade to a paid tier
- **Feature Blocking Analytics**: Which features are most frequently blocked
- **Revenue Impact**: Revenue generated from tier-based conversions
- **Upgrade Modal Performance**: CTR and dismiss rates for upgrade prompts

### Key Components

1. **Sentry Interceptor** (`backend/src/common/interceptors/sentry.interceptor.ts`)
   - Captures all 403 errors with full context
   - Tracks user journey (last 5 pages visited)
   - Tags events for easy filtering in Sentry

2. **Analytics Service** (`backend/src/modules/analytics/analytics.service.ts`)
   - Calculates all RBAC metrics
   - Provides tracking methods for events
   - Generates actionable recommendations

3. **Alert Service** (`backend/src/modules/analytics/alert.service.ts`)
   - Hourly metric checks
   - Automated alerts when thresholds are exceeded
   - Daily summary emails

4. **Database Tables** (Prisma schema)
   - `rbac_events`: All 403 blocking events
   - `upgrade_modals`: Modal shown/dismissed/clicked tracking
   - `subscription_conversions`: Successful upgrades

---

## Architecture

```
┌─────────────────────┐
│   User Request      │
│   (AI Feature)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ SubscriptionTier    │
│ Guard               │
└──────────┬──────────┘
           │
           ▼ (403 Forbidden)
┌─────────────────────┐
│ Sentry Interceptor  │
│ - Log to Sentry     │
│ - Store in DB       │
│ - Track journey     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Upgrade Modal       │
│ (Frontend)          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Analytics Service   │
│ - Track events      │
│ - Calculate metrics │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Alert Service       │
│ - Hourly checks     │
│ - Send alerts       │
│ - Daily summaries   │
└─────────────────────┘
```

---

## Dashboard Access

### API Endpoints

#### 1. Main RBAC Dashboard
```
GET /analytics/rbac-metrics?days=7
```

**Response:**
```json
{
  "period": "last_7_days",
  "dateRange": {
    "start": "2025-11-01T00:00:00.000Z",
    "end": "2025-11-07T23:59:59.999Z"
  },
  "total_403_errors": 450,
  "403_rate": 4.2,
  "most_blocked_features": [
    { "feature": "AI Analysis", "count": 120 },
    { "feature": "ArkaneMatch Chat", "count": 85 },
    { "feature": "AutoScout", "count": 67 }
  ],
  "conversions": {
    "free_to_gold": 12,
    "total": 15,
    "conversion_rate": 14.5,
    "revenue_generated": 749.85,
    "by_tier": {
      "FREE_to_GOLD": 12,
      "FREE_to_PRO": 2,
      "BASIC_to_GOLD": 1
    },
    "by_source": [
      { "source": "ai_features_403", "count": 10, "revenue": 499.90 },
      { "source": "upgrade_modal", "count": 5, "revenue": 249.95 }
    ]
  },
  "upgrade_modal": {
    "shown": 83,
    "dismissed": 71,
    "cta_clicked": 15,
    "ctr": 18.1,
    "dismiss_rate": 85.5
  },
  "recommendations": [
    "MODERATE PERFORMANCE: Metrics are within acceptable ranges but there is room for improvement."
  ]
}
```

#### 2. 403 Rate Only
```
GET /analytics/rbac-metrics/403-rate?startDate=2025-11-01&endDate=2025-11-07
```

#### 3. Conversion Rate Only
```
GET /analytics/rbac-metrics/conversion-rate?startDate=2025-11-01&endDate=2025-11-07
```

### Sentry Dashboard

1. Go to Sentry → Issues
2. Filter by tag: `event_type:subscription.tier_blocked`
3. View custom fingerprints: `403-tier-blocked`

**Available tags:**
- `event_type`: Always `subscription.tier_blocked`
- `feature`: Feature name (e.g., "AI Analysis")
- `required_tier`: Required subscription tier
- `user_tier`: User's current tier
- `endpoint`: API endpoint that was blocked

---

## Metrics Definitions

### 1. 403 Error Rate
**Definition**: Percentage of all requests that result in a 403 error due to insufficient tier.

**Calculation**:
```
403_rate = (total_403_errors / estimated_total_requests) × 100
```

**Interpretation**:
- **< 5%**: Healthy - most users have appropriate access
- **5-10%**: Moderate - some UX friction
- **> 10%**: High - investigate tier requirements or improve messaging

---

### 2. Conversion Rate
**Definition**: Percentage of users who encounter a 403 error and subsequently upgrade.

**Calculation**:
```
conversion_rate = (total_conversions / total_403_errors) × 100
```

**Interpretation**:
- **< 5%**: Low - review pricing/value proposition
- **5-15%**: Moderate - acceptable but improvable
- **> 15%**: High - excellent conversion funnel

---

### 3. Upgrade Modal CTR
**Definition**: Click-through rate on upgrade modal CTA buttons.

**Calculation**:
```
ctr = (cta_clicked / modals_shown) × 100
```

**Interpretation**:
- **< 10%**: Low - improve modal design/messaging
- **10-20%**: Moderate - acceptable performance
- **> 20%**: High - excellent engagement

---

### 4. Revenue Generated
**Definition**: Total revenue from subscription upgrades tracked in the monitoring period.

**Pricing**:
- FREE → BASIC: €19.99/month
- FREE → PRO: €39.99/month
- FREE → GOLD: €49.99/month
- FREE → ENTERPRISE: €99.99/month

---

### 5. Most Blocked Features
**Definition**: Features that users most frequently attempt to access without proper tier.

**Use Cases**:
- Identify features with high demand
- Adjust tier requirements if too restrictive
- Prioritize marketing messaging around popular features

---

## Alert Thresholds

### Configured Thresholds

| Metric | Threshold | Severity | Action |
|--------|-----------|----------|--------|
| 403 Rate | > 10% | High | Immediate investigation - possible UX issue |
| Conversion Rate | < 5% | Medium | Review pricing/messaging within 24h |
| Modal CTR | < 10% | Medium | A/B test new modal designs |

### Alert Cooldown

- **Duration**: 60 minutes
- **Purpose**: Prevent alert spam
- **Override**: Manual checks can bypass cooldown

### Alert Channels

Currently configured:
1. **Sentry** (all alerts)
2. **Application logs** (daily summaries)

Future integrations:
- Slack webhooks
- Email notifications
- PagerDuty (for high-severity)

---

## Troubleshooting

### High 403 Rate (> 10%)

**Possible Causes:**
1. Feature is too restrictive (should be lower tier)
2. Free tier is too limited
3. Users are confused about tier benefits
4. Pricing page is unclear

**Actions:**
1. Review most blocked features
2. Check if users are repeatedly hitting same endpoint
3. Survey blocked users for feedback
4. Consider temporary tier requirement relaxation
5. Improve feature discovery for paid tiers

---

### Low Conversion Rate (< 5%)

**Possible Causes:**
1. Price point is too high
2. Value proposition is unclear
3. Upgrade flow has friction
4. Modal messaging is poor
5. Timing of modal is wrong

**Actions:**
1. A/B test different price points
2. Add social proof to modal
3. Simplify checkout flow
4. Highlight specific feature benefits
5. Show ROI calculator

---

### Low Modal CTR (< 10%)

**Possible Causes:**
1. Modal design is unappealing
2. CTA text is weak
3. Users don't understand benefit
4. Modal appears too frequently
5. Wrong timing (user not engaged)

**Actions:**
1. A/B test modal designs
2. Test different CTA copy
3. Show feature comparison table
4. Reduce modal frequency
5. Only show modal for high-value features

---

## Success Criteria

### Healthy Metrics (Target State)

| Metric | Target | Rationale |
|--------|--------|-----------|
| 403 Rate | < 5% | Minimal UX friction, most users satisfied with access |
| Conversion Rate | > 15% | Strong value proposition, effective messaging |
| Modal CTR | > 20% | High engagement, clear call-to-action |
| Revenue Growth | +10% MoM | Sustainable growth from tier conversions |

### Red Flags

⚠️ **Immediate Action Required:**
- 403 rate > 15%
- Conversion rate < 3%
- Modal CTR < 5%
- Revenue drop > 20%

### Monitoring Cadence

- **Real-time**: Sentry dashboard for individual errors
- **Hourly**: Automated alert checks
- **Daily**: Morning summary email
- **Weekly**: Team review of trends
- **Monthly**: Strategic review with recommendations

---

## API Reference

### Track Feature Blocked
```typescript
await analyticsService.trackFeatureBlocked(
  userId: string,
  feature: string,
  requiredTier: string
);
```

### Track Upgrade Modal Shown
```typescript
const modalId = await analyticsService.trackUpgradeModalShown(
  userId: string,
  feature: string
);
```

### Track Modal Dismissed
```typescript
await analyticsService.trackUpgradeModalDismissed(
  modalId: string,
  timeShownSeconds: number
);
```

### Track Modal CTA Clicked
```typescript
await analyticsService.trackUpgradeModalCtaClicked(
  modalId: string
);
```

### Track Upgrade Conversion
```typescript
await analyticsService.trackUpgradeConversion(
  userId: string,
  fromTier: string,
  toTier: string,
  source?: string,
  feature?: string,
  revenue?: number
);
```

---

## Frontend Integration Example

```typescript
// When 403 received
try {
  await api.getAiAnalysis(playerId);
} catch (error) {
  if (error.response?.status === 403) {
    // Track blocked event
    analytics.track('feature_blocked', {
      feature: 'AI Analysis',
      required_tier: 'GOLD',
      user_tier: currentTier,
    });

    // Show upgrade modal
    const modalId = await api.trackUpgradeModalShown(userId, 'AI Analysis');
    const modalStartTime = Date.now();

    showUpgradeModal({
      feature: 'AI Analysis',
      requiredTier: 'GOLD',
      onDismiss: async () => {
        const timeShown = Math.floor((Date.now() - modalStartTime) / 1000);
        await api.trackUpgradeModalDismissed(modalId, timeShown);
      },
      onCtaClick: async () => {
        await api.trackUpgradeModalCtaClicked(modalId);
        router.push('/pricing?feature=ai-analysis');
      },
    });
  }
}

// When upgrade successful
onUpgradeSuccess(async (subscription) => {
  await api.trackUpgradeConversion(
    userId,
    oldTier,
    subscription.tier,
    'ai_features_403',
    'AI Analysis',
    subscription.amount
  );
});
```

---

## Database Schema

### rbac_events
```sql
CREATE TABLE rbac_events (
  id           TEXT PRIMARY KEY,
  userId       TEXT NOT NULL,
  eventType    TEXT NOT NULL,  -- FEATURE_BLOCKED
  feature      TEXT NOT NULL,
  endpoint     TEXT NOT NULL,
  method       TEXT NOT NULL,
  currentTier  TEXT NOT NULL,
  requiredTier TEXT NOT NULL,
  userJourney  TEXT,           -- JSON of last 5 pages
  ipAddress    TEXT,
  userAgent    TEXT,
  timestamp    TIMESTAMP DEFAULT NOW()
);
```

### upgrade_modals
```sql
CREATE TABLE upgrade_modals (
  id                TEXT PRIMARY KEY,
  userId            TEXT NOT NULL,
  feature           TEXT NOT NULL,
  trigger           TEXT DEFAULT '403_error',
  shownAt           TIMESTAMP DEFAULT NOW(),
  dismissedAt       TIMESTAMP,
  ctaClickedAt      TIMESTAMP,
  timeShownSeconds  INTEGER
);
```

### subscription_conversions
```sql
CREATE TABLE subscription_conversions (
  id          TEXT PRIMARY KEY,
  userId      TEXT NOT NULL,
  fromTier    TEXT NOT NULL,
  toTier      TEXT NOT NULL,
  source      TEXT NOT NULL,  -- 'ai_features_403', 'upgrade_modal', etc.
  feature     TEXT,
  revenue     DECIMAL NOT NULL,
  currency    TEXT DEFAULT 'EUR',
  convertedAt TIMESTAMP DEFAULT NOW()
);
```

---

## Cron Jobs

### Hourly Metrics Check
- **Schedule**: Every hour (`:00`)
- **Purpose**: Check for threshold violations
- **Alerts**: Sent to Sentry if thresholds exceeded

### Daily Summary
- **Schedule**: 9:00 AM daily
- **Purpose**: Comprehensive metrics snapshot
- **Output**: Logged to console, sent to configured channels

---

## Best Practices

1. **Always track conversions** when users upgrade
2. **Include source parameter** to attribute conversions correctly
3. **Track modal interactions** even if user doesn't convert
4. **Monitor user journey** to understand context
5. **Review metrics weekly** to catch trends early
6. **A/B test improvements** based on data
7. **Document changes** that affect conversion rates

---

## Support

For questions or issues with the monitoring system:
- Check Sentry for error details
- Review application logs for daily summaries
- Contact: devops@appfoot.com
- Slack: #monitoring-alerts

---

**Last Updated**: November 7, 2025
**Version**: 1.0.0
