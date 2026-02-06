import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ReportContextDto } from './report-context.dto';

export class AutocompleteRequestDto {
  @ApiProperty({
    description: 'Nom du champ à compléter',
    example: 'strengths',
    enum: ['strengths', 'weaknesses', 'summary', 'notes', 'position', 'preferredFoot', 'tags'],
  })
  @IsString()
  @IsNotEmpty()
  fieldName: string;

  @ApiProperty({
    description: "Valeur partielle entrée par l'utilisateur",
    example: 'Bon contrôle du ballon',
  })
  @IsString()
  @IsNotEmpty()
  partialValue: string;

  @ApiProperty({
    description: 'Contexte du rapport pour des suggestions plus pertinentes',
    type: ReportContextDto,
  })
  @ValidateNested()
  @Type(() => ReportContextDto)
  @IsOptional()
  context?: ReportContextDto;
}

export class AutocompleteResponseDto {
  @ApiProperty({ description: 'Liste de suggestions', type: [String] })
  suggestions: string[];

  @ApiProperty({ description: "Si l'autocomplete utilise AI ou règles de base" })
  usingAI: boolean;
}
