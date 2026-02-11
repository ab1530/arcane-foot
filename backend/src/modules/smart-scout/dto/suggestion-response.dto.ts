import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SimilarReportDto {
  @ApiProperty({ description: 'ID du rapport similaire' })
  reportId: string;

  @ApiProperty({ description: 'Score de similarité (0-1)', example: 0.92 })
  similarity: number;

  @ApiProperty({ description: 'Informations sur le joueur du rapport similaire' })
  player: {
    id: string;
    name: string;
    position: string;
  };

  @ApiPropertyOptional({ description: 'Extraits pertinents du rapport' })
  excerpts?: {
    strengths?: string;
    weaknesses?: string;
    summary?: string;
  };
}

export class SuggestionDto {
  @ApiProperty({ description: 'Champ du rapport' })
  field: string;

  @ApiProperty({ description: 'Suggestion de texte' })
  value: string;

  @ApiProperty({ description: 'Score de confiance (0-1)', example: 0.85 })
  confidence: number;

  @ApiPropertyOptional({ description: 'Source de la suggestion' })
  source?: string;
}

export class SuggestionResponseDto {
  @ApiProperty({ description: 'Rapports similaires trouvés', type: [SimilarReportDto] })
  similarReports: SimilarReportDto[];

  @ApiProperty({ description: 'Suggestions pour compléter le rapport', type: [SuggestionDto] })
  suggestions: SuggestionDto[];

  @ApiPropertyOptional({ description: 'Insights générés par AI' })
  insights?: string;

  @ApiProperty({ description: 'Si OpenAI était disponible pour cette requête' })
  usingAI: boolean;
}
