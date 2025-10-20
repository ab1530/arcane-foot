import { IsString, IsOptional, IsInt, IsUrl } from 'class-validator';

export class CreateClubDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  shortName?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsString()
  country: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  stadium?: string;

  @IsInt()
  @IsOptional()
  founded?: number;

  @IsUrl()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  contactUserId?: string;
}
