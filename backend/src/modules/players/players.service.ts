import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlayersService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    position?: string;
    status?: string;
    nationality?: string;
    page?: number;
    limit?: number;
  }) {
    const { position, status, nationality, page = 1, limit = 20 } = params;

    const where: any = {};
    if (position) where.position = position;
    if (status) where.status = status;
    if (nationality) where.nationality = nationality;

    const skip = (page - 1) * limit;

    const [players, total] = await Promise.all([
      this.prisma.player.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          club: {
            select: {
              id: true,
              name: true,
              shortName: true,
              logo: true,
              country: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.player.count({ where }),
    ]);

    return {
      data: players,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    return this.prisma.player.findUnique({
      where: { id },
      include: {
        user: true,
        club: true,
        scoutingReports: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }
}
