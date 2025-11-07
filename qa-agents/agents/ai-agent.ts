/**
 * AI-AGENT - FastAPI Validator
 * Teste le service IA (FastAPI) et sa connectivité avec NestJS
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ErrorType, FixStrategy, SYSTEM_COMMANDS } from '../agents.config';

const execAsync = promisify(exec);

interface AITestResult {
  type: 'connectivity' | 'endpoints' | 'unit' | 'integration';
  passed: boolean;
  duration: number;
  errors: AIError[];
}

interface AIError {
  message: string;
  type: ErrorType;
}

interface AIAgentResult {
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
  results: AITestResult[];
}

export default class AIAgent {
  private logFile: string = './logs/ai-agent.log';
  private results: AITestResult[] = [];
  private aiServiceURL: string = 'http://localhost:8000';

  async run(): Promise<AIAgentResult> {
    await this.log('🤖 AI-Agent starting...');

    try {
      // 1. Vérifier connectivité du service IA
      await this.log('Checking AI service connectivity...');
      await this.checkConnectivity();

      // 2. Tester les endpoints FastAPI
      await this.log('Testing FastAPI endpoints...');
      await this.testEndpoints();

      // 3. Tests unitaires Python (si disponibles)
      await this.log('Running Python unit tests...');
      await this.runUnitTests();

      // 4. Test d'intégration NestJS ↔ FastAPI
      await this.log('Testing NestJS ↔ FastAPI integration...');
      await this.testIntegration();

      // 5. Analyser résultats
      const metrics = this.calculateMetrics();
      const errors = this.extractAllErrors();

      await this.log(`✅ AI-Agent completed: ${metrics.testsPassed}/${metrics.testsRun} checks passed`);

      return {
        success: metrics.testsFailed === 0,
        errors,
        fixes: [],
        metrics,
        results: this.results,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await this.log(`❌ AI-Agent failed: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Vérifier connectivité du service IA
   */
  private async checkConnectivity(): Promise<void> {
    const startTime = Date.now();
    const errors: AIError[] = [];

    try {
      // Vérifier si le service répond
      const { stdout } = await execAsync(
        `curl -s -o /dev/null -w "%{http_code}" ${this.aiServiceURL}/health || echo "000"`,
        { timeout: 5000 }
      );

      const status = parseInt(stdout.trim());

      if (status === 0) {
        errors.push({
          message: `AI service not reachable at ${this.aiServiceURL}`,
          type: ErrorType.TIMEOUT,
        });
      } else if (status === 404) {
        errors.push({
          message: 'AI service /health endpoint not found',
          type: ErrorType.API_404,
        });
      } else if (status !== 200) {
        errors.push({
          message: `AI service returned unexpected status: ${status}`,
          type: ErrorType.API_500,
        });
      }

      this.results.push({
        type: 'connectivity',
        passed: errors.length === 0,
        duration: Date.now() - startTime,
        errors,
      });

      if (errors.length === 0) {
        await this.log(`✅ AI service is reachable at ${this.aiServiceURL}`);
      } else {
        await this.log(`⚠️ AI service connectivity issues: ${errors.length} found`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push({
        message: `Connectivity check failed: ${errorMsg}`,
        type: ErrorType.TIMEOUT,
      });

      this.results.push({
        type: 'connectivity',
        passed: false,
        duration: Date.now() - startTime,
        errors,
      });
    }
  }

  /**
   * Tester les endpoints FastAPI
   */
  private async testEndpoints(): Promise<void> {
    const startTime = Date.now();
    const errors: AIError[] = [];

    const endpoints = [
      { method: 'GET', path: '/health', expectedStatus: 200 },
      { method: 'POST', path: '/api/predict', expectedStatus: [200, 422] }, // 422 si body manquant
      { method: 'POST', path: '/api/analyze', expectedStatus: [200, 422] },
    ];

    for (const endpoint of endpoints) {
      try {
        let curlCommand = '';

        if (endpoint.method === 'GET') {
          curlCommand = `curl -s -o /dev/null -w "%{http_code}" -X GET ${this.aiServiceURL}${endpoint.path}`;
        } else {
          curlCommand = `curl -s -o /dev/null -w "%{http_code}" -X POST ${this.aiServiceURL}${endpoint.path} -H "Content-Type: application/json" -d '{}'`;
        }

        const { stdout } = await execAsync(curlCommand, { timeout: 10000 });
        const status = parseInt(stdout.trim());

        const expectedStatuses = Array.isArray(endpoint.expectedStatus)
          ? endpoint.expectedStatus
          : [endpoint.expectedStatus];

        if (!expectedStatuses.includes(status)) {
          errors.push({
            message: `${endpoint.method} ${endpoint.path}: got ${status}, expected ${expectedStatuses.join(' or ')}`,
            type: status === 404 ? ErrorType.API_404 : ErrorType.API_500,
          });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push({
          message: `${endpoint.method} ${endpoint.path}: ${errorMsg}`,
          type: ErrorType.TIMEOUT,
        });
      }
    }

    this.results.push({
      type: 'endpoints',
      passed: errors.length === 0,
      duration: Date.now() - startTime,
      errors,
    });

    if (errors.length > 0) {
      await this.log(`❌ Endpoint tests failed: ${errors.length} errors`);
    } else {
      await this.log('✅ All FastAPI endpoints responding correctly');
    }
  }

  /**
   * Tests unitaires Python
   */
  private async runUnitTests(): Promise<void> {
    const startTime = Date.now();
    const errors: AIError[] = [];

    try {
      await execAsync(SYSTEM_COMMANDS.ai.test, { timeout: 120000 });

      this.results.push({
        type: 'unit',
        passed: true,
        duration: Date.now() - startTime,
        errors: [],
      });

      await this.log('✅ Python unit tests passed');
    } catch (error: any) {
      const output = (error.stdout || '') + (error.stderr || '');

      // Parser erreurs pytest
      if (output.includes('FAILED')) {
        const failRegex = /FAILED\s+(.+)/g;
        let match;

        while ((match = failRegex.exec(output)) !== null) {
          errors.push({
            message: `Test failed: ${match[1]}`,
            type: ErrorType.TEST_FAIL,
          });
        }
      } else if (output.includes('ERROR')) {
        errors.push({
          message: 'Python tests encountered errors',
          type: ErrorType.TEST_FAIL,
        });
      }

      this.results.push({
        type: 'unit',
        passed: false,
        duration: Date.now() - startTime,
        errors,
      });

      await this.log(`❌ Python unit tests failed: ${errors.length} failures`);
    }
  }

  /**
   * Test intégration NestJS ↔ FastAPI
   */
  private async testIntegration(): Promise<void> {
    const startTime = Date.now();
    const errors: AIError[] = [];

    try {
      // Vérifier que le module AI existe dans NestJS
      const aiServicePath = path.join(process.cwd(), '../backend/src/modules/ai/ai.service.ts');

      try {
        await fs.access(aiServicePath);
        await this.log('✅ AI service integration exists in NestJS');
      } catch {
        errors.push({
          message: 'AI service not integrated in NestJS backend',
          type: ErrorType.CONFIG_ERROR,
        });
      }

      // Vérifier la configuration AI_SERVICE_URL
      const envPath = path.join(process.cwd(), '../backend/.env');
      try {
        const envContent = await fs.readFile(envPath, 'utf-8');
        if (!envContent.includes('AI_SERVICE_URL')) {
          errors.push({
            message: 'AI_SERVICE_URL not configured in backend .env',
            type: ErrorType.ENV_VAR_MISSING,
          });
        }
      } catch {
        errors.push({
          message: 'Backend .env file not found',
          type: ErrorType.CONFIG_ERROR,
        });
      }

      this.results.push({
        type: 'integration',
        passed: errors.length === 0,
        duration: Date.now() - startTime,
        errors,
      });

      if (errors.length > 0) {
        await this.log(`⚠️ Integration issues: ${errors.length} found`);
      } else {
        await this.log('✅ NestJS ↔ FastAPI integration configured correctly');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push({
        message: `Integration check failed: ${errorMsg}`,
        type: ErrorType.CONFIG_ERROR,
      });

      this.results.push({
        type: 'integration',
        passed: false,
        duration: Date.now() - startTime,
        errors,
      });
    }
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
        file: undefined,
        line: undefined,
        severity: this.getSeverity(err.type),
        fixStrategy: this.getFixStrategy(err.type),
      }))
    );
  }

  /**
   * Déterminer sévérité
   */
  private getSeverity(errorType: ErrorType): 'low' | 'medium' | 'high' | 'critical' {
    const criticalErrors = [ErrorType.TIMEOUT];
    const highErrors = [ErrorType.CONFIG_ERROR, ErrorType.ENV_VAR_MISSING];
    const mediumErrors = [ErrorType.API_404, ErrorType.API_500];

    if (criticalErrors.includes(errorType)) return 'critical';
    if (highErrors.includes(errorType)) return 'high';
    if (mediumErrors.includes(errorType)) return 'medium';
    return 'low';
  }

  /**
   * Obtenir stratégie de fix
   */
  private getFixStrategy(errorType: ErrorType): FixStrategy {
    if ([ErrorType.ENV_VAR_MISSING].includes(errorType)) {
      return FixStrategy.AUTO_FIX;
    }
    if ([ErrorType.CONFIG_ERROR, ErrorType.API_404].includes(errorType)) {
      return FixStrategy.MANUAL_FIX;
    }
    if ([ErrorType.TIMEOUT].includes(errorType)) {
      return FixStrategy.ESCALATE;
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
