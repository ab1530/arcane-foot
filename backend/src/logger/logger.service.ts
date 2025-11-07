import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { Logger as WinstonLogger } from 'winston';
import { createLogger } from './logger.config';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: WinstonLogger;

  constructor() {
    this.logger = createLogger();
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  // Custom methods for structured logging
  logHttpRequest(method: string, url: string, statusCode: number, duration: number, userId?: string) {
    this.logger.http('HTTP Request', {
      method,
      url,
      statusCode,
      duration,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  logDatabaseQuery(query: string, duration: number, params?: any) {
    this.logger.debug('Database Query', {
      query,
      duration,
      params,
      timestamp: new Date().toISOString(),
    });
  }

  logPerformance(operation: string, duration: number, metadata?: any) {
    this.logger.info('Performance Metric', {
      operation,
      duration,
      ...metadata,
      timestamp: new Date().toISOString(),
    });
  }

  logBusinessEvent(event: string, data?: any) {
    this.logger.info('Business Event', {
      event,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  logSecurity(event: string, severity: 'low' | 'medium' | 'high' | 'critical', data?: any) {
    const logMethod = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
    this.logger[logMethod]('Security Event', {
      event,
      severity,
      data,
      timestamp: new Date().toISOString(),
    });
  }
}
