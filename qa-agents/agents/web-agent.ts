/**
 * WEB-AGENT - Next.js Validator
 * Teste les composants React, pages et hooks Next.js
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ErrorType, FixStrategy, SYSTEM_COMMANDS } from '../agents.config';

const execAsync = promisify(exec);

interface WebTestResult {
  type: 'build' | 'lint' | 'typecheck' | 'unit';
  passed: boolean;
  duration: number;
  errors: WebError[];
}

interface WebError {
  file?: string;
  line?: number;
  message: string;
  type: ErrorType;
}

interface WebAgentResult {
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
  results: WebTestResult[];
}

export default class WebAgent {
  private logFile: string = './logs/web-agent.log';
  private results: WebTestResult[] = [];

  async run(): Promise<WebAgentResult> {
    await this.log('🌍 Web-Agent starting...');

    try {
      // 1. Type checking TypeScript
      await this.log('Running TypeScript type check...');
      await this.runTypeCheck();

      // 2. Linting avec ESLint
      await this.log('Running ESLint...');
      await this.runLint();

      // 3. Build Next.js
      await this.log('Running Next.js build...');
      await this.runBuild();

      // 4. Tests unitaires (si disponibles)
      await this.log('Running unit tests...');
      await this.runUnitTests();

      // 5. Analyser résultats
      const metrics = this.calculateMetrics();
      const errors = this.extractAllErrors();

      await this.log(`✅ Web-Agent completed: ${metrics.testsPassed}/${metrics.testsRun} checks passed`);

      return {
        success: metrics.testsFailed === 0,
        errors,
        fixes: [],
        metrics,
        results: this.results,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await this.log(`❌ Web-Agent failed: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Type checking TypeScript
   */
  private async runTypeCheck(): Promise<void> {
    const startTime = Date.now();

    try {
      await execAsync(SYSTEM_COMMANDS.web.typeCheck, { timeout: 60000 });

      this.results.push({
        type: 'typecheck',
        passed: true,
        duration: Date.now() - startTime,
        errors: [],
      });

      await this.log('✅ TypeScript type check passed');
    } catch (error: any) {
      const output = (error.stdout || '') + (error.stderr || '');
      const errors = this.parseTypeScriptErrors(output);

      this.results.push({
        type: 'typecheck',
        passed: false,
        duration: Date.now() - startTime,
        errors,
      });

      await this.log(`❌ TypeScript errors: ${errors.length} found`);
    }
  }

  /**
   * Linting ESLint
   */
  private async runLint(): Promise<void> {
    const startTime = Date.now();

    try {
      await execAsync(SYSTEM_COMMANDS.web.lint, { timeout: 60000 });

      this.results.push({
        type: 'lint',
        passed: true,
        duration: Date.now() - startTime,
        errors: [],
      });

      await this.log('✅ ESLint passed');
    } catch (error: any) {
      const output = (error.stdout || '') + (error.stderr || '');
      const errors = this.parseESLintErrors(output);

      this.results.push({
        type: 'lint',
        passed: errors.length === 0,
        duration: Date.now() - startTime,
        errors,
      });

      await this.log(`⚠️ ESLint warnings/errors: ${errors.length} found`);
    }
  }

  /**
   * Build Next.js
   */
  private async runBuild(): Promise<void> {
    const startTime = Date.now();

    try {
      await execAsync(SYSTEM_COMMANDS.web.build, { timeout: 180000 }); // 3 minutes

      this.results.push({
        type: 'build',
        passed: true,
        duration: Date.now() - startTime,
        errors: [],
      });

      await this.log('✅ Next.js build succeeded');
    } catch (error: any) {
      const output = (error.stdout || '') + (error.stderr || '');
      const errors = this.parseBuildErrors(output);

      this.results.push({
        type: 'build',
        passed: false,
        duration: Date.now() - startTime,
        errors,
      });

      await this.log(`❌ Next.js build failed: ${errors.length} errors`);
    }
  }

  /**
   * Tests unitaires
   */
  private async runUnitTests(): Promise<void> {
    const startTime = Date.now();

    try {
      await execAsync(SYSTEM_COMMANDS.web.test, { timeout: 120000 });

      this.results.push({
        type: 'unit',
        passed: true,
        duration: Date.now() - startTime,
        errors: [],
      });

      await this.log('✅ Unit tests passed');
    } catch (error: any) {
      const output = (error.stdout || '') + (error.stderr || '');
      const errors = this.parseJestErrors(output);

      this.results.push({
        type: 'unit',
        passed: false,
        duration: Date.now() - startTime,
        errors,
      });

      await this.log(`❌ Unit tests failed: ${errors.length} failures`);
    }
  }

  /**
   * Parser erreurs TypeScript
   */
  private parseTypeScriptErrors(output: string): WebError[] {
    const errors: WebError[] = [];
    const errorRegex = /(.+?)\((\d+),\d+\):\s+error\s+TS\d+:\s+(.+)/g;
    let match;

    while ((match = errorRegex.exec(output)) !== null) {
      errors.push({
        file: match[1],
        line: parseInt(match[2]),
        message: match[3],
        type: ErrorType.TYPE_ERROR,
      });
    }

    return errors;
  }

  /**
   * Parser erreurs ESLint
   */
  private parseESLintErrors(output: string): WebError[] {
    const errors: WebError[] = [];
    const errorRegex = /(.+?):(\d+):\d+\s+-\s+error\s+(.+)/g;
    let match;

    while ((match = errorRegex.exec(output)) !== null) {
      errors.push({
        file: match[1],
        line: parseInt(match[2]),
        message: match[3],
        type: ErrorType.SYNTAX_ERROR,
      });
    }

    return errors;
  }

  /**
   * Parser erreurs de build
   */
  private parseBuildErrors(output: string): WebError[] {
    const errors: WebError[] = [];

    if (output.includes('Module not found')) {
      const moduleRegex = /Module not found: Can't resolve '(.+?)'/g;
      let match;

      while ((match = moduleRegex.exec(output)) !== null) {
        errors.push({
          message: `Module not found: ${match[1]}`,
          type: ErrorType.IMPORT_ERROR,
        });
      }
    }

    if (output.includes('Build error')) {
      errors.push({
        message: 'Build failed',
        type: ErrorType.BUILD_ERROR,
      });
    }

    return errors;
  }

  /**
   * Parser erreurs Jest
   */
  private parseJestErrors(output: string): WebError[] {
    const errors: WebError[] = [];
    const failRegex = /●\s+(.+)/g;
    let match;

    while ((match = failRegex.exec(output)) !== null) {
      errors.push({
        message: match[1].trim(),
        type: ErrorType.TEST_FAIL,
      });
    }

    return errors;
  }

  /**
   * Calculer métriques
   */
  private calculateMetrics() {
    const testsRun = this.results.length;
    const testsPassed = this.results.filter(r => r.passed).length;
    const testsFailed = this.results.filter(r => !r.passed).length;
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
   * Déterminer sévérité
   */
  private getSeverity(errorType: ErrorType): 'low' | 'medium' | 'high' | 'critical' {
    const highErrors = [ErrorType.BUILD_ERROR, ErrorType.TYPE_ERROR];
    const mediumErrors = [ErrorType.IMPORT_ERROR, ErrorType.SYNTAX_ERROR];

    if (highErrors.includes(errorType)) return 'high';
    if (mediumErrors.includes(errorType)) return 'medium';
    return 'low';
  }

  /**
   * Obtenir stratégie de fix
   */
  private getFixStrategy(errorType: ErrorType): FixStrategy {
    if ([ErrorType.IMPORT_ERROR, ErrorType.SYNTAX_ERROR].includes(errorType)) {
      return FixStrategy.AUTO_FIX;
    }
    if ([ErrorType.TYPE_ERROR, ErrorType.BUILD_ERROR].includes(errorType)) {
      return FixStrategy.MANUAL_FIX;
    }
    return FixStrategy.SKIP;
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
