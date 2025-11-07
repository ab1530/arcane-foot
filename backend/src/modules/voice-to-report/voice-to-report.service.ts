import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { SupabaseService } from '../supabase/supabase.service';
import {
  ProcessVoiceReportDto,
  SupportedLanguage,
} from './dto/process-voice-report.dto';
import {
  VoiceReportResponseDto,
  ExtractedReportData,
} from './dto/voice-report-response.dto';
import { RecommendationType } from '@prisma/client';

@Injectable()
export class VoiceToReportService {
  private readonly logger = new Logger(VoiceToReportService.name);
  private openai: OpenAI | null = null;
  private readonly hasOpenAI: boolean;
  private readonly maxFileSizeMB: number;
  private readonly supportedFormats = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/webm', 'audio/ogg'];

  constructor(
    private configService: ConfigService,
    private supabaseService: SupabaseService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.hasOpenAI = !!apiKey && apiKey.startsWith('sk-');

    if (this.hasOpenAI) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('OpenAI Whisper transcription enabled');
    } else {
      this.logger.warn('OpenAI API key not configured - using fallback mode');
    }

    this.maxFileSizeMB = this.configService.get<number>('MAX_AUDIO_SIZE_MB') || 25;
  }

  /**
   * Main endpoint: Process voice recording into scouting report
   */
  async processVoiceReport(
    audioFile: Express.Multer.File,
    userId: string,
    dto: ProcessVoiceReportDto,
  ): Promise<VoiceReportResponseDto> {
    const startTime = Date.now();
    const language = dto.language || SupportedLanguage.EN;

    try {
      // Validate audio file
      this.validateAudioFile(audioFile);

      // Transcribe audio
      const transcription = await this.transcribeAudio(audioFile, language);

      // Extract report data from transcription
      const extractedData = await this.extractReportData(transcription, language);

      // Validate and enrich data
      const { data: validatedData, warnings } = await this.validateData(
        extractedData,
        dto.matchId,
        dto.playerId,
      );

      // Calculate confidence score
      const confidence = this.calculateConfidence(validatedData, transcription);

      // Generate suggestions
      const suggestions = this.generateSuggestions(validatedData, warnings);

      // Handle audio storage
      let audioUrl: string | undefined;
      if (dto.keepAudio) {
        audioUrl = await this.saveAudioPermanently(audioFile, userId);
      }

      const processingTimeMs = Date.now() - startTime;

      return {
        transcription,
        extractedData: validatedData,
        confidence,
        suggestions,
        audioUrl,
        warnings,
        language,
        processingTimeMs,
      };
    } catch (error) {
      this.logger.error(`Failed to process voice report: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to process voice report: ${error.message}`);
    }
  }

  /**
   * Validate audio file format and size
   */
  private validateAudioFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No audio file provided');
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > this.maxFileSizeMB) {
      throw new BadRequestException(
        `File size exceeds maximum of ${this.maxFileSizeMB}MB`,
      );
    }

    // Check MIME type
    if (!this.supportedFormats.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported audio format. Supported formats: mp3, wav, m4a, webm, ogg`,
      );
    }
  }

  /**
   * Transcribe audio using OpenAI Whisper or return URL for client-side processing
   */
  private async transcribeAudio(
    audioFile: Express.Multer.File,
    language: string,
  ): Promise<string> {
    if (this.hasOpenAI && this.openai) {
      return this.transcribeWithWhisper(audioFile, language);
    } else {
      // Fallback: would need client-side processing
      throw new BadRequestException(
        'Server-side transcription not available. Please configure OPENAI_API_KEY.',
      );
    }
  }

  /**
   * Transcribe audio using OpenAI Whisper API
   */
  private async transcribeWithWhisper(
    audioFile: Express.Multer.File,
    language: string,
  ): Promise<string> {
    let tempFilePath: string | null = null;

    try {
      // Save file temporarily
      tempFilePath = await this.saveAudioTemporarily(audioFile);

      this.logger.log(`Transcribing audio file: ${audioFile.originalname}`);

      // Call Whisper API
      const transcription = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-1',
        language: language === 'en' ? undefined : language, // auto-detect for English
        response_format: 'text',
      });

      this.logger.log('Transcription completed successfully');
      return transcription as string;
    } catch (error) {
      this.logger.error(`Whisper transcription failed: ${error.message}`);
      throw new InternalServerErrorException(`Transcription failed: ${error.message}`);
    } finally {
      // Cleanup temporary file
      if (tempFilePath) {
        await this.cleanupAudioFile(tempFilePath);
      }
    }
  }

  /**
   * Extract structured scouting report data from transcription
   */
  private async extractReportData(
    transcription: string,
    language: string,
  ): Promise<ExtractedReportData> {
    if (this.hasOpenAI && this.openai) {
      return this.extractWithAI(transcription, language);
    } else {
      return this.extractWithRules(transcription);
    }
  }

  /**
   * Extract data using OpenAI GPT for intelligent parsing
   */
  private async extractWithAI(
    transcription: string,
    language: string,
  ): Promise<ExtractedReportData> {
    try {
      const model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';

      const prompt = `Extract scouting report data from this ${language} transcription. Return ONLY valid JSON with these exact fields (use null for missing data):

Transcription: "${transcription}"

Expected JSON structure:
{
  "playerName": string | null,
  "position": string | null,
  "jerseyNumber": number | null,
  "team": string | null,
  "opponent": string | null,
  "competition": string | null,
  "matchDate": string | null (YYYY-MM-DD format),
  "venue": string | null,
  "technicalRating": number | null (0-100 scale),
  "physicalRating": number | null (0-100 scale),
  "tacticalRating": number | null (0-100 scale),
  "mentalRating": number | null (0-100 scale),
  "overallRating": number | null (0-100 scale),
  "strengths": string | null,
  "weaknesses": string | null,
  "keyMoments": string | null,
  "observations": string | null,
  "minutesPlayed": number | null,
  "recommendation": "BUY_NOW" | "MONITOR" | "FOLLOW_UP" | "NOT_INTERESTED" | "NEEDS_MORE_DATA" | null,
  "tags": string[] | null (extract relevant keywords)
}

IMPORTANT:
- Convert any ratings mentioned on 1-10 scale to 0-100 scale (multiply by 10)
- Extract player position in English (e.g., "Forward", "Midfielder", "Defender", "Goalkeeper")
- For recommendation, infer from context if not explicitly stated
- Extract tags like playing style, characteristics, or standout qualities`;

      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert football scouting assistant. Extract structured data from scouting reports accurately. Return only valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const content = response.choices[0].message.content;
      const extractedData = JSON.parse(content);

      this.logger.log('AI extraction completed successfully');
      return this.normalizeExtractedData(extractedData);
    } catch (error) {
      this.logger.error(`AI extraction failed: ${error.message}`);
      // Fallback to rule-based extraction
      return this.extractWithRules(transcription);
    }
  }

  /**
   * Rule-based extraction fallback (simple pattern matching)
   */
  private extractWithRules(transcription: string): ExtractedReportData {
    const data: ExtractedReportData = {};
    const lowerText = transcription.toLowerCase();

    // Extract player name (look for "player [name]", "report for [name]", etc.)
    const namePatterns = [
      /(?:player|report for|scouting|about|observing)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
      /^([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
    ];
    for (const pattern of namePatterns) {
      const match = transcription.match(pattern);
      if (match) {
        data.playerName = match[1].trim();
        break;
      }
    }

    // Extract position
    const positions = {
      goalkeeper: 'Goalkeeper',
      'goal keeper': 'Goalkeeper',
      defender: 'Defender',
      'center back': 'Defender',
      'centre back': 'Defender',
      'full back': 'Defender',
      'left back': 'Defender',
      'right back': 'Defender',
      midfielder: 'Midfielder',
      'central midfielder': 'Midfielder',
      'defensive midfielder': 'Midfielder',
      'attacking midfielder': 'Midfielder',
      forward: 'Forward',
      striker: 'Forward',
      winger: 'Forward',
      'left winger': 'Forward',
      'right winger': 'Forward',
    };

    for (const [key, value] of Object.entries(positions)) {
      if (lowerText.includes(key)) {
        data.position = value;
        break;
      }
    }

    // Extract jersey number
    const jerseyMatch = transcription.match(/(?:number|jersey|shirt)\s+(\d+)/i);
    if (jerseyMatch) {
      data.jerseyNumber = parseInt(jerseyMatch[1]);
    }

    // Extract team names
    const teamMatch = transcription.match(/(?:playing for|team)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
    if (teamMatch) data.team = teamMatch[1];

    const opponentMatch = transcription.match(/(?:against|versus|vs)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
    if (opponentMatch) data.opponent = opponentMatch[1];

    // Extract ratings (handle both 1-10 and 0-100 scales)
    const ratingPatterns = {
      technical: /technical(?:\s+rating)?[:\s]+(\d+)(?:\/10)?/i,
      physical: /physical(?:\s+rating)?[:\s]+(\d+)(?:\/10)?/i,
      tactical: /tactical(?:\s+rating)?[:\s]+(\d+)(?:\/10)?/i,
      mental: /mental(?:\s+rating)?[:\s]+(\d+)(?:\/10)?/i,
      overall: /overall(?:\s+rating)?[:\s]+(\d+)(?:\/10)?/i,
    };

    for (const [key, pattern] of Object.entries(ratingPatterns)) {
      const match = transcription.match(pattern);
      if (match) {
        let rating = parseInt(match[1]);
        // Convert 1-10 scale to 0-100
        if (rating <= 10) rating *= 10;
        data[`${key}Rating`] = Math.min(100, Math.max(0, rating));
      }
    }

    // Extract strengths and weaknesses
    const strengthsMatch = transcription.match(/strengths?[:\s]+([^.!?]+[.!?])/i);
    if (strengthsMatch) data.strengths = strengthsMatch[1].trim();

    const weaknessesMatch = transcription.match(/weaknesses?[:\s]+([^.!?]+[.!?])/i);
    if (weaknessesMatch) data.weaknesses = weaknessesMatch[1].trim();

    // Extract key moments
    const momentsMatch = transcription.match(/(?:key moments?|highlights?)[:\s]+([^.!?]+[.!?])/i);
    if (momentsMatch) data.keyMoments = momentsMatch[1].trim();

    // Extract recommendation
    if (/recommend.*(sign|buy)/i.test(lowerText)) {
      data.recommendation = RecommendationType.BUY_NOW;
    } else if (/recommend.*monitor/i.test(lowerText)) {
      data.recommendation = RecommendationType.MONITOR;
    } else if (/recommend.*(pass|not interested)/i.test(lowerText)) {
      data.recommendation = RecommendationType.NOT_INTERESTED;
    } else if (/recommend.*(follow|watch)/i.test(lowerText)) {
      data.recommendation = RecommendationType.FOLLOW_UP;
    }

    // Extract minutes played
    const minutesMatch = transcription.match(/(\d+)\s+minutes/i);
    if (minutesMatch) data.minutesPlayed = parseInt(minutesMatch[1]);

    // Extract simple tags
    const tags: string[] = [];
    const tagKeywords = ['fast', 'slow', 'technical', 'physical', 'tactical', 'strong', 'weak', 'leader', 'creative'];
    for (const keyword of tagKeywords) {
      if (lowerText.includes(keyword)) {
        tags.push(keyword);
      }
    }
    if (tags.length > 0) data.tags = tags;

    this.logger.log('Rule-based extraction completed');
    return data;
  }

  /**
   * Normalize extracted data (ensure correct types and ranges)
   */
  private normalizeExtractedData(data: any): ExtractedReportData {
    const normalized: ExtractedReportData = {};

    // Copy string fields
    const stringFields = [
      'playerName', 'position', 'team', 'opponent', 'competition',
      'matchDate', 'venue', 'strengths', 'weaknesses', 'keyMoments', 'observations'
    ];
    for (const field of stringFields) {
      if (data[field] && typeof data[field] === 'string') {
        normalized[field] = data[field];
      }
    }

    // Normalize numeric fields
    const numericFields = [
      'jerseyNumber', 'technicalRating', 'physicalRating',
      'tacticalRating', 'mentalRating', 'overallRating', 'minutesPlayed'
    ];
    for (const field of numericFields) {
      if (data[field] != null) {
        const value = parseInt(data[field]);
        if (!isNaN(value)) {
          // Clamp ratings to 0-100
          if (field.includes('Rating')) {
            normalized[field] = Math.min(100, Math.max(0, value));
          } else {
            normalized[field] = value;
          }
        }
      }
    }

    // Normalize recommendation
    if (data.recommendation) {
      const rec = data.recommendation.toString().toUpperCase();
      if (['BUY_NOW', 'MONITOR', 'FOLLOW_UP', 'NOT_INTERESTED', 'NEEDS_MORE_DATA'].includes(rec)) {
        normalized.recommendation = rec as RecommendationType;
      }
    }

    // Normalize tags
    if (Array.isArray(data.tags)) {
      normalized.tags = data.tags.filter(t => typeof t === 'string');
    }

    return normalized;
  }

  /**
   * Validate extracted data and add context from provided IDs
   */
  private async validateData(
    data: ExtractedReportData,
    matchId?: string,
    playerId?: string,
  ): Promise<{ data: ExtractedReportData; warnings: string[] }> {
    const warnings: string[] = [];

    // Add IDs if provided
    if (matchId) {
      data['matchId'] = matchId;
    }
    if (playerId) {
      data['playerId'] = playerId;
    }

    // Check for missing critical fields
    if (!data.playerName && !playerId) {
      warnings.push('Player name not identified - please specify manually');
    }

    // Validate ratings
    const ratingFields = ['technicalRating', 'physicalRating', 'tacticalRating', 'mentalRating'];
    const hasAnyRating = ratingFields.some(field => data[field] != null);
    if (!hasAnyRating) {
      warnings.push('No performance ratings detected - consider adding them');
    }

    // Calculate overall rating if not provided but other ratings exist
    if (!data.overallRating && hasAnyRating) {
      const ratings = ratingFields
        .map(field => data[field])
        .filter(r => r != null) as number[];

      if (ratings.length > 0) {
        data.overallRating = Math.round(
          ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        );
      }
    }

    // Validate date format
    if (data.matchDate && !/^\d{4}-\d{2}-\d{2}$/.test(data.matchDate)) {
      warnings.push('Match date format may be incorrect - expected YYYY-MM-DD');
    }

    return { data, warnings };
  }

  /**
   * Calculate confidence score based on completeness
   */
  private calculateConfidence(
    data: ExtractedReportData,
    transcription: string,
  ): number {
    let score = 0;
    const maxScore = 100;

    // Player identification (20 points)
    if (data.playerName) score += 20;
    else if (data['playerId']) score += 15;

    // Match context (15 points)
    if (data.team) score += 5;
    if (data.opponent) score += 5;
    if (data.matchDate) score += 5;

    // Performance ratings (30 points)
    const ratingFields = ['technicalRating', 'physicalRating', 'tacticalRating', 'mentalRating'];
    const ratingCount = ratingFields.filter(field => data[field] != null).length;
    score += (ratingCount / ratingFields.length) * 30;

    // Observations (20 points)
    if (data.strengths) score += 7;
    if (data.weaknesses) score += 7;
    if (data.keyMoments || data.observations) score += 6;

    // Recommendation (15 points)
    if (data.recommendation) score += 15;

    // Adjust based on transcription length (quality indicator)
    const wordCount = transcription.split(/\s+/).length;
    if (wordCount < 50) score *= 0.8; // Too short
    else if (wordCount > 200) score *= 1.1; // Detailed

    return Math.min(maxScore, Math.round(score));
  }

  /**
   * Generate helpful suggestions for improving the report
   */
  private generateSuggestions(
    data: ExtractedReportData,
    warnings: string[],
  ): string[] {
    const suggestions: string[] = [];

    if (!data.playerName) {
      suggestions.push('Include the player\'s full name at the beginning');
    }

    if (!data.position) {
      suggestions.push('Mention the player\'s position');
    }

    const ratingFields = ['technicalRating', 'physicalRating', 'tacticalRating', 'mentalRating'];
    const missingRatings = ratingFields.filter(field => data[field] == null);
    if (missingRatings.length > 0) {
      suggestions.push(`Add ratings for: ${missingRatings.map(f => f.replace('Rating', '')).join(', ')}`);
    }

    if (!data.strengths) {
      suggestions.push('Describe the player\'s key strengths');
    }

    if (!data.weaknesses) {
      suggestions.push('Mention areas for improvement');
    }

    if (!data.recommendation) {
      suggestions.push('Include a clear recommendation (Sign, Monitor, or Pass)');
    }

    if (!data.keyMoments && !data.observations) {
      suggestions.push('Add specific examples or key moments from the match');
    }

    return suggestions;
  }

  /**
   * Save audio file temporarily for processing
   */
  private async saveAudioTemporarily(file: Express.Multer.File): Promise<string> {
    const filename = `${Date.now()}-${file.originalname}`;
    const filepath = path.join('/tmp', filename);

    await fs.promises.writeFile(filepath, file.buffer);
    this.logger.log(`Temporary audio file saved: ${filepath}`);

    return filepath;
  }

  /**
   * Save audio file permanently to Supabase Storage
   */
  private async saveAudioPermanently(
    file: Express.Multer.File,
    userId: string,
  ): Promise<string> {
    try {
      const filename = `${userId}/${Date.now()}-${file.originalname}`;
      const audioUrl = await this.supabaseService.uploadFile(
        file.buffer,
        filename,
        'voice-reports',
      );

      this.logger.log(`Audio saved permanently: ${audioUrl}`);
      return audioUrl;
    } catch (error) {
      this.logger.error(`Failed to save audio permanently: ${error.message}`);
      // Non-critical error, continue without permanent storage
      return undefined;
    }
  }

  /**
   * Clean up temporary audio file
   */
  private async cleanupAudioFile(filepath: string): Promise<void> {
    try {
      await fs.promises.unlink(filepath);
      this.logger.log(`Temporary file cleaned up: ${filepath}`);
    } catch (error) {
      // Non-critical error, just log
      this.logger.warn(`Failed to cleanup temporary file: ${error.message}`);
    }
  }

  /**
   * Get supported languages with info
   */
  getSupportedLanguages() {
    return [
      { code: 'en', name: 'English', whisperSupported: true },
      { code: 'es', name: 'Spanish', whisperSupported: true },
      { code: 'fr', name: 'French', whisperSupported: true },
      { code: 'de', name: 'German', whisperSupported: true },
      { code: 'it', name: 'Italian', whisperSupported: true },
      { code: 'pt', name: 'Portuguese', whisperSupported: true },
    ];
  }

  /**
   * Get example voice report templates
   */
  getExamples() {
    return [
      {
        language: 'en',
        prompt: 'This is a scouting report for John Doe, center back, number 5, playing for Real Madrid against Barcelona in La Liga at Santiago Bernabéu on February 15th. Technical rating: 8 out of 10. Physical rating: 9 out of 10. Tactical rating: 7 out of 10. Mental rating: 8 out of 10. Overall rating: 8 out of 10. Strengths: Excellent positioning, strong in the air, good passing range. Weaknesses: Can be slow to turn, sometimes caught out of position on counter-attacks. Key moments: Made a crucial block in the 67th minute, won every aerial duel in the second half. Overall impression: Top-quality defender with Champions League potential. Recommendation: Sign.',
        tips: [
          'Start with player name and position',
          'Include match context (opponent, date, venue)',
          'Give ratings on a scale of 1-10 or 0-100',
          'Describe strengths and weaknesses',
          'Mention specific moments from the match',
          'End with a clear recommendation',
        ],
      },
      {
        language: 'es',
        prompt: 'Informe de scouting para Juan Pérez, delantero centro, número 9, jugando para Barcelona contra Real Madrid en La Liga. Valoración técnica: 9 sobre 10. Valoración física: 8 sobre 10. Valoración táctica: 8 sobre 10. Valoración mental: 9 sobre 10. Fortalezas: excelente finalización, muy rápido, buen regate. Debilidades: a veces egoísta, puede mejorar el juego aéreo. Momentos clave: marcó dos goles en la segunda mitad. Impresión general: delantero de clase mundial. Recomendación: fichar.',
        tips: [
          'Comienza con el nombre y posición del jugador',
          'Incluye contexto del partido',
          'Proporciona valoraciones del 1-10 o 0-100',
          'Describe fortalezas y debilidades',
          'Menciona momentos específicos',
          'Termina con una recomendación clara',
        ],
      },
      {
        language: 'fr',
        prompt: 'Rapport de scouting pour Pierre Martin, milieu de terrain, numéro 10, jouant pour PSG contre Lyon en Ligue 1. Note technique: 8 sur 10. Note physique: 7 sur 10. Note tactique: 9 sur 10. Note mentale: 8 sur 10. Forces: excellente vision du jeu, passes précises, leadership. Faiblesses: manque de vitesse, défense à améliorer. Moments clés: a délivré deux passes décisives. Recommandation: suivre.',
        tips: [
          'Commencez par le nom et la position du joueur',
          'Incluez le contexte du match',
          'Donnez des notes de 1-10 ou 0-100',
          'Décrivez les forces et faiblesses',
          'Mentionnez des moments spécifiques',
          'Terminez par une recommandation claire',
        ],
      },
    ];
  }
}
