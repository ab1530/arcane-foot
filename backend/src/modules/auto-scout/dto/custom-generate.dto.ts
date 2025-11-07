import { IsString, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class TemplateSectionDto {
  @ApiProperty({ description: 'Section name', example: 'Match Overview' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Fields to include in this section', type: [String] })
  @IsString({ each: true })
  fields: string[];
}

export class CustomTemplateDto {
  @ApiProperty({ description: 'Template name', example: 'Custom Match Analysis' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Template description' })
  @IsString()
  description: string;

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
