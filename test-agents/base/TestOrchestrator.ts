import { BaseAgent } from './BaseAgent';
import { AgentReport, TestContext, AgentType } from './types';
import { Logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

export class TestOrchestrator {
  private context: TestContext;
  private agents: BaseAgent[] = [];
  private logger: Logger;
  private reports: AgentReport[] = [];

  constructor(context: TestContext) {
    this.context = context;
    this.logger = new Logger('Orchestrator');
  }

  /**
   * Register an agent
   */
  registerAgent(agent: BaseAgent): void {
    this.agents.push(agent);
    this.logger.info(`Registered agent: ${agent.constructor.name}`);
  }

  /**
   * Run all agents in parallel
   */
  async runParallel(): Promise<AgentReport[]> {
    this.logger.header('🤖 ARCANE AUTONOMOUS TEST ENGINE - PARALLEL EXECUTION');
    this.logger.info(`Executing ${this.agents.length} agents in parallel...`);

    const startTime = Date.now();

    try {
      const promises = this.agents.map(agent => agent.run());
      this.reports = await Promise.all(promises);

      const duration = Date.now() - startTime;
      this.logger.success(`All agents completed in ${duration}ms (${(duration / 1000).toFixed(2)}s)`);

      return this.reports;
    } catch (error: any) {
      this.logger.error(`Orchestrator failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Run all agents sequentially
   */
  async runSequential(): Promise<AgentReport[]> {
    this.logger.header('🤖 ARCANE AUTONOMOUS TEST ENGINE - SEQUENTIAL EXECUTION');
    this.logger.info(`Executing ${this.agents.length} agents sequentially...`);

    const startTime = Date.now();

    for (const agent of this.agents) {
      try {
        const report = await agent.run();
        this.reports.push(report);
      } catch (error: any) {
        this.logger.error(`Agent ${agent.constructor.name} failed: ${error.message}`);
      }
    }

    const duration = Date.now() - startTime;
    this.logger.success(`All agents completed in ${duration}ms (${(duration / 1000).toFixed(2)}s)`);

    return this.reports;
  }

  /**
   * Generate comprehensive test report
   */
  generateComprehensiveReport(): string {
    const totalTests = this.reports.reduce((sum, r) => sum + r.totalTests, 0);
    const totalPassed = this.reports.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = this.reports.reduce((sum, r) => sum + r.failed, 0);
    const totalErrors = this.reports.reduce((sum, r) => sum + r.errors, 0);
    const totalSkipped = this.reports.reduce((sum, r) => sum + r.skipped, 0);
    const totalDuration = this.reports.reduce((sum, r) => sum + r.duration, 0);
    const allBugs = this.reports.flatMap(r => r.bugs);

    const passRate = ((totalPassed / totalTests) * 100).toFixed(2);

    let report = `# 🧪 ARCANE AUTOMATED TEST REPORT\n\n`;
    report += `**Date**: ${new Date().toISOString()}\n`;
    report += `**Duration**: ${(totalDuration / 1000).toFixed(2)}s\n`;
    report += `**Agents**: ${this.reports.length}\n\n`;

    report += `---\n\n`;

    report += `## 📊 EXECUTIVE SUMMARY\n\n`;
    report += `| Metric | Value |\n`;
    report += `|--------|-------|\n`;
    report += `| **Total Tests** | ${totalTests} |\n`;
    report += `| **Passed** | ✅ ${totalPassed} |\n`;
    report += `| **Failed** | ❌ ${totalFailed} |\n`;
    report += `| **Errors** | ⚠️ ${totalErrors} |\n`;
    report += `| **Skipped** | ⏭️ ${totalSkipped} |\n`;
    report += `| **Pass Rate** | ${passRate}% |\n`;
    report += `| **Bugs Found** | 🐛 ${allBugs.length} |\n\n`;

    report += `---\n\n`;

    report += `## 🤖 AGENT REPORTS\n\n`;

    for (const agentReport of this.reports) {
      const agentPassRate = ((agentReport.passed / agentReport.totalTests) * 100).toFixed(2);

      report += `### ${agentReport.agentName}Agent\n\n`;
      report += `| Metric | Value |\n`;
      report += `|--------|-------|\n`;
      report += `| Tests | ${agentReport.totalTests} |\n`;
      report += `| Passed | ✅ ${agentReport.passed} |\n`;
      report += `| Failed | ❌ ${agentReport.failed} |\n`;
      report += `| Errors | ⚠️ ${agentReport.errors} |\n`;
      report += `| Pass Rate | ${agentPassRate}% |\n`;
      report += `| Duration | ${(agentReport.duration / 1000).toFixed(2)}s |\n`;
      report += `| Bugs | 🐛 ${agentReport.bugs.length} |\n\n`;

      if (agentReport.bugs.length > 0) {
        report += `**Bugs Found**:\n`;
        for (const bug of agentReport.bugs) {
          report += `- [${bug.severity.toUpperCase()}] ${bug.title}: ${bug.description}\n`;
        }
        report += `\n`;
      }

      if (agentReport.recommendations.length > 0) {
        report += `**Recommendations**:\n`;
        for (const rec of agentReport.recommendations) {
          report += `- ${rec}\n`;
        }
        report += `\n`;
      }

      report += `---\n\n`;
    }

    report += `## 🐛 ALL BUGS (${allBugs.length})\n\n`;

    if (allBugs.length === 0) {
      report += `✅ **No bugs found! Platform is clean.**\n\n`;
    } else {
      const criticalBugs = allBugs.filter(b => b.severity === 'critical');
      const majorBugs = allBugs.filter(b => b.severity === 'major');
      const minorBugs = allBugs.filter(b => b.severity === 'minor');
      const trivialBugs = allBugs.filter(b => b.severity === 'trivial');

      report += `### Severity Breakdown\n\n`;
      report += `- 🔴 **Critical**: ${criticalBugs.length}\n`;
      report += `- 🟠 **Major**: ${majorBugs.length}\n`;
      report += `- 🟡 **Minor**: ${minorBugs.length}\n`;
      report += `- 🟢 **Trivial**: ${trivialBugs.length}\n\n`;

      report += `### Bug Details\n\n`;

      for (const bug of allBugs) {
        const emoji = bug.severity === 'critical' ? '🔴' : bug.severity === 'major' ? '🟠' : bug.severity === 'minor' ? '🟡' : '🟢';
        report += `#### ${emoji} ${bug.id}: ${bug.title}\n\n`;
        report += `- **Severity**: ${bug.severity}\n`;
        report += `- **Category**: ${bug.category}\n`;
        report += `- **Description**: ${bug.description}\n`;
        report += `- **Location**: ${bug.location}\n`;
        if (bug.fix) {
          report += `- **Fix**: ${bug.fix.applied ? '✅ Applied' : '❌ Not applied'}\n`;
        }
        report += `\n`;
      }
    }

    report += `---\n\n`;
    report += `## ✅ CONCLUSION\n\n`;

    if (totalFailed === 0 && totalErrors === 0) {
      report += `🎉 **All tests passed!** Platform is demo-ready.\n\n`;
    } else {
      report += `⚠️ **${totalFailed + totalErrors} tests failed.** Review bugs and apply fixes.\n\n`;
    }

    return report;
  }

  /**
   * Save report to file
   */
  saveReport(reportContent: string, filename: string = 'ARCANE_AUTOMATED_TEST_REPORT.md'): void {
    const reportPath = path.join(__dirname, '../../', filename);
    fs.writeFileSync(reportPath, reportContent);
    this.logger.success(`Report saved to: ${reportPath}`);
  }

  /**
   * Get all bugs
   */
  getAllBugs() {
    return this.reports.flatMap(r => r.bugs);
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const totalTests = this.reports.reduce((sum, r) => sum + r.totalTests, 0);
    const totalPassed = this.reports.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = this.reports.reduce((sum, r) => sum + r.failed, 0);
    const totalErrors = this.reports.reduce((sum, r) => sum + r.errors, 0);
    const allBugs = this.reports.flatMap(r => r.bugs);

    return {
      totalTests,
      totalPassed,
      totalFailed,
      totalErrors,
      totalBugs: allBugs.length,
      passRate: ((totalPassed / totalTests) * 100).toFixed(2),
      criticalBugs: allBugs.filter(b => b.severity === 'critical').length,
      majorBugs: allBugs.filter(b => b.severity === 'major').length,
    };
  }
}
