import { IsString, IsOptional, IsObject, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportType } from '../interfaces/report.interface';

class TemplateSectionDto {
  @ApiProperty({ description: 'Section name', example: 'Match Overview' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Fields to include in this section', type: [String] })
  @IsString({ each: true })
  fields: string[];
}

export class CustomTemplateDto {
  @ApiProperty({ description: 'Template ID', example: 'custom-template-1' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Template name', example: 'Custom Match Analysis' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Template description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Template icon', example: 'document' })
  @IsString()
  icon: string;

  @ApiProperty({ description: 'Use case description', example: 'Custom analysis' })
  @IsString()
  useCase: string;

  @ApiProperty({ description: 'Estimated cost', example: '$0.030' })
  @IsString()
  estimatedCost: string;

  @ApiProperty({ description: 'Report type', enum: ReportType })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiProperty({ description: 'Template sections', type: [TemplateSectionDto] })
  @ValidateNested({ each: true })
  @Type(() => TemplateSectionDto)
  sections: TemplateSectionDto[];

  @ApiProperty({ description: 'Prompt template with placeholders' })
  @IsString()
  promptTemplate: string;
}

export class CustomGenerateDto {
  @ApiProperty({
    description: 'ID of the player to generate report for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  playerId: string;

  @ApiProperty({
    description: 'Custom report template',
    type: CustomTemplateDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => CustomTemplateDto)
  template: CustomTemplateDto;

  @ApiPropertyOptional({
    description: 'Additional custom instructions for AI',
    example: 'Emphasize leadership qualities and experience',
  })
  @IsOptional()
  @IsString()
  customPrompt?: string;
}
