/**
 * Logger Utility for Mobile App
 * Provides centralized error tracking and logging
 * Can be extended with Sentry or other error tracking services
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = __DEV__;
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error | any, context?: LogContext): void {
    this.log('error', message, { ...context, error: this.serializeError(error) });

    // In production, send to error tracking service (e.g., Sentry)
    if (!this.isDevelopment) {
      this.sendToErrorTracking(message, error, context);
    }
  }

  /**
   * Log a debug message (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log('debug', message, context);
    }
  }

  /**
   * Track an API call
   */
  apiCall(
    endpoint: string,
    method: string,
    duration: number,
    status: number,
    context?: LogContext
  ): void {
    const level: LogLevel = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';

    this.log(level, `API ${method} ${endpoint}`, {
      ...context,
      duration,
      status,
      type: 'api_call',
    });
  }

  /**
   * Track a navigation event
   */
  navigation(from: string, to: string): void {
    this.debug(`Navigation: ${from} → ${to}`, { type: 'navigation' });
  }

  /**
   * Track a user action
   */
  userAction(action: string, context?: LogContext): void {
    this.info(`User action: ${action}`, { ...context, type: 'user_action' });
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...context,
    };

    // Console logging with appropriate method
    switch (level) {
      case 'error':
        console.error(`[${timestamp}] ERROR:`, message, context);
        break;
      case 'warn':
        console.warn(`[${timestamp}] WARN:`, message, context);
        break;
      case 'debug':
        console.debug(`[${timestamp}] DEBUG:`, message, context);
        break;
      case 'info':
      default:
        console.log(`[${timestamp}] INFO:`, message, context);
        break;
    }

    // Store logs for later analysis (optional)
    this.storeLog(logData);
  }

  /**
   * Serialize error object for logging
   */
  private serializeError(error?: Error | any): any {
    if (!error) return null;

    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    // Handle axios errors
    if (error.response) {
      return {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
        },
      };
    }

    // Handle other error types
    return typeof error === 'object' ? JSON.stringify(error) : String(error);
  }

  /**
   * Send error to external error tracking service
   * TODO: Integrate with Sentry or similar service
   */
  private sendToErrorTracking(message: string, error?: Error | any, context?: LogContext): void {
    // Placeholder for Sentry or other error tracking integration
    // Example:
    // Sentry.captureException(error, {
    //   tags: { ...context },
    //   extra: { message },
    // });

    // For now, just log that we would send this to tracking
    if (__DEV__) {
      console.log('[ERROR TRACKING]', message, error, context);
    }
  }

  /**
   * Store log locally for later retrieval
   * Can be used to send logs on next app start or on demand
   */
  private storeLog(logData: any): void {
    // TODO: Implement local storage of logs
    // Could use AsyncStorage or a SQLite database
    // For now, this is a no-op
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const logError = (message: string, error?: Error | any, context?: LogContext) =>
  logger.error(message, error, context);

export const logWarn = (message: string, context?: LogContext) =>
  logger.warn(message, context);

export const logInfo = (message: string, context?: LogContext) =>
  logger.info(message, context);

export const logDebug = (message: string, context?: LogContext) =>
  logger.debug(message, context);

export const logApiCall = (endpoint: string, method: string, duration: number, status: number, context?: LogContext) =>
  logger.apiCall(endpoint, method, duration, status, context);

export default logger;
