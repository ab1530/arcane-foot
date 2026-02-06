type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogEntry = {
  ts: number;
  level: LogLevel;
  tag: string;
  message: string;
  context?: Record<string, any>;
};

const BUFFER_LIMIT = 200;
const buffer: LogEntry[] = [];

const envLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
const levelRank: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const shouldLog = (level: LogLevel) => levelRank[level] >= levelRank[envLevel];

const format = (entry: LogEntry) => {
  const { ts, level, tag, message, context } = entry;
  const time = new Date(ts).toISOString();
  const ctxString =
    context && Object.keys(context).length > 0
      ? JSON.stringify(context, (_k, v) => (v instanceof Error ? v.message : v))
      : '';
  return `[${level.toUpperCase()}][${tag}] ${time} - ${message}${ctxString ? ` ${ctxString}` : ''}`;
};

const push = (entry: LogEntry) => {
  buffer.push(entry);
  if (buffer.length > BUFFER_LIMIT) {
    buffer.shift();
  }
};

const emit = (entry: LogEntry) => {
  push(entry);
  const line = format(entry);
  switch (entry.level) {
    case 'debug':
    case 'info':
      console.log(line);
      break;
    case 'warn':
      console.warn(line);
      break;
    case 'error':
      console.error(line);
      break;
  }
};

const log = (level: LogLevel, tag: string, message: string, context?: Record<string, any>) => {
  if (!shouldLog(level)) return;
  emit({ ts: Date.now(), level, tag, message, context });
};

export const logger = {
  debug: (tag: string, message: string, context?: Record<string, any>) =>
    log('debug', tag, message, context),
  info: (tag: string, message: string, context?: Record<string, any>) =>
    log('info', tag, message, context),
  warn: (tag: string, message: string, context?: Record<string, any>) =>
    log('warn', tag, message, context),
  error: (tag: string, message: string, context?: Record<string, any>) =>
    log('error', tag, message, context),
  getBuffer: () => [...buffer],
  clear: () => buffer.splice(0, buffer.length),
};

const DEFAULT_TAG = 'mobile';

const normalizeContext = (context?: any) => {
  if (!context) {
    return undefined;
  }

  if (context instanceof Error) {
    return {
      error: context.message,
      stack: context.stack,
    };
  }

  if (typeof context === 'object' && !Array.isArray(context)) {
    return context as Record<string, any>;
  }

  return { detail: context };
};

export const logDebug = (message: string, context?: any) =>
  logger.debug(DEFAULT_TAG, message, normalizeContext(context));

export const logInfo = (message: string, context?: any) =>
  logger.info(DEFAULT_TAG, message, normalizeContext(context));

export const logWarn = (message: string, context?: any) =>
  logger.warn(DEFAULT_TAG, message, normalizeContext(context));

export const logError = (message: string, error?: any, context?: any) => {
  const errorContext = error
    ? error instanceof Error
      ? { error: error.message, stack: error.stack }
      : { error }
    : undefined;

  const merged =
    context || errorContext
      ? {
          ...(normalizeContext(context) || {}),
          ...(errorContext || {}),
        }
      : undefined;

  logger.error(DEFAULT_TAG, message, merged);
};
