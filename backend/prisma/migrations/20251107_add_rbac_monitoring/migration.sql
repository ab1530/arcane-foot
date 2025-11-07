-- Create RBAC Monitoring Tables
-- These tables track 403 errors, upgrade modals, and subscription conversions

-- Create RbacEventType enum
CREATE TYPE "RbacEventType" AS ENUM ('FEATURE_BLOCKED', 'UPGRADE_MODAL_SHOWN', 'UPGRADE_MODAL_DISMISSED', 'UPGRADE_MODAL_CTA_CLICKED', 'SUBSCRIPTION_UPGRADED');

-- Create rbac_events table
CREATE TABLE "rbac_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" "RbacEventType" NOT NULL,
    "feature" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "currentTier" TEXT NOT NULL,
    "requiredTier" TEXT NOT NULL,
    "userJourney" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rbac_events_pkey" PRIMARY KEY ("id")
);

-- Create indexes for rbac_events
CREATE INDEX "rbac_events_userId_idx" ON "rbac_events"("userId");
CREATE INDEX "rbac_events_eventType_idx" ON "rbac_events"("eventType");
CREATE INDEX "rbac_events_feature_idx" ON "rbac_events"("feature");
CREATE INDEX "rbac_events_timestamp_idx" ON "rbac_events"("timestamp");
CREATE INDEX "rbac_events_currentTier_idx" ON "rbac_events"("currentTier");
CREATE INDEX "rbac_events_requiredTier_idx" ON "rbac_events"("requiredTier");

-- Create upgrade_modals table
CREATE TABLE "upgrade_modals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "trigger" TEXT NOT NULL DEFAULT '403_error',
    "shownAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dismissedAt" TIMESTAMP(3),
    "ctaClickedAt" TIMESTAMP(3),
    "timeShownSeconds" INTEGER,

    CONSTRAINT "upgrade_modals_pkey" PRIMARY KEY ("id")
);

-- Create indexes for upgrade_modals
CREATE INDEX "upgrade_modals_userId_idx" ON "upgrade_modals"("userId");
CREATE INDEX "upgrade_modals_feature_idx" ON "upgrade_modals"("feature");
CREATE INDEX "upgrade_modals_shownAt_idx" ON "upgrade_modals"("shownAt");

-- Create subscription_conversions table
CREATE TABLE "subscription_conversions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromTier" TEXT NOT NULL,
    "toTier" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "feature" TEXT,
    "revenue" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "convertedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_conversions_pkey" PRIMARY KEY ("id")
);

-- Create indexes for subscription_conversions
CREATE INDEX "subscription_conversions_userId_idx" ON "subscription_conversions"("userId");
CREATE INDEX "subscription_conversions_fromTier_idx" ON "subscription_conversions"("fromTier");
CREATE INDEX "subscription_conversions_toTier_idx" ON "subscription_conversions"("toTier");
CREATE INDEX "subscription_conversions_source_idx" ON "subscription_conversions"("source");
CREATE INDEX "subscription_conversions_convertedAt_idx" ON "subscription_conversions"("convertedAt");

-- Grant permissions (if needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON "rbac_events" TO your_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON "upgrade_modals" TO your_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON "subscription_conversions" TO your_user;
