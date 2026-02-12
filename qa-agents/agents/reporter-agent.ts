/**
 * REPORTER-AGENT - Documentation Generator
 * Génère le rapport QA final en Markdown
 */

import * as fs from 'fs/promises';
import * as path from 'path';

interface ReporterInput {
  timestamp: string;
  duration: number;
  mode: string;
  agentResults: any[];
  summary: any;
  criticalErrors: any[];
  recommendations: string[];
}

export default class ReporterAgent {
  private logFile: string = 'qa-agents/logs/reporter-agent.log';
  private reportPath: string = 'qa-agents/reports/QA_AUTONOMY_REPORT.md';

  async run(): Promise<any> {
    await this.log('📝 Reporter-Agent starting...');

    // Ce code sera appelé par l'orchestrateur avec les données
    // Pour l'instant, on retourne un résultat minimal

    return {
      success: true,
      errors: [],
      fixes: [],
      metrics: {
        testsRun: 0,
        testsPassed: 0,
        testsFailed: 0,
        errorsDetected: 0,
        errorsFixed: 0,
        errorsPending: 0,
      },
    };
  }

  /**
   * Générer le rapport complet
   */
  async generateReport(data: ReporterInput): Promise<string> {
    await this.log('Generating comprehensive report...');

    const md = this.buildMarkdown(data);

    // Sauvegarder
    await fs.writeFile(this.reportPath, md);

    await this.log(`✅ Report saved to ${this.reportPath}`);

    return md;
  }

  /**
   * Construire le Markdown
   */
  private buildMarkdown(data: ReporterInput): string {
    let md = '';

    // Header
    md += this.buildHeader(data);

    // Summary
    md += this.buildSummary(data);

    // Agents Results
    md += this.buildAgentResults(data);

    // Critical Errors
    if (data.criticalErrors.length > 0) {
      md += this.buildCriticalErrors(data.criticalErrors);
    }

    // Recommendations
    md += this.buildRecommendations(data.recommendations);

    // Footer
    md += this.buildFooter();

    return md;
  }

  private buildHeader(data: ReporterInput): string {
    const date = new Date(data.timestamp).toLocaleString('fr-FR');
    const durationMin = (data.duration / 60000).toFixed(2);

    return `# 🤖 ARCANE QA AUTONOMY REPORT

**Date d'exécution**: ${date}
**Durée totale**: ${durationMin} minutes
**Mode**: ${data.mode}

---

`;
  }

  private buildSummary(data: ReporterInput): string {
    const { summary } = data;

    const successIcon = summary.successRate >= 90 ? '✅' : summary.successRate >= 70 ? '⚠️' : '❌';
    const fixIcon = summary.autoFixRate >= 70 ? '✅' : summary.autoFixRate >= 50 ? '⚠️' : '❌';

    return `## 📊 Résumé Global

| Métrique | Valeur | Status |
|----------|--------|--------|
| Tests exécutés | **${summary.totalTests}** | - |
| Tests réussis | **${summary.totalPassed}** | ${successIcon} ${summary.successRate.toFixed(1)}% |
| Tests échoués | **${summary.totalFailed}** | ${(100 - summary.successRate).toFixed(1)}% |
| Erreurs détectées | **${summary.totalErrors}** | - |
| Corrections auto | **${summary.totalFixes}** | ${fixIcon} ${summary.autoFixRate.toFixed(1)}% |

### Indicateurs Qualité

\`\`\`
Taux de succès:      ${this.buildProgressBar(summary.successRate)}
Taux de correction:  ${this.buildProgressBar(summary.autoFixRate)}
\`\`\`

`;
  }

  private buildProgressBar(percentage: number): string {
    const filled = Math.round(percentage / 5); // 20 blocks max
    const empty = 20 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty) + ` ${percentage.toFixed(1)}%`;
  }

  private buildAgentResults(data: ReporterInput): string {
    let md = `## 🤖 Résultats par Agent\n\n`;

    for (const agent of data.agentResults) {
      const statusIcon = agent.success ? '✅' : '❌';
      const durationSec = (agent.duration / 1000).toFixed(2);

      md += `### ${statusIcon} ${agent.agentName}\n\n`;
      md += `**Durée**: ${durationSec}s | `;
      md += `**Tests**: ${agent.metrics.testsPassed}/${agent.metrics.testsRun} `;

      if (agent.metrics.testsRun > 0) {
        const rate = (agent.metrics.testsPassed / agent.metrics.testsRun * 100).toFixed(1);
        md += `(${rate}%)`;
      }

      md += `\n\n`;

      // Métriques
      if (agent.errors.length > 0 || agent.fixes.length > 0) {
        md += `| Métrique | Valeur |\n`;
        md += `|----------|--------|\n`;
        md += `| Erreurs détectées | ${agent.errors.length} |\n`;
        md += `| Corrections réussies | ${agent.fixes.filter((f: any) => f.success).length} |\n`;
        md += `| Corrections échouées | ${agent.fixes.filter((f: any) => !f.success).length} |\n`;
        md += `\n`;
      }

      // Top 5 erreurs
      if (agent.errors.length > 0) {
        md += `**Principales erreurs**:\n\n`;
        agent.errors.slice(0, 5).forEach((err: any, i: number) => {
          md += `${i + 1}. \`${err.type}\`: ${err.message}\n`;
          if (err.file) {
            md += `   - Fichier: \`${err.file}\`${err.line ? `:${err.line}` : ''}\n`;
          }
        });

        if (agent.errors.length > 5) {
          md += `\n*... et ${agent.errors.length - 5} autres erreurs*\n`;
        }

        md += `\n`;
      }

      // Top 5 corrections
      if (agent.fixes.length > 0) {
        md += `**Corrections appliquées**:\n\n`;
        agent.fixes.filter((f: any) => f.success).slice(0, 5).forEach((fix: any, i: number) => {
          md += `${i + 1}. ✅ ${fix.action} dans \`${fix.file}\`\n`;
          if (fix.details) {
            md += `   - ${fix.details}\n`;
          }
        });

        md += `\n`;
      }

      md += `---\n\n`;
    }

    return md;
  }

  private buildCriticalErrors(errors: any[]): string {
    let md = `## 🔴 Erreurs Critiques (${errors.length})\n\n`;

    md += `> ⚠️ **ATTENTION**: Ces erreurs nécessitent une intervention manuelle immédiate\n\n`;

    errors.forEach((err, i) => {
      md += `### ${i + 1}. ${err.type}\n\n`;
      md += `- **Sévérité**: 🔴 CRITIQUE\n`;
      md += `- **Message**: ${err.message}\n`;
      if (err.file) {
        md += `- **Fichier**: \`${err.file}\`${err.line ? `:${err.line}` : ''}\n`;
      }
      md += `- **Stratégie**: ${err.fixStrategy}\n`;
      md += `\n`;

      // Suggestions
      md += `**Actions recommandées**:\n`;
      md += this.getSuggestionsForError(err);
      md += `\n---\n\n`;
    });

    return md;
  }

  private getSuggestionsForError(err: any): string {
    const suggestions = {
      DB_CONNECTION_ERROR: `1. Vérifier que la base de données est démarrée\n2. Vérifier les variables d'environnement DB_*\n3. Tester la connexion: \`psql $DATABASE_URL\`\n`,
      AUTH_ERROR: `1. Vérifier JWT_SECRET dans .env\n2. Vérifier la validité du token\n3. Tester l'endpoint: \`curl -H "Authorization: Bearer $TOKEN" /api/auth/me\`\n`,
      SECURITY_ERROR: `1. ⚠️ URGENT: Analyser la faille de sécurité\n2. Mettre à jour les dépendances: \`npm audit fix\`\n3. Consulter l'équipe sécurité\n`,
      MIGRATION_ERROR: `1. Vérifier les migrations Prisma: \`npx prisma migrate status\`\n2. Résoudre les conflits: \`npx prisma migrate resolve\`\n3. Appliquer: \`npx prisma migrate deploy\`\n`,
    };

    return suggestions[err.type as keyof typeof suggestions] || `1. Analyser l'erreur manuellement\n2. Consulter la documentation\n3. Demander de l'aide si nécessaire\n`;
  }

  private buildRecommendations(recommendations: string[]): string {
    let md = `## 🎯 Recommandations\n\n`;

    if (recommendations.length === 0) {
      md += `✅ Aucune recommandation - Le système fonctionne parfaitement!\n\n`;
    } else {
      recommendations.forEach((rec, i) => {
        md += `${i + 1}. ${rec}\n`;
      });
      md += `\n`;
    }

    return md;
  }

  private buildFooter(): string {
    return `---

## 📚 Liens Utiles

- [Architecture QA Agents](./AGENTS_ARCHITECTURE.md)
- [Configuration Agents](../agents.config.ts)
- [Logs Orchestrator](../logs/orchestrator.log)
- [Documentation Projet](../../README.md)

## 🔄 Prochaines Exécutions

Le système QA s'exécute automatiquement selon le planning suivant:
- **Local**: À la demande via \`npm run qa:autonomy\`
- **CI/CD**: À chaque push sur \`develop\` et \`main\`
- **Cron**: Quotidiennement à 03:00 UTC

---

*🤖 Rapport généré automatiquement par Arcane QA Autonomy System v1.0*
*Pour toute question: [lakhdari@arcane-football.com](mailto:lakhdari@arcane-football.com)*
`;
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
