import { logger } from "@/lib/logger";

// Analytics Event Types
export type AnalyticsEvent =
  | { type: 'page_view'; page: string; referrer?: string }
  | { type: 'button_click'; label: string; location: string }
  | { type: 'form_submit'; formName: string; success: boolean }
  | { type: 'api_call'; endpoint: string; method: string; duration: number; status: number }
  | { type: 'search'; query: string; resultsCount: number }
  | { type: 'feature_usage'; feature: string; action: string }
  | { type: 'error'; errorType: string; message: string; page: string }
  | { type: 'performance'; metric: string; value: number; page: string }
  | { type: 'subscription'; action: 'view_pricing' | 'click_upgrade' | 'complete_purchase'; tier?: string }
  | { type: 'player_interaction'; action: 'view' | 'search' | 'filter' | 'export'; playerId?: string }
  | { type: 'report_interaction'; action: 'create' | 'edit' | 'delete' | 'export'; reportId?: string }
  | { type: 'camp_interaction'; action: 'view' | 'register' | 'payment'; campId?: string };

// User Properties
interface UserProperties {
  userId?: string;
  email?: string;
  tier?: string;
  role?: string;
  organizationId?: string;
}

class Analytics {
  private isInitialized = false;
  private queue: AnalyticsEvent[] = [];

  initialize() {
    if (this.isInitialized) return;

    this.isInitialized = true;

    // Process queued events
    this.queue.forEach(event => this.track(event));
    this.queue = [];

    // Track Web Vitals automatically
    if (typeof window !== 'undefined') {
      this.trackWebVitals();
    }
  }

  identify(userId: string, properties?: UserProperties) {
    logger.setContext({
      userId,
      email: properties?.email,
      tier: properties?.tier,
      role: properties?.role,
      organizationId: properties?.organizationId,
    });

    console.log('[Analytics] User identified:', userId);
  }

  track(event: AnalyticsEvent) {
    if (!this.isInitialized) {
      this.queue.push(event);
      return;
    }

    logger.debug('Analytics event', {
      scope: 'Analytics',
      event,
    });

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', event);
    }

    // Here you would also send to your analytics platform (Google Analytics, Mixpanel, etc.)
    // Example: window.gtag?.('event', event.type, event);
  }

  // Track page views
  pageView(page: string, referrer?: string) {
    this.track({ type: 'page_view', page, referrer });
  }

  // Track button clicks
  buttonClick(label: string, location: string) {
    this.track({ type: 'button_click', label, location });
  }

  // Track form submissions
  formSubmit(formName: string, success: boolean) {
    this.track({ type: 'form_submit', formName, success });
  }

  // Track API calls with performance
  apiCall(endpoint: string, method: string, duration: number, status: number) {
    this.track({ type: 'api_call', endpoint, method, duration, status });
  }

  // Track search queries
  search(query: string, resultsCount: number) {
    this.track({ type: 'search', query, resultsCount });
  }

  // Track feature usage
  featureUsage(feature: string, action: string) {
    this.track({ type: 'feature_usage', feature, action });
  }

  // Track errors
  error(errorType: string, message: string, page: string) {
    this.track({ type: 'error', errorType, message, page });
    logger.warn('Analytics error', {
      scope: 'Analytics',
      errorType,
      message,
      page,
    });
  }

  // Track performance metrics
  performance(metric: string, value: number, page: string) {
    this.track({ type: 'performance', metric, value, page });
  }

  // Track Web Vitals (Core Web Vitals)
  private trackWebVitals() {
    if ('web-vital' in window || typeof window.PerformanceObserver !== 'undefined') {
      // Track FCP (First Contentful Paint)
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.performance('FCP', entry.startTime, window.location.pathname);
          }
        }
      }).observe({ entryTypes: ['paint'] });

      // Track LCP (Largest Contentful Paint)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.performance('LCP', (lastEntry as any).renderTime || (lastEntry as any).loadTime, window.location.pathname);
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // Track FID (First Input Delay)
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as any;
          this.performance('FID', fidEntry.processingStart - fidEntry.startTime, window.location.pathname);
        }
      }).observe({ entryTypes: ['first-input'] });

      // Track CLS (Cumulative Layout Shift)
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            this.performance('CLS', clsValue, window.location.pathname);
          }
        }
      }).observe({ entryTypes: ['layout-shift'] });
    }
  }

  // Clear user data (on logout)
  reset() {
    logger.clearContext(['userId', 'email', 'tier', 'role', 'organizationId']);
    console.log('[Analytics] User data cleared');
  }
}

// Singleton instance
export const analytics = new Analytics();

// Initialize on client side
if (typeof window !== 'undefined') {
  analytics.initialize();
}

// React Hook for easy usage
export function useAnalytics() {
  return {
    track: analytics.track.bind(analytics),
    identify: analytics.identify.bind(analytics),
    pageView: analytics.pageView.bind(analytics),
    buttonClick: analytics.buttonClick.bind(analytics),
    formSubmit: analytics.formSubmit.bind(analytics),
    apiCall: analytics.apiCall.bind(analytics),
    search: analytics.search.bind(analytics),
    featureUsage: analytics.featureUsage.bind(analytics),
    error: analytics.error.bind(analytics),
    performance: analytics.performance.bind(analytics),
    reset: analytics.reset.bind(analytics),
  };
}
