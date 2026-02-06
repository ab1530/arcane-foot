/**
 * Global Error Handler
 *
 * Centralized error handling that:
 * - Detects 403 subscription errors
 * - Shows upgrade modal instead of generic error
 * - Tracks feature blocking events for analytics
 * - Integrates with error boundary
 */

import { analytics } from './analytics';
import { handleSubscriptionError, isSubscriptionError } from './api-interceptor';
import { logger } from './logger';

export interface ErrorContext {
  endpoint?: string;
  method?: string;
  userId?: string;
  timestamp?: string;
  component?: string;
  action?: string;
  [key: string]: any;
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logToLogger?: boolean;
  trackAnalytics?: boolean;
  context?: ErrorContext;
}

/**
 * Global error handler for API and application errors
 */
export class ErrorHandler {
  /**
   * Handle any error - API, runtime, or React errors
   */
  static handle(
    error: any,
    options: ErrorHandlerOptions = {}
  ): {
    handled: boolean;
    isSubscriptionError: boolean;
    message: string;
  } {
    const {
      showToast = true,
      logToLogger = true,
      trackAnalytics = true,
      context = {},
    } = options;

    // Extract error details
    const errorMessage = this.extractErrorMessage(error);
    const errorStatus = error?.status || error?.response?.status || 0;

    // Check if it's a subscription error
    const subError = isSubscriptionError(error, context.endpoint);

    if (subError.isSubscriptionError) {
      // Handle subscription error - show upgrade modal
      const currentTier = this.getCurrentTier();
      handleSubscriptionError(error, context.endpoint, currentTier);

      return {
        handled: true,
        isSubscriptionError: true,
        message: subError.message || errorMessage,
      };
    }

    // Handle other errors
    this.handleGenericError(error, errorMessage, errorStatus, {
      showToast,
      logToLogger,
      trackAnalytics,
      context,
    });

    return {
      handled: true,
      isSubscriptionError: false,
      message: errorMessage,
    };
  }

  /**
   * Handle API errors specifically
   */
  static handleApiError(
    error: any,
    endpoint: string,
    method: string = 'GET',
    options: Omit<ErrorHandlerOptions, 'context'> = {}
  ) {
    return this.handle(error, {
      ...options,
      context: {
        endpoint,
        method,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Handle React component errors
   */
  static handleComponentError(
    error: Error,
    errorInfo: React.ErrorInfo,
    componentName?: string
  ) {
    const context: ErrorContext = {
      component: componentName,
      timestamp: new Date().toISOString(),
    };

    logger.error('Component error', error, {
      scope: 'UI',
      componentName,
      componentStack: errorInfo.componentStack,
    });

    // Track in analytics
    analytics.error('component_error', error.message, componentName || 'unknown');

    return {
      handled: true,
      isSubscriptionError: false,
      message: error.message,
    };
  }

  /**
   * Extract error message from various error formats
   */
  private static extractErrorMessage(error: any): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error?.message) {
      return error.message;
    }

    if (error?.error) {
      return typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
    }

    if (error?.response?.data?.message) {
      return error.response.data.message;
    }

    if (error?.response?.data?.error) {
      return error.response.data.error;
    }

    return 'Une erreur est survenue';
  }

  /**
   * Get current subscription tier from localStorage
   */
  private static getCurrentTier(): string {
    if (typeof window === 'undefined') {
      return 'FREE';
    }

    try {
      const userStr = localStorage.getItem('arcane_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.subscription?.tier || 'FREE';
      }
    } catch {
      // Ignore parsing errors
    }

    return 'FREE';
  }

  /**
   * Handle generic (non-subscription) errors
   */
  private static handleGenericError(
    error: any,
    errorMessage: string,
    errorStatus: number,
    options: ErrorHandlerOptions
  ) {
    const { logToLogger, trackAnalytics, context } = options;

    if (logToLogger) {
      const payload = {
        scope: 'ErrorHandler',
        errorStatus,
        errorMessage,
        error,
        endpoint: context?.endpoint,
        method: context?.method,
        context,
      };
      if (errorStatus >= 500) {
        logger.error('Unhandled error', error, payload);
      } else {
        logger.warn('Unhandled error', payload);
      }
    }

    // Track in analytics
    if (trackAnalytics) {
      analytics.error(
        this.categorizeError(errorStatus),
        errorMessage,
        context?.endpoint || 'unknown'
      );
    }
  }

  /**
   * Categorize error by status code
   */
  private static categorizeError(status: number): string {
    if (status === 0) return 'network_error';
    if (status === 400) return 'validation_error';
    if (status === 401) return 'auth_error';
    if (status === 403) return 'forbidden_error';
    if (status === 404) return 'not_found_error';
    if (status >= 500) return 'server_error';
    return 'unknown_error';
  }

  /**
   * Create a user-friendly error message
   */
  static getUserFriendlyMessage(error: any): string {
    const status = error?.status || error?.response?.status || 0;

    switch (status) {
      case 0:
        return 'Erreur de connexion. Vérifiez votre connexion internet.';
      case 400:
        return 'Données invalides. Veuillez vérifier votre saisie.';
      case 401:
        return 'Vous devez être connecté pour accéder à cette fonctionnalité.';
      case 403:
        return 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
      case 404:
        return 'Ressource non trouvée.';
      case 429:
        return 'Trop de requêtes. Veuillez réessayer dans quelques instants.';
      case 500:
      case 502:
      case 503:
        return 'Erreur serveur. Nos équipes ont été notifiées.';
      default:
        return this.extractErrorMessage(error);
    }
  }
}

/**
 * React Hook for error handling
 */
export function useErrorHandler() {
  const handleError = (error: any, context?: ErrorContext) => {
    return ErrorHandler.handle(error, {
      showToast: true,
      logToLogger: true,
      trackAnalytics: true,
      context,
    });
  };

  const handleApiError = (error: any, endpoint: string, method?: string) => {
    return ErrorHandler.handleApiError(error, endpoint, method, {
      showToast: true,
      logToLogger: true,
      trackAnalytics: true,
    });
  };

  return {
    handleError,
    handleApiError,
    getUserFriendlyMessage: ErrorHandler.getUserFriendlyMessage,
  };
}

export default ErrorHandler;
