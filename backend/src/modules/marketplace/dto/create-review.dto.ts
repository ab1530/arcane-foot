import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray, Min, Max } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ description: 'Offer ID being reviewed' })
  @IsString()
  offerId: string;

  @ApiProperty({ description: 'Rating from 1 to 5', minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Written comment', required: false })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({
    description: 'Tags describing the scout',
    required: false,
    example: ['punctual', 'professional', 'insightful'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
