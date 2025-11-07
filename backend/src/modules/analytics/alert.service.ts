import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AnalyticsService } from './analytics.service';
import * as Sentry from '@sentry/nestjs';

/**
 * Alert Service for RBAC Monitoring
 *
 * Monitors RBAC metrics and sends alerts when thresholds are exceeded
 *
 * Alerts:
 * - If 403 rate > 10% → High priority alert
 * - If conversion rate < 5% → Medium priority alert
 * - Daily summary email with metrics snapshot
 */
@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  // Alert thresholds
  private readonly THRESHOLDS = {
    HIGH_403_RATE: 10, // percentage
    LOW_CONVERSION_RATE: 5, // percentage
    LOW_MODAL_CTR: 10, // percentage
  };

  // Alert cooldown (don't spam alerts)
  private lastAlertTime: Record<string, Date> = {};
  private readonly ALERT_COOLDOWN_MINUTES = 60;

  constructor(private analyticsService: AnalyticsService) {}

  /**
   * Check metrics every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkHourlyMetrics() {
    this.logger.log('Running hourly RBAC metrics check...');

    try {
      const metrics = await this.analyticsService.getRbacMetrics(1); // Last 24 hours

      // Check 403 rate
      if (metrics['403_rate'] > this.THRESHOLDS.HIGH_403_RATE) {
        await this.sendHighRateAlert(metrics['403_rate'], metrics.total_403_errors);
      }

      // Check conversion rate
      if (
        metrics.conversions.conversion_rate < this.THRESHOLDS.LOW_CONVERSION_RATE &&
        metrics.total_403_errors > 10 // Only alert if we have meaningful data
      ) {
        await this.sendLowConversionAlert(
          metrics.conversions.conversion_rate,
          metrics.conversions.total,
          metrics.total_403_errors,
        );
      }

      // Check modal CTR
      if (
        metrics.upgrade_modal.ctr < this.THRESHOLDS.LOW_MODAL_CTR &&
        metrics.upgrade_modal.shown > 10 // Only alert if we have meaningful data
      ) {
        await this.sendLowModalCtrAlert(
          metrics.upgrade_modal.ctr,
          metrics.upgrade_modal.cta_clicked,
          metrics.upgrade_modal.shown,
        );
      }

      this.logger.log('Hourly metrics check completed');
    } catch (error) {
      this.logger.error('Failed to check hourly metrics', error);
      Sentry.captureException(error);
    }
  }

  /**
   * Send daily summary at 9 AM
   */
  @Cron('0 9 * * *')
  async sendDailySummary() {
    this.logger.log('Generating daily RBAC metrics summary...');

    try {
      const metrics = await this.analyticsService.getRbacMetrics(7); // Last 7 days

      const summary = this.formatDailySummary(metrics);

      // Log to console for now (can be extended to email/Slack)
      this.logger.log('=== DAILY RBAC METRICS SUMMARY ===');
      this.logger.log(summary);
      this.logger.log('==================================');

      // Send to Sentry as breadcrumb
      Sentry.addBreadcrumb({
        category: 'rbac.metrics',
        message: 'Daily RBAC metrics summary',
        level: 'info',
        data: metrics,
      });
    } catch (error) {
      this.logger.error('Failed to generate daily summary', error);
      Sentry.captureException(error);
    }
  }

  /**
   * Send high 403 rate alert
   */
  private async sendHighRateAlert(rate: number, total: number) {
    const alertKey = 'high_403_rate';

    if (!this.shouldSendAlert(alertKey)) {
      return;
    }

    const message = `HIGH 403 RATE ALERT: ${rate.toFixed(2)}% of requests are being blocked (${total} total). This may indicate UX issues or overly restrictive tier requirements.`;

    this.logger.warn(message);

    // Send to Sentry
    Sentry.captureMessage(message, {
      level: 'warning',
      tags: {
        alert_type: 'high_403_rate',
        severity: 'high',
      },
      extra: {
        rate,
        total,
        threshold: this.THRESHOLDS.HIGH_403_RATE,
      },
    });

    this.lastAlertTime[alertKey] = new Date();
  }

  /**
   * Send low conversion rate alert
   */
  private async sendLowConversionAlert(
    conversionRate: number,
    conversions: number,
    blockedEvents: number,
  ) {
    const alertKey = 'low_conversion_rate';

    if (!this.shouldSendAlert(alertKey)) {
      return;
    }

    const message = `LOW CONVERSION RATE ALERT: Only ${conversionRate.toFixed(2)}% of blocked users are upgrading (${conversions}/${blockedEvents}). Review pricing and value proposition.`;

    this.logger.warn(message);

    // Send to Sentry
    Sentry.captureMessage(message, {
      level: 'warning',
      tags: {
        alert_type: 'low_conversion_rate',
        severity: 'medium',
      },
      extra: {
        conversionRate,
        conversions,
        blockedEvents,
        threshold: this.THRESHOLDS.LOW_CONVERSION_RATE,
      },
    });

    this.lastAlertTime[alertKey] = new Date();
  }

  /**
   * Send low modal CTR alert
   */
  private async sendLowModalCtrAlert(ctr: number, clicks: number, shown: number) {
    const alertKey = 'low_modal_ctr';

    if (!this.shouldSendAlert(alertKey)) {
      return;
    }

    const message = `LOW MODAL CTR ALERT: Only ${ctr.toFixed(2)}% click-through rate on upgrade modals (${clicks}/${shown}). Consider improving modal design.`;

    this.logger.warn(message);

    // Send to Sentry
    Sentry.captureMessage(message, {
      level: 'warning',
      tags: {
        alert_type: 'low_modal_ctr',
        severity: 'medium',
      },
      extra: {
        ctr,
        clicks,
        shown,
        threshold: this.THRESHOLDS.LOW_MODAL_CTR,
      },
    });

    this.lastAlertTime[alertKey] = new Date();
  }

  /**
   * Check if we should send alert (respects cooldown)
   */
  private shouldSendAlert(alertKey: string): boolean {
    const lastAlert = this.lastAlertTime[alertKey];

    if (!lastAlert) {
      return true;
    }

    const minutesSinceLastAlert =
      (Date.now() - lastAlert.getTime()) / (1000 * 60);

    return minutesSinceLastAlert >= this.ALERT_COOLDOWN_MINUTES;
  }

  /**
   * Format daily summary
   */
  private formatDailySummary(metrics: any): string {
    const lines = [
      `Period: ${metrics.period}`,
      `Date Range: ${new Date(metrics.dateRange.start).toLocaleDateString()} - ${new Date(metrics.dateRange.end).toLocaleDateString()}`,
      '',
      '--- 403 ERRORS ---',
      `Total: ${metrics.total_403_errors}`,
      `Rate: ${metrics['403_rate']}%`,
      '',
      '--- TOP BLOCKED FEATURES ---',
      ...metrics.most_blocked_features
        .slice(0, 5)
        .map((f) => `  ${f.feature}: ${f.count}`),
      '',
      '--- CONVERSIONS ---',
      `Total: ${metrics.conversions.total}`,
      `FREE → GOLD: ${metrics.conversions.free_to_gold}`,
      `Conversion Rate: ${metrics.conversions.conversion_rate}%`,
      `Revenue: €${metrics.conversions.revenue_generated.toFixed(2)}`,
      '',
      '--- UPGRADE MODALS ---',
      `Shown: ${metrics.upgrade_modal.shown}`,
      `CTA Clicked: ${metrics.upgrade_modal.cta_clicked}`,
      `CTR: ${metrics.upgrade_modal.ctr}%`,
      `Dismiss Rate: ${metrics.upgrade_modal.dismiss_rate}%`,
      '',
      '--- RECOMMENDATIONS ---',
      ...metrics.recommendations.map((r) => `  • ${r}`),
    ];

    return lines.join('\n');
  }

  /**
   * Manual check for testing/debugging
   */
  async manualCheck() {
    this.logger.log('Running manual RBAC metrics check...');
    await this.checkHourlyMetrics();
  }

  /**
   * Get alert configuration
   */
  getAlertConfig() {
    return {
      thresholds: this.THRESHOLDS,
      cooldownMinutes: this.ALERT_COOLDOWN_MINUTES,
      lastAlerts: Object.entries(this.lastAlertTime).map(([key, time]) => ({
        alertType: key,
        lastTriggered: time,
        cooldownRemaining: Math.max(
          0,
          this.ALERT_COOLDOWN_MINUTES -
            (Date.now() - time.getTime()) / (1000 * 60),
        ),
      })),
    };
  }
}
