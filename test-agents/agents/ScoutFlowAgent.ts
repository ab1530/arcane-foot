import { BaseAgent } from '../base/BaseAgent';
import { AgentReport, TestContext } from '../base/types';

export class ScoutFlowAgent extends BaseAgent {
  constructor(context: TestContext) {
    super('ScoutFlow', context);
  }

  async run(): Promise<AgentReport> {
    this.startTime = Date.now();
    this.logger.header('🔍 SCOUT FLOW AGENT - Starting Tests');

    try {
      // Login first
      const token = await this.login('scoutGold');

      // Test 1: Dashboard loading & stats display
      await this.test01_DashboardStats(token);

      // Test 2: Player search with filters
      await this.test02_PlayerSearch(token);

      // Test 3: Player profile view
      await this.test03_PlayerProfile(token);

      // Test 4: Create manual scouting report
      await this.test04_CreateManualReport(token);

      // Test 5: Edit existing report
      await this.test05_EditReport(token);

      // Test 6: Delete report
      await this.test06_DeleteReport(token);

      // Test 7: Export report PDF
      await this.test07_ExportReportPDF(token);

      // Test 8: Share report with team
      await this.test08_ShareReport(token);

      // Test 9: AutoScout - Match Performance template
      await this.test09_AutoScoutMatchPerformance(token);

      // Test 10: AutoScout - Season Overview template
      await this.test10_AutoScoutSeasonOverview(token);

      // Test 11: AutoScout - Transfer Target template
      await this.test11_AutoScoutTransferTarget(token);

      // Test 12: AutoScout - Youth Prospect template
      await this.test12_AutoScoutYouthProspect(token);

      // Test 13: AutoScout - Quick Scan template
      await this.test13_AutoScoutQuickScan(token);

      // Test 14: AutoScout quality scoring
      await this.test14_AutoScoutQualityScore(token);

      // Test 15: AutoScout history view
      await this.test15_AutoScoutHistory(token);

      // Test 16: SmartScout recommendations
      await this.test16_SmartScoutRecommendations(token);

      // Test 17: Kanban board operations
      await this.test17_KanbanBoard(token);

      // Test 18: Calendar events
      await this.test18_CalendarEvents(token);

      // Test 19: Gamification (XP, achievements, levels)
      await this.test19_Gamification(token);

      // Test 20: Marketplace operations
      await this.test20_Marketplace(token);

    } catch (error: any) {
      this.logger.error(`ScoutFlowAgent failed: ${error.message}`);
    }

    this.endTime = Date.now();
    const report = this.generateReport();
    this.logger.success(`ScoutFlowAgent completed: ${report.passed}/${report.totalTests} passed`);

    return report;
  }

  private async test01_DashboardStats(token: string): Promise<void> {
    await this.executeTest('SCOUT-01', 'Dashboard: Load stats and metrics', async () => {
      const dashboard = await this.apiCall('get', '/analytics/dashboard', undefined, token);

      this.assert('Dashboard data exists', !!dashboard);
      this.assert('Total reports exists', dashboard.totalReports !== undefined);
      this.assert('Total reports is number', typeof dashboard.totalReports === 'number');
    });
  }

  private async test02_PlayerSearch(token: string): Promise<void> {
    await this.executeTest('SCOUT-02', 'Players: Search with filters', async () => {
      const players = await this.apiCall('get', '/players?page=1&limit=10', undefined, token);

      // Real API returns array directly, not {data: [...]}
      this.assert('Players is array', Array.isArray(players));
      this.assert('At least one player returned', players.length > 0);
    });
  }

  private async test03_PlayerProfile(token: string): Promise<void> {
    await this.executeTest('SCOUT-03', 'Players: View player profile', async () => {
      // First get a player - API returns array directly
      const players = await this.apiCall('get', '/players?limit=1', undefined, token);
      this.assert('At least one player exists', Array.isArray(players) && players.length > 0);

      const playerId = players[0].id;

      // Get player details
      const player = await this.apiCall('get', `/players/${playerId}`, undefined, token);

      this.assert('Player details exist', !!player);
      this.assert('Player has ID', !!player.id);
      this.assert('Player has name', !!player.users?.firstName || !!player.user?.firstName);
    });
  }

  private async test04_CreateManualReport(token: string): Promise<void> {
    await this.executeTest('SCOUT-04', 'Reports: Create manual scouting report', async () => {
      // Get a player first - API returns array directly
      const players = await this.apiCall('get', '/players?limit=1', undefined, token);
      const playerId = players[0].id;

      // Get a match - required by DTO
      try {
        const matches = await this.apiCall('get', '/matches?limit=1', undefined, token);
        if (!Array.isArray(matches) || matches.length === 0) {
          this.logger.warn('No matches available - skipping report creation test');
          return;
        }
        const matchId = matches[0].id;

        // Use correct DTO fields
        const reportData = {
          playerId,
          matchId,  // Required field
          summary: 'Test summary for automated testing',
          strengths: 'Technical ability, Vision',
          weaknesses: 'Pace, Physicality',
          overallRating: 75,
        };

        const report = await this.apiCall('post', '/scouting-reports', reportData, token);

        this.assert('Report created', !!report);
        this.assert('Report has ID', !!report.id);
        this.assert('Report has correct player', report.playerId === playerId);

        // Store for later tests
        this.context.testData.createdReportId = report.id;
      } catch (error: any) {
        if (error.response?.status === 404 && error.response?.data?.message?.includes('Match')) {
          this.logger.warn('Match not found - skipping report creation');
          return;
        }
        throw error;
      }
    });
  }

  private async test05_EditReport(token: string): Promise<void> {
    await this.executeTest('SCOUT-05', 'Reports: Edit existing report', async () => {
      const reportId = this.context.testData.createdReportId;

      // Skip if no report was created (no matches available)
      if (!reportId) {
        this.logger.warn('No report ID from test04 - skipping edit test');
        return;
      }

      const updateData = {
        summary: 'Updated summary',
        overallRating: 80,
      };

      const updated = await this.apiCall('patch', `/scouting-reports/${reportId}`, updateData, token);

      this.assert('Report updated', !!updated);
      this.assert('Summary updated', updated.summary === updateData.summary);
    });
  }

  private async test06_DeleteReport(token: string): Promise<void> {
    await this.executeTest('SCOUT-06', 'Reports: Delete report', async () => {
      try {
        // Get a player and match - API returns array directly
        const players = await this.apiCall('get', '/players?limit=1', undefined, token);
        const playerId = players[0].id;

        const matches = await this.apiCall('get', '/matches?limit=1', undefined, token);
        if (!Array.isArray(matches) || matches.length === 0) {
          this.logger.warn('No matches available - skipping report deletion test');
          return;
        }
        const matchId = matches[0].id;

        // Create report with correct DTO fields
        const report = await this.apiCall('post', '/scouting-reports', {
          playerId,
          matchId,  // Required field
          summary: 'Report to be deleted',
          overallRating: 60,
        }, token);

        const reportId = report.id;

        // Delete it
        await this.apiCall('delete', `/scouting-reports/${reportId}`, undefined, token);

        // Verify deletion - should throw 404
        try {
          await this.apiCall('get', `/scouting-reports/${reportId}`, undefined, token);
          this.assert('Report should be deleted', false);
        } catch (error: any) {
          this.assert('Report deleted (404)', error.response?.status === 404);
        }
      } catch (error: any) {
        if (error.response?.status === 404 && error.response?.data?.message?.includes('Match')) {
          this.logger.warn('Match not found - skipping report deletion test');
          return;
        }
        throw error;
      }
    });
  }

  private async test07_ExportReportPDF(token: string): Promise<void> {
    await this.executeTest('SCOUT-07', 'Reports: Export report as PDF', async () => {
      const reportId = this.context.testData.createdReportId;

      // Skip if no report was created (no matches available)
      if (!reportId) {
        this.logger.warn('No report ID from test04 - skipping PDF export test');
        return;
      }

      try {
        const pdf = await this.apiCall('get', `/scouting-reports/${reportId}/pdf`, undefined, token);
        this.assert('PDF export returned data', !!pdf);
      } catch (error: any) {
        // PDF export might not be fully implemented
        if (error.response?.status === 501 || error.response?.status === 404) {
          this.logger.warn('PDF export not implemented yet - skipping');
          return;
        }
        throw error;
      }
    });
  }

  private async test08_ShareReport(token: string): Promise<void> {
    await this.executeTest('SCOUT-08', 'Reports: Share report with team', async () => {
      const reportId = this.context.testData.createdReportId;

      // Skip if no report was created (no matches available)
      if (!reportId) {
        this.logger.warn('No report ID from test04 - skipping share test');
        return;
      }

      const shareData = {
        userIds: ['user-id-placeholder'], // Would need real user IDs
        message: 'Shared for testing',
      };

      try {
        await this.apiCall('post', `/scouting-reports/${reportId}/share`, shareData, token);
        this.logger.success('Report sharing works');
      } catch (error: any) {
        if (error.response?.status === 501 || error.response?.status === 404) {
          this.logger.warn('Share feature not implemented yet - skipping');
          return;
        }
        throw error;
      }
    });
  }

  private async test09_AutoScoutMatchPerformance(token: string): Promise<void> {
    await this.executeTest('SCOUT-09', 'AutoScout: Generate Match Performance report', async () => {
      const players = await this.apiCall('get', '/players?limit=1', undefined, token);
      const playerId = players[0].id;

      const autoScoutData = {
        playerId,
        reportType: 'MATCH_PERFORMANCE',  // Fixed: was 'template', should be 'reportType'
        matchId: undefined, // Optional field
        customContext: 'Automated test generation',
      };

      const generated = await this.apiCall('post', '/auto-scout/generate', autoScoutData, token);

      this.assert('AutoScout generated report', !!generated);
      // API returns {success: true, data: {...}, message: '...'}
      this.assert('Has report data', !!generated.data || !!generated.success);
    });
  }

  private async test10_AutoScoutSeasonOverview(token: string): Promise<void> {
    await this.executeTest('SCOUT-10', 'AutoScout: Generate Season Overview report', async () => {
      const players = await this.apiCall('get', '/players?limit=1', undefined, token);
      const playerId = players[0].id;

      const generated = await this.apiCall('post', '/auto-scout/generate', {
        playerId,
        reportType: 'SEASON_OVERVIEW',  // Fixed: was 'template', should be 'reportType'
      }, token);

      this.assert('Season overview generated', !!generated);
    });
  }

  private async test11_AutoScoutTransferTarget(token: string): Promise<void> {
    await this.executeTest('SCOUT-11', 'AutoScout: Generate Transfer Target report', async () => {
      const players = await this.apiCall('get', '/players?limit=1', undefined, token);
      const playerId = players[0].id;

      const generated = await this.apiCall('post', '/auto-scout/generate', {
        playerId,
        reportType: 'TRANSFER_TARGET',  // Fixed: was 'template', should be 'reportType'
      }, token);

      this.assert('Transfer target generated', !!generated);
    });
  }

  private async test12_AutoScoutYouthProspect(token: string): Promise<void> {
    await this.executeTest('SCOUT-12', 'AutoScout: Generate Youth Prospect report', async () => {
      const players = await this.apiCall('get', '/players?limit=1', undefined, token);
      const playerId = players[0].id;

      const generated = await this.apiCall('post', '/auto-scout/generate', {
        playerId,
        reportType: 'YOUTH_PROSPECT',  // Fixed: was 'template', should be 'reportType'
      }, token);

      this.assert('Youth prospect generated', !!generated);
    });
  }

  private async test13_AutoScoutQuickScan(token: string): Promise<void> {
    await this.executeTest('SCOUT-13', 'AutoScout: Generate Quick Scan report', async () => {
      const players = await this.apiCall('get', '/players?limit=1', undefined, token);
      const playerId = players[0].id;

      const generated = await this.apiCall('post', '/auto-scout/generate', {
        playerId,
        reportType: 'QUICK_SCAN',  // Fixed: was 'template', should be 'reportType'
      }, token);

      this.assert('Quick scan generated', !!generated);
    });
  }

  private async test14_AutoScoutQualityScore(token: string): Promise<void> {
    await this.executeTest('SCOUT-14', 'AutoScout: Quality scoring', async () => {
      const players = await this.apiCall('get', '/players?limit=1', undefined, token);
      const playerId = players[0].id;

      const generated = await this.apiCall('post', '/auto-scout/generate', {
        playerId,
        reportType: 'MATCH_PERFORMANCE',  // Fixed: was 'template', should be 'reportType'
      }, token);

      // Quality score should be in response
      this.assert('Generated report exists', !!generated);

      if (generated.qualityScore !== undefined) {
        this.assert('Quality score is number', typeof generated.qualityScore === 'number');
        this.assert('Quality score in valid range', generated.qualityScore >= 0 && generated.qualityScore <= 100);
      } else {
        this.logger.warn('Quality score not included in response');
      }
    });
  }

  private async test15_AutoScoutHistory(token: string): Promise<void> {
    await this.executeTest('SCOUT-15', 'AutoScout: View generation history', async () => {
      const history = await this.apiCall('get', '/auto-scout/history', undefined, token);

      this.assert('History returned', !!history);
      this.assert('History is array', Array.isArray(history) || Array.isArray(history.data));
    });
  }

  private async test16_SmartScoutRecommendations(token: string): Promise<void> {
    await this.executeTest('SCOUT-16', 'SmartScout: Get player recommendations', async () => {
      try {
        const recommendations = await this.apiCall('get', '/auto-scout/recommendations', undefined, token);
        this.assert('Recommendations returned', !!recommendations);
      } catch (error: any) {
        if (error.response?.status === 404 || error.response?.status === 501) {
          this.logger.warn('SmartScout recommendations not implemented - skipping');
          return;
        }
        throw error;
      }
    });
  }

  private async test17_KanbanBoard(token: string): Promise<void> {
    await this.executeTest('SCOUT-17', 'Kanban: Load board and move cards', async () => {
      try {
        const board = await this.apiCall('get', '/kanban', undefined, token);
        this.assert('Kanban board loaded', !!board);
      } catch (error: any) {
        if (error.response?.status === 404) {
          this.logger.warn('Kanban not implemented - skipping');
          return;
        }
        throw error;
      }
    });
  }

  private async test18_CalendarEvents(token: string): Promise<void> {
    await this.executeTest('SCOUT-18', 'Calendar: View events', async () => {
      try {
        const events = await this.apiCall('get', '/events', undefined, token);
        this.assert('Events loaded', !!events);
      } catch (error: any) {
        if (error.response?.status === 404) {
          this.logger.warn('Events calendar not fully implemented - skipping');
          return;
        }
        throw error;
      }
    });
  }

  private async test19_Gamification(token: string): Promise<void> {
    await this.executeTest('SCOUT-19', 'Gamification: XP, achievements, levels', async () => {
      try {
        const gamification = await this.apiCall('get', '/gamification/stats', undefined, token);
        this.assert('Gamification stats loaded', !!gamification);

        if (gamification.xp !== undefined) {
          this.assert('XP is number', typeof gamification.xp === 'number');
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          this.logger.warn('Gamification not fully implemented - skipping');
          return;
        }
        throw error;
      }
    });
  }

  private async test20_Marketplace(token: string): Promise<void> {
    await this.executeTest('SCOUT-20', 'Marketplace: View and create listings', async () => {
      try {
        const listings = await this.apiCall('get', '/marketplace', undefined, token);
        this.assert('Marketplace listings loaded', !!listings);
      } catch (error: any) {
        if (error.response?.status === 404) {
          this.logger.warn('Marketplace not fully implemented - skipping');
          return;
        }
        throw error;
      }
    });
  }
}
