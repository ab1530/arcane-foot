# RBAC Monitoring System - Setup Guide

Quick setup guide for the comprehensive 403 error and subscription conversion tracking system.

## Quick Start

### 1. Run Database Migration

Apply the RBAC monitoring tables to your database:

```bash
# Option A: Run the SQL migration directly
psql $DATABASE_URL -f prisma/migrations/add_rbac_monitoring.sql

# Option B: Let Prisma handle it (if no drift)
npx prisma migrate dev --name add_rbac_monitoring_tables

# Verify tables were created
npx prisma db pull
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Enable Sentry Interceptor

Add to your main application module:

```typescript
// src/app.module.ts
import { APP_INTERCEPTOR } from '@nestjs/core';
import { SentryInterceptor } from './common/interceptors/sentry.interceptor';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: SentryInterceptor,
    },
  ],
})
export class AppModule {}
```

### 4. Verify Setup

Test the monitoring system:

```bash
# Generate test data
npx ts-node src/scripts/simulate-rbac-events.ts

# Check the dashboard
curl http://localhost:3000/analytics/rbac-metrics?days=7
```

---

## Components Overview

### Files Created

#### Backend (NestJS)

1. **Sentry Interceptor**
   - `/backend/src/common/interceptors/sentry.interceptor.ts`
   - Captures all 403 errors with context
   - Tracks user journey
   - Sends to Sentry and database

2. **Analytics Service Enhancement**
   - `/backend/src/modules/analytics/analytics.service.ts`
   - Added RBAC monitoring methods:
     - `trackFeatureBlocked()`
     - `trackUpgradeModalShown()`
     - `trackUpgradeModalDismissed()`
     - `trackUpgradeModalCtaClicked()`
     - `trackUpgradeConversion()`
     - `get403Rate()`
     - `getConversionRate()`
     - `getRbacMetrics()`

3. **Alert Service**
   - `/backend/src/modules/analytics/alert.service.ts`
   - Hourly automated checks
   - Threshold-based alerts
   - Daily summary reports

4. **Analytics Controller**
   - `/backend/src/modules/analytics/analytics.controller.ts`
   - New endpoints:
     - `GET /analytics/rbac-metrics`
     - `GET /analytics/rbac-metrics/403-rate`
     - `GET /analytics/rbac-metrics/conversion-rate`

5. **Database Schema**
   - `/backend/prisma/schema.prisma`
   - New tables:
     - `rbac_events`
     - `upgrade_modals`
     - `subscription_conversions`
   - New enum: `RbacEventType`

6. **Test Data Generator**
   - `/backend/src/scripts/simulate-rbac-events.ts`
   - Generates realistic test data
   - Useful for dashboard development

#### Documentation

1. **Comprehensive Guide**
   - `/MONITORING_RBAC_GUIDE.md`
   - Full documentation of metrics, alerts, troubleshooting

2. **Migration SQL**
   - `/backend/prisma/migrations/add_rbac_monitoring.sql`
   - Manual migration for database drift scenarios

---

## API Endpoints

### Get RBAC Dashboard Metrics

```bash
GET /analytics/rbac-metrics?days=7
```

**Response:**
```json
{
  "period": "last_7_days",
  "total_403_errors": 450,
  "403_rate": 4.2,
  "most_blocked_features": [
    { "feature": "AI Analysis", "count": 120 }
  ],
  "conversions": {
    "free_to_gold": 12,
    "conversion_rate": 14.5,
    "revenue_generated": 749.85
  },
  "upgrade_modal": {
    "shown": 83,
    "ctr": 18.1
  },
  "recommendations": [...]
}
```

### Get 403 Rate

```bash
GET /analytics/rbac-metrics/403-rate?startDate=2025-11-01&endDate=2025-11-07
```

### Get Conversion Rate

```bash
GET /analytics/rbac-metrics/conversion-rate?startDate=2025-11-01&endDate=2025-11-07
```

---

## Frontend Integration

### Example: Track 403 Error

```typescript
// When API call returns 403
try {
  await api.getAiAnalysis(playerId);
} catch (error) {
  if (error.response?.status === 403) {
    // Backend automatically tracks via Sentry interceptor
    // Just show the upgrade modal
    showUpgradeModal({
      feature: 'AI Analysis',
      requiredTier: 'GOLD',
    });
  }
}
```

### Example: Track Modal Events

```typescript
// When modal is shown
const modalId = await api.post('/analytics/track-modal', {
  userId,
  feature: 'AI Analysis',
});

// When modal is dismissed
await api.put(`/analytics/track-modal/${modalId}/dismissed`, {
  timeShownSeconds: 15,
});

// When CTA is clicked
await api.put(`/analytics/track-modal/${modalId}/cta-clicked`);
```

### Example: Track Conversion

```typescript
// When user upgrades successfully
await api.post('/analytics/track-conversion', {
  userId,
  fromTier: 'FREE',
  toTier: 'GOLD',
  source: 'ai_features_403',
  feature: 'AI Analysis',
  revenue: 49.99,
});
```

---

## Testing

### Generate Test Data

```bash
# Generate realistic test events for last 7 days
npx ts-node src/scripts/simulate-rbac-events.ts

# Clear existing test data
npx ts-node src/scripts/simulate-rbac-events.ts --clear

# Clear and regenerate
npx ts-node src/scripts/simulate-rbac-events.ts --clear-and-simulate
```

### View Dashboard

```bash
# Last 7 days (default)
curl http://localhost:3000/analytics/rbac-metrics

# Last 30 days
curl http://localhost:3000/analytics/rbac-metrics?days=30

# Specific date range
curl 'http://localhost:3000/analytics/rbac-metrics/403-rate?startDate=2025-11-01&endDate=2025-11-07'
```

---

## Monitoring

### Automated Alerts

Alerts are triggered when:
- **403 rate > 10%**: High priority (possible UX issue)
- **Conversion rate < 5%**: Medium priority (pricing/messaging issue)
- **Modal CTR < 10%**: Medium priority (modal design issue)

### Daily Summary

Every day at 9:00 AM, the system logs a comprehensive summary:
- Total 403 errors
- Top blocked features
- Conversion stats
- Revenue generated
- Recommendations

View logs:
```bash
# Docker
docker logs appfoot-backend | grep "DAILY RBAC METRICS"

# PM2
pm2 logs | grep "DAILY RBAC METRICS"
```

### Sentry Dashboard

1. Go to your Sentry dashboard
2. Filter by tag: `event_type:subscription.tier_blocked`
3. View custom tags:
   - `feature`: Feature name
   - `required_tier`: Required tier
   - `user_tier`: User's current tier
   - `endpoint`: Blocked API endpoint

---

## Success Metrics

### Target KPIs

| Metric | Target | Status |
|--------|--------|--------|
| 403 Rate | < 5% | Healthy |
| Conversion Rate | > 15% | Excellent |
| Modal CTR | > 20% | High engagement |
| Revenue Growth | +10% MoM | Sustainable |

### Health Check

```bash
# Quick health check
curl http://localhost:3000/analytics/rbac-metrics?days=1 | jq '.recommendations'
```

Expected output:
```json
[
  "EXCELLENT PERFORMANCE: All metrics are within healthy ranges."
]
```

---

## Troubleshooting

### Issue: No events being tracked

**Check:**
1. Is Sentry interceptor registered in AppModule?
2. Is SubscriptionTierGuard throwing ForbiddenException?
3. Are Prisma tables created?

```bash
# Verify tables exist
psql $DATABASE_URL -c "\dt rbac_*"
```

### Issue: Dashboard returns empty data

**Solution:**
```bash
# Generate test data
npx ts-node src/scripts/simulate-rbac-events.ts

# Verify data was inserted
psql $DATABASE_URL -c "SELECT COUNT(*) FROM rbac_events;"
```

### Issue: Alerts not firing

**Check:**
1. Is ScheduleModule imported in AppModule?
2. Are cron jobs running?

```typescript
// app.module.ts
@Module({
  imports: [
    ScheduleModule.forRoot(), // Required for cron jobs
    AnalyticsModule,
  ],
})
```

---

## Performance Considerations

### Database Indexing

All key fields are indexed:
- `rbac_events`: userId, eventType, feature, timestamp
- `upgrade_modals`: userId, feature, shownAt
- `subscription_conversions`: userId, fromTier, toTier, source, convertedAt

### Query Optimization

The dashboard endpoint runs 7 optimized queries in parallel:
- Total 403 events count
- Most blocked features (grouped)
- Modal stats (batch fetch)
- Conversions (batch fetch)
- Conversions by source (aggregated)
- Total revenue (aggregated)
- 403 rate calculation

Typical response time: **< 200ms**

### Data Retention

Consider implementing data retention policies:

```sql
-- Archive old events (older than 90 days)
DELETE FROM rbac_events WHERE timestamp < NOW() - INTERVAL '90 days';
DELETE FROM upgrade_modals WHERE "shownAt" < NOW() - INTERVAL '90 days';

-- Keep conversions indefinitely (for revenue tracking)
```

---

## Next Steps

### Phase 1: Basic Monitoring (Complete)
- [x] Track 403 errors
- [x] Track modal interactions
- [x] Track conversions
- [x] Dashboard endpoint
- [x] Automated alerts

### Phase 2: Enhanced Analytics (Future)
- [ ] Real-time dashboard UI
- [ ] Email notifications
- [ ] Slack integration
- [ ] A/B testing framework
- [ ] Cohort analysis
- [ ] Revenue attribution

### Phase 3: Optimization (Future)
- [ ] ML-based conversion prediction
- [ ] Dynamic tier pricing
- [ ] Personalized upgrade messaging
- [ ] Feature usage prediction
- [ ] Churn risk scoring

---

## Support

For issues or questions:
- Documentation: `/MONITORING_RBAC_GUIDE.md`
- Sentry: Check tag `event_type:subscription.tier_blocked`
- Logs: Search for "RBAC" or "403"

---

**Version**: 1.0.0
**Last Updated**: November 7, 2025
**Status**: Production Ready
