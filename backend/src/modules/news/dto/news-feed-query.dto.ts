import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min, IsArray } from 'class-validator';

const allowedCategories = ['clubs', 'players', 'market', 'notifications'] as const;
export type NewsFeedCategory = (typeof allowedCategories)[number];

const normalizeLimit = (value?: number | string): number | undefined => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) return undefined;
  return parsed;
};

const normalizeCategories = (value?: string | string[]): string[] | undefined => {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value !== 'string' || !value.trim()) return undefined;
  return value
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
};

export class NewsFeedQueryDto {
  @Transform(({ value }) => normalizeLimit(value))
  @IsOptional()
  @IsInt({ message: 'limit must be an integer' })
  @Min(5, { message: 'limit must be at least 5' })
  @Max(50, { message: 'limit must be at most 50' })
  limit?: number;

  @Transform(({ value }) => normalizeCategories(value))
  @IsOptional()
  @IsArray({ message: 'categories must be an array' })
  @IsString({ each: true, message: 'each category must be a string' })
  @IsIn(allowedCategories, { each: true, message: 'Invalid category filter' })
  categories?: NewsFeedCategory[];
}
