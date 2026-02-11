import api from '../api';
import type {
  GenerateReportDto,
  GeneratedReport,
  ReportTemplate,
  ReportType,
  AutoScoutHistoryItem,
  RegenerateOptions,
  CostEstimate,
} from '../../types/auto-scout';

export const autoScoutApi = {
  /**
   * Generate a new scouting report using AI
   */
  async generate(data: GenerateReportDto): Promise<{
    success: boolean;
    data: GeneratedReport;
    message: string;
    costWarning?: string;
    qualityGrade?: string;
  }> {
    const response = await api.postRaw('/auto-scout/generate', data);
    return response;
  },

  /**
   * Get available report templates
   */
  async getTemplates(): Promise<{
    success: boolean;
    data: ReportTemplate[];
    count: number;
  }> {
    const response = await api.getRaw('/auto-scout/templates');
    return response;
  },

  /**
   * Get report generation history for a player (or all players)
   */
  async getHistory(playerId: string): Promise<{
    success: boolean;
    data: AutoScoutHistoryItem[];
  }> {
    if (!playerId) {
      throw new Error('autoScoutApi.getHistory requires a playerId');
    }
    const response = await api.getRaw(`/auto-scout/player/${playerId}/history`);
    return response;
  },

  /**
   * Regenerate an existing report with different parameters
   */
  async regenerate(
    reportId: string,
    options?: RegenerateOptions
  ): Promise<{
    success: boolean;
    data: GeneratedReport;
  }> {
    const response = await api.postRaw(`/auto-scout/regenerate/${reportId}`, options);
    return response;
  },

  /**
   * Get cost estimate for report generation
   */
  async getCostEstimate(reportType?: ReportType): Promise<{
    success: boolean;
    data: CostEstimate;
  }> {
    const params = reportType ? { reportType } : undefined;
    const response = await api.getRaw('/auto-scout/cost-estimate', { params });
    return response;
  },

  /**
   * Preview report without saving to database
   */
  async preview(
    playerId: string,
    matchId?: string
  ): Promise<{
    success: boolean;
    data: GeneratedReport;
    message: string;
    note: string;
  }> {
    const params = matchId ? { matchId } : undefined;
    const response = await api.getRaw(`/auto-scout/preview/${playerId}`, { params });
    return response;
  },

  /**
   * Enhance existing scouting report with AI insights
   */
  async enhance(reportId: string): Promise<{
    success: boolean;
    data: GeneratedReport;
    message: string;
  }> {
    const response = await api.postRaw(`/auto-scout/enhance/${reportId}`, {});
    return response;
  },

  /**
   * Get analytics for AutoScout usage
   */
  async getAnalytics(startDate?: string, endDate?: string): Promise<any> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.getRaw('/auto-scout/analytics', { params });
    return response;
  },

  /**
   * Delete a generated report
   */
  async deleteReport(reportId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await api.deleteRaw(`/auto-scout/reports/${reportId}`);
    return response;
  },
};

export default autoScoutApi;
