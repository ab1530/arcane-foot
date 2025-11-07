import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateBoardDto {
  @ApiProperty({ description: 'Nom du tableau Kanban' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Description du tableau' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Tableau public ou privé', default: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
