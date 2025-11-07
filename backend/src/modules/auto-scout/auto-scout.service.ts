import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StatsAggregatorService } from './stats-aggregator.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import OpenAI from 'openai';
import { randomUUID } from 'crypto';
import {
  GeneratedReport,
  PlayerStats,
  ReportTemplate,
  GenerationOptions,
  QualityScore,
  BulkGenerationResult,
  ReportType,
} from './interfaces/report.interface';
import {
  matchPerformanceTemplate,
  seasonOverviewTemplate,
  transferTargetTemplate,
  youthProspectTemplate,
  quickScanTemplate,
} from './templates';

@Injectable()
export class AutoScoutService {
  private readonly logger = new Logger(AutoScoutService.name);
  private readonly openai: OpenAI;
  private readonly COST_PER_1K_INPUT_TOKENS = 0.01; // GPT-4 Turbo pricing
  private readonly COST_PER_1K_OUTPUT_TOKENS = 0.03;

  constructor(
    private readonly prisma: PrismaService,
    private readonly statsAggregator: StatsAggregatorService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate a scouting report for a player
   */
  async generateReport(
    playerId: string,
    matchId?: string,
    options?: GenerationOptions,
    scoutId?: string,
  ): Promise<GeneratedReport> {
    const startTime = Date.now();

    // Check cache first
    const cacheKey = `autoscout:${playerId}:${matchId || 'general'}:${options?.reportType || 'default'}`;
    const cached = await this.cacheManager.get<GeneratedReport>(cacheKey);
    if (cached) {
      this.logger.log(`Returning cached report for player ${playerId}`);
      return cached;
    }

    // Fetch player stats
    const stats = await this.statsAggregator.getPlayerStats(playerId, {
      includeMatches: true,
      matchCount: 5,
      includeHistoricalReports: true,
    });

    if (!stats) {
      throw new BadRequestException(`Player with ID ${playerId} not found`);
    }

    // Select appropriate template
    const template = this.getTemplate(options?.reportType);

    // Generate report with AI
    let report: GeneratedReport;
    let tokensUsed = 0;

    try {
      const aiResult = await this.generateWithAI(stats, template, {
        matchId,
        customContext: options?.customContext,
        temperature: options?.temperature || 0.7,
        maxTokens: options?.maxTokens || 2000,
      });

      report = aiResult.report;
      tokensUsed = aiResult.tokensUsed;
    } catch (error) {
      this.logger.error(`AI generation failed: ${error.message}`);
      // Fallback to template-based report
      report = this.generateTemplateBasedReport(stats, template);
      tokensUsed = 0;
    }

    // Calculate quality score
    const qualityScore = this.calculateQualityScore(report, stats);
    report.qualityScore = qualityScore;

    // Save to database
    const generationTime = Date.now() - startTime;
    const cost = this.calculateCost(tokensUsed);

    await this.saveGeneratedReport({
      playerId,
      matchId,
      scoutId,
      reportData: report,
      qualityScore: qualityScore.total,
      qualityBreakdown: qualityScore.breakdown,
      template: template.name,
      model: 'gpt-4-turbo-preview',
      tokensUsed,
      generationTime,
      cost,
    });

    // Cache the result
    await this.cacheManager.set(cacheKey, report, 3600000); // 1 hour

    return report;
  }

  /**
   * Generate reports for multiple players (bulk operation)
   */
  async generateBulkReports(
    playerIds: string[],
    matchId: string,
    scoutId?: string,
  ): Promise<BulkGenerationResult> {
    const maxConcurrent = 10;
    const results: GeneratedReport[] = [];
    const errors: Array<{ playerId: string; error: string }> = [];
    let totalTokens = 0;

    // Process in batches
    for (let i = 0; i < playerIds.length; i += maxConcurrent) {
      const batch = playerIds.slice(i, i + maxConcurrent);

      const batchPromises = batch.map(async (playerId) => {
        try {
          const report = await this.generateReport(playerId, matchId, undefined, scoutId);
          results.push(report);
          // Extract tokens from saved report (would need to track this)
          return { success: true, playerId };
        } catch (error) {
          errors.push({ playerId, error: error.message });
          return { success: false, playerId };
        }
      });

      await Promise.all(batchPromises);
    }

    // Calculate statistics
    const avgQualityScore = results.length > 0
      ? results.reduce((sum, r) => sum + r.qualityScore.total, 0) / results.length
      : 0;

    const totalCost = this.calculateCost(totalTokens);

    return {
      total: playerIds.length,
      successful: results.length,
      failed: errors.length,
      reports: results,
      errors,
      totalTokens,
      totalCost,
      averageQualityScore: avgQualityScore,
    };
  }

  /**
   * Enhance an existing scouting report with AI insights
   */
  async enhanceReport(reportId: string): Promise<GeneratedReport> {
    // Fetch existing report
    const existingReport = await this.prisma.scouting_reports.findUnique({
      where: { id: reportId },
      include: {
        players: {
          include: {
            users: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!existingReport) {
      throw new BadRequestException('Report not found');
    }

    // Get fresh stats
    const stats = await this.statsAggregator.getPlayerStats(existingReport.playerId, {
      includeMatches: true,
      matchCount: 5,
    });

    // Generate enhancement using AI
    const enhancementPrompt = this.buildEnhancementPrompt(existingReport, stats);

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert football scout providing additional insights to enhance an existing scouting report.',
        },
        {
          role: 'user',
          content: enhancementPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const enhancement = this.parseEnhancement(completion.choices[0].message.content);

    // Create enhanced report
    const enhancedReport: GeneratedReport = {
      playerId: existingReport.playerId,
      playerName: `${existingReport.players.users.firstName} ${existingReport.players.users.lastName}`,
      position: existingReport.players.position || 'Unknown',
      summary: enhancement.summary || existingReport.summary || '',
      technicalSkills: enhancement.technicalSkills || this.extractCategoryFromReport(existingReport, 'technical'),
      tacticalAwareness: enhancement.tacticalAwareness || this.extractCategoryFromReport(existingReport, 'tactical'),
      physicalAttributes: enhancement.physicalAttributes || this.extractCategoryFromReport(existingReport, 'physical'),
      mentalAttributes: enhancement.mentalAttributes || this.extractCategoryFromReport(existingReport, 'mental'),
      overallRating: enhancement.overallRating || existingReport.overallRating || 0,
      potential: enhancement.potential || '',
      recommendations: enhancement.recommendations || [],
      comparablePlayers: enhancement.comparablePlayers || [],
      qualityScore: this.calculateQualityScore(enhancement as any, stats),
      generatedAt: new Date(),
      model: 'gpt-4-turbo-preview',
    };

    return enhancedReport;
  }

  /**
   * Get available report templates
   */
  getReportTemplates(): ReportTemplate[] {
    return [
      matchPerformanceTemplate,
      seasonOverviewTemplate,
      transferTargetTemplate,
      youthProspectTemplate,
      quickScanTemplate,
    ];
  }

  /**
   * Generate report with custom template
   */
  async customGenerate(
    playerId: string,
    template: ReportTemplate,
    customPrompt?: string,
    scoutId?: string,
  ): Promise<GeneratedReport> {
    const stats = await this.statsAggregator.getPlayerStats(playerId, {
      includeMatches: true,
      matchCount: 5,
    });

    const aiResult = await this.generateWithAI(stats, template, {
      customContext: customPrompt,
      temperature: 0.7,
    });

    const report = aiResult.report;
    report.qualityScore = this.calculateQualityScore(report, stats);

    return report;
  }

  /**
   * Get analytics for AutoScout usage
   */
  async getAnalytics(startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [totalReports, avgQuality, totalTokens, templateUsage] = await Promise.all([
      this.prisma.auto_generated_reports.count({ where }),
      this.prisma.auto_generated_reports.aggregate({
        where,
        _avg: { qualityScore: true },
      }),
      this.prisma.auto_generated_reports.aggregate({
        where,
        _sum: { tokensUsed: true },
      }),
      this.prisma.auto_generated_reports.groupBy({
        by: ['template'],
        where,
        _count: { template: true },
      }),
    ]);

    const totalCost = this.calculateCost(totalTokens._sum.tokensUsed || 0);

    return {
      totalReports,
      averageQualityScore: avgQuality._avg.qualityScore || 0,
      totalTokensUsed: totalTokens._sum.tokensUsed || 0,
      estimatedCost: totalCost,
      templateUsage: templateUsage.map(t => ({
        template: t.template,
        count: t._count.template,
      })),
    };
  }

  /**
   * Generate report using GPT-4
   */
  private async generateWithAI(
    stats: PlayerStats,
    template: ReportTemplate,
    context?: {
      matchId?: string;
      customContext?: string;
      temperature?: number;
      maxTokens?: number;
    },
  ): Promise<{ report: GeneratedReport; tokensUsed: number }> {
    const prompt = this.buildPrompt(stats, template, context?.customContext);

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: this.getSystemPrompt(),
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: context?.temperature || 0.7,
      max_tokens: context?.maxTokens || 2000,
      response_format: { type: 'json_object' },
    });

    const report = this.parseAIResponse(
      completion.choices[0].message.content,
      stats,
    );

    const tokensUsed = completion.usage?.total_tokens || 0;

    return { report, tokensUsed };
  }

  /**
   * Build the prompt for AI generation
   */
  private buildPrompt(
    stats: PlayerStats,
    template: ReportTemplate,
    customContext?: string,
  ): string {
    const statsJson = JSON.stringify(stats, null, 2);

    let prompt = template.promptTemplate
      .replace('{player_name}', stats.basic.name)
      .replace('{position}', stats.basic.position)
      .replace('{stats}', statsJson);

    if (customContext) {
      prompt += `\n\nAdditional Context: ${customContext}`;
    }

    prompt += `\n\nPlease provide your analysis in JSON format with the following structure:
{
  "summary": "2-3 sentence overview",
  "technicalSkills": {
    "rating": 0-10,
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"],
    "details": "detailed analysis"
  },
  "tacticalAwareness": { same structure },
  "physicalAttributes": { same structure },
  "mentalAttributes": { same structure },
  "overallRating": 0-10,
  "potential": "text description",
  "recommendations": ["rec1", "rec2"],
  "comparablePlayers": ["player1", "player2"]
}`;

    return prompt;
  }

  /**
   * Get system prompt for GPT-4
   */
  private getSystemPrompt(): string {
    return `You are an expert football scout with 20+ years of experience analyzing players across all levels of professional football.

Your expertise includes:
- Detailed technical analysis (ball control, passing, shooting, dribbling)
- Tactical understanding (positioning, decision-making, game intelligence)
- Physical assessment (pace, strength, stamina, agility)
- Mental evaluation (composure, leadership, work rate, consistency)

When analyzing players:
1. Be specific and evidence-based, referencing stats where relevant
2. Provide balanced assessment (both strengths and areas for improvement)
3. Consider the player's age, position, and level of competition
4. Give actionable insights and recommendations
5. Compare to similar players when appropriate
6. Use professional scouting terminology
7. Be honest about limitations in data or observation

Always return your analysis in valid JSON format.`;
  }

  /**
   * Parse AI response into structured report
   */
  private parseAIResponse(
    content: string,
    stats: PlayerStats,
  ): GeneratedReport {
    try {
      const parsed = JSON.parse(content);

      return {
        playerId: '', // Will be set by caller
        playerName: stats.basic.name,
        position: stats.basic.position,
        summary: parsed.summary || '',
        technicalSkills: parsed.technicalSkills || this.getDefaultCategory(),
        tacticalAwareness: parsed.tacticalAwareness || this.getDefaultCategory(),
        physicalAttributes: parsed.physicalAttributes || this.getDefaultCategory(),
        mentalAttributes: parsed.mentalAttributes || this.getDefaultCategory(),
        overallRating: parsed.overallRating || 0,
        potential: parsed.potential || '',
        recommendations: parsed.recommendations || [],
        comparablePlayers: parsed.comparablePlayers || [],
        qualityScore: { total: 0, breakdown: { dataCompleteness: 0, insightDepth: 0, technicalAccuracy: 0, actionability: 0 }, grade: 'C' },
        generatedAt: new Date(),
        model: 'gpt-4-turbo-preview',
      };
    } catch (error) {
      this.logger.error(`Failed to parse AI response: ${error.message}`);
      throw new BadRequestException('Failed to generate valid report');
    }
  }

  /**
   * Generate template-based report as fallback
   */
  private generateTemplateBasedReport(
    stats: PlayerStats,
    template: ReportTemplate,
  ): GeneratedReport {
    return {
      playerId: '',
      playerName: stats.basic.name,
      position: stats.basic.position,
      summary: `Template-based report for ${stats.basic.name}. Limited AI analysis available.`,
      technicalSkills: {
        rating: stats.ratings.avgTechnical,
        strengths: ['Based on historical data'],
        weaknesses: ['AI analysis unavailable'],
        details: 'Template-based analysis',
      },
      tacticalAwareness: {
        rating: stats.ratings.avgTactical,
        strengths: [],
        weaknesses: [],
        details: 'Template-based analysis',
      },
      physicalAttributes: {
        rating: stats.ratings.avgPhysical,
        strengths: [],
        weaknesses: [],
        details: 'Template-based analysis',
      },
      mentalAttributes: {
        rating: stats.ratings.avgMental,
        strengths: [],
        weaknesses: [],
        details: 'Template-based analysis',
      },
      overallRating: (stats.ratings.avgTechnical + stats.ratings.avgTactical + stats.ratings.avgPhysical + stats.ratings.avgMental) / 4,
      potential: 'Analysis unavailable',
      recommendations: ['AI generation failed - manual review recommended'],
      comparablePlayers: [],
      qualityScore: { total: 25, breakdown: { dataCompleteness: 25, insightDepth: 0, technicalAccuracy: 0, actionability: 0 }, grade: 'D' },
      generatedAt: new Date(),
      model: 'template-fallback',
    };
  }

  /**
   * Calculate quality score for generated report
   */
  private calculateQualityScore(
    report: GeneratedReport,
    stats: PlayerStats,
  ): QualityScore {
    const scores = {
      dataCompleteness: this.scoreDataCompleteness(stats),
      insightDepth: this.scoreInsightDepth(report),
      technicalAccuracy: this.scoreTechnicalAccuracy(report, stats),
      actionability: this.scoreActionability(report),
    };

    const total = Object.values(scores).reduce((a, b) => a + b, 0);

    return {
      total,
      breakdown: scores,
      grade: this.getGrade(total),
    };
  }

  private scoreDataCompleteness(stats: PlayerStats): number {
    let score = 0;

    // Basic info (5 points)
    if (stats.basic.name && stats.basic.position) score += 5;

    // Career stats (5 points)
    if (stats.career.totalMatches > 0) score += 5;

    // Recent form (10 points)
    if (stats.recent.last5Matches.length >= 3) score += 10;

    // Ratings (5 points)
    if (stats.ratings.avgTechnical > 0) score += 5;

    return Math.min(score, 25);
  }

  private scoreInsightDepth(report: GeneratedReport): number {
    let score = 0;

    // Summary quality (5 points)
    if (report.summary && report.summary.length > 50) score += 5;

    // Detailed analysis in each category (15 points)
    const categories = [
      report.technicalSkills,
      report.tacticalAwareness,
      report.physicalAttributes,
      report.mentalAttributes,
    ];

    categories.forEach(cat => {
      if (cat.strengths.length > 0 && cat.weaknesses.length > 0) {
        score += 3;
      }
    });

    // Recommendations (5 points)
    if (report.recommendations && report.recommendations.length >= 2) score += 5;

    return Math.min(score, 25);
  }

  private scoreTechnicalAccuracy(report: GeneratedReport, stats: PlayerStats): number {
    let score = 25;

    // Check if ratings are reasonable
    if (report.overallRating < 0 || report.overallRating > 10) score -= 10;

    // Check if category ratings align with overall
    const avgCategory = (
      report.technicalSkills.rating +
      report.tacticalAwareness.rating +
      report.physicalAttributes.rating +
      report.mentalAttributes.rating
    ) / 4;

    if (Math.abs(avgCategory - report.overallRating) > 2) score -= 5;

    return Math.max(score, 0);
  }

  private scoreActionability(report: GeneratedReport): number {
    let score = 0;

    // Recommendations provided (10 points)
    if (report.recommendations && report.recommendations.length > 0) score += 10;

    // Comparable players (5 points)
    if (report.comparablePlayers && report.comparablePlayers.length > 0) score += 5;

    // Potential assessment (5 points)
    if (report.potential && report.potential.length > 10) score += 5;

    // Specific weaknesses identified (5 points)
    const totalWeaknesses = [
      report.technicalSkills.weaknesses,
      report.tacticalAwareness.weaknesses,
      report.physicalAttributes.weaknesses,
      report.mentalAttributes.weaknesses,
    ].flat().length;

    if (totalWeaknesses >= 3) score += 5;

    return Math.min(score, 25);
  }

  private getGrade(total: number): 'S' | 'A' | 'B' | 'C' | 'D' {
    if (total >= 90) return 'S';
    if (total >= 80) return 'A';
    if (total >= 70) return 'B';
    if (total >= 60) return 'C';
    return 'D';
  }

  private getTemplate(reportType?: ReportType): ReportTemplate {
    switch (reportType) {
      case ReportType.MATCH_PERFORMANCE:
        return matchPerformanceTemplate;
      case ReportType.SEASON_OVERVIEW:
        return seasonOverviewTemplate;
      case ReportType.TRANSFER_TARGET:
        return transferTargetTemplate;
      case ReportType.YOUTH_PROSPECT:
        return youthProspectTemplate;
      case ReportType.QUICK_SCAN:
        return quickScanTemplate;
      default:
        return seasonOverviewTemplate;
    }
  }

  private calculateCost(tokens: number): number {
    // Rough estimate: 60% input, 40% output
    const inputTokens = tokens * 0.6;
    const outputTokens = tokens * 0.4;

    return (
      (inputTokens / 1000) * this.COST_PER_1K_INPUT_TOKENS +
      (outputTokens / 1000) * this.COST_PER_1K_OUTPUT_TOKENS
    );
  }

  private async saveGeneratedReport(data: any) {
    try {
      await this.prisma.auto_generated_reports.create({
        data: {
          id: randomUUID(),
          playerId: data.playerId,
          matchId: data.matchId,
          scoutId: data.scoutId,
          reportData: data.reportData,
          qualityScore: data.qualityScore,
          qualityBreakdown: data.qualityBreakdown,
          template: data.template,
          model: data.model,
          tokensUsed: data.tokensUsed,
          generationTime: data.generationTime,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to save generated report: ${error.message}`);
    }
  }

  private getDefaultCategory() {
    return {
      rating: 0,
      strengths: [],
      weaknesses: [],
      details: '',
    };
  }

  private buildEnhancementPrompt(existingReport: any, stats: PlayerStats): string {
    return `Enhance this existing scouting report with additional insights:

Existing Report Summary: ${existingReport.summary || 'N/A'}
Current Overall Rating: ${existingReport.overallRating || 'N/A'}

Player Stats:
${JSON.stringify(stats, null, 2)}

Please provide:
1. Enhanced summary with deeper insights
2. Additional comparable players
3. More specific recommendations
4. Updated potential assessment based on recent performance

Return in the same JSON format as a full report.`;
  }

  private parseEnhancement(content: string): Partial<GeneratedReport> {
    try {
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  private extractCategoryFromReport(report: any, category: string) {
    return {
      rating: report[`${category}Rating`] || 0,
      strengths: [],
      weaknesses: [],
      details: report[`${category}Notes`] || '',
    };
  }
}
