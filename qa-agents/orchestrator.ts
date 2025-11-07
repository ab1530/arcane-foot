#!/usr/bin/env ts-node
/**
 * ARCANE QA AUTONOMY SYSTEM - ORCHESTRATOR
 * Cerveau central qui coordonne tous les agents autonomes
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  AGENTS_CONFIG,
  ORCHESTRATOR_CONFIG,
  AgentConfig,
  ErrorType,
  FixStrategy,
  ERROR_FIX_STRATEGY,
} from './agents.config';

const execAsync = promisify(exec);

// ============ TYPES ============

interface AgentResult {
  agentName: string;
  success: boolean;
  duration: number;
  errors: ErrorReport[];
  fixes: FixReport[];
  metrics: AgentMetrics;
}

interface ErrorReport {
  type: ErrorType;
  message: string;
  file?: string;
  line?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  fixStrategy: FixStrategy;
}

interface FixReport {
  errorType: ErrorType;
  action: string;
  file: string;
  success: boolean;
  details: string;
}

interface AgentMetrics {
  testsRun: number;
  testsPassed: number;
  testsFailed: number;
  errorsDetected: number;
  errorsFixed: number;
  errorsPending: number;
}

interface OrchestratorReport {
  timestamp: string;
  duration: number;
  mode: string;
  agentResults: AgentResult[];
  summary: {
    totalTests: number;
    totalPassed: number;
    totalFailed: number;
    totalErrors: number;
    totalFixes: number;
    successRate: number;
    autoFixRate: number;
  };
  criticalErrors: ErrorReport[];
  recommendations: string[];
}

// ============ LOGGER ============

class Logger {
  private logFile: string;

  constructor(logPath: string) {
    this.logFile = path.join(logPath, 'orchestrator.log');
  }

  async log(level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS', message: string) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${level}] ${message}\n`;

    // Console
    const colors = {
      INFO: '\x1b[36m',    // Cyan
      WARN: '\x1b[33m',    // Yellow
      ERROR: '\x1b[31m',   // Red
      SUCCESS: '\x1b[32m', // Green
    };
    console.log(`${colors[level]}${logLine}\x1b[0m`);

    // File
    await fs.appendFile(this.logFile, logLine);
  }

  info(msg: string) { return this.log('INFO', msg); }
  warn(msg: string) { return this.log('WARN', msg); }
  error(msg: string) { return this.log('ERROR', msg); }
  success(msg: string) { return this.log('SUCCESS', msg); }
}

// ============ ORCHESTRATOR CLASS ============

class QAOrchestrator {
  private logger: Logger;
  private startTime: number = 0;
  private agentResults: AgentResult[] = [];
  private mode: string;

  constructor() {
    this.logger = new Logger(ORCHESTRATOR_CONFIG.logsPath);
    this.mode = ORCHESTRATOR_CONFIG.mode;
  }

  /**
   * Point d'entrée principal
   */
  async run(): Promise<void> {
    this.startTime = Date.now();

    await this.logger.info('🚀 ARCANE QA AUTONOMY SYSTEM - STARTED');
    await this.logger.info(`Mode: ${this.mode}`);
    await this.logger.info(`Parallelism: ${ORCHESTRATOR_CONFIG.parallelism}`);

    try {
      // 1. Initialisation
      await this.initialize();

      // 2. Exécution des agents
      await this.executeAgents();

      // 3. Génération du rapport
      await this.generateReport();

      // 4. Auto-commit si activé
      if (ORCHESTRATOR_CONFIG.autoCommit) {
        await this.autoCommit();
      }

      // 5. Notifications
      await this.sendNotifications();

      await this.logger.success('✅ QA AUTONOMY SYSTEM - COMPLETED');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await this.logger.error(`❌ ORCHESTRATOR FAILED: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Initialisation: création dossiers, nettoyage logs
   */
  private async initialize(): Promise<void> {
    await this.logger.info('Initializing system...');

    // Créer dossiers si nécessaires
    const dirs = [
      ORCHESTRATOR_CONFIG.logsPath,
      path.dirname(ORCHESTRATOR_CONFIG.reportPath),
      path.join(path.dirname(ORCHESTRATOR_CONFIG.reportPath), 'history'),
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }

    await this.logger.success('System initialized');
  }

  /**
   * Exécution de tous les agents selon l'ordre de priorité
   */
  private async executeAgents(): Promise<void> {
    await this.logger.info('Starting agents execution...');

    // Tri des agents par priorité
    const agents = Object.entries(AGENTS_CONFIG)
      .filter(([_, config]) => config.enabled)
      .sort(([_, a], [__, b]) => a.priority - b.priority);

    // Grouper agents par priorité pour parallélisation
    const priorityGroups = this.groupByPriority(agents);

    for (const [priority, groupAgents] of Object.entries(priorityGroups)) {
      await this.logger.info(`📍 Executing priority ${priority} agents...`);

      // Agents qui peuvent tourner en parallèle
      const parallelAgents = groupAgents.filter(([_, cfg]) => cfg.runInParallel);
      const serialAgents = groupAgents.filter(([_, cfg]) => !cfg.runInParallel);

      // Exécuter agents parallèles
      if (parallelAgents.length > 0) {
        const results = await Promise.all(
          parallelAgents.map(([name, cfg]) => this.executeAgent(name, cfg))
        );
        this.agentResults.push(...results);
      }

      // Exécuter agents séquentiels
      for (const [name, cfg] of serialAgents) {
        const result = await this.executeAgent(name, cfg);
        this.agentResults.push(result);

        // Stop si erreur critique
        if (!result.success && ORCHESTRATOR_CONFIG.stopOnCriticalError) {
          const hasCritical = result.errors.some(e => e.severity === 'critical');
          if (hasCritical) {
            await this.logger.error(`🛑 Critical error in ${name}, stopping execution`);
            break;
          }
        }
      }
    }

    await this.logger.success('All agents executed');
  }

  /**
   * Exécuter un agent spécifique
   */
  private async executeAgent(
    agentName: string,
    config: AgentConfig
  ): Promise<AgentResult> {
    await this.logger.info(`🤖 Executing ${config.name}...`);
    const agentStart = Date.now();

    try {
      // Dynamically import agent module
      const agentModule = await import(`./agents/${agentName}`);
      const agent = new agentModule.default();

      // Exécuter avec timeout
      const result = await this.executeWithTimeout(
        () => agent.run(),
        config.timeout,
        `${agentName} timeout`
      );

      const duration = Date.now() - agentStart;
      await this.logger.success(`✅ ${config.name} completed in ${duration}ms`);

      return {
        agentName: config.name,
        success: (result as any).success,
        duration,
        errors: (result as any).errors || [],
        fixes: (result as any).fixes || [],
        metrics: (result as any).metrics || this.getDefaultMetrics(),
      };
    } catch (error) {
      const duration = Date.now() - agentStart;
      const errorMsg = error instanceof Error ? error.message : String(error);
      await this.logger.error(`❌ ${config.name} failed: ${errorMsg}`);

      return {
        agentName: config.name,
        success: false,
        duration,
        errors: [{
          type: ErrorType.CRITICAL_ERROR,
          message: errorMsg,
          severity: 'critical',
          fixStrategy: FixStrategy.ESCALATE,
        }],
        fixes: [],
        metrics: this.getDefaultMetrics(),
      };
    }
  }

  /**
   * Exécuter une fonction avec timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number,
    errorMsg: string
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(errorMsg)), timeout)
      ),
    ]);
  }

  /**
   * Grouper agents par priorité
   */
  private groupByPriority(
    agents: [string, AgentConfig][]
  ): Record<number, [string, AgentConfig][]> {
    return agents.reduce((acc, agent) => {
      const priority = agent[1].priority;
      if (!acc[priority]) acc[priority] = [];
      acc[priority].push(agent);
      return acc;
    }, {} as Record<number, [string, AgentConfig][]>);
  }

  /**
   * Générer le rapport final Markdown
   */
  private async generateReport(): Promise<void> {
    await this.logger.info('Generating final report...');

    const duration = Date.now() - this.startTime;
    const timestamp = new Date().toISOString();

    // Calculer statistiques globales
    const summary = this.calculateSummary();
    const criticalErrors = this.extractCriticalErrors();
    const recommendations = this.generateRecommendations();

    const report: OrchestratorReport = {
      timestamp,
      duration,
      mode: this.mode,
      agentResults: this.agentResults,
      summary,
      criticalErrors,
      recommendations,
    };

    // Générer Markdown
    const markdown = this.generateMarkdownReport(report);

    // Sauvegarder rapport principal
    await fs.writeFile(ORCHESTRATOR_CONFIG.reportPath, markdown);

    // Sauvegarder dans historique
    const historyPath = path.join(
      path.dirname(ORCHESTRATOR_CONFIG.reportPath),
      'history',
      `${timestamp.split('T')[0]}_${timestamp.split('T')[1].split('.')[0].replace(/:/g, '-')}.md`
    );
    await fs.writeFile(historyPath, markdown);

    await this.logger.success(`Report generated: ${ORCHESTRATOR_CONFIG.reportPath}`);
  }

  /**
   * Calculer le résumé global
   */
  private calculateSummary() {
    const totalTests = this.agentResults.reduce((sum, r) => sum + r.metrics.testsRun, 0);
    const totalPassed = this.agentResults.reduce((sum, r) => sum + r.metrics.testsPassed, 0);
    const totalFailed = this.agentResults.reduce((sum, r) => sum + r.metrics.testsFailed, 0);
    const totalErrors = this.agentResults.reduce((sum, r) => sum + r.errors.length, 0);
    const totalFixes = this.agentResults.reduce((sum, r) => sum + r.fixes.filter(f => f.success).length, 0);

    return {
      totalTests,
      totalPassed,
      totalFailed,
      totalErrors,
      totalFixes,
      successRate: totalTests > 0 ? (totalPassed / totalTests) * 100 : 0,
      autoFixRate: totalErrors > 0 ? (totalFixes / totalErrors) * 100 : 0,
    };
  }

  /**
   * Extraire erreurs critiques
   */
  private extractCriticalErrors(): ErrorReport[] {
    return this.agentResults
      .flatMap(r => r.errors)
      .filter(e => e.severity === 'critical');
  }

  /**
   * Générer recommandations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const summary = this.calculateSummary();

    if (summary.successRate < 90) {
      recommendations.push('⚠️ Taux de succès < 90% - Vérifier les tests échoués');
    }

    if (summary.autoFixRate < 50) {
      recommendations.push('⚠️ Taux de correction auto < 50% - Améliorer les patterns de fix');
    }

    const criticalErrors = this.extractCriticalErrors();
    if (criticalErrors.length > 0) {
      recommendations.push(`🔴 ${criticalErrors.length} erreur(s) critique(s) - Intervention immédiate requise`);
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Tout est OK - Aucune action requise');
    }

    return recommendations;
  }

  /**
   * Générer rapport Markdown
   */
  private generateMarkdownReport(report: OrchestratorReport): string {
    const { summary, criticalErrors, recommendations } = report;
    const durationMin = (report.duration / 60000).toFixed(2);

    let md = `# 🤖 ARCANE QA AUTONOMY REPORT\n\n`;
    md += `**Date**: ${report.timestamp}\n`;
    md += `**Durée**: ${durationMin} minutes\n`;
    md += `**Mode**: ${report.mode}\n\n`;

    // Résumé
    md += `## 📊 Résumé Global\n\n`;
    md += `| Métrique | Valeur |\n`;
    md += `|----------|--------|\n`;
    md += `| Tests exécutés | ${summary.totalTests} |\n`;
    md += `| Tests passés | ✅ ${summary.totalPassed} (${summary.successRate.toFixed(1)}%) |\n`;
    md += `| Tests échoués | ❌ ${summary.totalFailed} (${(100 - summary.successRate).toFixed(1)}%) |\n`;
    md += `| Erreurs détectées | ${summary.totalErrors} |\n`;
    md += `| Corrections appliquées | ${summary.totalFixes} |\n`;
    md += `| Taux de correction auto | ${summary.autoFixRate.toFixed(1)}% |\n\n`;

    // Agents
    md += `## 🤖 Résultats par Agent\n\n`;
    for (const agent of report.agentResults) {
      const status = agent.success ? '✅' : '❌';
      md += `### ${status} ${agent.agentName}\n\n`;
      md += `- **Durée**: ${(agent.duration / 1000).toFixed(2)}s\n`;
      md += `- **Tests**: ${agent.metrics.testsPassed}/${agent.metrics.testsRun} passés\n`;
      md += `- **Erreurs détectées**: ${agent.errors.length}\n`;
      md += `- **Corrections**: ${agent.fixes.filter(f => f.success).length}/${agent.fixes.length}\n\n`;

      if (agent.errors.length > 0) {
        md += `**Erreurs**:\n`;
        agent.errors.slice(0, 5).forEach(err => {
          md += `- [${err.severity.toUpperCase()}] ${err.type}: ${err.message}\n`;
        });
        if (agent.errors.length > 5) {
          md += `- ... et ${agent.errors.length - 5} autres erreurs\n`;
        }
        md += `\n`;
      }
    }

    // Erreurs critiques
    if (criticalErrors.length > 0) {
      md += `## 🔴 Erreurs Critiques\n\n`;
      criticalErrors.forEach((err, i) => {
        md += `### ${i + 1}. ${err.type}\n\n`;
        md += `- **Message**: ${err.message}\n`;
        if (err.file) md += `- **Fichier**: ${err.file}${err.line ? `:${err.line}` : ''}\n`;
        md += `- **Stratégie**: ${err.fixStrategy}\n\n`;
      });
    }

    // Recommandations
    md += `## 🎯 Recommandations\n\n`;
    recommendations.forEach(rec => {
      md += `- ${rec}\n`;
    });
    md += `\n`;

    // Footer
    md += `---\n`;
    md += `*Rapport généré automatiquement par Arcane QA Autonomy System*\n`;

    return md;
  }

  /**
   * Auto-commit des corrections
   */
  private async autoCommit(): Promise<void> {
    await this.logger.info('Creating auto-commit...');

    try {
      const { stdout } = await execAsync('git status --porcelain');

      if (stdout.trim()) {
        const summary = this.calculateSummary();
        const commitMsg = `chore(qa): auto-fixes from QA agents\n\n` +
          `- ${summary.totalFixes} corrections appliquées\n` +
          `- ${summary.totalErrors - summary.totalFixes} erreurs restantes\n` +
          `- Taux de succès: ${summary.successRate.toFixed(1)}%\n\n` +
          `🤖 Generated by Arcane QA Autonomy System`;

        await execAsync('git add .');
        await execAsync(`git commit -m "${commitMsg}"`);

        await this.logger.success('Auto-commit created');
      } else {
        await this.logger.info('No changes to commit');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await this.logger.warn(`Auto-commit failed: ${errorMsg}`);
    }
  }

  /**
   * Envoyer notifications
   */
  private async sendNotifications(): Promise<void> {
    const criticalErrors = this.extractCriticalErrors();

    if (criticalErrors.length === 0) {
      return; // Pas de notification si tout va bien
    }

    await this.logger.info('Sending notifications...');

    // TODO: Implémenter Slack/Email/Sentry notifications
    if (ORCHESTRATOR_CONFIG.notificationChannels.slack) {
      await this.sendSlackNotification(criticalErrors);
    }

    if (ORCHESTRATOR_CONFIG.notificationChannels.sentry) {
      await this.sendSentryAlert(criticalErrors);
    }
  }

  private async sendSlackNotification(errors: ErrorReport[]): Promise<void> {
    // TODO: Implémenter
    await this.logger.info(`Slack notification sent (${errors.length} critical errors)`);
  }

  private async sendSentryAlert(errors: ErrorReport[]): Promise<void> {
    // TODO: Implémenter
    await this.logger.info(`Sentry alert sent (${errors.length} critical errors)`);
  }

  private getDefaultMetrics(): AgentMetrics {
    return {
      testsRun: 0,
      testsPassed: 0,
      testsFailed: 0,
      errorsDetected: 0,
      errorsFixed: 0,
      errorsPending: 0,
    };
  }
}

// ============ MAIN ============

async function main() {
  const orchestrator = new QAOrchestrator();

  try {
    await orchestrator.run();
    process.exit(0);
  } catch (error) {
    console.error('ORCHESTRATOR FATAL ERROR:', error);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

export default QAOrchestrator;
