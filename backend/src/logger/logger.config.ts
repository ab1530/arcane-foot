import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for structured logging
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${context || 'Application'}] ${level}: ${message} ${metaStr}`;
  }),
);

// File rotation configuration
const getDailyRotateTransport = (filename: string, level: string) => {
  return new winston.transports.File({
    filename: path.join(logsDir, filename),
    level,
    format: customFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 5,
  });
};

export const createLogger = (): winston.Logger => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

  const transports: winston.transport[] = [
    // Console output
    new winston.transports.Console({
      format: isDevelopment ? consoleFormat : customFormat,
      level: logLevel,
    }),

    // Error logs
    getDailyRotateTransport('error.log', 'error'),

    // Combined logs
    getDailyRotateTransport('combined.log', logLevel),

    // HTTP logs
    getDailyRotateTransport('http.log', 'http'),

    // Debug logs (only in development)
    ...(isDevelopment ? [getDailyRotateTransport('debug.log', 'debug')] : []),
  ];

  return winston.createLogger({
    levels: winston.config.npm.levels,
    format: customFormat,
    transports,
    exitOnError: false,
  });
};

export const loggerConfig = {
  logger: createLogger(),
};
