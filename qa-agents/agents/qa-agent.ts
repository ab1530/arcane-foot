/**
 * QA-AGENT - Universal Test Runner
 * Exécute tous les tests du projet et détecte les erreurs
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ErrorType, FixStrategy, SYSTEM_COMMANDS } from '../agents.config';

const execAsync = promisify(exec);

interface TestResult {
  suite: string;
  passed: number;
  failed: number;
  errors: TestError[];
  duration: number;
}

interface TestError {
  test: string;
  message: string;
  file?: string;
  line?: number;
  type: ErrorType;
}

interface QAAgentResult {
  success: boolean;
  errors: any[];
  fixes: any[];
  metrics: {
    testsRun: number;
    testsPassed: number;
    testsFailed: number;
    errorsDetected: number;
    errorsFixed: number;
    errorsPending: number;
  };
  testResults: TestResult[];
}

export default class QAAgent {
  private logFile: string = './logs/qa-agent.log';
  private results: TestResult[] = [];

  async run(): Promise<QAAgentResult> {
    await this.log('🧪 QA-Agent starting...');

    const startTime = Date.now();

    try {
      // 1. Tests Backend (NestJS + Jest)
      await this.log('Running backend tests...');
      const backendResult = await this.runBackendTests();
      this.results.push(backendResult);

      // 2. Tests Web (Next.js + Playwright) - Temporairement désactivé
      // await this.log('Running web tests...');
      // const webResult = await this.runWebTests();
      // this.results.push(webResult);

      // 3. Tests Mobile (Expo + Jest) - Temporairement désactivé
      // await this.log('Running mobile tests...');
      // const mobileResult = await this.runMobileTests();
      // this.results.push(mobileResult);

      // 4. Tests E2E (Playwright) - Temporairement désactivé
      // await this.log('Running E2E tests...');
      // const e2eResult = await this.runE2ETests();
      // this.results.push(e2eResult);

      // 5. Analyse des résultats
      const metrics = this.calculateMetrics();
      const allErrors = this.extractAllErrors();

      const duration = Date.now() - startTime;
      await this.log(`✅ QA-Agent completed in ${duration}ms`);

      return {
        success: metrics.testsFailed === 0,
        errors: allErrors,
        fixes: [],
        metrics,
        testResults: this.results,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await this.log(`❌ QA-Agent failed: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Exécuter tests backend NestJS
   */
  private async runBackendTests(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const { stdout, stderr } = await execAsync(
        SYSTEM_COMMANDS.backend.test,
        { timeout: 180000 } // 3 minutes
      );

      const result = this.parseJestOutput(stdout + stderr);
      const duration = Date.now() - startTime;

      await this.log(`Backend tests: ${result.passed}/${result.passed + result.failed} passed`);

      return {
        suite: 'Backend (NestJS)',
        ...result,
        duration,
      };
    } catch (error: any) {
      // Jest retourne exit code 1 si tests échouent
      const output = (error.stdout || '') + (error.stderr || '');
      const result = this.parseJestOutput(output);
      const duration = Date.now() - startTime;

      await this.log(`Backend tests failed: ${result.failed} failures`);

      return {
        suite: 'Backend (NestJS)',
        ...result,
        duration,
      };
    }
  }

  /**
   * Exécuter tests web Next.js
   */
  private async runWebTests(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const { stdout, stderr } = await execAsync(
        SYSTEM_COMMANDS.web.test,
        { timeout: 180000 } // 3 minutes
      );

      const result = this.parseJestOutput(stdout + stderr);
      const duration = Date.now() - startTime;

      await this.log(`Web tests: ${result.passed}/${result.passed + result.failed} passed`);

      return {
        suite: 'Web (Next.js)',
        ...result,
        duration,
      };
    } catch (error: any) {
      const output = (error.stdout || '') + (error.stderr || '');
      const result = this.parseJestOutput(output);
      const duration = Date.now() - startTime;

      return {
        suite: 'Web (Next.js)',
        ...result,
        duration,
      };
    }
  }

  /**
   * Exécuter tests mobile Expo
   */
  private async runMobileTests(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const { stdout, stderr } = await execAsync(
        SYSTEM_COMMANDS.mobile.test,
        { timeout: 240000 } // 4 minutes (Expo peut être lent)
      );

      const result = this.parseJestOutput(stdout + stderr);
      const duration = Date.now() - startTime;

      await this.log(`Mobile tests: ${result.passed}/${result.passed + result.failed} passed`);

      return {
        suite: 'Mobile (Expo)',
        ...result,
        duration,
      };
    } catch (error: any) {
      const output = (error.stdout || '') + (error.stderr || '');
      const result = this.parseJestOutput(output);
      const duration = Date.now() - startTime;

      return {
        suite: 'Mobile (Expo)',
        ...result,
        duration,
      };
    }
  }

  /**
   * Exécuter tests E2E Playwright
   */
  private async runE2ETests(): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const { stdout, stderr } = await execAsync(
        SYSTEM_COMMANDS.web.testE2E,
        { timeout: 300000 } // 5 minutes
      );

      const result = this.parsePlaywrightOutput(stdout + stderr);
      const duration = Date.now() - startTime;

      await this.log(`E2E tests: ${result.passed}/${result.passed + result.failed} passed`);

      return {
        suite: 'E2E (Playwright)',
        ...result,
        duration,
      };
    } catch (error: any) {
      const output = (error.stdout || '') + (error.stderr || '');
      const result = this.parsePlaywrightOutput(output);
      const duration = Date.now() - startTime;

      return {
        suite: 'E2E (Playwright)',
        ...result,
        duration,
      };
    }
  }

  /**
   * Parser la sortie Jest
   */
  private parseJestOutput(output: string): { passed: number; failed: number; errors: TestError[] } {
    const errors: TestError[] = [];
    let passed = 0;
    let failed = 0;

    // Extract test results
    const testSummaryMatch = output.match(/Tests:\s+(\d+)\s+failed.*?(\d+)\s+passed.*?(\d+)\s+total/i);
    if (testSummaryMatch) {
      failed = parseInt(testSummaryMatch[1]);
      passed = parseInt(testSummaryMatch[2]);
    }

    // Extract errors
    const errorBlocks = output.match(/●.*?(?=●|$)/gs) || [];
    for (const block of errorBlocks) {
      const error = this.parseJestError(block);
      if (error) errors.push(error);
    }

    return { passed, failed, errors };
  }

  /**
   * Parser une erreur Jest
   */
  private parseJestError(errorBlock: string): TestError | null {
    const testNameMatch = errorBlock.match(/●\s+(.+)/);
    const fileMatch = errorBlock.match(/at\s+.*?\((.+?):(\d+):\d+\)/);
    const messageMatch = errorBlock.match(/Error:\s+(.+?)(?:\n|$)/);

    if (!testNameMatch) return null;

    const message = messageMatch ? messageMatch[1] : 'Unknown error';
    const type = this.categorizeError(message);

    return {
      test: testNameMatch[1].trim(),
      message,
      file: fileMatch ? fileMatch[1] : undefined,
      line: fileMatch ? parseInt(fileMatch[2]) : undefined,
      type,
    };
  }

  /**
   * Parser la sortie Playwright
   */
  private parsePlaywrightOutput(output: string): { passed: number; failed: number; errors: TestError[] } {
    const errors: TestError[] = [];
    let passed = 0;
    let failed = 0;

    // Playwright format: "X passed (Xms)"
    const passedMatch = output.match(/(\d+)\s+passed/i);
    const failedMatch = output.match(/(\d+)\s+failed/i);

    if (passedMatch) passed = parseInt(passedMatch[1]);
    if (failedMatch) failed = parseInt(failedMatch[1]);

    // Extract errors from Playwright output
    const errorBlocks = output.match(/\d+\)\s+.+?\n\n\s+Error:.+?(?=\d+\)|$)/gs) || [];
    for (const block of errorBlocks) {
      const error = this.parsePlaywrightError(block);
      if (error) errors.push(error);
    }

    return { passed, failed, errors };
  }

  /**
   * Parser une erreur Playwright
   */
  private parsePlaywrightError(errorBlock: string): TestError | null {
    const testNameMatch = errorBlock.match(/\d+\)\s+(.+)/);
    const messageMatch = errorBlock.match(/Error:\s+(.+?)(?:\n|$)/);

    if (!testNameMatch) return null;

    const message = messageMatch ? messageMatch[1] : 'Unknown error';
    const type = this.categorizeError(message);

    return {
      test: testNameMatch[1].trim(),
      message,
      type,
    };
  }

  /**
   * Catégoriser une erreur
   */
  private categorizeError(message: string): ErrorType {
    if (message.includes('Cannot find module')) return ErrorType.IMPORT_ERROR;
    if (message.includes('is not defined')) return ErrorType.UNDEFINED_VARIABLE;
    if (message.includes('TypeError')) return ErrorType.TYPE_ERROR;
    if (message.includes('SyntaxError')) return ErrorType.SYNTAX_ERROR;
    if (message.includes('404')) return ErrorType.API_404;
    if (message.includes('500')) return ErrorType.API_500;
    if (message.includes('timeout')) return ErrorType.TIMEOUT;
    if (message.includes('ECONNREFUSED')) return ErrorType.DB_CONNECTION_ERROR;
    if (message.includes('Authentication')) return ErrorType.AUTH_ERROR;

    return ErrorType.TEST_FAIL;
  }

  /**
   * Calculer métriques globales
   */
  private calculateMetrics() {
    const testsRun = this.results.reduce((sum, r) => sum + r.passed + r.failed, 0);
    const testsPassed = this.results.reduce((sum, r) => sum + r.passed, 0);
    const testsFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
    const errorsDetected = this.results.reduce((sum, r) => sum + r.errors.length, 0);

    return {
      testsRun,
      testsPassed,
      testsFailed,
      errorsDetected,
      errorsFixed: 0,
      errorsPending: errorsDetected,
    };
  }

  /**
   * Extraire toutes les erreurs
   */
  private extractAllErrors() {
    return this.results.flatMap(result =>
      result.errors.map(err => ({
        type: err.type,
        message: err.message,
        file: err.file,
        line: err.line,
        severity: this.getSeverity(err.type),
        fixStrategy: this.getFixStrategy(err.type),
      }))
    );
  }

  /**
   * Déterminer la sévérité
   */
  private getSeverity(errorType: ErrorType): 'low' | 'medium' | 'high' | 'critical' {
    const criticalErrors = [
      ErrorType.CRITICAL_ERROR,
      ErrorType.SECURITY_ERROR,
      ErrorType.DB_CONNECTION_ERROR,
      ErrorType.MIGRATION_ERROR,
    ];

    const highErrors = [
      ErrorType.AUTH_ERROR,
      ErrorType.BUILD_ERROR,
      ErrorType.CONFIG_ERROR,
    ];

    const mediumErrors = [
      ErrorType.API_500,
      ErrorType.API_404,
      ErrorType.TIMEOUT,
    ];

    if (criticalErrors.includes(errorType)) return 'critical';
    if (highErrors.includes(errorType)) return 'high';
    if (mediumErrors.includes(errorType)) return 'medium';
    return 'low';
  }

  /**
   * Obtenir stratégie de correction
   */
  private getFixStrategy(errorType: ErrorType): FixStrategy {
    if (errorType === ErrorType.IMPORT_ERROR) return FixStrategy.AUTO_FIX;
    if (errorType === ErrorType.SYNTAX_ERROR) return FixStrategy.AUTO_FIX;
    if (errorType === ErrorType.TYPE_ERROR) return FixStrategy.AUTO_FIX;
    if (errorType === ErrorType.UNDEFINED_VARIABLE) return FixStrategy.AUTO_FIX;
    if (errorType === ErrorType.API_404) return FixStrategy.AUTO_FIX;

    if (errorType === ErrorType.TIMEOUT) return FixStrategy.RETRY;
    if (errorType === ErrorType.DB_CONNECTION_ERROR) return FixStrategy.RETRY;

    if (errorType === ErrorType.CRITICAL_ERROR) return FixStrategy.ESCALATE;
    if (errorType === ErrorType.SECURITY_ERROR) return FixStrategy.ESCALATE;

    return FixStrategy.MANUAL_FIX;
  }

  /**
   * Logger
   */
  private async log(message: string): Promise<void> {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message}\n`;

    console.log(logLine.trim());
    await fs.appendFile(this.logFile, logLine).catch(() => {});
  }
}
