# RBAC Monitoring System - Implementation Checklist

Quick checklist to get the monitoring system up and running.

---

## Pre-Deployment Checklist

### 1. Database Setup
- [ ] Run migration: `psql $DATABASE_URL -f backend/prisma/migrations/add_rbac_monitoring.sql`
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Verify tables exist: `psql $DATABASE_URL -c "\dt rbac_*"`

### 2. Backend Configuration
- [ ] Add Sentry interceptor to AppModule (see below)
- [ ] Enable ScheduleModule in AppModule (see below)
- [ ] Verify AnalyticsModule is imported
- [ ] Check Sentry DSN is configured in .env

### 3. Testing
- [ ] Generate test data: `npx ts-node src/scripts/simulate-rbac-events.ts`
- [ ] Test dashboard: `curl http://localhost:3000/analytics/rbac-metrics?days=7`
- [ ] Verify Sentry receives events (trigger a 403 error)
- [ ] Check logs for hourly/daily summaries

---

## Code Changes Required

### 1. Enable Sentry Interceptor

File: `backend/src/app.module.ts`

```typescript
import { APP_INTERCEPTOR } from '@nestjs/core';
import { SentryInterceptor } from './common/interceptors/sentry.interceptor';

@Module({
  imports: [
    // ... existing imports
    PrismaModule,
    AnalyticsModule,
  ],
  providers: [
    // Add this:
    {
      provide: APP_INTERCEPTOR,
      useClass: SentryInterceptor,
    },
  ],
})
export class AppModule {}
```

### 2. Enable Cron Jobs (for alerts)

File: `backend/src/app.module.ts`

```typescript
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    // Add this:
    ScheduleModule.forRoot(),

    // ... existing imports
    AnalyticsModule,
  ],
})
export class AppModule {}
```

---

## Post-Deployment Checklist

### 1. Verify Tracking Works
- [ ] Make API call that returns 403 (e.g., AI feature as FREE user)
- [ ] Check Sentry for event with tag `event_type:subscription.tier_blocked`
- [ ] Check database: `SELECT COUNT(*) FROM rbac_events;`

### 2. Verify Dashboard Works
- [ ] Call: `GET /analytics/rbac-metrics?days=7`
- [ ] Should return metrics with test data
- [ ] Verify recommendations are generated

### 3. Verify Alerts Work
- [ ] Wait for hourly cron (or trigger manually)
- [ ] Check logs for: "Running hourly RBAC metrics check"
- [ ] Wait for 9:00 AM for daily summary
- [ ] Check logs for: "DAILY RBAC METRICS SUMMARY"

---

## Frontend Integration Checklist

### 1. Handle 403 Errors
- [ ] Catch 403 errors from API calls
- [ ] Show upgrade modal on 403
- [ ] Backend tracks automatically

### 2. Track Modal Events
- [ ] Call `trackUpgradeModalShown()` when modal opens
- [ ] Call `trackUpgradeModalDismissed()` when modal closes
- [ ] Call `trackUpgradeModalCtaClicked()` when user clicks CTA
- [ ] Track time modal was shown

### 3. Track Conversions
- [ ] Call `trackUpgradeConversion()` after successful upgrade
- [ ] Include source, feature, and revenue
- [ ] Link to 403 event that triggered upgrade

---

## Monitoring Checklist

### Daily
- [ ] Review 403 rate (target: < 5%)
- [ ] Review conversion rate (target: > 15%)
- [ ] Review modal CTR (target: > 20%)
- [ ] Check for alerts in logs

### Weekly
- [ ] Review most blocked features
- [ ] Analyze conversion sources
- [ ] Review revenue trends
- [ ] Act on recommendations

### Monthly
- [ ] Strategic review with team
- [ ] Compare to previous month
- [ ] Identify optimization opportunities
- [ ] Plan A/B tests

---

## Health Check Commands

```bash
# 1. Check database tables exist
psql $DATABASE_URL -c "SELECT COUNT(*) FROM rbac_events;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM upgrade_modals;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM subscription_conversions;"

# 2. Generate test data
cd backend
npx ts-node src/scripts/simulate-rbac-events.ts

# 3. View dashboard
curl http://localhost:3000/analytics/rbac-metrics?days=7

# 4. Check specific metrics
curl http://localhost:3000/analytics/rbac-metrics/403-rate
curl http://localhost:3000/analytics/rbac-metrics/conversion-rate

# 5. View logs
docker logs appfoot-backend | grep "RBAC"
docker logs appfoot-backend | grep "403"
```

---

## Troubleshooting Checklist

### No events tracked
- [ ] Sentry interceptor registered in AppModule?
- [ ] SubscriptionTierGuard throwing ForbiddenException?
- [ ] Database tables created?
- [ ] Prisma client generated?

### Dashboard returns empty
- [ ] Test data generated?
- [ ] Date range correct?
- [ ] Database has events?

### Alerts not firing
- [ ] ScheduleModule imported?
- [ ] AlertService in providers?
- [ ] Cron jobs running? (check logs)
- [ ] Threshold exceeded?

---

## Success Criteria

System is working correctly when:

- [x] 403 errors appear in Sentry with custom tags
- [x] Dashboard returns metrics
- [x] Hourly checks run (check logs)
- [x] Daily summaries generated (9:00 AM)
- [x] Alerts fire when thresholds exceeded
- [ ] Frontend tracks modal events
- [ ] Conversions are tracked end-to-end

---

## Quick Reference

### API Endpoints
```
GET /analytics/rbac-metrics?days=7
GET /analytics/rbac-metrics/403-rate?startDate=...&endDate=...
GET /analytics/rbac-metrics/conversion-rate?startDate=...&endDate=...
```

### Sentry Tags
- `event_type`: `subscription.tier_blocked`
- `feature`: Feature name
- `required_tier`: Required tier
- `user_tier`: User's current tier

### Alert Thresholds
- 403 rate > 10% → High priority
- Conversion rate < 5% → Medium priority
- Modal CTR < 10% → Medium priority

### Target KPIs
- 403 rate: < 5%
- Conversion rate: > 15%
- Modal CTR: > 20%
- Revenue growth: +10% MoM

---

## Documentation

- **Setup Guide**: `/backend/RBAC_MONITORING_SETUP.md`
- **Comprehensive Guide**: `/MONITORING_RBAC_GUIDE.md`
- **Delivery Summary**: `/RBAC_MONITORING_DELIVERY.md`
- **This Checklist**: `/RBAC_MONITORING_CHECKLIST.md`

---

**Last Updated**: November 7, 2025
**Version**: 1.0.0
