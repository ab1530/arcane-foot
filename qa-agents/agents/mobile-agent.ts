/**
 * MOBILE-AGENT - Expo/React Native Validator
 * Teste les composants React Native, écrans et hooks Expo
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ErrorType, FixStrategy, SYSTEM_COMMANDS } from '../agents.config';

const execAsync = promisify(exec);

interface MobileTestResult {
  type: 'lint' | 'typecheck' | 'unit' | 'components';
  passed: boolean;
  duration: number;
  errors: MobileError[];
}

interface MobileError {
  file?: string;
  line?: number;
  message: string;
  type: ErrorType;
}

interface MobileAgentResult {
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
  results: MobileTestResult[];
}

export default class MobileAgent {
  private logFile: string = './logs/mobile-agent.log';
  private results: MobileTestResult[] = [];

  async run(): Promise<MobileAgentResult> {
    await this.log('📱 Mobile-Agent starting...');

    try {
      // 1. Type checking TypeScript
      await this.log('Running TypeScript type check...');
      await this.runTypeCheck();

      // 2. Linting
      await this.log('Running ESLint...');
      await this.runLint();

      // 3. Tests unitaires
      await this.log('Running unit tests...');
      await this.runUnitTests();

      // 4. Vérifier structure des composants
      await this.log('Checking component structure...');
      await this.checkComponentStructure();

      // 5. Analyser résultats
      const metrics = this.calculateMetrics();
      const errors = this.extractAllErrors();

      await this.log(`✅ Mobile-Agent completed: ${metrics.testsPassed}/${metrics.testsRun} checks passed`);

      return {
        success: metrics.testsFailed === 0,
        errors,
        fixes: [],
        metrics,
        results: this.results,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await this.log(`❌ Mobile-Agent failed: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Type checking TypeScript
   */
  private async runTypeCheck(): Promise<void> {
    const startTime = Date.now();

    try {
      await execAsync(SYSTEM_COMMANDS.mobile.typeCheck, { timeout: 60000 });

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
   * Linting
   */
  private async runLint(): Promise<void> {
    const startTime = Date.now();

    try {
      await execAsync(SYSTEM_COMMANDS.mobile.lint, { timeout: 60000 });

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
   * Tests unitaires
   */
  private async runUnitTests(): Promise<void> {
    const startTime = Date.now();

    try {
      await execAsync(SYSTEM_COMMANDS.mobile.test, { timeout: 120000 });

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
   * Vérifier structure des composants
   */
  private async checkComponentStructure(): Promise<void> {
    const startTime = Date.now();
    const errors: MobileError[] = [];

    try {
      const mobilePath = path.join(process.cwd(), '../mobile');
      const componentsPath = path.join(mobilePath, 'components');
      const screensPath = path.join(mobilePath, 'screens');

      // Vérifier que les dossiers existent
      try {
        await fs.access(componentsPath);
      } catch {
        errors.push({
          message: 'Components directory not found',
          type: ErrorType.CONFIG_ERROR,
        });
      }

      try {
        await fs.access(screensPath);
      } catch {
        errors.push({
          message: 'Screens directory not found',
          type: ErrorType.CONFIG_ERROR,
        });
      }

      // Vérifier app.json
      try {
        const appJsonPath = path.join(mobilePath, 'app.json');
        const appJson = await fs.readFile(appJsonPath, 'utf-8');
        const config = JSON.parse(appJson);

        if (!config.expo) {
          errors.push({
            message: 'Invalid app.json: missing expo configuration',
            type: ErrorType.CONFIG_ERROR,
          });
        }
      } catch (error) {
        errors.push({
          message: 'app.json not found or invalid',
          type: ErrorType.CONFIG_ERROR,
        });
      }

      this.results.push({
        type: 'components',
        passed: errors.length === 0,
        duration: Date.now() - startTime,
        errors,
      });

      if (errors.length > 0) {
        await this.log(`⚠️ Component structure issues: ${errors.length} found`);
      } else {
        await this.log('✅ Component structure valid');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push({
        message: `Structure check failed: ${errorMsg}`,
        type: ErrorType.CONFIG_ERROR,
      });

      this.results.push({
        type: 'components',
        passed: false,
        duration: Date.now() - startTime,
        errors,
      });
    }
  }

  /**
   * Parser erreurs TypeScript
   */
  private parseTypeScriptErrors(output: string): MobileError[] {
    const errors: MobileError[] = [];
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
  private parseESLintErrors(output: string): MobileError[] {
    const errors: MobileError[] = [];
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
   * Parser erreurs Jest
   */
  private parseJestErrors(output: string): MobileError[] {
    const errors: MobileError[] = [];
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
    const highErrors = [ErrorType.CONFIG_ERROR, ErrorType.TYPE_ERROR];
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
    if ([ErrorType.TYPE_ERROR, ErrorType.CONFIG_ERROR].includes(errorType)) {
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
