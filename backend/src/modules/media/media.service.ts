import { Injectable, NotFoundException, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { PrismaService } from '../prisma/prisma.service';
import { MediaType, UserRole } from '@prisma/client';
import { UploadMediaDto } from './dto/upload-media.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private supabaseService: SupabaseService,
    private prisma: PrismaService,
  ) {}

  /**
   * Upload a file
   */
  async uploadFile(file: Express.Multer.File, uploadMediaDto: UploadMediaDto, user?: any) {
    const { type, playerId, matchId, reportId } = uploadMediaDto;

    // Authorization (highlights videos): player can only upload to their own profile.
    if (user && playerId && type === MediaType.VIDEO) {
      const role = user?.role as UserRole | string | undefined;
      const userPlayerId = user?.playerId;
      const isAdmin = role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
      const isOwnerPlayer = role === UserRole.PLAYER && userPlayerId && userPlayerId === playerId;

      if (!isAdmin && !isOwnerPlayer) {
        throw new ForbiddenException('Not allowed to upload video for this player');
      }

      // Limit: 3 highlight videos per player (V1)
      const currentCount = await this.prisma.media.count({
        where: { playerId, type: MediaType.VIDEO },
      });
      if (currentCount >= 3) {
        throw new BadRequestException('Maximum 3 videos per player');
      }
    }

    // Size limit for videos (V1)
    if (type === MediaType.VIDEO) {
      const maxMbRaw = process.env.VIDEO_MAX_SIZE_MB;
      const maxMb = maxMbRaw ? Number(maxMbRaw) : NaN;
      if (Number.isFinite(maxMb) && maxMb > 0) {
        const maxBytes = Math.floor(maxMb * 1024 * 1024);
        if (file.size > maxBytes) {
          throw new BadRequestException(`Video too large (max ${maxMb} MB)`);
        }
      }
    }

    // Validate entity exists
    if (playerId) {
      const player = await this.prisma.players.findUnique({ where: { id: playerId } });
      if (!player) {
        throw new NotFoundException(`Player with ID ${playerId} not found`);
      }
    }
    if (matchId) {
      const match = await this.prisma.matches.findUnique({ where: { id: matchId } });
      if (!match) {
        throw new NotFoundException(`Match with ID ${matchId} not found`);
      }
    }
    if (reportId) {
      const report = await this.prisma.scouting_reports.findUnique({ where: { id: reportId } });
      if (!report) {
        throw new NotFoundException(`Report with ID ${reportId} not found`);
      }
    }

    // Determine folder based on type
    let folder = 'media';
    if (type === MediaType.IMAGE) folder = 'images';
    else if (type === MediaType.VIDEO) folder = 'videos';
    else if (type === MediaType.DOCUMENT) folder = 'documents';
    else if (type === MediaType.AUDIO) folder = 'audio';

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.originalname.split('.').pop();
    const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;

    // Upload to Supabase
    const url = await this.supabaseService.uploadFile(file.buffer, filename, folder);

    // Create media record
    const media = await this.prisma.media.create({
      data: {
        id: randomUUID(),
        type,
        url,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        ...(playerId && { playerId }),
        ...(matchId && { matchId }),
        ...(reportId && { reportId }),
      },
      include: {
        players: {
          select: {
            id: true,
            users: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        matches: {
          select: {
            id: true,
            clubs_matches_homeClubIdToclubs: { select: { name: true } },
            clubs_matches_awayClubIdToclubs: { select: { name: true } },
          },
        },
      },
    });

    return media;
  }

  /**
   * Upload player avatar
   */
  async uploadPlayerAvatar(playerId: string, file: Express.Multer.File) {
    const player = await this.prisma.players.findUnique({
      where: { id: playerId },
      include: { users: true },
    });

    if (!player) {
      throw new NotFoundException(`Player with ID ${playerId} not found`);
    }

    // Validate file is an image
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    // Upload to Supabase
    const filename = `avatar-${playerId}-${Date.now()}.${file.originalname.split('.').pop()}`;
    const url = await this.supabaseService.uploadFile(file.buffer, filename, 'avatars');

    // Update user avatar
    await this.prisma.users.update({
      where: { id: player.userId },
      data: { avatar: url },
    });

    return { url, message: 'Avatar uploaded successfully' };
  }

  /**
   * Upload club logo
   */
  async uploadClubLogo(clubId: string, file: Express.Multer.File) {
    const club = await this.prisma.clubs.findUnique({ where: { id: clubId } });

    if (!club) {
      throw new NotFoundException(`Club with ID ${clubId} not found`);
    }

    // Validate file is an image
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    // Upload to Supabase
    const filename = `logo-${clubId}-${Date.now()}.${file.originalname.split('.').pop()}`;
    const url = await this.supabaseService.uploadFile(file.buffer, filename, 'logos');

    // Update club logo
    await this.prisma.clubs.update({
      where: { id: clubId },
      data: { logo: url },
    });

    return { url, message: 'Logo uploaded successfully' };
  }

  /**
   * Get media by ID
   */
  async findOne(id: string) {
    const media = await this.prisma.media.findUnique({
      where: { id },
      include: {
        players: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        matches: {
          include: {
            clubs_matches_homeClubIdToclubs: true,
            clubs_matches_awayClubIdToclubs: true,
          },
        },
        scouting_reports: {
          include: {
            players: true,
            matches: true,
          },
        },
      },
    });

    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }

    return media;
  }

  /**
   * Get all media for a player
   */
  async getPlayerMedia(playerId: string) {
    const player = await this.prisma.players.findUnique({ where: { id: playerId } });
    if (!player) {
      throw new NotFoundException(`Player with ID ${playerId} not found`);
    }

    return this.prisma.media.findMany({
      where: { playerId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  /**
   * Get all media for a match
   */
  async getMatchMedia(matchId: string) {
    const match = await this.prisma.matches.findUnique({ where: { id: matchId } });
    if (!match) {
      throw new NotFoundException(`Match with ID ${matchId} not found`);
    }

    return this.prisma.media.findMany({
      where: { matchId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  /**
   * Get all media for a report
   */
  async getReportMedia(reportId: string) {
    const report = await this.prisma.scouting_reports.findUnique({ where: { id: reportId } });
    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    return this.prisma.media.findMany({
      where: { reportId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  /**
   * Delete media
   */
  async remove(id: string, user?: any) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }

    if (user) {
      const role = user?.role as UserRole | string | undefined;
      const isAdmin = role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
      if (!isAdmin) {
        // Player can only delete their own player-linked media.
        if (
          role !== UserRole.PLAYER ||
          !user?.playerId ||
          !media.playerId ||
          media.playerId !== user.playerId
        ) {
          throw new ForbiddenException('Not allowed to delete this media');
        }
      }
    }

    // Delete from Supabase
    try {
      await this.supabaseService.deleteFile(media.url);
    } catch (error) {
      this.logger.error('Error deleting file from Supabase:', error);
      // Continue even if Supabase deletion fails
    }

    // Delete record from database
    return this.prisma.media.delete({ where: { id } });
  }

  /**
   * Download media file
   */
  async downloadFile(id: string) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }

    const blob = await this.supabaseService.downloadFile(media.url);

    return {
      blob,
      filename: media.filename,
      mimeType: media.mimeType,
    };
  }
}
