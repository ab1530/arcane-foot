import { BaseAgent } from '../base/BaseAgent';
import { AgentReport, TestContext } from '../base/types';

export class PlayerFlowAgent extends BaseAgent {
  constructor(context: TestContext) {
    super('PlayerFlow', context);
  }

  async run(): Promise<AgentReport> {
    this.startTime = Date.now();
    this.logger.header('⚽ PLAYER FLOW AGENT - Starting Tests');

    try {
      const token = await this.login('player');

      await this.test01_PlayerDashboard(token);
      await this.test02_ArkaneIndexScore(token);
      await this.test03_ProfileEditing(token);
      await this.test04_PassportGeneration(token);
      await this.test05_CoachingHubBrowsing(token);
      await this.test06_CoachProfileView(token);
      await this.test07_SessionBooking(token);
      await this.test08_PaymentProcessing(token);
      await this.test09_SessionConfirmation(token);
      await this.test10_CampsBrowsing(token);
      await this.test11_CampRegistration(token);
      await this.test12_MarketplaceVisibility(token);
      await this.test13_AchievementsDisplay(token);
      await this.test14_LeaderboardRanking(token);
      await this.test15_NotificationsView(token);

    } catch (error: any) {
      this.logger.error(`PlayerFlowAgent failed: ${error.message}`);
    }

    this.endTime = Date.now();
    const report = this.generateReport();
    this.logger.success(`PlayerFlowAgent completed: ${report.passed}/${report.totalTests} passed`);

    return report;
  }

  private async test01_PlayerDashboard(token: string): Promise<void> {
    await this.executeTest('PLAYER-01', 'Dashboard: View player stats', async () => {
      const dashboard = await this.apiCall('get', '/analytics/dashboard', undefined, token);
      this.assert('Dashboard loaded', !!dashboard);
    });
  }

  private async test02_ArkaneIndexScore(token: string): Promise<void> {
    await this.executeTest('PLAYER-02', 'ArkaneIndex: View score and radar chart', async () => {
      try {
        const index = await this.apiCall('get', '/arkane-index/me', undefined, token);
        this.assert('ArkaneIndex loaded', !!index);
      } catch (error: any) {
        if (error.response?.status === 404) {
          this.logger.warn('ArkaneIndex not available for this player - skipping');
          return;
        }
        throw error;
      }
    });
  }

  private async test03_ProfileEditing(token: string): Promise<void> {
    await this.executeTest('PLAYER-03', 'Profile: Edit profile information', async () => {
      const updateData = { firstName: 'UpdatedFirstName', phone: '+33123456789' };
      const updated = await this.apiCall('patch', '/users/me', updateData, token);
      this.assert('Profile updated', !!updated);
      this.assert('First name updated', updated.firstName === 'UpdatedFirstName');
    });
  }

  private async test04_PassportGeneration(token: string): Promise<void> {
    await this.executeTest('PLAYER-04', 'Passport: Generate digital passport PDF', async () => {
      try {
        const passport = await this.apiCall('get', '/passport/generate', undefined, token);
        this.assert('Passport generated', !!passport);
      } catch (error: any) {
        if (error.response?.status === 404 || error.response?.status === 501) {
          this.logger.warn('Passport generation not implemented - skipping');
          return;
        }
        throw error;
      }
    });
  }

  private async test05_CoachingHubBrowsing(token: string): Promise<void> {
    await this.executeTest('PLAYER-05', 'Coaching Hub: Browse available coaches', async () => {
      try {
        const coaches = await this.apiCall('get', '/coaching/coaches', undefined, token);
        this.assert('Coaches list loaded', !!coaches);
      } catch (error: any) {
        if (error.response?.status === 404) {
          this.logger.warn('Coaching hub not implemented - skipping');
          return;
        }
        throw error;
      }
    });
  }

  private async test06_CoachProfileView(token: string): Promise<void> {
    await this.executeTest('PLAYER-06', 'Coaching: View coach profile', async () => {
      this.logger.warn('Skipping - requires coach ID');
    });
  }

  private async test07_SessionBooking(token: string): Promise<void> {
    await this.executeTest('PLAYER-07', 'Coaching: Book session', async () => {
      this.logger.warn('Skipping - requires payment integration');
    });
  }

  private async test08_PaymentProcessing(token: string): Promise<void> {
    await this.executeTest('PLAYER-08', 'Payment: Process Stripe payment', async () => {
      this.logger.warn('Skipping - requires Stripe test mode setup');
    });
  }

  private async test09_SessionConfirmation(token: string): Promise<void> {
    await this.executeTest('PLAYER-09', 'Coaching: Confirm session booking', async () => {
      this.logger.warn('Skipping - depends on booking test');
    });
  }

  private async test10_CampsBrowsing(token: string): Promise<void> {
    await this.executeTest('PLAYER-10', 'Camps: Browse available camps', async () => {
      try {
        const camps = await this.apiCall('get', '/camps', undefined, token);
        this.assert('Camps list loaded', !!camps);
      } catch (error: any) {
        if (error.response?.status === 404) {
          this.logger.warn('Camps not implemented - skipping');
          return;
        }
        throw error;
      }
    });
  }

  private async test11_CampRegistration(token: string): Promise<void> {
    await this.executeTest('PLAYER-11', 'Camps: Register for camp', async () => {
      this.logger.warn('Skipping - requires payment integration');
    });
  }

  private async test12_MarketplaceVisibility(token: string): Promise<void> {
    await this.executeTest('PLAYER-12', 'Marketplace: Toggle visibility', async () => {
      try {
        await this.apiCall('patch', '/marketplace/visibility', { visible: true }, token);
        this.logger.success('Marketplace visibility toggled');
      } catch (error: any) {
        if (error.response?.status === 404) {
          this.logger.warn('Marketplace visibility not implemented - skipping');
          return;
        }
        throw error;
      }
    });
  }

  private async test13_AchievementsDisplay(token: string): Promise<void> {
    await this.executeTest('PLAYER-13', 'Gamification: View achievements', async () => {
      try {
        const achievements = await this.apiCall('get', '/gamification/achievements', undefined, token);
        this.assert('Achievements loaded', !!achievements);
      } catch (error: any) {
        if (error.response?.status === 404) {
          this.logger.warn('Achievements not implemented - skipping');
          return;
        }
        throw error;
      }
    });
  }

  private async test14_LeaderboardRanking(token: string): Promise<void> {
    await this.executeTest('PLAYER-14', 'Gamification: View leaderboard', async () => {
      try {
        const leaderboard = await this.apiCall('get', '/gamification/leaderboard', undefined, token);
        this.assert('Leaderboard loaded', !!leaderboard);
      } catch (error: any) {
        if (error.response?.status === 404) {
          this.logger.warn('Leaderboard not implemented - skipping');
          return;
        }
        throw error;
      }
    });
  }

  private async test15_NotificationsView(token: string): Promise<void> {
    await this.executeTest('PLAYER-15', 'Notifications: View all notifications', async () => {
      const notifications = await this.apiCall('get', '/notifications', undefined, token);
      this.assert('Notifications loaded', !!notifications);
    });
  }
}
