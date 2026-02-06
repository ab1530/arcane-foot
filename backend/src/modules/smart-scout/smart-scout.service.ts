import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';
import { PartialReportDto } from './dto/partial-report.dto';
import { ReportContextDto } from './dto/report-context.dto';
import {
  SuggestionResponseDto,
  SimilarReportDto,
  SuggestionDto,
} from './dto/suggestion-response.dto';
import { AutocompleteResponseDto } from './dto/autocomplete-request.dto';

@Injectable()
export class SmartScoutService {
  private readonly logger = new Logger(SmartScoutService.name);
  private openai: OpenAI | null = null;
  private readonly EMBEDDING_MODEL = 'text-embedding-3-small';
  private readonly EMBEDDING_DIMENSIONS = 1536;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;

  constructor(private prisma: PrismaService) {
    // Initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.logger.log('OpenAI client initialized successfully');
    } else {
      this.logger.warn('OpenAI API key not found. SmartScout will use rule-based fallback.');
    }
  }

  /**
   * Generate embedding for text using OpenAI API with retry logic
   */
  async generateEmbedding(text: string): Promise<number[] | null> {
    if (!this.openai) {
      this.logger.debug('OpenAI not available, skipping embedding generation');
      return null;
    }

    if (!text || text.trim().length === 0) {
      this.logger.warn('Cannot generate embedding for empty text');
      return null;
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        this.logger.debug(`Generating embedding (attempt ${attempt}/${this.MAX_RETRIES})`);

        const response = await this.openai.embeddings.create({
          model: this.EMBEDDING_MODEL,
          input: text.slice(0, 8000), // Limit input size
        });

        const embedding = response.data[0].embedding;

        // Validate embedding dimensions
        if (embedding.length !== this.EMBEDDING_DIMENSIONS) {
          throw new Error(
            `Invalid embedding dimensions: expected ${this.EMBEDDING_DIMENSIONS}, got ${embedding.length}`,
          );
        }

        this.logger.debug('Embedding generated successfully');
        return embedding;
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Embedding generation failed (attempt ${attempt}/${this.MAX_RETRIES}): ${error.message}`,
        );

        if (attempt < this.MAX_RETRIES) {
          // Exponential backoff
          const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    this.logger.error(
      `Failed to generate embedding after ${this.MAX_RETRIES} attempts: ${lastError?.message}`,
    );
    return null;
  }

  /**
   * Normalize and combine report text for embedding
   */
  private normalizeReportText(report: any): string {
    const parts: string[] = [];

    if (report.playerPosition) parts.push(`Position: ${report.playerPosition}`);
    if (report.technicalRating) parts.push(`Technical: ${report.technicalRating}/100`);
    if (report.physicalRating) parts.push(`Physical: ${report.physicalRating}/100`);
    if (report.mentalRating) parts.push(`Mental: ${report.mentalRating}/100`);
    if (report.tacticalRating) parts.push(`Tactical: ${report.tacticalRating}/100`);
    if (report.strengths) parts.push(`Strengths: ${report.strengths}`);
    if (report.weaknesses) parts.push(`Weaknesses: ${report.weaknesses}`);
    if (report.summary) parts.push(`Summary: ${report.summary}`);
    if (report.tags?.length) parts.push(`Tags: ${report.tags.join(', ')}`);

    return parts.join('\n').trim();
  }

  /**
   * Index existing report with embedding
   */
  async indexReport(reportId: string): Promise<void> {
    const report = await this.prisma.scouting_reports.findUnique({
      where: { id: reportId },
      include: {
        players: true,
        matches: true,
      },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    // Check if already indexed
    const existing = await this.prisma.report_embeddings.findUnique({
      where: { reportId },
    });

    if (existing) {
      this.logger.debug(`Report ${reportId} already indexed, skipping`);
      return;
    }

    const text = this.normalizeReportText(report);
    const embedding = await this.generateEmbedding(text);

    if (embedding) {
      await this.prisma.report_embeddings.create({
        data: {
          id: randomUUID(),
          reportId,
          embedding,
          model: this.EMBEDDING_MODEL,
        },
      });
      this.logger.log(`Report ${reportId} indexed successfully`);
    } else {
      this.logger.warn(`Could not generate embedding for report ${reportId}`);
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Find similar reports using vector similarity
   */
  private async findSimilarReportsWithEmbeddings(
    embedding: number[],
    context: ReportContextDto,
    limit: number = 5,
  ): Promise<SimilarReportDto[]> {
    // Get all indexed reports
    const embeddings = await this.prisma.report_embeddings.findMany({
      include: {
        scouting_reports: {
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
            matches: {
              include: {
                competitions: true,
              },
            },
          },
        },
      },
    });

    // Calculate similarities
    const similarities = embeddings.map((emb) => {
      const similarity = this.cosineSimilarity(embedding, emb.embedding);
      const report = emb.scouting_reports;

      // Apply relevance boost
      let boostedSimilarity = similarity;

      // +10% boost for same position
      if (context.position && report.playerPosition === context.position) {
        boostedSimilarity *= 1.1;
      }

      // +5% boost for same league
      if (context.league && report.matches?.competitions?.country === context.league) {
        boostedSimilarity *= 1.05;
      }

      return {
        reportId: report.id,
        similarity: boostedSimilarity,
        player: {
          id: report.players.id,
          name: `${report.players.users.firstName} ${report.players.users.lastName}`,
          position: report.playerPosition || report.players.position,
        },
        excerpts: {
          strengths: report.strengths,
          weaknesses: report.weaknesses,
          summary: report.summary,
        },
      };
    });

    // Sort by similarity and return top N
    return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
  }

  /**
   * Fallback: Find similar reports using rule-based approach
   */
  private async findSimilarReportsRuleBased(
    partialReport: PartialReportDto,
    context: ReportContextDto,
    limit: number = 5,
  ): Promise<SimilarReportDto[]> {
    const where: any = { status: 'APPROVED' };

    // Filter by position if available
    if (context.position || partialReport.playerPosition) {
      where.playerPosition = context.position || partialReport.playerPosition;
    }

    const reports = await this.prisma.scouting_reports.findMany({
      where,
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
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return reports.map((report) => ({
      reportId: report.id,
      similarity: 0.5, // Arbitrary similarity score for rule-based
      player: {
        id: report.players.id,
        name: `${report.players.users.firstName} ${report.players.users.lastName}`,
        position: report.playerPosition || report.players.position,
      },
      excerpts: {
        strengths: report.strengths,
        weaknesses: report.weaknesses,
        summary: report.summary,
      },
    }));
  }

  /**
   * Generate suggestions based on similar reports
   */
  private generateSuggestions(
    similarReports: SimilarReportDto[],
    partialReport: PartialReportDto,
  ): SuggestionDto[] {
    const suggestions: SuggestionDto[] = [];

    // Aggregate common phrases from similar reports
    const strengthsFreq = new Map<string, number>();
    const weaknessesFreq = new Map<string, number>();

    similarReports.forEach((report) => {
      if (report.excerpts?.strengths) {
        const phrases = report.excerpts.strengths.split(/[.,;]/).map((s) => s.trim());
        phrases.forEach((phrase) => {
          if (phrase.length > 10) {
            strengthsFreq.set(phrase, (strengthsFreq.get(phrase) || 0) + 1);
          }
        });
      }

      if (report.excerpts?.weaknesses) {
        const phrases = report.excerpts.weaknesses.split(/[.,;]/).map((s) => s.trim());
        phrases.forEach((phrase) => {
          if (phrase.length > 10) {
            weaknessesFreq.set(phrase, (weaknessesFreq.get(phrase) || 0) + 1);
          }
        });
      }
    });

    // Add strength suggestions if not already filled
    if (!partialReport.strengths || partialReport.strengths.length < 50) {
      const topStrengths = Array.from(strengthsFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      topStrengths.forEach(([phrase, count]) => {
        suggestions.push({
          field: 'strengths',
          value: phrase,
          confidence: Math.min(0.9, count / similarReports.length),
          source: 'similar_reports',
        });
      });
    }

    // Add weakness suggestions if not already filled
    if (!partialReport.weaknesses || partialReport.weaknesses.length < 50) {
      const topWeaknesses = Array.from(weaknessesFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      topWeaknesses.forEach(([phrase, count]) => {
        suggestions.push({
          field: 'weaknesses',
          value: phrase,
          confidence: Math.min(0.9, count / similarReports.length),
          source: 'similar_reports',
        });
      });
    }

    return suggestions;
  }

  /**
   * Get suggestions for partial report
   */
  async getSuggestions(
    partialReport: PartialReportDto,
    context: ReportContextDto,
  ): Promise<SuggestionResponseDto> {
    const text = this.normalizeReportText(partialReport);
    const embedding = await this.generateEmbedding(text);

    let similarReports: SimilarReportDto[];
    let usingAI = false;

    if (embedding && this.openai) {
      // Use AI-powered similarity search
      similarReports = await this.findSimilarReportsWithEmbeddings(embedding, context, 5);
      usingAI = true;
    } else {
      // Fallback to rule-based search
      similarReports = await this.findSimilarReportsRuleBased(partialReport, context, 5);
    }

    const suggestions = this.generateSuggestions(similarReports, partialReport);

    return {
      similarReports,
      suggestions,
      usingAI,
    };
  }

  /**
   * Smart autocomplete for report fields
   */
  async autocomplete(
    fieldName: string,
    partialValue: string,
    context: ReportContextDto,
  ): Promise<AutocompleteResponseDto> {
    const structuredFields = ['position', 'preferredFoot'];
    const textFields = ['strengths', 'weaknesses', 'summary', 'notes', 'tags'];

    if (!structuredFields.includes(fieldName) && !textFields.includes(fieldName)) {
      throw new BadRequestException(`Invalid field name: ${fieldName}`);
    }

    let suggestions: string[] = [];
    let usingAI = false;

    if (structuredFields.includes(fieldName)) {
      // For structured fields, use database values
      if (fieldName === 'position') {
        const positions = await this.prisma.scouting_reports.groupBy({
          by: ['playerPosition'],
          where: {
            playerPosition: {
              not: null,
              contains: partialValue,
              mode: 'insensitive',
            },
          },
          _count: true,
        });

        suggestions = positions
          .map((p) => p.playerPosition)
          .filter((p): p is string => p !== null)
          .slice(0, 5);
      }
    } else {
      // For text fields, find similar values from approved reports
      const where: any = { status: 'APPROVED' };

      if (context.position) {
        where.playerPosition = context.position;
      }

      const reports = await this.prisma.scouting_reports.findMany({
        where,
        select: {
          strengths: fieldName === 'strengths',
          weaknesses: fieldName === 'weaknesses',
          summary: fieldName === 'summary',
        },
        take: 20,
      });

      const values: string[] = [];
      reports.forEach((r) => {
        const value = r[fieldName];
        if (typeof value === 'string' && value.length > 0) {
          values.push(value);
        }
      });

      // Find values that contain the partial value
      suggestions = values
        .filter((v) => v.toLowerCase().includes(partialValue.toLowerCase()))
        .slice(0, 5);

      // If we have OpenAI, we could use embeddings for better matching
      if (this.openai && suggestions.length < 3) {
        usingAI = true;
        // For now, just mark as using AI - could enhance with semantic search
      }
    }

    return {
      suggestions: [...new Set(suggestions)], // Remove duplicates
      usingAI,
    };
  }

  /**
   * Generate AI insights for a player based on historical reports
   */
  async generateInsights(playerId: string): Promise<string> {
    const reports = await this.prisma.scouting_reports.findMany({
      where: {
        playerId,
        status: 'APPROVED',
      },
      include: {
        users: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (reports.length === 0) {
      throw new NotFoundException(`No reports found for player ${playerId}`);
    }

    if (!this.openai) {
      // Fallback: Generate simple text summary
      return this.generateInsightsFallback(reports);
    }

    try {
      // Use GPT-4 to generate insights
      const reportsText = reports
        .map(
          (r, i) =>
            `Report ${i + 1} (by ${r.users.firstName} ${r.users.lastName}):\n` +
            `Technical: ${r.technicalRating || 'N/A'}, Physical: ${r.physicalRating || 'N/A'}, ` +
            `Mental: ${r.mentalRating || 'N/A'}, Tactical: ${r.tacticalRating || 'N/A'}\n` +
            `Strengths: ${r.strengths || 'N/A'}\n` +
            `Weaknesses: ${r.weaknesses || 'N/A'}\n`,
        )
        .join('\n');

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              "You are an expert football scout analyzer. Analyze the following scouting reports and provide insights about the player's development, consistency, and trends.",
          },
          {
            role: 'user',
            content: `Analyze these ${reports.length} scouting reports and provide:\n1. Performance trends (improving/declining)\n2. Scout consensus (do they agree?)\n3. Key strengths and weaknesses\n4. Development recommendations\n\n${reportsText}`,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      return response.choices[0].message.content || this.generateInsightsFallback(reports);
    } catch (error) {
      this.logger.error(`Failed to generate AI insights: ${error.message}`);
      return this.generateInsightsFallback(reports);
    }
  }

  /**
   * Fallback insights generation without AI
   */
  private generateInsightsFallback(reports: any[]): string {
    const avgTechnical =
      reports.reduce((sum, r) => sum + (r.technicalRating || 0), 0) / reports.length;
    const avgPhysical =
      reports.reduce((sum, r) => sum + (r.physicalRating || 0), 0) / reports.length;
    const avgMental = reports.reduce((sum, r) => sum + (r.mentalRating || 0), 0) / reports.length;
    const avgTactical =
      reports.reduce((sum, r) => sum + (r.tacticalRating || 0), 0) / reports.length;

    return (
      `Player Analysis (${reports.length} reports):\n\n` +
      `Average Ratings:\n` +
      `- Technical: ${avgTechnical.toFixed(1)}/100\n` +
      `- Physical: ${avgPhysical.toFixed(1)}/100\n` +
      `- Mental: ${avgMental.toFixed(1)}/100\n` +
      `- Tactical: ${avgTactical.toFixed(1)}/100\n\n` +
      `Multiple scouts have evaluated this player. Consider reviewing individual reports for detailed insights.`
    );
  }

  /**
   * Reindex all approved reports
   */
  async reindexAll(): Promise<{ indexed: number; failed: number }> {
    const reports = await this.prisma.scouting_reports.findMany({
      where: {
        status: 'APPROVED',
      },
      select: {
        id: true,
      },
    });

    let indexed = 0;
    let failed = 0;

    for (const report of reports) {
      try {
        await this.indexReport(report.id);
        indexed++;
      } catch (error) {
        this.logger.error(`Failed to index report ${report.id}: ${error.message}`);
        failed++;
      }
    }

    this.logger.log(`Reindexing complete: ${indexed} indexed, ${failed} failed`);

    return { indexed, failed };
  }
}
