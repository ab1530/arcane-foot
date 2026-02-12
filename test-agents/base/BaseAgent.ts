import axios, { AxiosInstance } from 'axios';
import {
  TestResult,
  AgentReport,
  Bug,
  TestConfig,
  TestContext,
  AgentType,
  APICallLog,
  AssertionResult,
} from './types';
import { Logger } from '../utils/logger';

export abstract class BaseAgent {
  protected agentName: AgentType;
  protected config: TestConfig;
  protected context: TestContext;
  protected apiClient: AxiosInstance;
  protected logger: Logger;
  protected testResults: TestResult[] = [];
  protected bugs: Bug[] = [];
  protected startTime: number = 0;
  protected endTime: number = 0;

  constructor(agentName: AgentType, context: TestContext) {
    this.agentName = agentName;
    this.context = context;
    this.config = context.config;
    this.logger = new Logger(`${agentName}Agent`);

    this.apiClient = axios.create({
      baseURL: this.config.apiBaseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for logging
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        this.logger.error(`API Error: ${error.message}`);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Main execution method - must be implemented by each agent
   */
  abstract run(): Promise<AgentReport>;

  /**
   * Execute a single test case
   */
  protected async executeTest(
    testId: string,
    testName: string,
    testFn: () => Promise<void>
  ): Promise<TestResult> {
    const testStart = Date.now();
    const apiCalls: APICallLog[] = [];
    const assertions: AssertionResult[] = [];

    this.logger.info(`▶ Running: ${testName}`);

    try {
      await testFn();

      const duration = Date.now() - testStart;
      const result: TestResult = {
        testId,
        testName,
        status: 'pass',
        duration,
        apiCalls,
        assertions,
      };

      this.logger.success(`✓ Passed: ${testName} (${duration}ms)`);
      this.testResults.push(result);
      return result;
    } catch (error: any) {
      const duration = Date.now() - testStart;
      const result: TestResult = {
        testId,
        testName,
        status: 'fail',
        duration,
        error: error.message,
        stackTrace: error.stack,
        apiCalls,
        assertions,
      };

      this.logger.error(`✗ Failed: ${testName} - ${error.message}`);
      this.testResults.push(result);

      // Create bug report
      this.createBug(testId, testName, error);

      return result;
    }
  }

  /**
   * Login helper
   */
  protected async login(role: string): Promise<string> {
    const user = this.context.users[role];
    if (!user) {
      throw new Error(`No credentials found for role: ${role}`);
    }

    this.logger.info(`Logging in as ${role}...`);

    try {
      const response = await this.apiClient.post('/auth/login', {
        email: user.email,
        password: user.password,
      });

      const accessToken = response.data.accessToken;
      this.context.accessTokens[role] = accessToken;
      this.logger.success(`Logged in as ${role}`);

      return accessToken;
    } catch (error: any) {
      this.logger.error(`Login failed for ${role}: ${error.message}`);
      throw error;
    }
  }

  /**
   * API call helper with automatic logging
   */
  protected async apiCall<T = any>(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    endpoint: string,
    data?: any,
    token?: string
  ): Promise<T> {
    const callStart = Date.now();
    const headers: Record<string, string> = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await this.apiClient.request({
        method,
        url: endpoint,
        data,
        headers,
      });

      const responseTime = Date.now() - callStart;

      const apiLog: APICallLog = {
        method: method.toUpperCase(),
        endpoint,
        statusCode: response.status,
        responseTime,
        requestBody: data,
        responseBody: response.data,
      };

      this.logger.debug(`API ${method.toUpperCase()} ${endpoint} - ${response.status} (${responseTime}ms)`);

      return response.data;
    } catch (error: any) {
      const responseTime = Date.now() - callStart;

      const apiLog: APICallLog = {
        method: method.toUpperCase(),
        endpoint,
        statusCode: error.response?.status || 0,
        responseTime,
        requestBody: data,
        error: error.message,
      };

      throw error;
    }
  }

  /**
   * Assertion helper
   */
  protected assert(
    description: string,
    condition: boolean,
    expected?: any,
    actual?: any
  ): void {
    const assertion: AssertionResult = {
      description,
      passed: condition,
      expected,
      actual,
    };

    if (!condition) {
      throw new Error(`Assertion failed: ${description}. Expected: ${expected}, Actual: ${actual}`);
    }
  }

  /**
   * Create a bug report
   */
  protected createBug(
    testId: string,
    testName: string,
    error: Error,
    severity: Bug['severity'] = 'major'
  ): void {
    const bug: Bug = {
      id: `BUG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      severity,
      category: this.categorizeBug(error),
      title: testName,
      description: error.message,
      location: this.extractLocation(error),
      stackTrace: error.stack,
      relatedTests: [testId],
    };

    this.bugs.push(bug);
    this.logger.warn(`Bug created: ${bug.id} - ${bug.title}`);
  }

  /**
   * Categorize bug based on error message
   */
  private categorizeBug(error: Error): Bug['category'] {
    const message = error.message.toLowerCase();

    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return 'security';
    }
    if (message.includes('timeout') || message.includes('slow')) {
      return 'performance';
    }
    if (message.includes('data') || message.includes('database')) {
      return 'data';
    }
    if (message.includes('api') || message.includes('endpoint')) {
      return 'api';
    }
    if (message.includes('ui') || message.includes('component')) {
      return 'ui';
    }

    return 'other';
  }

  /**
   * Extract location from stack trace
   */
  private extractLocation(error: Error): string {
    if (!error.stack) return 'Unknown';

    const stackLines = error.stack.split('\n');
    if (stackLines.length > 1) {
      const location = stackLines[1].trim();
      return location;
    }

    return 'Unknown';
  }

  /**
   * Generate agent report
   */
  protected generateReport(): AgentReport {
    const passed = this.testResults.filter(t => t.status === 'pass').length;
    const failed = this.testResults.filter(t => t.status === 'fail').length;
    const errors = this.testResults.filter(t => t.status === 'error').length;
    const skipped = this.testResults.filter(t => t.status === 'skip').length;
    const duration = this.endTime - this.startTime;

    const report: AgentReport = {
      agentName: this.agentName,
      totalTests: this.testResults.length,
      passed,
      failed,
      errors,
      skipped,
      duration,
      testResults: this.testResults,
      bugs: this.bugs,
      recommendations: this.generateRecommendations(),
    };

    return report;
  }

  /**
   * Generate recommendations based on test results
   */
  protected generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Performance recommendations
    const slowTests = this.testResults.filter(t => t.duration > 5000);
    if (slowTests.length > 0) {
      recommendations.push(`${slowTests.length} tests took >5s. Consider optimizing API calls or database queries.`);
    }

    // Error pattern recommendations
    const apiErrors = this.bugs.filter(b => b.category === 'api');
    if (apiErrors.length > 3) {
      recommendations.push(`Multiple API errors detected (${apiErrors.length}). Review error handling and validation.`);
    }

    const securityErrors = this.bugs.filter(b => b.category === 'security');
    if (securityErrors.length > 0) {
      recommendations.push(`Security issues found (${securityErrors.length}). Review RBAC and authentication.`);
    }

    return recommendations;
  }

  /**
   * Sleep utility
   */
  protected async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
