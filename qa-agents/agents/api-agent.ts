/**
 * API-AGENT - Endpoint Validator
 * Teste tous les endpoints NestJS et FastAPI
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ErrorType, FixStrategy } from '../agents.config';

const execAsync = promisify(exec);

interface EndpointTest {
  method: string;
  path: string;
  status: number;
  expectedStatus: number;
  duration: number;
  error?: string;
}

interface APIAgentResult {
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
  endpoints: EndpointTest[];
}

export default class APIAgent {
  private logFile: string = './logs/api-agent.log';
  private endpoints: EndpointTest[] = [];
  private baseURL: string = 'http://localhost:3000';

  async run(): Promise<APIAgentResult> {
    await this.log('🌐 API-Agent starting...');

    try {
      // 1. Découvrir tous les endpoints NestJS
      await this.log('Discovering NestJS endpoints...');
      const nestEndpoints = await this.discoverNestJSEndpoints();

      // 2. Tester chaque endpoint
      await this.log(`Testing ${nestEndpoints.length} endpoints...`);
      for (const endpoint of nestEndpoints) {
        await this.testEndpoint(endpoint);
      }

      // 3. Analyser les résultats
      const metrics = this.calculateMetrics();
      const errors = this.extractErrors();

      await this.log(`✅ API-Agent completed: ${metrics.testsPassed}/${metrics.testsRun} endpoints OK`);

      return {
        success: metrics.testsFailed === 0,
        errors,
        fixes: [],
        metrics,
        endpoints: this.endpoints,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await this.log(`❌ API-Agent failed: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Découvrir les endpoints NestJS en scannant les controllers
   */
  private async discoverNestJSEndpoints(): Promise<Array<{ method: string; path: string; expectedStatus: number }>> {
    const endpoints: Array<{ method: string; path: string; expectedStatus: number }> = [];

    try {
      // Scanner les fichiers controllers
      const controllersPath = path.join(process.cwd(), '../backend/src/modules');
      const modules = await fs.readdir(controllersPath);

      for (const module of modules) {
        const controllerPath = path.join(controllersPath, module, `${module}.controller.ts`);

        try {
          const content = await fs.readFile(controllerPath, 'utf-8');

          // Extraire les routes des décorateurs
          const routes = this.extractRoutesFromController(content, module);
          endpoints.push(...routes);
        } catch {
          // Controller n'existe pas pour ce module
          continue;
        }
      }

      await this.log(`Discovered ${endpoints.length} endpoints`);
      return endpoints;
    } catch (error) {
      await this.log('⚠️ Could not discover endpoints, using default list');

      // Liste par défaut des endpoints critiques
      return [
        { method: 'GET', path: '/api/health', expectedStatus: 200 },
        { method: 'POST', path: '/api/auth/login', expectedStatus: 400 }, // Sans credentials = 400
        { method: 'GET', path: '/api/players', expectedStatus: 401 }, // Sans auth = 401
        { method: 'GET', path: '/api/clubs', expectedStatus: 401 },
        { method: 'GET', path: '/api/matches', expectedStatus: 401 },
      ];
    }
  }

  /**
   * Extraire routes d'un controller via regex
   */
  private extractRoutesFromController(content: string, moduleName: string): Array<{ method: string; path: string; expectedStatus: number }> {
    const endpoints: Array<{ method: string; path: string; expectedStatus: number }> = [];

    // Regex pour capturer @Get(), @Post(), etc.
    const decoratorRegex = /@(Get|Post|Put|Delete|Patch)\(['"]?([^'")\s]*)?['"]?\)/g;
    let match;

    while ((match = decoratorRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const routePath = match[2] || '';
      const fullPath = `/api/${moduleName}${routePath ? '/' + routePath : ''}`;

      endpoints.push({
        method,
        path: fullPath,
        expectedStatus: method === 'GET' ? 401 : 400, // GET sans auth = 401, POST sans body = 400
      });
    }

    return endpoints;
  }

  /**
   * Tester un endpoint
   */
  private async testEndpoint(endpoint: { method: string; path: string; expectedStatus: number }): Promise<void> {
    const startTime = Date.now();

    try {
      let curlCommand = '';

      switch (endpoint.method) {
        case 'GET':
          curlCommand = `curl -s -o /dev/null -w "%{http_code}" -X GET ${this.baseURL}${endpoint.path}`;
          break;
        case 'POST':
          curlCommand = `curl -s -o /dev/null -w "%{http_code}" -X POST ${this.baseURL}${endpoint.path} -H "Content-Type: application/json" -d '{}'`;
          break;
        case 'PUT':
          curlCommand = `curl -s -o /dev/null -w "%{http_code}" -X PUT ${this.baseURL}${endpoint.path} -H "Content-Type: application/json" -d '{}'`;
          break;
        case 'DELETE':
          curlCommand = `curl -s -o /dev/null -w "%{http_code}" -X DELETE ${this.baseURL}${endpoint.path}`;
          break;
        default:
          curlCommand = `curl -s -o /dev/null -w "%{http_code}" ${this.baseURL}${endpoint.path}`;
      }

      const { stdout } = await execAsync(curlCommand, { timeout: 5000 });
      const status = parseInt(stdout.trim());
      const duration = Date.now() - startTime;

      const result: EndpointTest = {
        method: endpoint.method,
        path: endpoint.path,
        status,
        expectedStatus: endpoint.expectedStatus,
        duration,
      };

      // Vérifier le statut
      if (status === 404) {
        result.error = `Route not found`;
      } else if (status === 500) {
        result.error = `Internal server error`;
      } else if (status !== endpoint.expectedStatus && ![200, 201, 400, 401].includes(status)) {
        result.error = `Unexpected status: got ${status}, expected ${endpoint.expectedStatus}`;
      }

      this.endpoints.push(result);

      if (result.error) {
        await this.log(`❌ ${endpoint.method} ${endpoint.path} → ${status} (${result.error})`);
      } else {
        await this.log(`✅ ${endpoint.method} ${endpoint.path} → ${status} (${duration}ms)`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);

      this.endpoints.push({
        method: endpoint.method,
        path: endpoint.path,
        status: 0,
        expectedStatus: endpoint.expectedStatus,
        duration,
        error: `Request failed: ${errorMsg}`,
      });

      await this.log(`❌ ${endpoint.method} ${endpoint.path} → ERROR: ${errorMsg}`);
    }
  }

  /**
   * Calculer métriques
   */
  private calculateMetrics() {
    const testsRun = this.endpoints.length;
    const testsPassed = this.endpoints.filter(e => !e.error).length;
    const testsFailed = this.endpoints.filter(e => e.error).length;
    const errorsDetected = testsFailed;

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
   * Extraire erreurs
   */
  private extractErrors() {
    return this.endpoints
      .filter(e => e.error)
      .map(e => ({
        type: e.status === 404 ? ErrorType.API_404 :
              e.status === 500 ? ErrorType.API_500 :
              e.status === 0 ? ErrorType.TIMEOUT :
              ErrorType.API_500,
        message: `${e.method} ${e.path}: ${e.error}`,
        file: undefined,
        line: undefined,
        severity: e.status === 404 ? 'medium' as const :
                  e.status === 500 ? 'high' as const :
                  'critical' as const,
        fixStrategy: e.status === 404 ? FixStrategy.AUTO_FIX :
                     e.status === 500 ? FixStrategy.MANUAL_FIX :
                     FixStrategy.ESCALATE,
      }));
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
