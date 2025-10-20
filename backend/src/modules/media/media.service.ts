import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { PrismaService } from '../prisma/prisma.service';
import { MediaType } from '@prisma/client';
import { UploadMediaDto } from './dto/upload-media.dto';

@Injectable()
export class MediaService {
  constructor(
    private supabaseService: SupabaseService,
    private prisma: PrismaService,
  ) {}

  /**
   * Upload a file
   */
  async uploadFile(file: Express.Multer.File, uploadMediaDto: UploadMediaDto) {
    const { type, playerId, matchId, reportId } = uploadMediaDto;

    // Validate entity exists
    if (playerId) {
      const player = await this.prisma.player.findUnique({ where: { id: playerId } });
      if (!player) {
        throw new NotFoundException(`Player with ID ${playerId} not found`);
      }
    }
    if (matchId) {
      const match = await this.prisma.match.findUnique({ where: { id: matchId } });
      if (!match) {
        throw new NotFoundException(`Match with ID ${matchId} not found`);
      }
    }
    if (reportId) {
      const report = await this.prisma.scoutingReport.findUnique({ where: { id: reportId } });
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
        type,
        url,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        playerId,
        matchId,
        reportId,
      },
      include: {
        player: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        match: {
          select: {
            id: true,
            homeClub: { select: { name: true } },
            awayClub: { select: { name: true } },
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
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
      include: { user: true },
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
    await this.prisma.user.update({
      where: { id: player.userId },
      data: { avatar: url },
    });

    return { url, message: 'Avatar uploaded successfully' };
  }

  /**
   * Upload club logo
   */
  async uploadClubLogo(clubId: string, file: Express.Multer.File) {
    const club = await this.prisma.club.findUnique({ where: { id: clubId } });

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
    await this.prisma.club.update({
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
        player: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        match: {
          include: {
            homeClub: true,
            awayClub: true,
          },
        },
        report: {
          include: {
            player: true,
            match: true,
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
    const player = await this.prisma.player.findUnique({ where: { id: playerId } });
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
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
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
    const report = await this.prisma.scoutingReport.findUnique({ where: { id: reportId } });
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
  async remove(id: string) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }

    // Delete from Supabase
    try {
      await this.supabaseService.deleteFile(media.url);
    } catch (error) {
      console.error('Error deleting file from Supabase:', error);
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
