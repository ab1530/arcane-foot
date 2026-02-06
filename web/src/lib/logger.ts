/**
 * Centralized logging utility for Arcane Web
 * - Structured logs with trace IDs
 * - In-memory buffer for debug panel
 * - Console output in dev or when debug is enabled
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  scope?: string;
  event?: string;
  feature?: string;
  [key: string]: any;
}

export interface LogEntry {
  id: string;
  ts: number;
  level: LogLevel;
  scope: string;
  message: string;
  context?: LogContext;
  traceId: string;
  route?: string;
  stack?: string;
}

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const TRACE_KEY = 'arcane_trace_id';
const MAX_BUFFER = 500;
const DEFAULT_LEVEL =
  (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === 'production' ? 'warn' : 'debug');
const DEFAULT_ENABLED =
  process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true';

const sanitizeContext = (value: any): any => {
  if (value instanceof Error) {
    return { message: value.message, stack: value.stack };
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeContext(item));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, sanitizeContext(val)])
    );
  }
  return value;
};

const createId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const getRoute = () => {
  if (typeof window === 'undefined') return undefined;
  return window.location.pathname;
};

const getTraceId = () => {
  if (typeof window === 'undefined') return 'server';
  try {
    const existing = sessionStorage.getItem(TRACE_KEY);
    if (existing) return existing;
    const fresh = createId();
    sessionStorage.setItem(TRACE_KEY, fresh);
    return fresh;
  } catch {
    return 'unknown';
  }
};

class Logger {
  private buffer: LogEntry[] = [];
  private listeners = new Set<(entry: LogEntry) => void>();
  private level: LogLevel = DEFAULT_LEVEL;
  private enabled = DEFAULT_ENABLED;
  private traceId = getTraceId();
  private globalContext: LogContext = {};
  private handlersInstalled = false;
  private flags: Record<string, boolean> = {
    network: true,
  };

  setLevel(level: LogLevel) {
    this.level = level;
  }

  getLevel() {
    return this.level;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  getEnabled() {
    return this.enabled;
  }

  setFlag(key: string, value: boolean) {
    this.flags[key] = value;
  }

  getFlag(key: string, fallback = false) {
    return this.flags[key] ?? fallback;
  }

  setContext(context: LogContext) {
    this.globalContext = { ...this.globalContext, ...context };
  }

  clearContext(keys?: string[]) {
    if (!keys) {
      this.globalContext = {};
      return;
    }
    const next = { ...this.globalContext };
    for (const key of keys) {
      delete next[key];
    }
    this.globalContext = next;
  }

  scope(scopeName: string) {
    return {
      debug: (message: string, context?: LogContext) =>
        this.debug(message, { ...context, scope: scopeName }),
      info: (message: string, context?: LogContext) =>
        this.info(message, { ...context, scope: scopeName }),
      warn: (message: string, context?: LogContext) =>
        this.warn(message, { ...context, scope: scopeName }),
      error: (message: string, error?: Error | unknown, context?: LogContext) =>
        this.error(message, error, { ...context, scope: scopeName }),
    };
  }

  createRequestId() {
    return createId();
  }

  subscribe(listener: (entry: LogEntry) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getLogs() {
    return [...this.buffer];
  }

  clearLogs() {
    this.buffer = [];
  }

  installGlobalHandlers() {
    if (typeof window === 'undefined' || this.handlersInstalled) return;
    this.handlersInstalled = true;

    window.addEventListener('error', (event) => {
      this.error('Unhandled error', event.error || event.message, {
        scope: 'Window',
        source: event.filename,
        line: event.lineno,
        column: event.colno,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      this.error('Unhandled promise rejection', reason, {
        scope: 'Window',
      });
    });
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    this.log('error', message, context, error);
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error | unknown) {
    if (LEVEL_RANK[level] < LEVEL_RANK[this.level]) return;

    const { scope = 'App', ...rest } = context || {};
    const mergedContext = { ...this.globalContext, ...rest };
    const stack = error instanceof Error ? error.stack : undefined;

    const entry: LogEntry = {
      id: createId(),
      ts: Date.now(),
      level,
      scope,
      message,
      context: Object.keys(mergedContext).length ? mergedContext : undefined,
      traceId: this.traceId,
      route: getRoute(),
      stack,
    };

    this.buffer.push(entry);
    if (this.buffer.length > MAX_BUFFER) {
      this.buffer.shift();
    }

    for (const listener of this.listeners) {
      listener(entry);
    }

    if (!this.enabled) return;

    const prefix = `[${level.toUpperCase()}][${entry.scope}][${entry.traceId}]`;
    const route = entry.route ? ` ${entry.route}` : '';
    const line = `${prefix}${route} ${message}`;
    const contextPayload = entry.context ? sanitizeContext(entry.context) : undefined;

    switch (level) {
      case 'debug':
        console.debug(line, contextPayload);
        break;
      case 'info':
        console.info(line, contextPayload);
        break;
      case 'warn':
        console.warn(line, contextPayload);
        break;
      case 'error':
        console.error(line, contextPayload, error instanceof Error ? error : undefined);
        break;
    }
  }
}

export const logger = new Logger();

export const logInfo = (message: string, context?: LogContext) => logger.info(message, context);
export const logWarn = (message: string, context?: LogContext) => logger.warn(message, context);
export const logError = (message: string, error?: Error | unknown, context?: LogContext) =>
  logger.error(message, error, context);
export const logDebug = (message: string, context?: LogContext) => logger.debug(message, context);
