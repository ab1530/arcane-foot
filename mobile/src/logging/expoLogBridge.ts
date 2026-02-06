/**
 * Expo Log Bridge
 *
 * Centralized logging system that:
 * 1. Overrides console.* methods
 * 2. Formats logs for Expo CLI with colors and tags
 * 3. Sends logs to file storage via logger.service
 * 4. Integrates with Sentry (when configured)
 * 5. Provides real-time visibility in Expo terminal
 */

import { logger as loggerService } from '../services/logger.service';

// ANSI color codes for Expo CLI (works in Metro bundler terminal)
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
};

// Tag types for categorization
export type LogTag =
  | 'API'
  | 'NAVIGATION'
  | 'UI'
  | 'AI'
  | 'ERROR'
  | 'AUTH'
  | 'DATA'
  | 'PERFORMANCE'
  | 'USER_ACTION'
  | 'SYSTEM';

interface LogBridgeOptions {
  enableColors?: boolean;
  enableFileLogging?: boolean;
  enableSentry?: boolean;
  timestampFormat?: 'ISO' | 'SHORT' | 'TIME_ONLY';
}

class ExpoLogBridge {
  private static instance: ExpoLogBridge;
  private originalConsole: {
    log: any;
    info: any;
    warn: any;
    error: any;
    debug: any;
  };
  private options: Required<LogBridgeOptions>;
  private isInitialized = false;

  private constructor() {
    // Store original console methods
    this.originalConsole = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console),
    };

    // Default options
    this.options = {
      enableColors: __DEV__,
      enableFileLogging: true,
      enableSentry: false,
      timestampFormat: 'TIME_ONLY',
    };
  }

  public static getInstance(): ExpoLogBridge {
    if (!ExpoLogBridge.instance) {
      ExpoLogBridge.instance = new ExpoLogBridge();
    }
    return ExpoLogBridge.instance;
  }

  /**
   * Initialize the log bridge and override console methods
   */
  public init(options?: Partial<LogBridgeOptions>): void {
    if (this.isInitialized) {
      this.warn('ExpoLogBridge already initialized', 'SYSTEM');
      return;
    }

    // Merge options
    this.options = { ...this.options, ...options };

    // Override console methods
    this.overrideConsoleMethods();

    this.isInitialized = true;
    this.info('Expo Log Bridge initialized', 'SYSTEM', {
      options: this.options,
      platform: __DEV__ ? 'development' : 'production',
    });
  }

  /**
   * Override console methods with enhanced logging
   */
  private overrideConsoleMethods(): void {
    console.log = (...args: any[]) => this.handleLog('INFO', args);
    console.info = (...args: any[]) => this.handleLog('INFO', args);
    console.warn = (...args: any[]) => this.handleLog('WARN', args);
    console.error = (...args: any[]) => this.handleLog('ERROR', args);
    console.debug = (...args: any[]) => this.handleLog('DEBUG', args);
  }

  /**
   * Handle log messages
   */
  private handleLog(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', args: any[]): void {
    const timestamp = this.formatTimestamp();
    const tag = this.extractTag(args);
    const message = this.formatMessage(args);
    const context = this.extractContext(args);

    // Format for Expo CLI
    const formattedLog = this.formatForExpoCLI(level, tag, timestamp, message);

    // Output to original console (visible in Expo CLI)
    this.outputToConsole(level, formattedLog);

    // Write to file storage
    if (this.options.enableFileLogging) {
      this.writeToFile(level, tag, message, context);
    }

    // Send to Sentry (if enabled and error level)
    if (this.options.enableSentry && level === 'ERROR') {
      this.sendToSentry(message, context);
    }
  }

  /**
   * Format log for Expo CLI with colors and structure
   */
  private formatForExpoCLI(
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG',
    tag: LogTag,
    timestamp: string,
    message: string
  ): string {
    if (!this.options.enableColors) {
      return `[${timestamp}] [${level}] [${tag}] ${message}`;
    }

    // Color scheme based on level
    const levelColors = {
      INFO: { bg: COLORS.bgBlue, fg: COLORS.white },
      WARN: { bg: COLORS.bgYellow, fg: COLORS.black },
      ERROR: { bg: COLORS.bgRed, fg: COLORS.white },
      DEBUG: { bg: COLORS.bgMagenta, fg: COLORS.white },
    };

    // Tag colors
    const tagColors: Record<LogTag, string> = {
      API: COLORS.cyan,
      NAVIGATION: COLORS.blue,
      UI: COLORS.green,
      AI: COLORS.magenta,
      ERROR: COLORS.red,
      AUTH: COLORS.yellow,
      DATA: COLORS.cyan,
      PERFORMANCE: COLORS.yellow,
      USER_ACTION: COLORS.green,
      SYSTEM: COLORS.white,
    };

    const { bg, fg } = levelColors[level];
    const tagColor = tagColors[tag] || COLORS.white;

    return (
      `${COLORS.dim}${timestamp}${COLORS.reset} ` +
      `${bg}${fg}${COLORS.bright} ${level} ${COLORS.reset} ` +
      `${tagColor}${COLORS.bright}[${tag}]${COLORS.reset} ` +
      `${message}`
    );
  }

  /**
   * Extract tag from arguments
   */
  private extractTag(args: any[]): LogTag {
    // Check if first arg is a tag
    const possibleTag = args[0];
    if (typeof possibleTag === 'string' && possibleTag.startsWith('[') && possibleTag.endsWith(']')) {
      const tag = possibleTag.slice(1, -1).toUpperCase();
      if (this.isValidTag(tag)) {
        return tag as LogTag;
      }
    }

    // Auto-detect tag from message content
    const message = args.join(' ').toLowerCase();
    if (message.includes('api') || message.includes('fetch') || message.includes('request')) {
      return 'API';
    }
    if (message.includes('navigat')) {
      return 'NAVIGATION';
    }
    if (message.includes('ai') || message.includes('gpt') || message.includes('openai')) {
      return 'AI';
    }
    if (message.includes('auth') || message.includes('login') || message.includes('token')) {
      return 'AUTH';
    }
    if (message.includes('error') || message.includes('fail')) {
      return 'ERROR';
    }
    if (message.includes('render') || message.includes('component')) {
      return 'UI';
    }
    if (message.includes('click') || message.includes('press') || message.includes('action')) {
      return 'USER_ACTION';
    }
    if (message.includes('performance') || message.includes('duration') || message.includes('ms')) {
      return 'PERFORMANCE';
    }

    return 'SYSTEM';
  }

  /**
   * Check if tag is valid
   */
  private isValidTag(tag: string): boolean {
    const validTags: LogTag[] = [
      'API', 'NAVIGATION', 'UI', 'AI', 'ERROR',
      'AUTH', 'DATA', 'PERFORMANCE', 'USER_ACTION', 'SYSTEM'
    ];
    return validTags.includes(tag as LogTag);
  }

  /**
   * Format message from arguments
   */
  private formatMessage(args: any[]): string {
    return args
      .map(arg => {
        // Skip tag if it's the first arg
        if (typeof arg === 'string' && arg.startsWith('[') && arg.endsWith(']')) {
          return '';
        }

        if (typeof arg === 'string') {
          return arg;
        }

        if (arg instanceof Error) {
          return `${arg.name}: ${arg.message}`;
        }

        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return '[Circular Object]';
          }
        }

        return String(arg);
      })
      .filter(Boolean)
      .join(' ');
  }

  /**
   * Extract context object from arguments
   */
  private extractContext(args: any[]): any {
    const context: any = {};

    args.forEach(arg => {
      if (typeof arg === 'object' && !(arg instanceof Error)) {
        Object.assign(context, arg);
      }
    });

    return Object.keys(context).length > 0 ? context : undefined;
  }

  /**
   * Format timestamp
   */
  private formatTimestamp(): string {
    const now = new Date();

    switch (this.options.timestampFormat) {
      case 'ISO':
        return now.toISOString();

      case 'SHORT':
        return now.toISOString().split('T')[1].split('.')[0];

      case 'TIME_ONLY':
      default:
        return now.toTimeString().split(' ')[0];
    }
  }

  /**
   * Output to console using original method
   */
  private outputToConsole(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', formattedLog: string): void {
    switch (level) {
      case 'ERROR':
        this.originalConsole.error(formattedLog);
        break;
      case 'WARN':
        this.originalConsole.warn(formattedLog);
        break;
      case 'DEBUG':
        this.originalConsole.debug(formattedLog);
        break;
      case 'INFO':
      default:
        this.originalConsole.log(formattedLog);
        break;
    }
  }

  /**
   * Write to file via logger service
   */
  private writeToFile(
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG',
    tag: LogTag,
    message: string,
    context?: any
  ): void {
    const contextStr = tag;

    switch (level) {
      case 'ERROR':
        loggerService.error(message, contextStr, context);
        break;
      case 'WARN':
        loggerService.warn(message, contextStr, context);
        break;
      case 'DEBUG':
        loggerService.debug(message, contextStr, context);
        break;
      case 'INFO':
      default:
        loggerService.info(message, contextStr, context);
        break;
    }
  }

  /**
   * Send to Sentry (placeholder for now)
   */
  private sendToSentry(message: string, context?: any): void {
    // TODO: Integrate Sentry
    // Example:
    // Sentry.captureException(new Error(message), {
    //   tags: { context },
    //   level: 'error',
    // });
  }

  /**
   * Public logging methods with tags
   */
  public log(message: string, tag: LogTag = 'SYSTEM', context?: any): void {
    const args = context ? [message, context] : [message];
    console.log(`[${tag}]`, ...args);
  }

  public info(message: string, tag: LogTag = 'SYSTEM', context?: any): void {
    this.log(message, tag, context);
  }

  public warn(message: string, tag: LogTag = 'SYSTEM', context?: any): void {
    const args = context ? [message, context] : [message];
    console.warn(`[${tag}]`, ...args);
  }

  public error(message: string, tag: LogTag = 'ERROR', error?: Error, context?: any): void {
    const args: any[] = [`[${tag}]`, message];
    if (error) args.push(error);
    if (context) args.push(context);
    console.error(...args);
  }

  public debug(message: string, tag: LogTag = 'SYSTEM', context?: any): void {
    if (__DEV__) {
      const args = context ? [message, context] : [message];
      console.debug(`[${tag}]`, ...args);
    }
  }

  /**
   * Specialized logging methods
   */
  public logAPI(
    method: string,
    endpoint: string,
    status: number,
    duration: number,
    requestId?: string
  ): void {
    const emoji = status >= 400 ? '❌' : status >= 300 ? '⚠️' : '✅';
    this.log(
      `${emoji} ${method} ${endpoint} - ${status} (${duration}ms)${
        requestId ? ` req_id=${requestId}` : ''
      }`,
      'API',
      { method, endpoint, status, duration, requestId }
    );
  }

  public logNavigation(from: string, to: string, params?: any): void {
    this.log(
      `🧭 ${from} → ${to}`,
      'NAVIGATION',
      { from, to, params }
    );
  }

  public logUserAction(action: string, screen: string, data?: any): void {
    this.log(
      `👆 User ${action} on ${screen}`,
      'USER_ACTION',
      { action, screen, data }
    );
  }

  public logAI(service: string, operation: string, duration: number, tokens?: number): void {
    this.log(
      `🤖 ${service} - ${operation} (${duration}ms${tokens ? `, ${tokens} tokens` : ''})`,
      'AI',
      { service, operation, duration, tokens }
    );
  }

  public logPerformance(operation: string, duration: number, metadata?: any): void {
    const emoji = duration > 1000 ? '🐌' : duration > 500 ? '⚠️' : '⚡';
    this.log(
      `${emoji} ${operation} took ${duration}ms`,
      'PERFORMANCE',
      { operation, duration, ...metadata }
    );
  }

  /**
   * Get original console (for React Native debugging)
   */
  public getOriginalConsole() {
    return this.originalConsole;
  }

  /**
   * Restore original console methods
   */
  public restore(): void {
    console.log = this.originalConsole.log;
    console.info = this.originalConsole.info;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.debug = this.originalConsole.debug;

    this.isInitialized = false;
    this.originalConsole.log('Expo Log Bridge restored to original console');
  }
}

// Export singleton instance
export const logBridge = ExpoLogBridge.getInstance();

// Export convenience functions
export const log = (message: string, tag?: LogTag, context?: any) =>
  logBridge.log(message, tag, context);

export const logInfo = (message: string, tag?: LogTag, context?: any) =>
  logBridge.info(message, tag, context);

export const logWarn = (message: string, tag?: LogTag, context?: any) =>
  logBridge.warn(message, tag, context);

export const logError = (message: string, error?: Error, context?: any) =>
  logBridge.error(message, 'ERROR', error, context);

export const logDebug = (message: string, tag?: LogTag, context?: any) =>
  logBridge.debug(message, tag, context);

export const logAPI = (
  method: string,
  endpoint: string,
  status: number,
  duration: number,
  requestId?: string
) => logBridge.logAPI(method, endpoint, status, duration, requestId);

export const logNavigation = (from: string, to: string, params?: any) =>
  logBridge.logNavigation(from, to, params);

export const logUserAction = (action: string, screen: string, data?: any) =>
  logBridge.logUserAction(action, screen, data);

export const logAI = (service: string, operation: string, duration: number, tokens?: number) =>
  logBridge.logAI(service, operation, duration, tokens);

export const logPerformance = (operation: string, duration: number, metadata?: any) =>
  logBridge.logPerformance(operation, duration, metadata);

export default logBridge;
