import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateContactMessageDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @IsEmail()
  @MaxLength(200)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(40)
  type: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  company?: string;
}
