import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PassportService } from './passport.service';
import { CreatePassportDto, VerifyPassportDto } from './dto/passport.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('passport')
export class PassportController {
  constructor(private readonly passportService: PassportService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT, UserRole.SCOUT)
  async createPassport(@Body() createPassportDto: CreatePassportDto) {
    return this.passportService.createPassport(
      createPassportDto.playerId,
      createPassportDto.verificationNotes,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyPassport(@Request() req) {
    const userId = req.user.userId || req.user.id;
    return this.passportService.getPassportForUser(userId);
  }

  @Get('player/:playerId')
  @UseGuards(JwtAuthGuard)
  async getPassportByPlayer(@Param('playerId') playerId: string) {
    return this.passportService.getPassport(playerId);
  }

  @Get('token/:token')
  async getPassportByToken(@Param('token') token: string) {
    const passport = await this.passportService.getPassportByToken(token);
    const qrCode = await this.passportService.generateQRCode(passport.publicToken);

    return {
      ...passport,
      qrCodeUrl: qrCode,
    };
  }

  @Get('qr/:token')
  async getQRCode(@Param('token') token: string) {
    return {
      qrCodeUrl: await this.passportService.generateQRCode(token),
    };
  }

  @Put('player/:playerId/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async verifyPassport(
    @Param('playerId') playerId: string,
    @Body() verifyPassportDto: VerifyPassportDto,
    @Request() req,
  ) {
    return this.passportService.verifyPassport(
      playerId,
      verifyPassportDto.status,
      req.user.userId,
      verifyPassportDto.verificationNotes,
    );
  }

  @Delete('player/:playerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async deletePassport(@Param('playerId') playerId: string) {
    return this.passportService.deletePassport(playerId);
  }
}
