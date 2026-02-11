#!/usr/bin/env ts-node

import { TestOrchestrator } from './base/TestOrchestrator';
import { ScoutFlowAgent } from './agents/ScoutFlowAgent';
import { PlayerFlowAgent } from './agents/PlayerFlowAgent';
import { AIFlowAgent } from './agents/AIFlowAgent';
import { RepairBotAgent } from './agents/RepairBotAgent';
import { testConfig } from './config';
import { Logger } from './utils/logger';

const logger = new Logger('Main');

async function main() {
  logger.header('🚀 ARCANE AUTONOMOUS TEST ENGINE - PHASE 2');
  logger.info('Initializing test orchestrator...');

  const orchestrator = new TestOrchestrator(testConfig);

  // Register agents
  orchestrator.registerAgent(new ScoutFlowAgent(testConfig));
  orchestrator.registerAgent(new PlayerFlowAgent(testConfig));
  orchestrator.registerAgent(new AIFlowAgent(testConfig));

  logger.separator();
  logger.info('Starting parallel test execution...');
  logger.separator();

  // Run all agents in parallel
  const startTime = Date.now();
  const reports = await orchestrator.runParallel();
  const duration = Date.now() - startTime;

  logger.separator();
  logger.success(`All tests completed in ${(duration / 1000).toFixed(2)}s`);
  logger.separator();

  // Get summary
  const summary = orchestrator.getSummary();

  logger.info(`📊 TEST SUMMARY:`);
  logger.info(`   Total Tests: ${summary.totalTests}`);
  logger.info(`   ✅ Passed: ${summary.totalPassed}`);
  logger.info(`   ❌ Failed: ${summary.totalFailed}`);
  logger.info(`   ⚠️  Errors: ${summary.totalErrors}`);
  logger.info(`   🐛 Bugs: ${summary.totalBugs}`);
  logger.info(`   Pass Rate: ${summary.passRate}%`);

  logger.separator();

  // Generate comprehensive report
  const reportContent = orchestrator.generateComprehensiveReport();
  orchestrator.saveReport(reportContent);

  // Run RepairBot if bugs found
  const bugs = orchestrator.getAllBugs();
  if (bugs.length > 0) {
    logger.separator();
    logger.info(`Found ${bugs.length} bugs - starting RepairBot...`);
    logger.separator();

    const repairBot = new RepairBotAgent(bugs);
    const fixes = await repairBot.run();

    logger.info(`RepairBot generated ${fixes.length} automated fixes`);
    repairBot.savePatchLog();
  }

  logger.separator();
  logger.header('✅ PHASE 2 COMPLETE');

  // Exit with appropriate code
  if (summary.totalFailed > 0 || summary.totalErrors > 0) {
    logger.warn(`Tests failed. Review ARCANE_AUTOMATED_TEST_REPORT.md for details.`);
    process.exit(1);
  } else {
    logger.success(`All tests passed! Platform is demo-ready.`);
    process.exit(0);
  }
}

// Run
main().catch((error) => {
  logger.error(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
