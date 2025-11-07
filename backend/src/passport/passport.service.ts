import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../modules/prisma/prisma.service';
import { PassportStatus } from '@prisma/client';
import * as QRCode from 'qrcode';
import { randomUUID } from 'crypto';

@Injectable()
export class PassportService {
  constructor(private prisma: PrismaService) {}

  async createPassport(playerId: string, verificationNotes?: string) {
    const player = await this.prisma.players.findUnique({
      where: { id: playerId },
      include: {
        users: true,
        clubs: true,
        scouting_reports: {
          where: { status: 'APPROVED' },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    const existingPassport = await this.prisma.player_passports.findUnique({
      where: { playerId },
    });

    if (existingPassport) {
      throw new BadRequestException('Player already has a passport');
    }

    const avgRating = player.scouting_reports.length > 0
      ? Math.round(
          player.scouting_reports.reduce((sum, r) => sum + (r.overallRating || 0), 0) /
            player.scouting_reports.length
        )
      : null;

    const passportData = {
      firstName: player.users.firstName,
      lastName: player.users.lastName,
      position: player.position,
      nationality: player.nationality,
      dateOfBirth: player.dateOfBirth,
      height: player.height,
      weight: player.weight,
      preferredFoot: player.preferredFoot,
      club: player.clubs ? { name: player.clubs.name, logo: player.clubs.logo } : null,
      avatar: player.users.avatar,
      averageRating: avgRating,
      totalReports: player.scouting_reports.length,
      statsSnapshot: player.statsJson,
    };

    return this.prisma.player_passports.create({
      data: {
        id: randomUUID(),
        playerId,
        publicToken: randomUUID(),
        status: PassportStatus.PENDING,
        passportData,
        verificationNotes,
        updatedAt: new Date(),
      },
      include: {
        players: {
          include: {
            users: true,
            clubs: true,
          },
        },
      },
    });
  }

  async getPassport(playerId: string) {
    const passport = await this.prisma.player_passports.findUnique({
      where: { playerId },
      include: {
        players: {
          include: {
            users: true,
            clubs: true,
          },
        },
      },
    });

    if (!passport) {
      throw new NotFoundException('Passport not found');
    }

    return passport;
  }

  async getPassportByToken(token: string) {
    const passport = await this.prisma.player_passports.findUnique({
      where: { publicToken: token },
      include: {
        players: {
          include: {
            users: true,
            clubs: true,
          },
        },
      },
    });

    if (!passport) {
      throw new NotFoundException('Passport not found');
    }

    return passport;
  }

  async verifyPassport(
    playerId: string,
    status: PassportStatus,
    verifiedById: string,
    verificationNotes?: string,
  ) {
    const passport = await this.prisma.player_passports.findUnique({
      where: { playerId },
    });

    if (!passport) {
      throw new NotFoundException('Passport not found');
    }

    return this.prisma.player_passports.update({
      where: { playerId },
      data: {
        status,
        verifiedAt: status === PassportStatus.VERIFIED ? new Date() : null,
        verifiedById,
        verificationNotes,
      },
      include: {
        players: {
          include: {
            users: true,
            clubs: true,
          },
        },
      },
    });
  }

  async generateQRCode(token: string): Promise<string> {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const passportUrl = `${baseUrl}/passport/${token}`;

    try {
      const qrCodeDataUrl = await QRCode.toDataURL(passportUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#080C1D',
          light: '#E4FF3B',
        },
      });

      return qrCodeDataUrl;
    } catch (error) {
      throw new BadRequestException('Failed to generate QR code');
    }
  }

  async deletePassport(playerId: string) {
    const passport = await this.prisma.player_passports.findUnique({
      where: { playerId },
    });

    if (!passport) {
      throw new NotFoundException('Passport not found');
    }

    return this.prisma.player_passports.delete({
      where: { playerId },
    });
  }
}
