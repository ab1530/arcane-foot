import { Injectable, Logger, BadRequestException, Inject, NotFoundException } from '@nestjs/common';
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
    const openAiApiKey = process.env.OPENAI_API_KEY;
    if (!openAiApiKey) {
      this.logger.warn(
        'OpenAI API key not found. AutoScout AI generation will fallback when invoked.',
      );
    }

    this.openai = new OpenAI({
      // Keep service boot-safe when AI credentials are not configured in prod.
      apiKey: openAiApiKey || 'missing-openai-api-key',
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
      model: 'gpt-4o',
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
    const avgQualityScore =
      results.length > 0
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

  async regenerateReport(reportId: string, temperature?: number) {
    const existing = await this.prisma.auto_generated_reports.findUnique({
      where: { id: reportId },
    });

    if (!existing) {
      throw new NotFoundException(`Auto-scout report ${reportId} not found`);
    }

    const reportType = this.mapTemplateNameToReportType(existing.template ?? undefined);

    return this.generateReport(
      existing.playerId,
      existing.matchId ?? undefined,
      {
        reportType,
        temperature,
      },
      existing.scoutId ?? undefined,
    );
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
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert football scout providing additional insights to enhance an existing scouting report.',
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
      technicalSkills:
        enhancement.technicalSkills || this.extractCategoryFromReport(existingReport, 'technical'),
      tacticalAwareness:
        enhancement.tacticalAwareness || this.extractCategoryFromReport(existingReport, 'tactical'),
      physicalAttributes:
        enhancement.physicalAttributes ||
        this.extractCategoryFromReport(existingReport, 'physical'),
      mentalAttributes:
        enhancement.mentalAttributes || this.extractCategoryFromReport(existingReport, 'mental'),
      overallRating: enhancement.overallRating || existingReport.overallRating || 0,
      potential: enhancement.potential || '',
      recommendations: enhancement.recommendations || [],
      comparablePlayers: enhancement.comparablePlayers || [],
      qualityScore: this.calculateQualityScore(enhancement as any, stats),
      generatedAt: new Date(),
      model: 'gpt-4o',
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
    _scoutId?: string,
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
      templateUsage: templateUsage.map((t) => ({
        template: t.template,
        count: t._count.template,
      })),
    };
  }

  /**
   * Get player's Auto-Scout report history
   */
  async getPlayerHistory(playerId: string) {
    try {
      const reports = await this.prisma.auto_generated_reports.findMany({
        where: { playerId },
        orderBy: { createdAt: 'desc' },
        take: 50, // Limit to 50 most recent reports
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
          users: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return reports.map((report) => ({
        id: report.id,
        playerName: report.players?.users?.firstName
          ? `${report.players.users.firstName} ${report.players.users.lastName}`
          : 'Unknown Player',
        scoutName: report.users
          ? `${report.users.firstName} ${report.users.lastName}`
          : 'Auto-Scout',
        reportType: report.template || 'SEASON_OVERVIEW',
        generatedAt: report.createdAt,
        qualityScore: {
          total: report.qualityScore || 0,
          breakdown: report.qualityBreakdown || {
            dataCompleteness: 0,
            insightDepth: 0,
            technicalAccuracy: 0,
            actionability: 0,
          },
          grade: this.calculateGrade(report.qualityScore || 0),
        },
        isOfficial: report.scoutId !== null,
        model: report.model || 'unknown',
      }));
    } catch (error) {
      this.logger.error(`Failed to get player history: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all Auto-Scout reports for a user
   */
  async getAllHistory(scoutId: string) {
    try {
      const reports = await this.prisma.auto_generated_reports.findMany({
        where: { scoutId },
        orderBy: { createdAt: 'desc' },
        take: 100, // Limit to 100 most recent reports
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
          users: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return reports.map((report) => ({
        id: report.id,
        playerId: report.playerId,
        playerName: report.players?.users?.firstName
          ? `${report.players.users.firstName} ${report.players.users.lastName}`
          : 'Unknown Player',
        scoutName: report.users
          ? `${report.users.firstName} ${report.users.lastName}`
          : 'Auto-Scout',
        reportType: report.template || 'SEASON_OVERVIEW',
        generatedAt: report.createdAt,
        qualityScore: {
          total: report.qualityScore || 0,
          breakdown: report.qualityBreakdown || {
            dataCompleteness: 0,
            insightDepth: 0,
            technicalAccuracy: 0,
            actionability: 0,
          },
          grade: this.calculateGrade(report.qualityScore || 0),
        },
        isOfficial: report.scoutId !== null,
        model: report.model || 'unknown',
      }));
    } catch (error) {
      this.logger.error(`Failed to get all history: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate grade from quality score
   */
  private calculateGrade(score: number): 'S' | 'A' | 'B' | 'C' | 'D' {
    if (score >= 90) return 'S';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    return 'D';
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
      model: 'gpt-4o',
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

    const report = this.parseAIResponse(completion.choices[0].message.content, stats);

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
  private parseAIResponse(content: string, stats: PlayerStats): GeneratedReport {
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
        qualityScore: {
          total: 0,
          breakdown: {
            dataCompleteness: 0,
            insightDepth: 0,
            technicalAccuracy: 0,
            actionability: 0,
          },
          grade: 'C',
        },
        generatedAt: new Date(),
        model: 'gpt-4o',
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
    _template: ReportTemplate,
  ): GeneratedReport {
    const DEFAULT_TEMPLATE_RATING = 5;
    const normalizeRating = (value?: number | null) =>
      typeof value === 'number' && value > 0 ? value : DEFAULT_TEMPLATE_RATING;

    const technicalRating = normalizeRating(stats.ratings?.avgTechnical);
    const tacticalRating = normalizeRating(stats.ratings?.avgTactical);
    const physicalRating = normalizeRating(stats.ratings?.avgPhysical);
    const mentalRating = normalizeRating(stats.ratings?.avgMental);
    const overallRating = (technicalRating + tacticalRating + physicalRating + mentalRating) / 4;

    const basicInfo = stats.basic ?? { name: 'Unknown Player', position: 'Utility Player', age: 0 };
    const safePosition = basicInfo.position || 'Utility Player';
    const safeName = basicInfo.name || 'Unknown Player';
    const safeTrends = stats.trends ?? { improving: false, declining: false, consistent: true };

    // Generate intelligent summary
    const summary = this.generateSummary(stats, overallRating);

    // Analyze strengths and weaknesses based on ratings and position
    const technicalAnalysis = this.analyzeTechnicalSkills(technicalRating, safePosition);
    const tacticalAnalysis = this.analyzeTacticalAwareness(tacticalRating, safePosition);
    const physicalAnalysis = this.analyzePhysicalAttributes(
      physicalRating,
      stats.physical || ({} as any),
    );
    const mentalAnalysis = this.analyzeMentalAttributes(
      mentalRating,
      stats.recent?.recentForm || '',
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(stats, overallRating);

    // Assess potential
    const potential = this.assessPotential(basicInfo.age ?? 0, overallRating, safeTrends);

    // Find comparable players based on position
    const comparablePlayers = this.getComparablePlayers(safePosition, overallRating);

    return {
      playerId: '',
      playerName: safeName,
      position: safePosition,
      summary,
      technicalSkills: {
        rating: technicalRating,
        strengths: technicalAnalysis.strengths,
        weaknesses: technicalAnalysis.weaknesses,
        details: technicalAnalysis.details,
      },
      tacticalAwareness: {
        rating: tacticalRating,
        strengths: tacticalAnalysis.strengths,
        weaknesses: tacticalAnalysis.weaknesses,
        details: tacticalAnalysis.details,
      },
      physicalAttributes: {
        rating: physicalRating,
        strengths: physicalAnalysis.strengths,
        weaknesses: physicalAnalysis.weaknesses,
        details: physicalAnalysis.details,
      },
      mentalAttributes: {
        rating: mentalRating,
        strengths: mentalAnalysis.strengths,
        weaknesses: mentalAnalysis.weaknesses,
        details: mentalAnalysis.details,
      },
      overallRating,
      potential,
      recommendations,
      comparablePlayers,
      qualityScore: {
        total: 72,
        breakdown: {
          dataCompleteness: 20,
          insightDepth: 18,
          technicalAccuracy: 20,
          actionability: 14,
        },
        grade: 'B',
      },
      generatedAt: new Date(),
      model: 'advanced-template',
    };
  }

  /**
   * Generate intelligent summary based on stats
   */
  private generateSummary(stats: PlayerStats, overallRating: number): string {
    const age = stats.basic?.age ?? 0;
    const position = stats.basic?.position ?? 'player';
    const name = stats.basic?.name ?? 'The player';
    const form = stats.recent?.recentForm;
    const trends = stats.trends || { improving: false, declining: false, consistent: true };

    let ageCategory = '';
    if (age < 21) ageCategory = 'young';
    else if (age < 26) ageCategory = 'developing';
    else if (age < 30) ageCategory = 'experienced';
    else ageCategory = 'veteran';

    let performanceLevel = '';
    if (overallRating >= 8) performanceLevel = 'exceptional';
    else if (overallRating >= 7) performanceLevel = 'strong';
    else if (overallRating >= 6) performanceLevel = 'solid';
    else if (overallRating >= 5) performanceLevel = 'average';
    else performanceLevel = 'developing';

    return `${name} is a ${ageCategory} ${position} displaying ${performanceLevel} overall performance. ${form || 'Performance data based on historical scouting reports'}. ${trends.improving ? 'Shows positive development trend with improving performances.' : trends.declining ? 'Recent performances suggest need for tactical adjustment or rest.' : 'Maintains consistent performance levels.'}`;
  }

  /**
   * Analyze technical skills based on rating and position
   */
  private analyzeTechnicalSkills(rating: number, position: string) {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    let details = '';

    if (rating >= 7) {
      strengths.push('Excellent technical ability');
      if (position.includes('M') || position.includes('W')) {
        strengths.push('Strong passing range', 'Good ball control under pressure');
      } else if (position.includes('F') || position.includes('ST')) {
        strengths.push('Clinical finishing', 'Good first touch');
      } else if (position.includes('B') || position.includes('D')) {
        strengths.push('Accurate long passing', 'Solid ball distribution');
      }
      details = `Shows high-level technical proficiency appropriate for ${position} role. Consistently demonstrates quality in possession and ball manipulation.`;
    } else if (rating >= 6) {
      strengths.push('Competent technical skills', 'Reliable in possession');
      weaknesses.push('Could improve consistency');
      details = `Demonstrates solid technical foundation with room for refinement. Generally reliable but occasional lapses in execution.`;
    } else {
      weaknesses.push('Technical skills need development', 'Inconsistent touch');
      strengths.push('Shows potential with proper training');
      details = `Technical abilities require focused development. Would benefit from additional training on ball control and passing accuracy.`;
    }

    return { strengths, weaknesses, details };
  }

  /**
   * Analyze tactical awareness
   */
  private analyzeTacticalAwareness(rating: number, position: string) {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    let details = '';

    if (rating >= 7) {
      strengths.push('Excellent positioning', 'Strong tactical intelligence');
      if (position.includes('DM') || position.includes('CB')) {
        strengths.push('Anticipates play well', 'Good defensive positioning');
      } else if (position.includes('AM') || position.includes('W')) {
        strengths.push('Finds space effectively', 'Creates chances');
      }
      details = `Demonstrates advanced tactical understanding. Reads the game well and makes intelligent decisions both in and out of possession.`;
    } else if (rating >= 6) {
      strengths.push('Understands tactical role', 'Generally well-positioned');
      weaknesses.push('Occasional positional errors');
      details = `Shows good tactical awareness with occasional lapses. Understanding of team shape and defensive duties is developing positively.`;
    } else {
      weaknesses.push('Positional awareness needs work', 'Decision-making could improve');
      strengths.push('Willing to learn tactical instructions');
      details = `Tactical understanding requires development. Would benefit from video analysis and tactical coaching to improve positioning and decision-making.`;
    }

    return { strengths, weaknesses, details };
  }

  /**
   * Analyze physical attributes
   */
  private analyzePhysicalAttributes(rating: number, physical: any) {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    let details = '';

    if (rating >= 7) {
      strengths.push('Excellent physical condition', 'Good athleticism');
      if (physical?.height && physical.height > 180) {
        strengths.push('Strong aerial presence');
      }
      strengths.push('Good stamina and work rate');
      details = `Shows excellent physical attributes with strong pace, power, and endurance. Physical conditioning allows for sustained high-intensity performance.`;
    } else if (rating >= 6) {
      strengths.push('Adequate physical presence', 'Decent pace');
      weaknesses.push('Could improve overall fitness');
      details = `Possesses solid physical attributes though there's room for improvement in strength and conditioning programs.`;
    } else {
      weaknesses.push('Physical attributes need development', 'Stamina concerns');
      strengths.push('Young enough to develop physically');
      details = `Physical development is a priority area. Focused strength and conditioning work could significantly improve overall performance levels.`;
    }

    return { strengths, weaknesses, details };
  }

  /**
   * Analyze mental attributes
   */
  private analyzeMentalAttributes(rating: number, recentForm: string) {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    let details = '';

    if (rating >= 7) {
      strengths.push('Strong mentality', 'Good composure under pressure', 'Consistent performer');
      details = `Demonstrates excellent mental strength and professionalism. ${recentForm || 'Maintains focus and determination in challenging situations.'}`;
    } else if (rating >= 6) {
      strengths.push('Generally composed', 'Shows determination');
      weaknesses.push('Concentration can waver');
      details = `Shows good mental attributes overall. ${recentForm || 'Generally maintains composure though can be affected by high-pressure situations.'}`;
    } else {
      weaknesses.push('Mental resilience needs strengthening', 'Can be inconsistent');
      strengths.push('Shows commitment to improvement');
      details = `Mental side of the game requires development. Would benefit from sports psychology support and confidence-building work.`;
    }

    return { strengths, weaknesses, details };
  }

  /**
   * Generate position-specific recommendations
   */
  private generateRecommendations(stats: PlayerStats, overallRating: number): string[] {
    const recommendations: string[] = [];
    const position = stats.basic?.position || '';
    const age = stats.basic?.age ?? 0;
    const trends = stats.trends || { declining: false, improving: false };

    // Age-based recommendations
    if (age < 23) {
      recommendations.push('Loan to competitive league for regular first-team experience');
      recommendations.push('Intensive training program to maximize development window');
    } else if (age > 29) {
      recommendations.push('Consider squad rotation to manage workload and prevent injuries');
    }

    // Position-specific recommendations
    if (position.includes('GK')) {
      recommendations.push('Regular shot-stopping drills and distribution training');
    } else if (position.includes('CB') || position.includes('FB')) {
      recommendations.push('Focus on defensive positioning and 1v1 situations');
      recommendations.push('Video analysis of aerial duels and defensive transitions');
    } else if (position.includes('DM')) {
      recommendations.push('Improve reading of the game and interception timing');
      recommendations.push('Enhance passing range and distribution under pressure');
    } else if (position.includes('CM') || position.includes('AM')) {
      recommendations.push('Develop creative passing and through-ball execution');
      recommendations.push('Work on off-the-ball movement and space creation');
    } else if (position.includes('W') || position.includes('F')) {
      recommendations.push('Finishing drills and shooting accuracy training');
      recommendations.push('Work on 1v1 dribbling and chance creation');
    }

    // Performance-based recommendations
    if (overallRating < 6) {
      recommendations.push('Individual technical coaching to address fundamental weaknesses');
    } else if (overallRating >= 7.5) {
      recommendations.push(
        'Ready for higher level competition - monitor for transfer opportunities',
      );
    }

    // Form-based recommendations
    if (trends.declining) {
      recommendations.push('Medical screening to rule out underlying fitness issues');
      recommendations.push('Tactical session to restore confidence and form');
    } else if (trends.improving) {
      recommendations.push('Increased responsibility in matches to build on positive momentum');
    }

    return recommendations.slice(0, 4); // Return top 4 recommendations
  }

  /**
   * Assess player potential
   */
  private assessPotential(age: number, rating: number, _trends: any): string {
    if (age < 21) {
      if (rating >= 7)
        return 'Exceptional potential - could develop into world-class player with proper development';
      if (rating >= 6) return 'High potential - shows promise for top-level football';
      return 'Developing potential - needs consistent game time and coaching';
    } else if (age < 24) {
      if (rating >= 7.5)
        return 'Elite level - approaching peak years with room for tactical refinement';
      if (rating >= 6.5) return 'Strong potential - key development years ahead';
      return 'Moderate potential - can establish himself as solid professional';
    } else if (age < 28) {
      if (rating >= 7.5) return 'Peak years - performing at high level with experience advantage';
      if (rating >= 6.5) return 'Solid professional - reliable performer at current level';
      return 'Limited upside - best suited for current level or slight step down';
    } else {
      if (rating >= 7) return 'Experienced quality - valuable for leadership and consistency';
      return 'Veteran presence - best suited for mentoring younger players';
    }
  }

  /**
   * Get comparable players based on position and rating
   */
  private getComparablePlayers(
    positionInput: string | null | undefined,
    rating: number = 6.5,
  ): string[] {
    const position = (positionInput || '').toUpperCase();
    if (!position) {
      return ['Comparable players unavailable - add position data for better matches'];
    }

    const positionGroups: Record<string, string[][]> = {
      GK: [
        ['Gianluigi Donnarumma', 'Mike Maignan'],
        ['Thibaut Courtois', 'Ederson'],
        ['André Onana', 'Yann Sommer'],
      ],
      CB: [
        ['Virgil van Dijk', 'Rúben Dias'],
        ['Antonio Rüdiger', 'Marquinhos'],
        ['Dayot Upamecano', 'Gabriel Magalhães'],
      ],
      FB: [
        ['Trent Alexander-Arnold', 'Alphonso Davies'],
        ['Achraf Hakimi', 'João Cancelo'],
        ['Theo Hernández', 'Reece James'],
      ],
      DM: [
        ['Rodri', 'Joshua Kimmich'],
        ['Aurélien Tchouaméni', 'Casemiro'],
        ['Declan Rice', 'Wilfred Ndidi'],
      ],
      CM: [
        ['Kevin De Bruyne', 'Luka Modrić'],
        ['Jude Bellingham', 'Frenkie de Jong'],
        ['Bruno Fernandes', 'Martin Ødegaard'],
      ],
      AM: [
        ['Jamal Musiala', 'Florian Wirtz'],
        ['Phil Foden', 'Bernardo Silva'],
        ['Mason Mount', 'James Maddison'],
      ],
      W: [
        ['Vinícius Júnior', 'Bukayo Saka'],
        ['Khvicha Kvaratskhelia', 'Rafael Leão'],
        ['Luis Díaz', 'Ousmane Dembélé'],
      ],
      ST: [
        ['Erling Haaland', 'Kylian Mbappé'],
        ['Victor Osimhen', 'Harry Kane'],
        ['Lautaro Martínez', 'Ollie Watkins'],
      ],
    };

    // Find matching position group
    let players: string[] = [];
    for (const [key, levels] of Object.entries(positionGroups)) {
      if (position.includes(key)) {
        if (rating >= 8) players = levels[0] || [];
        else if (rating >= 6.5) players = levels[1] || [];
        else players = levels[2] || [];
        break;
      }
    }

    return players.length > 0 ? players : ['Versatile players at this performance tier'];
  }

  /**
   * Calculate quality score for generated report
   */
  private calculateQualityScore(report: GeneratedReport, stats: PlayerStats): QualityScore {
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
    if ((stats.basic?.name || '').length > 0 && (stats.basic?.position || '').length > 0) {
      score += 5;
    }

    // Career stats (5 points)
    if ((stats.career?.totalMatches ?? 0) > 0) score += 5;

    // Recent form (10 points)
    if ((stats.recent?.last5Matches?.length ?? 0) >= 3) score += 10;

    // Ratings (5 points)
    if ((stats.ratings?.avgTechnical ?? 0) > 0) score += 5;

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

    categories.forEach((cat) => {
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
    const avgCategory =
      (report.technicalSkills.rating +
        report.tacticalAwareness.rating +
        report.physicalAttributes.rating +
        report.mentalAttributes.rating) /
      4;

    if (Math.abs(avgCategory - report.overallRating) > 2) score -= 5;

    const ratingPairs = [
      { actual: report.technicalSkills.rating, baseline: stats.ratings?.avgTechnical },
      { actual: report.tacticalAwareness.rating, baseline: stats.ratings?.avgTactical },
      { actual: report.physicalAttributes.rating, baseline: stats.ratings?.avgPhysical },
      { actual: report.mentalAttributes.rating, baseline: stats.ratings?.avgMental },
    ];

    let hasMeaningfulBaseline = false;

    ratingPairs.forEach(({ actual, baseline }) => {
      const base = typeof baseline === 'number' ? baseline : 0;

      if (base > 0) {
        hasMeaningfulBaseline = true;
        const diff = Math.abs(actual - base);

        if (diff > 2) score -= 3;
        if (diff > 4) score -= 5;
      } else {
        score -= 3;
      }
    });

    if (!hasMeaningfulBaseline) {
      score -= 10;
    }

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

  private mapTemplateNameToReportType(name?: string): ReportType | undefined {
    if (!name) return undefined;
    const map: Record<string, ReportType> = {
      'Match Performance': ReportType.MATCH_PERFORMANCE,
      'Season Overview': ReportType.SEASON_OVERVIEW,
      'Transfer Target': ReportType.TRANSFER_TARGET,
      'Youth Prospect': ReportType.YOUTH_PROSPECT,
      'Quick Scan': ReportType.QUICK_SCAN,
    };
    return map[name];
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
      // Save to auto_generated_reports table
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

      // Also create a scouting report if matchId is provided
      // This makes auto-scout reports appear in the /reports page
      if (data.matchId && data.scoutId) {
        const report = data.reportData as GeneratedReport;

        // Convert ratings from 0-10 scale to 0-100 scale
        const convertRating = (rating: number) => Math.round(rating * 10);

        // Combine strengths from all categories
        const allStrengths = [
          ...(report.technicalSkills?.strengths || []),
          ...(report.tacticalAwareness?.strengths || []),
          ...(report.physicalAttributes?.strengths || []),
          ...(report.mentalAttributes?.strengths || []),
        ];

        // Combine weaknesses from all categories
        const allWeaknesses = [
          ...(report.technicalSkills?.weaknesses || []),
          ...(report.tacticalAwareness?.weaknesses || []),
          ...(report.physicalAttributes?.weaknesses || []),
          ...(report.mentalAttributes?.weaknesses || []),
        ];

        // Create the scouting report
        await this.prisma.scouting_reports.create({
          data: {
            id: randomUUID(),
            matchId: data.matchId,
            playerId: data.playerId,
            scoutId: data.scoutId,
            status: 'SUBMITTED', // Auto-submit AI-generated reports
            overallRating: convertRating(report.overallRating || 0),
            summary: report.summary || '',
            strengths: allStrengths.join('; '),
            weaknesses: allWeaknesses.join('; '),
            technicalRating: convertRating(report.technicalSkills?.rating || 0),
            tacticalRating: convertRating(report.tacticalAwareness?.rating || 0),
            physicalRating: convertRating(report.physicalAttributes?.rating || 0),
            mentalRating: convertRating(report.mentalAttributes?.rating || 0),
            playerPosition: report.position || '',
            recommendationNotes: report.recommendations?.join('\n') || '',
            tags: ['AUTO_SCOUT', `QUALITY_${report.qualityScore?.grade || 'C'}`],
            notesJson: {
              aiGenerated: true,
              model: data.model,
              template: data.template,
              qualityScore: report.qualityScore
                ? {
                    total: report.qualityScore.total,
                    breakdown: report.qualityScore.breakdown,
                    grade: report.qualityScore.grade,
                  }
                : null,
              technicalDetails: report.technicalSkills?.details,
              tacticalDetails: report.tacticalAwareness?.details,
              physicalDetails: report.physicalAttributes?.details,
              mentalDetails: report.mentalAttributes?.details,
              potential: report.potential,
              comparablePlayers: report.comparablePlayers,
            },
            updatedAt: new Date(),
          },
        });

        this.logger.log(
          `Created scouting report for auto-scout generated report (playerId: ${data.playerId}, matchId: ${data.matchId})`,
        );
      }
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
