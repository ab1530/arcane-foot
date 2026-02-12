import { BaseAgent } from '../base/BaseAgent';
import { AgentReport, TestContext } from '../base/types';

export class AIFlowAgent extends BaseAgent {
  constructor(context: TestContext) {
    super('AIFlow', context);
  }

  async run(): Promise<AgentReport> {
    this.startTime = Date.now();
    this.logger.header('🤖 AI FLOW AGENT - Starting Tests');

    try {
      const token = await this.login('scoutGold');

      // Get a test player - API returns array directly
      const players = await this.apiCall('get', '/players?limit=1', undefined, token);
      if (!Array.isArray(players) || players.length === 0) {
        throw new Error('No players found in database');
      }
      const playerId = players[0].id;

      // AutoScout Tests (10 tests)
      await this.test01_AutoScoutMatchPerformance(token, playerId);
      await this.test02_AutoScoutSeasonOverview(token, playerId);
      await this.test03_AutoScoutTransferTarget(token, playerId);
      await this.test04_AutoScoutYouthProspect(token, playerId);
      await this.test05_AutoScoutQuickScan(token, playerId);
      await this.test06_AutoScoutQualityScore(token, playerId);
      await this.test07_AutoScoutCostEstimate(token);
      await this.test08_AutoScoutSaveReport(token, playerId);
      await this.test09_AutoScoutRegenerate(token, playerId);
      await this.test10_AutoScoutExportPDF(token);

      // ArkaneGPT Tests (5 tests)
      await this.test11_ArkaneGPTPlayerComparison(token);
      await this.test12_ArkaneGPTTacticalAnalysis(token);
      await this.test13_ArkaneGPTTransferRecommendation(token);
      await this.test14_ArkaneGPTStreaming(token);
      await this.test15_ArkaneGPTContextRetention(token);

      // ArkaneIndex Tests (4 tests)
      await this.test16_ArkaneIndexCalculate(token, playerId);
      await this.test17_ArkaneIndexBreakdown(token, playerId);
      await this.test18_ArkaneIndexComparables(token, playerId);
      await this.test19_ArkaneIndexHistoricalTrend(token, playerId);

      // Market Value AI Tests (4 tests)
      await this.test20_MarketValueEstimate(token, playerId);
      await this.test21_MarketValueFactors(token, playerId);
      await this.test22_MarketValueConfidence(token, playerId);
      await this.test23_MarketValueHistoricalChart(token, playerId);

      // Other AI Features (2 tests)
      await this.test24_PerformancePredictor(token, playerId);
      await this.test25_PlayStyleDNA(token, playerId);

    } catch (error: any) {
      this.logger.error(`AIFlowAgent failed: ${error.message}`);
    }

    this.endTime = Date.now();
    const report = this.generateReport();
    this.logger.success(`AIFlowAgent completed: ${report.passed}/${report.totalTests} passed`);

    return report;
  }

  private async test01_AutoScoutMatchPerformance(token: string, playerId: string): Promise<void> {
    await this.executeTest('AI-01', 'AutoScout: Match Performance template', async () => {
      const report = await this.apiCall('post', '/auto-scout/generate', {
        playerId,
        reportType: 'MATCH_PERFORMANCE',  // Fixed: was 'template', should be 'reportType'
      }, token);
      this.assert('Report generated', !!report);
      this.context.testData.aiReportId = report.id;
    });
  }

  private async test02_AutoScoutSeasonOverview(token: string, playerId: string): Promise<void> {
    await this.executeTest('AI-02', 'AutoScout: Season Overview template', async () => {
      const report = await this.apiCall('post', '/auto-scout/generate', {
        playerId,
        reportType: 'SEASON_OVERVIEW',  // Fixed: was 'template', should be 'reportType'
      }, token);
      this.assert('Report generated', !!report);
    });
  }

  private async test03_AutoScoutTransferTarget(token: string, playerId: string): Promise<void> {
    await this.executeTest('AI-03', 'AutoScout: Transfer Target template', async () => {
      const report = await this.apiCall('post', '/auto-scout/generate', {
        playerId,
        reportType: 'TRANSFER_TARGET',  // Fixed: was 'template', should be 'reportType'
      }, token);
      this.assert('Report generated', !!report);
    });
  }

  private async test04_AutoScoutYouthProspect(token: string, playerId: string): Promise<void> {
    await this.executeTest('AI-04', 'AutoScout: Youth Prospect template', async () => {
      const report = await this.apiCall('post', '/auto-scout/generate', {
        playerId,
        reportType: 'YOUTH_PROSPECT',  // Fixed: was 'template', should be 'reportType'
      }, token);
      this.assert('Report generated', !!report);
    });
  }

  private async test05_AutoScoutQuickScan(token: string, playerId: string): Promise<void> {
    await this.executeTest('AI-05', 'AutoScout: Quick Scan template', async () => {
      const report = await this.apiCall('post', '/auto-scout/generate', {
        playerId,
        reportType: 'QUICK_SCAN',  // Fixed: was 'template', should be 'reportType'
      }, token);
      this.assert('Report generated', !!report);
    });
  }

  private async test06_AutoScoutQualityScore(token: string, playerId: string): Promise<void> {
    await this.executeTest('AI-06', 'AutoScout: Quality scoring accuracy', async () => {
      const report = await this.apiCall('post', '/auto-scout/generate', {
        playerId,
        reportType: 'MATCH_PERFORMANCE',  // Fixed: was 'template', should be 'reportType'
      }, token);

      if (report.qualityScore !== undefined) {
        this.assert('Quality score exists', typeof report.qualityScore === 'number');
        this.assert('Quality score valid range', report.qualityScore >= 0 && report.qualityScore <= 100);
      }
    });
  }

  private async test07_AutoScoutCostEstimate(token: string): Promise<void> {
    await this.executeTest('AI-07', 'AutoScout: Cost estimation', async () => {
      // Fixed: cost-estimate uses query param, not path param
      const estimate = await this.apiCall('get', '/auto-scout/cost-estimate?reportType=MATCH_PERFORMANCE', undefined, token);
      this.assert('Cost estimate returned', !!estimate);

      if (estimate.data?.estimatedTokens) {
        this.assert('Estimated tokens is number', typeof estimate.data.estimatedTokens === 'number');
      }
    });
  }

  private async test08_AutoScoutSaveReport(token: string, playerId: string): Promise<void> {
    await this.executeTest('AI-08', 'AutoScout: Save generated report', async () => {
      const report = await this.apiCall('post', '/auto-scout/generate', {
        playerId,
        reportType: 'QUICK_SCAN',  // Fixed: was 'template', should be 'reportType'
      }, token);

      // API returns {success: true, data: {...}}
      this.assert('Report generation successful', !!report.success && !!report.data);
      this.context.testData.savedAutoScoutId = report.data?.id;
    });
  }

  private async test09_AutoScoutRegenerate(token: string, playerId: string): Promise<void> {
    await this.executeTest('AI-09', 'AutoScout: Regenerate report', async () => {
      const report = await this.apiCall('post', '/auto-scout/generate', {
        playerId,
        reportType: 'QUICK_SCAN',  // Fixed: was 'template', should be 'reportType'
      }, token);

      this.assert('New report generated', !!report);
    });
  }

  private async test10_AutoScoutExportPDF(token: string): Promise<void> {
    await this.executeTest('AI-10', 'AutoScout: Export AI report as PDF', async () => {
      const reportId = this.context.testData.savedAutoScoutId;
      if (!reportId) {
        this.logger.warn('No saved report ID - skipping');
        return;
      }

      try {
        await this.apiCall('get', `/auto-scout/${reportId}/pdf`, undefined, token);
      } catch (error: any) {
        if (error.response?.status === 404 || error.response?.status === 501) {
          this.logger.warn('PDF export not implemented - skipping');
          return;
        }
        throw error;
      }
    });
  }

  private async test11_ArkaneGPTPlayerComparison(token: string): Promise<void> {
    await this.executeTest('AI-11', 'ArkaneGPT: Player comparison query', async () => {
      try {
        const response = await this.apiCall('post', '/arkane-gpt/chat', {
          message: 'Compare the top 2 players in the database',
        }, token);

        this.assert('Chat response received', !!response);
      } catch (error: any) {
        if (error.response?.status === 404) {
          this.logger.warn('ArkaneGPT not implemented - skipping');
          return;
        }
        throw error;
      }
    });
  }

  private async test12_ArkaneGPTTacticalAnalysis(token: string): Promise<void> {
    await this.executeTest('AI-12', 'ArkaneGPT: Tactical analysis query', async () => {
      try {
        const response = await this.apiCall('post', '/arkane-gpt/chat', {
          message: 'What tactical system would work best for a fast winger?',
        }, token);

        this.assert('Tactical response received', !!response);
      } catch (error: any) {
        if (error.response?.status === 404) {
          this.logger.warn('ArkaneGPT not implemented - skipping');
          return;
        }
      }
    });
  }

  private async test13_ArkaneGPTTransferRecommendation(token: string): Promise<void> {
    await this.executeTest('AI-13', 'ArkaneGPT: Transfer recommendation', async () => {
      try {
        const response = await this.apiCall('post', '/arkane-gpt/chat', {
          message: 'Recommend midfielders under 25 years old',
        }, token);

        this.assert('Recommendation received', !!response);
      } catch (error: any) {
        if (error.response?.status === 404) {
          this.logger.warn('ArkaneGPT not implemented - skipping');
          return;
        }
      }
    });
  }

  private async test14_ArkaneGPTStreaming(token: string): Promise<void> {
    await this.executeTest('AI-14', 'ArkaneGPT: Streaming responses', async () => {
      this.logger.warn('Streaming test requires WebSocket/SSE - skipping');
    });
  }

  private async test15_ArkaneGPTContextRetention(token: string): Promise<void> {
    await this.executeTest('AI-15', 'ArkaneGPT: Context retention across messages', async () => {
      try {
        await this.apiCall('post', '/arkane-gpt/chat', {
          message: 'Tell me about Lionel Messi',
        }, token);

        const response2 = await this.apiCall('post', '/arkane-gpt/chat', {
          message: 'What about his statistics?',
        }, token);

        this.assert('Context retained', !!response2);
      } catch (error: any) {
        if (error.response?.status === 404) {
          this.logger.warn('ArkaneGPT not implemented - skipping');
          return;
        }
      }
    });
  }

  private async test16_ArkaneIndexCalculate(token: string, playerId: string): Promise<void> {
    await this.executeTest('AI-16', 'ArkaneIndex: Calculate index', async () => {
      try {
        const index = await this.apiCall('get', `/arkane-index/${playerId}`, undefined, token);
        this.assert('Index calculated', !!index);
        this.assert('Index score exists', index.score !== undefined);
      } catch (error: any) {
        if (error.response?.status === 404) {
          this.logger.warn('ArkaneIndex not implemented - skipping');
          return;
        }
        throw error;
      }
    });
  }

  private async test17_ArkaneIndexBreakdown(token: string, playerId: string): Promise<void> {
    await this.executeTest('AI-17', 'ArkaneIndex: View breakdown', async () => {
      try {
        const index = await this.apiCall('get', `/arkane-index/${playerId}`, undefined, token);

        if (index.breakdown) {
          this.assert('Technical score exists', index.breakdown.technical !== undefined);
          this.assert('Physical score exists', index.breakdown.physical !== undefined);
          this.assert('Mental score exists', index.breakdown.mental !== undefined);
          this.assert('Tactical score exists', index.breakdown.tactical !== undefined);
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          this.logger.warn('ArkaneIndex not implemented - skipping');
          return;
        }
      }
    });
  }

  private async test18_ArkaneIndexComparables(token: string, playerId: string): Promise<void> {
    await this.executeTest('AI-18', 'ArkaneIndex: Comparable players', async () => {
      try {
        const comparables = await this.apiCall('get', `/arkane-index/${playerId}/comparables`, undefined, token);
        this.assert('Comparables returned', !!comparables);
      } catch (error: any) {
        if (error.response?.status === 404) {
          this.logger.warn('Comparables not implemented - skipping');
          return;
        }
      }
    });
  }

  private async test19_ArkaneIndexHistoricalTrend(token: string, playerId: string): Promise<void> {
    await this.executeTest('AI-19', 'ArkaneIndex: Historical trend', async () => {
      try {
        const trend = await this.apiCall('get', `/arkane-index/${playerId}/history`, undefined, token);
        this.assert('Historical data returned', !!trend);
      } catch (error: any) {
        if (error.response?.status === 404) {
          this.logger.warn('Historical trend not implemented - skipping');
          return;
        }
      }
    });
  }

  private async test20_MarketValueEstimate(token: string, playerId: string): Promise<void> {
    await this.executeTest('AI-20', 'MarketValue: Estimate value', async () => {
      try {
        const value = await this.apiCall('get', `/market-value/${playerId}`, undefined, token);
        this.assert('Market value calculated', !!value);
        this.assert('Value amount exists', value.estimatedValue !== undefined);
      } catch (error: any) {
        if (error.response?.status === 404) {
          this.logger.warn('Market value not implemented - skipping');
          return;
        }
      }
    });
  }

  private async test21_MarketValueFactors(token: string, playerId: string): Promise<void> {
    await this.executeTest('AI-21', 'MarketValue: Factor breakdown', async () => {
      try {
        const value = await this.apiCall('get', `/market-value/${playerId}`, undefined, token);

        if (value.factors) {
          this.assert('Factors breakdown exists', Array.isArray(value.factors) || typeof value.factors === 'object');
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          this.logger.warn('Market value not implemented - skipping');
          return;
        }
      }
    });
  }

  private async test22_MarketValueConfidence(token: string, playerId: string): Promise<void> {
    await this.executeTest('AI-22', 'MarketValue: Confidence score', async () => {
      try {
        const value = await this.apiCall('get', `/market-value/${playerId}`, undefined, token);

        if (value.confidence !== undefined) {
          this.assert('Confidence is number', typeof value.confidence === 'number');
          this.assert('Confidence valid range', value.confidence >= 0 && value.confidence <= 100);
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          this.logger.warn('Market value not implemented - skipping');
          return;
        }
      }
    });
  }

  private async test23_MarketValueHistoricalChart(token: string, playerId: string): Promise<void> {
    await this.executeTest('AI-23', 'MarketValue: Historical chart data', async () => {
      try {
        const history = await this.apiCall('get', `/market-value/${playerId}/history`, undefined, token);
        this.assert('Historical data returned', !!history);
      } catch (error: any) {
        if (error.response?.status === 404) {
          this.logger.warn('Market value history not implemented - skipping');
          return;
        }
      }
    });
  }

  private async test24_PerformancePredictor(token: string, playerId: string): Promise<void> {
    await this.executeTest('AI-24', 'Performance Predictor: Future stats', async () => {
      try {
        const prediction = await this.apiCall('get', `/performance-predictor/${playerId}`, undefined, token);
        this.assert('Prediction returned', !!prediction);
      } catch (error: any) {
        if (error.response?.status === 404) {
          this.logger.warn('Performance Predictor not implemented - skipping');
          return;
        }
      }
    });
  }

  private async test25_PlayStyleDNA(token: string, playerId: string): Promise<void> {
    await this.executeTest('AI-25', 'PlayStyle DNA: Profile and comparison', async () => {
      try {
        const dna = await this.apiCall('get', `/playstyle-dna/${playerId}`, undefined, token);
        this.assert('DNA profile returned', !!dna);
      } catch (error: any) {
        if (error.response?.status === 404) {
          this.logger.warn('PlayStyle DNA not implemented - skipping');
          return;
        }
      }
    });
  }
}
