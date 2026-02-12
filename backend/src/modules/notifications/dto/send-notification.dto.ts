import { IsString, IsOptional, IsObject } from 'class-validator';

export class SendNotificationDto {
  @IsString()
  userId: string;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsString()
  type: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, string>;
}
