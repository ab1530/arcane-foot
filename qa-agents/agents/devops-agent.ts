/**
 * DEVOPS-AGENT - Infrastructure Validator
 * Valide Docker, GitLab CI, variables d'environnement, Sentry, Supabase
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ErrorType, FixStrategy, SYSTEM_COMMANDS } from '../agents.config';

const execAsync = promisify(exec);

interface DevOpsCheckResult {
  type: 'docker' | 'gitlab-ci' | 'env' | 'sentry' | 'supabase' | 'secrets';
  passed: boolean;
  duration: number;
  errors: DevOpsError[];
  warnings: string[];
}

interface DevOpsError {
  message: string;
  type: ErrorType;
  file?: string;
}

interface DevOpsAgentResult {
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
  results: DevOpsCheckResult[];
}

export default class DevOpsAgent {
  private logFile: string = './logs/devops-agent.log';
  private results: DevOpsCheckResult[] = [];

  async run(): Promise<DevOpsAgentResult> {
    await this.log('🔧 DevOps-Agent starting...');

    try {
      // 1. Valider Docker
      await this.log('Validating Docker configuration...');
      await this.validateDocker();

      // 2. Valider GitLab CI
      await this.log('Validating GitLab CI configuration...');
      await this.validateGitLabCI();

      // 3. Valider variables d'environnement
      await this.log('Validating environment variables...');
      await this.validateEnvironmentVariables();

      // 4. Valider Sentry
      await this.log('Validating Sentry configuration...');
      await this.validateSentry();

      // 5. Valider Supabase
      await this.log('Validating Supabase configuration...');
      await this.validateSupabase();

      // 6. Vérifier secrets exposés
      await this.log('Checking for exposed secrets...');
      await this.checkExposedSecrets();

      // 7. Analyser résultats
      const metrics = this.calculateMetrics();
      const errors = this.extractAllErrors();

      await this.log(`✅ DevOps-Agent completed: ${metrics.testsPassed}/${metrics.testsRun} checks passed`);

      return {
        success: metrics.testsFailed === 0,
        errors,
        fixes: [],
        metrics,
        results: this.results,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await this.log(`❌ DevOps-Agent failed: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Valider configuration Docker
   */
  private async validateDocker(): Promise<void> {
    const startTime = Date.now();
    const errors: DevOpsError[] = [];
    const warnings: string[] = [];

    try {
      const dockerComposePath = path.join(process.cwd(), '../docker-compose.yml');

      // Vérifier que docker-compose.yml existe
      try {
        const content = await fs.readFile(dockerComposePath, 'utf-8');

        // Vérifier les services critiques
        const requiredServices = ['backend', 'database'];
        for (const service of requiredServices) {
          if (!content.includes(service)) {
            warnings.push(`Service '${service}' not found in docker-compose.yml`);
          }
        }

        // Vérifier les ports exposés
        if (!content.includes('ports:')) {
          warnings.push('No ports exposed in docker-compose.yml');
        }

        // Vérifier les variables d'environnement
        if (!content.includes('environment:') && !content.includes('env_file:')) {
          warnings.push('No environment variables configured in docker-compose.yml');
        }
      } catch {
        errors.push({
          message: 'docker-compose.yml not found',
          type: ErrorType.CONFIG_ERROR,
          file: dockerComposePath,
        });
      }

      // Vérifier Dockerfiles
      const dockerfiles = [
        '../backend/Dockerfile',
        '../web/Dockerfile',
        '../ai-service/Dockerfile',
      ];

      for (const dockerfile of dockerfiles) {
        const dockerfilePath = path.join(process.cwd(), dockerfile);
        try {
          await fs.access(dockerfilePath);
        } catch {
          warnings.push(`${dockerfile} not found`);
        }
      }

      this.results.push({
        type: 'docker',
        passed: errors.length === 0,
        duration: Date.now() - startTime,
        errors,
        warnings,
      });

      if (errors.length > 0) {
        await this.log(`❌ Docker validation failed: ${errors.length} errors`);
      } else if (warnings.length > 0) {
        await this.log(`⚠️ Docker validation passed with ${warnings.length} warnings`);
      } else {
        await this.log('✅ Docker configuration valid');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push({
        message: `Docker validation failed: ${errorMsg}`,
        type: ErrorType.DOCKER_BUILD_FAIL,
      });

      this.results.push({
        type: 'docker',
        passed: false,
        duration: Date.now() - startTime,
        errors,
        warnings,
      });
    }
  }

  /**
   * Valider GitLab CI
   */
  private async validateGitLabCI(): Promise<void> {
    const startTime = Date.now();
    const errors: DevOpsError[] = [];
    const warnings: string[] = [];

    try {
      const gitlabCIPath = path.join(process.cwd(), '../.gitlab-ci.yml');

      try {
        const content = await fs.readFile(gitlabCIPath, 'utf-8');

        // Vérifier les stages critiques
        const requiredStages = ['build', 'test', 'deploy'];
        for (const stage of requiredStages) {
          if (!content.includes(`- ${stage}`) && !content.includes(`stage: ${stage}`)) {
            warnings.push(`Stage '${stage}' not found in .gitlab-ci.yml`);
          }
        }

        // Vérifier les scripts de test
        if (!content.includes('npm test') && !content.includes('pytest')) {
          warnings.push('No test scripts found in .gitlab-ci.yml');
        }

        // Vérifier artifacts
        if (!content.includes('artifacts:')) {
          warnings.push('No artifacts configuration in .gitlab-ci.yml');
        }
      } catch {
        errors.push({
          message: '.gitlab-ci.yml not found',
          type: ErrorType.PIPELINE_FAIL,
          file: gitlabCIPath,
        });
      }

      this.results.push({
        type: 'gitlab-ci',
        passed: errors.length === 0,
        duration: Date.now() - startTime,
        errors,
        warnings,
      });

      if (errors.length > 0) {
        await this.log(`❌ GitLab CI validation failed: ${errors.length} errors`);
      } else if (warnings.length > 0) {
        await this.log(`⚠️ GitLab CI validation passed with ${warnings.length} warnings`);
      } else {
        await this.log('✅ GitLab CI configuration valid');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push({
        message: `GitLab CI validation failed: ${errorMsg}`,
        type: ErrorType.PIPELINE_FAIL,
      });

      this.results.push({
        type: 'gitlab-ci',
        passed: false,
        duration: Date.now() - startTime,
        errors,
        warnings,
      });
    }
  }

  /**
   * Valider variables d'environnement
   */
  private async validateEnvironmentVariables(): Promise<void> {
    const startTime = Date.now();
    const errors: DevOpsError[] = [];
    const warnings: string[] = [];

    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'SUPABASE_URL',
      'SUPABASE_KEY',
      'SENTRY_DSN',
    ];

    try {
      const backendEnvPath = path.join(process.cwd(), '../backend/.env');

      try {
        const content = await fs.readFile(backendEnvPath, 'utf-8');

        for (const envVar of requiredEnvVars) {
          if (!content.includes(`${envVar}=`)) {
            errors.push({
              message: `Required environment variable '${envVar}' not found in backend/.env`,
              type: ErrorType.ENV_VAR_MISSING,
              file: backendEnvPath,
            });
          }
        }

        // Vérifier .env.example existe
        const envExamplePath = path.join(process.cwd(), '../backend/.env.example');
        try {
          await fs.access(envExamplePath);
        } catch {
          warnings.push('.env.example not found - should document required variables');
        }
      } catch {
        errors.push({
          message: 'backend/.env file not found',
          type: ErrorType.CONFIG_ERROR,
          file: backendEnvPath,
        });
      }

      this.results.push({
        type: 'env',
        passed: errors.length === 0,
        duration: Date.now() - startTime,
        errors,
        warnings,
      });

      if (errors.length > 0) {
        await this.log(`❌ Environment variables validation failed: ${errors.length} missing`);
      } else {
        await this.log('✅ All required environment variables present');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push({
        message: `Environment validation failed: ${errorMsg}`,
        type: ErrorType.CONFIG_ERROR,
      });

      this.results.push({
        type: 'env',
        passed: false,
        duration: Date.now() - startTime,
        errors,
        warnings,
      });
    }
  }

  /**
   * Valider Sentry
   */
  private async validateSentry(): Promise<void> {
    const startTime = Date.now();
    const errors: DevOpsError[] = [];
    const warnings: string[] = [];

    try {
      // Vérifier configuration Sentry dans le backend
      const instrumentPath = path.join(process.cwd(), '../backend/src/instrument.ts');

      try {
        const content = await fs.readFile(instrumentPath, 'utf-8');

        if (!content.includes('@sentry/node')) {
          warnings.push('Sentry not properly configured in instrument.ts');
        }

        if (!content.includes('Sentry.init')) {
          errors.push({
            message: 'Sentry.init() not found in instrument.ts',
            type: ErrorType.CONFIG_ERROR,
            file: instrumentPath,
          });
        }
      } catch {
        warnings.push('instrument.ts not found - Sentry may not be configured');
      }

      this.results.push({
        type: 'sentry',
        passed: errors.length === 0,
        duration: Date.now() - startTime,
        errors,
        warnings,
      });

      if (errors.length > 0) {
        await this.log(`❌ Sentry validation failed: ${errors.length} errors`);
      } else if (warnings.length > 0) {
        await this.log(`⚠️ Sentry validation passed with ${warnings.length} warnings`);
      } else {
        await this.log('✅ Sentry configuration valid');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push({
        message: `Sentry validation failed: ${errorMsg}`,
        type: ErrorType.CONFIG_ERROR,
      });

      this.results.push({
        type: 'sentry',
        passed: false,
        duration: Date.now() - startTime,
        errors,
        warnings,
      });
    }
  }

  /**
   * Valider Supabase
   */
  private async validateSupabase(): Promise<void> {
    const startTime = Date.now();
    const errors: DevOpsError[] = [];
    const warnings: string[] = [];

    try {
      // Vérifier configuration Supabase
      const supabaseServicePath = path.join(process.cwd(), '../backend/src/modules/supabase/supabase.service.ts');

      try {
        const content = await fs.readFile(supabaseServicePath, 'utf-8');

        if (!content.includes('@supabase/supabase-js')) {
          warnings.push('Supabase client not imported');
        }

        if (!content.includes('createClient')) {
          errors.push({
            message: 'Supabase client not initialized',
            type: ErrorType.CONFIG_ERROR,
            file: supabaseServicePath,
          });
        }
      } catch {
        warnings.push('supabase.service.ts not found - Supabase may not be configured');
      }

      this.results.push({
        type: 'supabase',
        passed: errors.length === 0,
        duration: Date.now() - startTime,
        errors,
        warnings,
      });

      if (errors.length > 0) {
        await this.log(`❌ Supabase validation failed: ${errors.length} errors`);
      } else if (warnings.length > 0) {
        await this.log(`⚠️ Supabase validation passed with ${warnings.length} warnings`);
      } else {
        await this.log('✅ Supabase configuration valid');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push({
        message: `Supabase validation failed: ${errorMsg}`,
        type: ErrorType.CONFIG_ERROR,
      });

      this.results.push({
        type: 'supabase',
        passed: false,
        duration: Date.now() - startTime,
        errors,
        warnings,
      });
    }
  }

  /**
   * Vérifier secrets exposés
   */
  private async checkExposedSecrets(): Promise<void> {
    const startTime = Date.now();
    const errors: DevOpsError[] = [];
    const warnings: string[] = [];

    try {
      // Vérifier que .env n'est pas commité
      const { stdout } = await execAsync('cd .. && git ls-files | grep -E "\.env$" || echo ""', { timeout: 5000 });

      if (stdout.trim()) {
        errors.push({
          message: '.env file is tracked by git - SECURITY RISK!',
          type: ErrorType.SECRETS_EXPOSED,
        });
      }

      // Vérifier .gitignore
      const gitignorePath = path.join(process.cwd(), '../.gitignore');
      try {
        const content = await fs.readFile(gitignorePath, 'utf-8');

        if (!content.includes('.env')) {
          errors.push({
            message: '.env not in .gitignore - SECURITY RISK!',
            type: ErrorType.SECRETS_EXPOSED,
            file: gitignorePath,
          });
        }
      } catch {
        warnings.push('.gitignore not found');
      }

      this.results.push({
        type: 'secrets',
        passed: errors.length === 0,
        duration: Date.now() - startTime,
        errors,
        warnings,
      });

      if (errors.length > 0) {
        await this.log(`🔴 SECRET EXPOSURE DETECTED: ${errors.length} critical issues`);
      } else {
        await this.log('✅ No exposed secrets detected');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push({
        message: `Secret check failed: ${errorMsg}`,
        type: ErrorType.SECURITY_ERROR,
      });

      this.results.push({
        type: 'secrets',
        passed: false,
        duration: Date.now() - startTime,
        errors,
        warnings,
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
        file: err.file,
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
    const criticalErrors = [ErrorType.SECRETS_EXPOSED, ErrorType.SECURITY_ERROR];
    const highErrors = [ErrorType.PIPELINE_FAIL, ErrorType.DOCKER_BUILD_FAIL];
    const mediumErrors = [ErrorType.CONFIG_ERROR, ErrorType.ENV_VAR_MISSING];

    if (criticalErrors.includes(errorType)) return 'critical';
    if (highErrors.includes(errorType)) return 'high';
    if (mediumErrors.includes(errorType)) return 'medium';
    return 'low';
  }

  /**
   * Obtenir stratégie de fix
   */
  private getFixStrategy(errorType: ErrorType): FixStrategy {
    if ([ErrorType.SECRETS_EXPOSED, ErrorType.SECURITY_ERROR].includes(errorType)) {
      return FixStrategy.ESCALATE;
    }
    if ([ErrorType.ENV_VAR_MISSING].includes(errorType)) {
      return FixStrategy.AUTO_FIX;
    }
    if ([ErrorType.CONFIG_ERROR, ErrorType.PIPELINE_FAIL, ErrorType.DOCKER_BUILD_FAIL].includes(errorType)) {
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
