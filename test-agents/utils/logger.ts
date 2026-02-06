import fs from 'fs';
import path from 'path';

export class Logger {
  private name: string;
  private logFile: string;

  constructor(name: string) {
    this.name = name;
    this.logFile = path.join(__dirname, '../logs', `${name}-${Date.now()}.log`);

    // Ensure logs directory exists
    const logsDir = path.dirname(this.logFile);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  private write(level: string, message: string, color: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] [${this.name}] ${message}`;

    // Console output with color
    console.log(`${color}${logMessage}\x1b[0m`);

    // File output
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  info(message: string): void {
    this.write('INFO', message, '\x1b[36m'); // Cyan
  }

  success(message: string): void {
    this.write('SUCCESS', message, '\x1b[32m'); // Green
  }

  warn(message: string): void {
    this.write('WARN', message, '\x1b[33m'); // Yellow
  }

  error(message: string): void {
    this.write('ERROR', message, '\x1b[31m'); // Red
  }

  debug(message: string): void {
    this.write('DEBUG', message, '\x1b[90m'); // Gray
  }

  separator(): void {
    console.log('\x1b[90m' + '─'.repeat(80) + '\x1b[0m');
  }

  header(message: string): void {
    console.log('\x1b[1m\x1b[35m' + '═'.repeat(80) + '\x1b[0m');
    console.log('\x1b[1m\x1b[35m  ' + message + '\x1b[0m');
    console.log('\x1b[1m\x1b[35m' + '═'.repeat(80) + '\x1b[0m');
  }
}
