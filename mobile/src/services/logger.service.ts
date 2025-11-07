import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: any;
  stack?: string;
}

class LoggerService {
  private static instance: LoggerService;
  private logs: LogEntry[] = [];
  private readonly maxLogsInMemory = 1000;
  private readonly logFileName = 'app.log';
  private readonly maxLogFiles = 5;
  private readonly maxLogFileSize = 5 * 1024 * 1024; // 5MB

  private constructor() {
    this.initializeLogger();
  }

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  private async initializeLogger() {
    try {
      const logsDir = this.getLogsDirectory();
      const dirInfo = await FileSystem.getInfoAsync(logsDir);

      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(logsDir, { intermediates: true });
      }

      // Clean old logs on initialization
      await this.cleanOldLogs();
    } catch (error) {
      console.error('Failed to initialize logger:', error);
    }
  }

  private getLogsDirectory(): string {
    return `${FileSystem.documentDirectory}logs`;
  }

  private getCurrentLogFilePath(): string {
    return `${this.getLogsDirectory()}/${this.logFileName}`;
  }

  private formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, context, message, data, stack } = entry;
    let logLine = `[${timestamp}] [${level}] [${context}] ${message}`;

    if (data) {
      try {
        logLine += ` | Data: ${JSON.stringify(data)}`;
      } catch (error) {
        logLine += ` | Data: [Circular or Invalid JSON]`;
      }
    }

    if (stack) {
      logLine += `\nStack: ${stack}`;
    }

    return logLine;
  }

  private async writeToFile(entry: LogEntry) {
    try {
      const logFilePath = this.getCurrentLogFilePath();
      const logLine = this.formatLogEntry(entry) + '\n';

      // Check file size before writing
      const fileInfo = await FileSystem.getInfoAsync(logFilePath);
      if (fileInfo.exists && fileInfo.size && fileInfo.size > this.maxLogFileSize) {
        await this.rotateLogFiles();
      }

      await FileSystem.writeAsStringAsync(logFilePath, logLine, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    } catch (error) {
      console.error('Failed to write log to file:', error);
    }
  }

  private async rotateLogFiles() {
    try {
      const logsDir = this.getLogsDirectory();

      // Move current log to backup
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `app_${timestamp}.log`;
      const currentLogPath = this.getCurrentLogFilePath();
      const backupLogPath = `${logsDir}/${backupFileName}`;

      await FileSystem.moveAsync({
        from: currentLogPath,
        to: backupLogPath,
      });

      // Clean old backups
      await this.cleanOldLogs();
    } catch (error) {
      console.error('Failed to rotate log files:', error);
    }
  }

  private async cleanOldLogs() {
    try {
      const logsDir = this.getLogsDirectory();
      const files = await FileSystem.readDirectoryAsync(logsDir);

      // Sort files by creation time (newest first)
      const logFiles = files
        .filter(file => file.endsWith('.log') && file !== this.logFileName)
        .sort()
        .reverse();

      // Keep only the most recent log files
      const filesToDelete = logFiles.slice(this.maxLogFiles);

      for (const file of filesToDelete) {
        await FileSystem.deleteAsync(`${logsDir}/${file}`, { idempotent: true });
      }
    } catch (error) {
      console.error('Failed to clean old logs:', error);
    }
  }

  private log(level: LogLevel, context: string, message: string, data?: any, stack?: string) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      data,
      stack,
    };

    // Add to in-memory logs
    this.logs.push(entry);
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs.shift();
    }

    // Write to file asynchronously
    this.writeToFile(entry);

    // Also log to console in development
    if (__DEV__) {
      const consoleMessage = this.formatLogEntry(entry);
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(consoleMessage);
          break;
        case LogLevel.INFO:
          console.info(consoleMessage);
          break;
        case LogLevel.WARN:
          console.warn(consoleMessage);
          break;
        case LogLevel.ERROR:
        case LogLevel.FATAL:
          console.error(consoleMessage);
          break;
      }
    }
  }

  public debug(message: string, context: string = 'App', data?: any) {
    this.log(LogLevel.DEBUG, context, message, data);
  }

  public info(message: string, context: string = 'App', data?: any) {
    this.log(LogLevel.INFO, context, message, data);
  }

  public warn(message: string, context: string = 'App', data?: any) {
    this.log(LogLevel.WARN, context, message, data);
  }

  public error(message: string, context: string = 'App', data?: any, error?: Error) {
    this.log(LogLevel.ERROR, context, message, data, error?.stack);
  }

  public fatal(message: string, context: string = 'App', data?: any, error?: Error) {
    this.log(LogLevel.FATAL, context, message, data, error?.stack);
  }

  // Custom logging methods
  public logApiRequest(method: string, url: string, statusCode?: number, duration?: number) {
    this.info('API Request', 'API', {
      method,
      url,
      statusCode,
      duration,
      platform: Platform.OS,
    });
  }

  public logApiError(method: string, url: string, error: any) {
    this.error('API Error', 'API', {
      method,
      url,
      error: error?.message || error,
      platform: Platform.OS,
    }, error);
  }

  public logNavigation(screen: string, params?: any) {
    this.info('Navigation', 'Navigation', {
      screen,
      params,
      platform: Platform.OS,
    });
  }

  public logPerformance(operation: string, duration: number, metadata?: any) {
    this.info('Performance', 'Performance', {
      operation,
      duration,
      ...metadata,
      platform: Platform.OS,
    });
  }

  public logUserAction(action: string, data?: any) {
    this.info('User Action', 'User', {
      action,
      data,
      platform: Platform.OS,
    });
  }

  // Get logs
  public getInMemoryLogs(): LogEntry[] {
    return [...this.logs];
  }

  public async getLogFileContent(): Promise<string> {
    try {
      const logFilePath = this.getCurrentLogFilePath();
      const fileInfo = await FileSystem.getInfoAsync(logFilePath);

      if (!fileInfo.exists) {
        return 'No logs available';
      }

      return await FileSystem.readAsStringAsync(logFilePath, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    } catch (error) {
      console.error('Failed to read log file:', error);
      return 'Failed to read logs';
    }
  }

  public async getAllLogFiles(): Promise<string[]> {
    try {
      const logsDir = this.getLogsDirectory();
      const files = await FileSystem.readDirectoryAsync(logsDir);
      return files.filter(file => file.endsWith('.log'));
    } catch (error) {
      console.error('Failed to get log files:', error);
      return [];
    }
  }

  public async exportLogs(): Promise<string> {
    try {
      const logsDir = this.getLogsDirectory();
      const exportDir = `${FileSystem.cacheDirectory}exported_logs`;
      const exportPath = `${exportDir}/logs_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;

      // Create export directory
      const dirInfo = await FileSystem.getInfoAsync(exportDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(exportDir, { intermediates: true });
      }

      // Get all log files
      const files = await this.getAllLogFiles();
      let allLogs = '';

      for (const file of files) {
        const content = await FileSystem.readAsStringAsync(`${logsDir}/${file}`, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        allLogs += `\n\n=== ${file} ===\n\n${content}`;
      }

      // Write to export file
      await FileSystem.writeAsStringAsync(exportPath, allLogs, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      return exportPath;
    } catch (error) {
      console.error('Failed to export logs:', error);
      throw error;
    }
  }

  public async clearLogs() {
    try {
      const logsDir = this.getLogsDirectory();
      await FileSystem.deleteAsync(logsDir, { idempotent: true });
      await FileSystem.makeDirectoryAsync(logsDir, { intermediates: true });
      this.logs = [];
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }
}

export const logger = LoggerService.getInstance();
