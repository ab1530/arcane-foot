// Test Agent Type Definitions

export interface TestResult {
  testId: string;
  testName: string;
  status: 'pass' | 'fail' | 'skip' | 'error';
  duration: number;
  error?: string;
  stackTrace?: string;
  screenshot?: string;
  apiCalls?: APICallLog[];
  assertions?: AssertionResult[];
  metadata?: Record<string, any>;
}

export interface APICallLog {
  method: string;
  endpoint: string;
  statusCode: number;
  responseTime: number;
  requestBody?: any;
  responseBody?: any;
  error?: string;
}

export interface AssertionResult {
  description: string;
  passed: boolean;
  expected: any;
  actual: any;
}

export interface AgentReport {
  agentName: string;
  totalTests: number;
  passed: number;
  failed: number;
  errors: number;
  skipped: number;
  duration: number;
  testResults: TestResult[];
  bugs: Bug[];
  recommendations: string[];
}

export interface Bug {
  id: string;
  severity: 'critical' | 'major' | 'minor' | 'trivial';
  category: 'api' | 'ui' | 'data' | 'security' | 'performance' | 'other';
  title: string;
  description: string;
  location: string;
  stackTrace?: string;
  fix?: BugFix;
  relatedTests: string[];
}

export interface BugFix {
  filePath: string;
  description: string;
  patch: string;
  applied: boolean;
  verified: boolean;
}

export interface TestConfig {
  apiBaseUrl: string;
  webBaseUrl: string;
  mobileBaseUrl?: string;
  timeout: number;
  retries: number;
  parallel: boolean;
  headless: boolean;
  screenshots: boolean;
  verbose: boolean;
}

export interface UserCredentials {
  email: string;
  password: string;
  role: string;
  tier?: string;
}

export interface TestContext {
  config: TestConfig;
  users: Record<string, UserCredentials>;
  accessTokens: Record<string, string>;
  testData: Record<string, any>;
}

export type AgentType =
  | 'ScoutFlow'
  | 'PlayerFlow'
  | 'AdminFlow'
  | 'CoachFlow'
  | 'AIFlow'
  | 'DataSync'
  | 'RepairBot'
  | 'Regression';
