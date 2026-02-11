/**
 * ARCANE QA AUTONOMY SYSTEM - AGENTS CONFIGURATION
 * Configuration centrale pour tous les agents autonomes
 */

export interface AgentConfig {
  name: string;
  enabled: boolean;
  priority: number; // 1 = highest, 10 = lowest
  timeout: number; // milliseconds
  maxRetries: number;
  dependencies: string[]; // Agents qui doivent s'exécuter avant
  autoFix: boolean;
  escalateOn: string[]; // Types d'erreurs qui déclenchent l'escalade
  runInParallel: boolean;
  schedule?: string; // Cron expression
}

export interface OrchestratorConfig {
  mode: 'local' | 'ci' | 'watch';
  parallelism: number; // Nombre d'agents en parallèle
  stopOnCriticalError: boolean;
  autoCommit: boolean;
  notificationChannels: {
    slack?: string;
    email?: string;
    sentry?: boolean;
  };
  reportPath: string;
  logsPath: string;
}

// ============ CONFIGURATION DES AGENTS ============

export const AGENTS_CONFIG: Record<string, AgentConfig> = {
  'qa-agent': {
    name: 'QA Agent (Universal Tester)',
    enabled: true,
    priority: 1, // Exécute en premier
    timeout: 300000, // 5 minutes
    maxRetries: 2,
    dependencies: [],
    autoFix: false, // Détecte seulement, ne corrige pas
    escalateOn: ['CRITICAL_ERROR', 'CONFIG_ERROR', 'DEPENDENCY_MISSING'],
    runInParallel: false,
    schedule: '0 */6 * * *', // Toutes les 6 heures
  },

  'fix-agent': {
    name: 'Fix Agent (Auto-Repair)',
    enabled: true,
    priority: 2, // Après QA-Agent
    timeout: 180000, // 3 minutes
    maxRetries: 3,
    dependencies: ['qa-agent'],
    autoFix: true,
    escalateOn: ['UNFIXABLE_ERROR', 'BUSINESS_LOGIC_ERROR', 'SECURITY_ERROR'],
    runInParallel: false,
  },

  'api-agent': {
    name: 'API Agent (Endpoint Validator)',
    enabled: true, // ✅ Implémenté
    priority: 3,
    timeout: 120000, // 2 minutes
    maxRetries: 2,
    dependencies: ['qa-agent'],
    autoFix: true,
    escalateOn: ['AUTH_ERROR', 'DB_ERROR', 'EXTERNAL_API_ERROR'],
    runInParallel: true, // Peut tourner en parallèle avec web/mobile agents
  },

  'web-agent': {
    name: 'Web Agent (Next.js Validator)',
    enabled: true, // ✅ Implémenté
    priority: 3,
    timeout: 180000, // 3 minutes
    maxRetries: 2,
    dependencies: ['qa-agent'],
    autoFix: true,
    escalateOn: ['SSR_ERROR', 'BUILD_ERROR', 'ROUTE_ERROR'],
    runInParallel: true,
  },

  'mobile-agent': {
    name: 'Mobile Agent (Expo/RN Validator)',
    enabled: true, // ✅ Implémenté
    priority: 3,
    timeout: 240000, // 4 minutes (Expo peut être lent)
    maxRetries: 2,
    dependencies: ['qa-agent'],
    autoFix: true,
    escalateOn: ['NATIVE_MODULE_ERROR', 'BUILD_ERROR', 'METRO_ERROR'],
    runInParallel: true,
  },

  'ai-agent': {
    name: 'AI Agent (FastAPI Validator)',
    enabled: true, // ✅ Implémenté
    priority: 4,
    timeout: 120000, // 2 minutes
    maxRetries: 2,
    dependencies: ['api-agent'],
    autoFix: true,
    escalateOn: ['MODEL_LOADING_ERROR', 'INFERENCE_ERROR', 'TIMEOUT'],
    runInParallel: true,
  },

  'devops-agent': {
    name: 'DevOps Agent (Infrastructure Validator)',
    enabled: true, // ✅ Implémenté
    priority: 5,
    timeout: 300000, // 5 minutes (Docker builds peuvent être longs)
    maxRetries: 1,
    dependencies: [],
    autoFix: true,
    escalateOn: ['DOCKER_BUILD_FAIL', 'PIPELINE_FAIL', 'SECRETS_MISSING'],
    runInParallel: false,
  },

  'reporter-agent': {
    name: 'Reporter Agent (Documentation Generator)',
    enabled: true,
    priority: 10, // Toujours en dernier
    timeout: 30000, // 30 secondes
    maxRetries: 1,
    dependencies: ['qa-agent', 'fix-agent', 'api-agent', 'web-agent', 'mobile-agent', 'ai-agent', 'devops-agent'],
    autoFix: false,
    escalateOn: [],
    runInParallel: false,
  },
};

// ============ CONFIGURATION ORCHESTRATOR ============

export const ORCHESTRATOR_CONFIG: OrchestratorConfig = {
  mode: process.env.QA_MODE as 'local' | 'ci' | 'watch' || 'local',
  parallelism: 3, // Max 3 agents en parallèle
  stopOnCriticalError: true,
  autoCommit: process.env.QA_AUTO_COMMIT === 'true',
  notificationChannels: {
    slack: process.env.SLACK_WEBHOOK_URL,
    email: process.env.QA_NOTIFICATION_EMAIL,
    sentry: process.env.SENTRY_DSN ? true : false,
  },
  reportPath: './reports/QA_AUTONOMY_REPORT.md',
  logsPath: './logs',
};

// ============ TYPES D'ERREURS ET ACTIONS ============

export enum ErrorType {
  // Syntax & Types
  SYNTAX_ERROR = 'SYNTAX_ERROR',
  TYPE_ERROR = 'TYPE_ERROR',
  IMPORT_ERROR = 'IMPORT_ERROR',

  // Logic
  LOGIC_ERROR = 'LOGIC_ERROR',
  NULL_POINTER = 'NULL_POINTER',
  UNDEFINED_VARIABLE = 'UNDEFINED_VARIABLE',

  // API & Network
  API_404 = 'API_404',
  API_500 = 'API_500',
  TIMEOUT = 'TIMEOUT',
  AUTH_ERROR = 'AUTH_ERROR',

  // Database
  DB_CONNECTION_ERROR = 'DB_CONNECTION_ERROR',
  DB_QUERY_ERROR = 'DB_QUERY_ERROR',
  MIGRATION_ERROR = 'MIGRATION_ERROR',

  // Configuration
  CONFIG_ERROR = 'CONFIG_ERROR',
  ENV_VAR_MISSING = 'ENV_VAR_MISSING',
  DEPENDENCY_MISSING = 'DEPENDENCY_MISSING',

  // Build & Deploy
  BUILD_ERROR = 'BUILD_ERROR',
  DOCKER_BUILD_FAIL = 'DOCKER_BUILD_FAIL',
  PIPELINE_FAIL = 'PIPELINE_FAIL',

  // Security
  SECURITY_ERROR = 'SECURITY_ERROR',
  SECRETS_EXPOSED = 'SECRETS_EXPOSED',

  // Tests
  TEST_FAIL = 'TEST_FAIL',
  E2E_FAIL = 'E2E_FAIL',

  // Critical
  CRITICAL_ERROR = 'CRITICAL_ERROR',
  UNFIXABLE_ERROR = 'UNFIXABLE_ERROR',
}

export enum FixStrategy {
  AUTO_FIX = 'AUTO_FIX',           // Correction automatique
  MANUAL_FIX = 'MANUAL_FIX',       // Nécessite intervention manuelle
  ESCALATE = 'ESCALATE',           // Escalade immédiate
  RETRY = 'RETRY',                 // Réessayer
  SKIP = 'SKIP',                   // Ignorer
}

// Mapping ErrorType → FixStrategy
export const ERROR_FIX_STRATEGY: Record<ErrorType, FixStrategy> = {
  // Auto-fixables
  [ErrorType.SYNTAX_ERROR]: FixStrategy.AUTO_FIX,
  [ErrorType.TYPE_ERROR]: FixStrategy.AUTO_FIX,
  [ErrorType.IMPORT_ERROR]: FixStrategy.AUTO_FIX,
  [ErrorType.UNDEFINED_VARIABLE]: FixStrategy.AUTO_FIX,
  [ErrorType.API_404]: FixStrategy.AUTO_FIX,
  [ErrorType.ENV_VAR_MISSING]: FixStrategy.AUTO_FIX,
  [ErrorType.DEPENDENCY_MISSING]: FixStrategy.AUTO_FIX,

  // Retriables
  [ErrorType.TIMEOUT]: FixStrategy.RETRY,
  [ErrorType.DB_CONNECTION_ERROR]: FixStrategy.RETRY,

  // Escalade immédiate
  [ErrorType.SECURITY_ERROR]: FixStrategy.ESCALATE,
  [ErrorType.SECRETS_EXPOSED]: FixStrategy.ESCALATE,
  [ErrorType.CRITICAL_ERROR]: FixStrategy.ESCALATE,
  [ErrorType.UNFIXABLE_ERROR]: FixStrategy.ESCALATE,
  [ErrorType.MIGRATION_ERROR]: FixStrategy.ESCALATE,
  [ErrorType.PIPELINE_FAIL]: FixStrategy.ESCALATE,

  // Manuel
  [ErrorType.LOGIC_ERROR]: FixStrategy.MANUAL_FIX,
  [ErrorType.AUTH_ERROR]: FixStrategy.MANUAL_FIX,
  [ErrorType.DB_QUERY_ERROR]: FixStrategy.MANUAL_FIX,
  [ErrorType.CONFIG_ERROR]: FixStrategy.MANUAL_FIX,
  [ErrorType.BUILD_ERROR]: FixStrategy.MANUAL_FIX,
  [ErrorType.DOCKER_BUILD_FAIL]: FixStrategy.MANUAL_FIX,

  // Skip
  [ErrorType.NULL_POINTER]: FixStrategy.AUTO_FIX,
  [ErrorType.API_500]: FixStrategy.MANUAL_FIX,
  [ErrorType.TEST_FAIL]: FixStrategy.AUTO_FIX,
  [ErrorType.E2E_FAIL]: FixStrategy.MANUAL_FIX,
};

// ============ PATTERNS DE CORRECTION ============

export interface FixPattern {
  errorPattern: RegExp;
  fixAction: string;
  confidence: number; // 0-1
  examples: string[];
}

export const FIX_PATTERNS: FixPattern[] = [
  {
    errorPattern: /Cannot find module ['"](.+?)['"]/,
    fixAction: 'ADD_IMPORT',
    confidence: 0.95,
    examples: [
      "Cannot find module '@nestjs/common'",
      "Cannot find module '../services/user.service'",
    ],
  },
  {
    errorPattern: /Property ['"](.+?)['"] does not exist on type/,
    fixAction: 'ADD_TYPE_ANNOTATION',
    confidence: 0.85,
    examples: [
      "Property 'firstName' does not exist on type 'Player'",
    ],
  },
  {
    errorPattern: /(.+?) is not defined/,
    fixAction: 'DEFINE_VARIABLE',
    confidence: 0.75,
    examples: [
      "userId is not defined",
      "fetchData is not defined",
    ],
  },
  {
    errorPattern: /Route ['"](.+?)['"] not found/,
    fixAction: 'CREATE_ROUTE_STUB',
    confidence: 0.90,
    examples: [
      "Route '/api/players' not found",
    ],
  },
  {
    errorPattern: /Expected (\d+) arguments, but got (\d+)/,
    fixAction: 'FIX_FUNCTION_PARAMS',
    confidence: 0.80,
    examples: [
      "Expected 2 arguments, but got 1",
    ],
  },
  {
    errorPattern: /Module build failed.*SyntaxError/,
    fixAction: 'FIX_SYNTAX',
    confidence: 0.70,
    examples: [
      "Module build failed: SyntaxError: Unexpected token",
    ],
  },
  {
    errorPattern: /ECONNREFUSED.*:(\d+)/,
    fixAction: 'CHECK_SERVICE_STATUS',
    confidence: 0.60,
    examples: [
      "ECONNREFUSED localhost:6379",
      "ECONNREFUSED localhost:5432",
    ],
  },
];

// ============ COMMANDES SYSTÈME ============

export const SYSTEM_COMMANDS = {
  backend: {
    test: 'cd ../backend && npm test',
    testWatch: 'cd ../backend && npm run test:watch',
    testE2E: 'cd ../backend && npm run test:e2e',
    build: 'cd ../backend && npm run build',
    lint: 'cd ../backend && npm run lint',
    format: 'cd ../backend && npm run format',
  },
  web: {
    test: 'cd ../web && npm test',
    testE2E: 'cd ../web && npx playwright test',
    build: 'cd ../web && npm run build',
    lint: 'cd ../web && npm run lint',
    typeCheck: 'cd ../web && npm run type-check',
  },
  mobile: {
    test: 'cd ../mobile && npm test',
    lint: 'cd ../mobile && npm run lint',
    typeCheck: 'cd ../mobile && npm run type-check',
  },
  ai: {
    test: 'cd ../ai-service && python -m pytest',
    lint: 'cd ../ai-service && ruff check .',
    typeCheck: 'cd ../ai-service && mypy .',
  },
  docker: {
    build: 'cd .. && docker-compose build',
    up: 'cd .. && docker-compose up -d',
    down: 'cd .. && docker-compose down',
    logs: 'cd .. && docker-compose logs -f',
  },
};

// ============ SEUILS DE QUALITÉ ============

export const QUALITY_THRESHOLDS = {
  testCoverage: {
    minimum: 70, // %
    target: 85,
    critical: 50,
  },
  buildTime: {
    warning: 180000, // 3 minutes
    critical: 300000, // 5 minutes
  },
  errorRate: {
    acceptable: 0.05, // 5%
    warning: 0.10,    // 10%
    critical: 0.20,   // 20%
  },
  autoFixRate: {
    target: 0.70, // 70% des erreurs auto-corrigées
    minimum: 0.50,
  },
};

// ============ EXPORT ============

export default {
  agents: AGENTS_CONFIG,
  orchestrator: ORCHESTRATOR_CONFIG,
  errorStrategies: ERROR_FIX_STRATEGY,
  fixPatterns: FIX_PATTERNS,
  commands: SYSTEM_COMMANDS,
  thresholds: QUALITY_THRESHOLDS,
};
