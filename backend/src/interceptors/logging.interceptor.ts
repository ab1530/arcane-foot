import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;
    const requestId = request?.requestId;
    const startTime = Date.now();

    this.logger.debug(
      `Incoming Request: ${method} ${url} ${requestId ? `(req_id=${requestId})` : ''}`,
      'HTTP',
    );

    if (body && Object.keys(body).length > 0) {
      // Log body but sanitize sensitive data
      const sanitizedBody = this.sanitizeData(body);
      this.logger.debug(
        `Request Body: ${JSON.stringify(sanitizedBody)} ${requestId ? `(req_id=${requestId})` : ''}`,
        'HTTP',
      );
    }

    return next.handle().pipe(
      tap({
        next: (_data) => {
          const response = context.switchToHttp().getResponse();
          const duration = Date.now() - startTime;

          this.logger.logHttpRequest({
            method,
            url,
            statusCode: response.statusCode,
            duration,
            userId: user?.id,
            role: user?.role,
            requestId,
          });

          if (duration > 1000) {
            this.logger.warn(
              `Slow request detected: ${method} ${url} took ${duration}ms`,
              'Performance',
            );
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `Request failed: ${method} ${url} after ${duration}ms - ${error.message} ${
              requestId ? `(req_id=${requestId})` : ''
            }`,
            error.stack,
            'HTTP',
          );
        },
      }),
    );
  }

  private sanitizeData(data: any): any {
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'accessToken'];
    const sanitized = { ...data };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}
