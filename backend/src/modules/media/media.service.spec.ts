import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MediaService } from './media.service';
import { SupabaseService } from '../supabase/supabase.service';
import { PrismaService } from '../prisma/prisma.service';
import { MediaType, PrismaClient } from '@prisma/client';
import { UploadMediaDto } from './dto/upload-media.dto';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('MediaService', () => {
  let service: MediaService;
  let supabaseService: jest.Mocked<SupabaseService>;
  let prisma: DeepMockProxy<PrismaClient>;

  // Mock file data
  const mockImageFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test-image.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024 * 500, // 500KB
    buffer: Buffer.from('mock image data'),
    stream: null,
    destination: '',
    filename: '',
    path: '',
  };

  const mockVideoFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test-video.mp4',
    encoding: '7bit',
    mimetype: 'video/mp4',
    size: 1024 * 1024 * 5, // 5MB
    buffer: Buffer.from('mock video data'),
    stream: null,
    destination: '',
    filename: '',
    path: '',
  };

  const mockDocumentFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test-document.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024 * 200, // 200KB
    buffer: Buffer.from('mock pdf data'),
    stream: null,
    destination: '',
    filename: '',
    path: '',
  };

  const mockAudioFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test-audio.mp3',
    encoding: '7bit',
    mimetype: 'audio/mpeg',
    size: 1024 * 1024 * 2, // 2MB
    buffer: Buffer.from('mock audio data'),
    stream: null,
    destination: '',
    filename: '',
    path: '',
  };

  // Mock entities
  const mockPlayer = {
    id: 'player-123',
    userId: 'user-123',
    users: {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      avatar: null,
    },
    firstName: 'John',
    lastName: 'Doe',
    position: 'Forward',
  };

  const mockMatch = {
    id: 'match-123',
    homeClubId: 'club-1',
    awayClubId: 'club-2',
    date: new Date('2024-01-15'),
  };

  const mockReport = {
    id: 'report-123',
    playerId: 'player-123',
    matchId: 'match-123',
    scoutId: 'scout-456',
  };

  const mockClub = {
    id: 'club-123',
    name: 'Test FC',
    logo: null,
  };

  const mockMedia = {
    id: 'media-123',
    type: MediaType.IMAGE,
    url: 'https://storage.example.com/images/test.jpg',
    thumbnailUrl: null,
    filename: 'test-image.jpg',
    mimeType: 'image/jpeg',
    size: 1024 * 500,
    duration: null,
    width: null,
    height: null,
    playerId: 'player-123',
    matchId: null,
    reportId: null,
    uploadedAt: new Date(),
    processedAt: null,
    players: {
      id: 'player-123',
      users: {
        firstName: 'John',
        lastName: 'Doe',
      },
    },
    matches: null,
    scouting_reports: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Mock Prisma using mockDeep
    prisma = mockDeep<PrismaClient>();

    // Mock SupabaseService
    supabaseService = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
      downloadFile: jest.fn(),
      getPublicUrl: jest.fn(),
      listFiles: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: SupabaseService,
          useValue: supabaseService,
        },
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('uploadFile', () => {
    const uploadDto: UploadMediaDto = {
      type: MediaType.IMAGE,
      playerId: 'player-123',
    };

    beforeEach(() => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      supabaseService.uploadFile.mockResolvedValue('https://storage.example.com/images/test.jpg');
      prisma.media.create.mockResolvedValue(mockMedia as any);
    });

    it('should upload image file successfully', async () => {
      const result = await service.uploadFile(mockImageFile, uploadDto);

      expect(result).toBeDefined();
      expect(result.type).toBe(MediaType.IMAGE);
      expect(result.url).toContain('storage.example.com');
      expect(prisma.players.findUnique).toHaveBeenCalledWith({
        where: { id: 'player-123' },
      });
      expect(supabaseService.uploadFile).toHaveBeenCalledWith(
        mockImageFile.buffer,
        expect.stringContaining('.jpg'),
        'images',
      );
    });

    it('should upload video file to videos folder', async () => {
      const videoDto: UploadMediaDto = {
        type: MediaType.VIDEO,
        matchId: 'match-123',
      };

      prisma.matches.findUnique.mockResolvedValue(mockMatch as any);
      const videoMedia = { ...mockMedia, type: MediaType.VIDEO };
      prisma.media.create.mockResolvedValue(videoMedia as any);

      await service.uploadFile(mockVideoFile, videoDto);

      expect(supabaseService.uploadFile).toHaveBeenCalledWith(
        mockVideoFile.buffer,
        expect.stringContaining('.mp4'),
        'videos',
      );
    });

    it('should upload document file to documents folder', async () => {
      const docDto: UploadMediaDto = {
        type: MediaType.DOCUMENT,
        reportId: 'report-123',
      };

      prisma.scouting_reports.findUnique.mockResolvedValue(mockReport as any);

      await service.uploadFile(mockDocumentFile, docDto);

      expect(supabaseService.uploadFile).toHaveBeenCalledWith(
        mockDocumentFile.buffer,
        expect.stringContaining('.pdf'),
        'documents',
      );
    });

    it('should upload audio file to audio folder', async () => {
      const audioDto: UploadMediaDto = {
        type: MediaType.AUDIO,
      };

      await service.uploadFile(mockAudioFile, audioDto);

      expect(supabaseService.uploadFile).toHaveBeenCalledWith(
        mockAudioFile.buffer,
        expect.stringContaining('.mp3'),
        'audio',
      );
    });

    it('should throw NotFoundException when player does not exist', async () => {
      prisma.players.findUnique.mockResolvedValue(null);

      await expect(service.uploadFile(mockImageFile, uploadDto)).rejects.toThrow(NotFoundException);
      await expect(service.uploadFile(mockImageFile, uploadDto)).rejects.toThrow(
        'Player with ID player-123 not found',
      );
    });

    it('should throw NotFoundException when match does not exist', async () => {
      const matchDto: UploadMediaDto = {
        type: MediaType.VIDEO,
        matchId: 'match-999',
      };

      prisma.matches.findUnique.mockResolvedValue(null);

      await expect(service.uploadFile(mockVideoFile, matchDto)).rejects.toThrow(NotFoundException);
      await expect(service.uploadFile(mockVideoFile, matchDto)).rejects.toThrow(
        'Match with ID match-999 not found',
      );
    });

    it('should throw NotFoundException when report does not exist', async () => {
      const reportDto: UploadMediaDto = {
        type: MediaType.DOCUMENT,
        reportId: 'report-999',
      };

      prisma.scouting_reports.findUnique.mockResolvedValue(null);

      await expect(service.uploadFile(mockDocumentFile, reportDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.uploadFile(mockDocumentFile, reportDto)).rejects.toThrow(
        'Report with ID report-999 not found',
      );
    });

    it('should generate unique filename with timestamp and random string', async () => {
      await service.uploadFile(mockImageFile, uploadDto);

      const uploadCall = (supabaseService.uploadFile as jest.Mock).mock.calls[0];
      const filename = uploadCall[1];

      expect(filename).toMatch(/^\d+-[a-z0-9]+\.jpg$/);
    });

    it('should create media record with correct data', async () => {
      await service.uploadFile(mockImageFile, uploadDto);

      expect(prisma.media.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: MediaType.IMAGE,
          url: 'https://storage.example.com/images/test.jpg',
          filename: 'test-image.jpg',
          mimeType: 'image/jpeg',
          size: 1024 * 500,
          playerId: 'player-123',
        }),
        include: expect.any(Object),
      });
    });

    it('should upload file without any entity associations', async () => {
      const simpleDto: UploadMediaDto = {
        type: MediaType.IMAGE,
      };

      await service.uploadFile(mockImageFile, simpleDto);

      expect(prisma.media.create).toHaveBeenCalledWith({
        data: expect.not.objectContaining({
          playerId: expect.anything(),
          matchId: expect.anything(),
          reportId: expect.anything(),
        }),
        include: expect.any(Object),
      });
    });

    it('should handle multiple entity associations', async () => {
      const multiDto: UploadMediaDto = {
        type: MediaType.VIDEO,
        playerId: 'player-123',
        matchId: 'match-123',
        reportId: 'report-123',
      };

      prisma.matches.findUnique.mockResolvedValue(mockMatch as any);
      prisma.scouting_reports.findUnique.mockResolvedValue(mockReport as any);

      await service.uploadFile(mockVideoFile, multiDto);

      expect(prisma.players.findUnique).toHaveBeenCalled();
      expect(prisma.matches.findUnique).toHaveBeenCalled();
      expect(prisma.scouting_reports.findUnique).toHaveBeenCalled();
      expect(prisma.media.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          playerId: 'player-123',
          matchId: 'match-123',
          reportId: 'report-123',
        }),
        include: expect.any(Object),
      });
    });

    it('should preserve original filename', async () => {
      await service.uploadFile(mockImageFile, uploadDto);

      expect(prisma.media.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          filename: 'test-image.jpg',
        }),
        include: expect.any(Object),
      });
    });

    it('should extract file extension correctly', async () => {
      const fileWithMultipleDots: Express.Multer.File = {
        ...mockImageFile,
        originalname: 'my.file.name.jpeg',
      };

      await service.uploadFile(fileWithMultipleDots, uploadDto);

      const uploadCall = (supabaseService.uploadFile as jest.Mock).mock.calls[0];
      const filename = uploadCall[1];
      expect(filename).toMatch(/\.jpeg$/);
    });
  });

  describe('uploadPlayerAvatar', () => {
    const playerId = 'player-123';

    beforeEach(() => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      supabaseService.uploadFile.mockResolvedValue(
        'https://storage.example.com/avatars/avatar-player-123.jpg',
      );
      prisma.users.update.mockResolvedValue({
        ...mockPlayer.users,
        avatar: 'https://storage.example.com/avatars/avatar-player-123.jpg',
      } as any);
    });

    it('should upload player avatar successfully', async () => {
      const result = await service.uploadPlayerAvatar(playerId, mockImageFile);

      expect(result).toBeDefined();
      expect(result.url).toContain('avatar-player-123');
      expect(result.message).toBe('Avatar uploaded successfully');
    });

    it('should throw NotFoundException when player does not exist', async () => {
      prisma.players.findUnique.mockResolvedValue(null);

      await expect(service.uploadPlayerAvatar(playerId, mockImageFile)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.uploadPlayerAvatar(playerId, mockImageFile)).rejects.toThrow(
        'Player with ID player-123 not found',
      );
    });

    it('should throw BadRequestException when file is not an image', async () => {
      await expect(service.uploadPlayerAvatar(playerId, mockDocumentFile)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadPlayerAvatar(playerId, mockDocumentFile)).rejects.toThrow(
        'File must be an image',
      );
    });

    it('should accept various image mime types', async () => {
      const imageMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
      ];

      for (const mimetype of imageMimeTypes) {
        const imageFile = { ...mockImageFile, mimetype };
        await service.uploadPlayerAvatar(playerId, imageFile);
      }

      expect(supabaseService.uploadFile).toHaveBeenCalledTimes(imageMimeTypes.length);
    });

    it('should upload to avatars folder', async () => {
      await service.uploadPlayerAvatar(playerId, mockImageFile);

      expect(supabaseService.uploadFile).toHaveBeenCalledWith(
        mockImageFile.buffer,
        expect.stringContaining('avatar-player-123'),
        'avatars',
      );
    });

    it('should update user avatar URL', async () => {
      await service.uploadPlayerAvatar(playerId, mockImageFile);

      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          avatar: 'https://storage.example.com/avatars/avatar-player-123.jpg',
        },
      });
    });

    it('should generate filename with playerId and timestamp', async () => {
      await service.uploadPlayerAvatar(playerId, mockImageFile);

      const uploadCall = (supabaseService.uploadFile as jest.Mock).mock.calls[0];
      const filename = uploadCall[1];

      expect(filename).toContain('avatar-player-123');
      expect(filename).toMatch(/avatar-player-123-\d+\.jpg$/);
    });

    it('should include player details in the query', async () => {
      await service.uploadPlayerAvatar(playerId, mockImageFile);

      expect(prisma.players.findUnique).toHaveBeenCalledWith({
        where: { id: playerId },
        include: { users: true },
      });
    });
  });

  describe('uploadClubLogo', () => {
    const clubId = 'club-123';

    beforeEach(() => {
      prisma.clubs.findUnique.mockResolvedValue(mockClub as any);
      supabaseService.uploadFile.mockResolvedValue(
        'https://storage.example.com/logos/logo-club-123.jpg',
      );
      prisma.clubs.update.mockResolvedValue({
        ...mockClub,
        logo: 'https://storage.example.com/logos/logo-club-123.jpg',
      } as any);
    });

    it('should upload club logo successfully', async () => {
      const result = await service.uploadClubLogo(clubId, mockImageFile);

      expect(result).toBeDefined();
      expect(result.url).toContain('logo-club-123');
      expect(result.message).toBe('Logo uploaded successfully');
    });

    it('should throw NotFoundException when club does not exist', async () => {
      prisma.clubs.findUnique.mockResolvedValue(null);

      await expect(service.uploadClubLogo(clubId, mockImageFile)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.uploadClubLogo(clubId, mockImageFile)).rejects.toThrow(
        'Club with ID club-123 not found',
      );
    });

    it('should throw BadRequestException when file is not an image', async () => {
      await expect(service.uploadClubLogo(clubId, mockVideoFile)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadClubLogo(clubId, mockVideoFile)).rejects.toThrow(
        'File must be an image',
      );
    });

    it('should upload to logos folder', async () => {
      await service.uploadClubLogo(clubId, mockImageFile);

      expect(supabaseService.uploadFile).toHaveBeenCalledWith(
        mockImageFile.buffer,
        expect.stringContaining('logo-club-123'),
        'logos',
      );
    });

    it('should update club logo URL', async () => {
      await service.uploadClubLogo(clubId, mockImageFile);

      expect(prisma.clubs.update).toHaveBeenCalledWith({
        where: { id: clubId },
        data: {
          logo: 'https://storage.example.com/logos/logo-club-123.jpg',
        },
      });
    });

    it('should generate filename with clubId and timestamp', async () => {
      await service.uploadClubLogo(clubId, mockImageFile);

      const uploadCall = (supabaseService.uploadFile as jest.Mock).mock.calls[0];
      const filename = uploadCall[1];

      expect(filename).toContain('logo-club-123');
      expect(filename).toMatch(/logo-club-123-\d+\.jpg$/);
    });

    it('should accept PNG format for logos', async () => {
      const pngFile = { ...mockImageFile, mimetype: 'image/png' };
      await service.uploadClubLogo(clubId, pngFile);

      expect(supabaseService.uploadFile).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    beforeEach(() => {
      prisma.media.findUnique.mockResolvedValue(mockMedia as any);
    });

    it('should find media by ID successfully', async () => {
      const result = await service.findOne('media-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('media-123');
      expect(prisma.media.findUnique).toHaveBeenCalledWith({
        where: { id: 'media-123' },
        include: expect.objectContaining({
          players: expect.any(Object),
          matches: expect.any(Object),
          scouting_reports: expect.any(Object),
        }),
      });
    });

    it('should throw NotFoundException when media does not exist', async () => {
      prisma.media.findUnique.mockResolvedValue(null);

      await expect(service.findOne('media-999')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('media-999')).rejects.toThrow(
        'Media with ID media-999 not found',
      );
    });

    it('should include related player data', async () => {
      const result = await service.findOne('media-123');

      expect(result.players).toBeDefined();
      expect(result.players.users).toBeDefined();
    });

    it('should include nested includes for related entities', async () => {
      await service.findOne('media-123');

      expect(prisma.media.findUnique).toHaveBeenCalledWith({
        where: { id: 'media-123' },
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
    });
  });

  describe('getPlayerMedia', () => {
    const playerId = 'player-123';

    beforeEach(() => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.media.findMany.mockResolvedValue([mockMedia] as any);
    });

    it('should get all media for a player', async () => {
      const result = await service.getPlayerMedia(playerId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should throw NotFoundException when player does not exist', async () => {
      prisma.players.findUnique.mockResolvedValue(null);

      await expect(service.getPlayerMedia('player-999')).rejects.toThrow(NotFoundException);
      await expect(service.getPlayerMedia('player-999')).rejects.toThrow(
        'Player with ID player-999 not found',
      );
    });

    it('should order media by uploadedAt descending', async () => {
      await service.getPlayerMedia(playerId);

      expect(prisma.media.findMany).toHaveBeenCalledWith({
        where: { playerId },
        orderBy: { uploadedAt: 'desc' },
      });
    });

    it('should return empty array when player has no media', async () => {
      prisma.media.findMany.mockResolvedValue([]);

      const result = await service.getPlayerMedia(playerId);

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should verify player exists before querying media', async () => {
      await service.getPlayerMedia(playerId);

      expect(prisma.players.findUnique).toHaveBeenCalledWith({
        where: { id: playerId },
      });
    });
  });

  describe('getMatchMedia', () => {
    const matchId = 'match-123';

    beforeEach(() => {
      prisma.matches.findUnique.mockResolvedValue(mockMatch as any);
      prisma.media.findMany.mockResolvedValue([{ ...mockMedia, matchId }] as any);
    });

    it('should get all media for a match', async () => {
      const result = await service.getMatchMedia(matchId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw NotFoundException when match does not exist', async () => {
      prisma.matches.findUnique.mockResolvedValue(null);

      await expect(service.getMatchMedia('match-999')).rejects.toThrow(NotFoundException);
      await expect(service.getMatchMedia('match-999')).rejects.toThrow(
        'Match with ID match-999 not found',
      );
    });

    it('should order media by uploadedAt descending', async () => {
      await service.getMatchMedia(matchId);

      expect(prisma.media.findMany).toHaveBeenCalledWith({
        where: { matchId },
        orderBy: { uploadedAt: 'desc' },
      });
    });

    it('should return empty array when match has no media', async () => {
      prisma.media.findMany.mockResolvedValue([]);

      const result = await service.getMatchMedia(matchId);

      expect(result).toEqual([]);
    });
  });

  describe('getReportMedia', () => {
    const reportId = 'report-123';

    beforeEach(() => {
      prisma.scouting_reports.findUnique.mockResolvedValue(mockReport as any);
      prisma.media.findMany.mockResolvedValue([{ ...mockMedia, reportId }] as any);
    });

    it('should get all media for a report', async () => {
      const result = await service.getReportMedia(reportId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw NotFoundException when report does not exist', async () => {
      prisma.scouting_reports.findUnique.mockResolvedValue(null);

      await expect(service.getReportMedia('report-999')).rejects.toThrow(NotFoundException);
      await expect(service.getReportMedia('report-999')).rejects.toThrow(
        'Report with ID report-999 not found',
      );
    });

    it('should order media by uploadedAt descending', async () => {
      await service.getReportMedia(reportId);

      expect(prisma.media.findMany).toHaveBeenCalledWith({
        where: { reportId },
        orderBy: { uploadedAt: 'desc' },
      });
    });

    it('should return empty array when report has no media', async () => {
      prisma.media.findMany.mockResolvedValue([]);

      const result = await service.getReportMedia(reportId);

      expect(result).toEqual([]);
    });
  });

  describe('remove', () => {
    const mediaId = 'media-123';

    beforeEach(() => {
      prisma.media.findUnique.mockResolvedValue(mockMedia as any);
      supabaseService.deleteFile.mockResolvedValue(undefined);
      prisma.media.delete.mockResolvedValue(mockMedia as any);
    });

    it('should delete media successfully', async () => {
      const result = await service.remove(mediaId);

      expect(result).toBeDefined();
      expect(supabaseService.deleteFile).toHaveBeenCalledWith(mockMedia.url);
      expect(prisma.media.delete).toHaveBeenCalledWith({
        where: { id: mediaId },
      });
    });

    it('should throw NotFoundException when media does not exist', async () => {
      prisma.media.findUnique.mockResolvedValue(null);

      await expect(service.remove('media-999')).rejects.toThrow(NotFoundException);
      await expect(service.remove('media-999')).rejects.toThrow(
        'Media with ID media-999 not found',
      );
    });

    it('should continue deletion even if Supabase deletion fails', async () => {
      supabaseService.deleteFile.mockRejectedValue(new Error('Supabase error'));

      const result = await service.remove(mediaId);

      expect(result).toBeDefined();
      expect(prisma.media.delete).toHaveBeenCalled();
    });

    it('should delete from Supabase before deleting database record', async () => {
      await service.remove(mediaId);

      expect(supabaseService.deleteFile).toHaveBeenCalled();
      expect(prisma.media.delete).toHaveBeenCalled();
    });

    it('should handle Supabase file not found error gracefully', async () => {
      supabaseService.deleteFile.mockRejectedValue(new Error('File not found in storage'));

      const result = await service.remove(mediaId);

      expect(result).toBeDefined();
      expect(prisma.media.delete).toHaveBeenCalled();
    });

    it('should verify media exists before attempting deletion', async () => {
      await service.remove(mediaId);

      expect(prisma.media.findUnique).toHaveBeenCalledWith({
        where: { id: mediaId },
      });
    });
  });

  describe('downloadFile', () => {
    const mediaId = 'media-123';
    const mockBlob = new Blob(['file content'], {
      type: 'image/jpeg',
    });

    beforeEach(() => {
      prisma.media.findUnique.mockResolvedValue(mockMedia as any);
      supabaseService.downloadFile.mockResolvedValue(mockBlob);
    });

    it('should download media file successfully', async () => {
      const result = await service.downloadFile(mediaId);

      expect(result).toBeDefined();
      expect(result.blob).toBe(mockBlob);
      expect(result.filename).toBe(mockMedia.filename);
      expect(result.mimeType).toBe(mockMedia.mimeType);
    });

    it('should throw NotFoundException when media does not exist', async () => {
      prisma.media.findUnique.mockResolvedValue(null);

      await expect(service.downloadFile('media-999')).rejects.toThrow(NotFoundException);
      await expect(service.downloadFile('media-999')).rejects.toThrow(
        'Media with ID media-999 not found',
      );
    });

    it('should call Supabase downloadFile with correct URL', async () => {
      await service.downloadFile(mediaId);

      expect(supabaseService.downloadFile).toHaveBeenCalledWith(mockMedia.url);
    });

    it('should return blob with correct metadata', async () => {
      const result = await service.downloadFile(mediaId);

      expect(result).toEqual({
        blob: mockBlob,
        filename: 'test-image.jpg',
        mimeType: 'image/jpeg',
      });
    });

    it('should handle large file downloads', async () => {
      const largeBlob = new Blob([new Array(1000000).fill('x').join('')], {
        type: 'video/mp4',
      });
      const videoMedia = {
        ...mockMedia,
        type: MediaType.VIDEO,
        mimeType: 'video/mp4',
        filename: 'large-video.mp4',
      };

      prisma.media.findUnique.mockResolvedValue(videoMedia as any);
      supabaseService.downloadFile.mockResolvedValue(largeBlob);

      const result = await service.downloadFile(mediaId);

      expect(result.blob).toBe(largeBlob);
      expect(result.filename).toBe('large-video.mp4');
      expect(result.mimeType).toBe('video/mp4');
    });

    it('should verify media exists before downloading', async () => {
      await service.downloadFile(mediaId);

      expect(prisma.media.findUnique).toHaveBeenCalledWith({
        where: { id: mediaId },
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle file with no extension', async () => {
      const noExtFile: Express.Multer.File = {
        ...mockImageFile,
        originalname: 'noextension',
      };

      const uploadDto: UploadMediaDto = {
        type: MediaType.IMAGE,
      };

      prisma.media.create.mockResolvedValue(mockMedia as any);
      supabaseService.uploadFile.mockResolvedValue('https://storage.test/url');

      await service.uploadFile(noExtFile, uploadDto);

      const uploadCall = (supabaseService.uploadFile as jest.Mock).mock.calls[0];
      const filename = uploadCall[1];
      expect(filename).toContain('.');
    });

    it('should handle very large file names', async () => {
      const longNameFile: Express.Multer.File = {
        ...mockImageFile,
        originalname: 'a'.repeat(300) + '.jpg',
      };

      const uploadDto: UploadMediaDto = {
        type: MediaType.IMAGE,
      };

      prisma.media.create.mockResolvedValue(mockMedia as any);
      supabaseService.uploadFile.mockResolvedValue('https://storage.test/url');

      await service.uploadFile(longNameFile, uploadDto);

      expect(prisma.media.create).toHaveBeenCalled();
    });

    it('should handle special characters in filename', async () => {
      const specialFile: Express.Multer.File = {
        ...mockImageFile,
        originalname: 'test file (2024) [final].jpg',
      };

      const uploadDto: UploadMediaDto = {
        type: MediaType.IMAGE,
      };

      prisma.media.create.mockResolvedValue(mockMedia as any);
      supabaseService.uploadFile.mockResolvedValue('https://storage.test/url');

      await service.uploadFile(specialFile, uploadDto);

      expect(prisma.media.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          filename: 'test file (2024) [final].jpg',
        }),
        include: expect.any(Object),
      });
    });

    it('should handle concurrent upload requests', async () => {
      const uploadDto: UploadMediaDto = {
        type: MediaType.IMAGE,
        playerId: 'player-123',
      };

      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      supabaseService.uploadFile.mockResolvedValue('https://storage.example.com/images/test.jpg');
      prisma.media.create.mockResolvedValue(mockMedia as any);

      const uploads = [
        service.uploadFile(mockImageFile, uploadDto),
        service.uploadFile(mockImageFile, uploadDto),
        service.uploadFile(mockImageFile, uploadDto),
      ];

      const results = await Promise.all(uploads);

      expect(results).toHaveLength(3);
      expect(supabaseService.uploadFile).toHaveBeenCalledTimes(3);
    });

    it('should handle empty buffer', async () => {
      const emptyFile: Express.Multer.File = {
        ...mockImageFile,
        buffer: Buffer.from(''),
        size: 0,
      };

      const uploadDto: UploadMediaDto = {
        type: MediaType.IMAGE,
      };

      prisma.media.create.mockResolvedValue(mockMedia as any);
      supabaseService.uploadFile.mockResolvedValue('https://storage.test/url');

      await service.uploadFile(emptyFile, uploadDto);

      expect(supabaseService.uploadFile).toHaveBeenCalled();
    });
  });

  describe('Folder Determination', () => {
    it('should use correct folder for each media type', async () => {
      const testCases = [
        { type: MediaType.IMAGE, expectedFolder: 'images', file: mockImageFile },
        { type: MediaType.VIDEO, expectedFolder: 'videos', file: mockVideoFile },
        {
          type: MediaType.DOCUMENT,
          expectedFolder: 'documents',
          file: mockDocumentFile,
        },
        { type: MediaType.AUDIO, expectedFolder: 'audio', file: mockAudioFile },
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();
        prisma.media.create.mockResolvedValue(mockMedia as any);
        supabaseService.uploadFile.mockResolvedValue('https://storage.test/url');

        const uploadDto: UploadMediaDto = {
          type: testCase.type,
        };

        await service.uploadFile(testCase.file, uploadDto);

        expect(supabaseService.uploadFile).toHaveBeenCalledWith(
          expect.any(Buffer),
          expect.any(String),
          testCase.expectedFolder,
        );
      }
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle full workflow: upload, find, download, delete', async () => {
      const uploadDto: UploadMediaDto = {
        type: MediaType.IMAGE,
        playerId: 'player-123',
      };

      // Setup mocks
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      supabaseService.uploadFile.mockResolvedValue(mockMedia.url);
      prisma.media.create.mockResolvedValue(mockMedia as any);
      prisma.media.findUnique.mockResolvedValue(mockMedia as any);
      supabaseService.downloadFile.mockResolvedValue(new Blob(['data'], { type: 'image/jpeg' }));
      supabaseService.deleteFile.mockResolvedValue(undefined);
      prisma.media.delete.mockResolvedValue(mockMedia as any);

      // Upload
      const uploaded = await service.uploadFile(mockImageFile, uploadDto);
      expect(uploaded).toBeDefined();

      // Find
      const found = await service.findOne(uploaded.id);
      expect(found).toBeDefined();

      // Download
      const downloaded = await service.downloadFile(uploaded.id);
      expect(downloaded).toBeDefined();

      // Delete
      const deleted = await service.remove(uploaded.id);
      expect(deleted).toBeDefined();
    });

    it('should handle player with multiple media files', async () => {
      const playerId = 'player-123';
      const mediaList = [
        { ...mockMedia, id: 'media-1', type: MediaType.IMAGE },
        { ...mockMedia, id: 'media-2', type: MediaType.VIDEO },
        { ...mockMedia, id: 'media-3', type: MediaType.DOCUMENT },
      ];

      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.media.findMany.mockResolvedValue(mediaList as any);

      const result = await service.getPlayerMedia(playerId);

      expect(result).toHaveLength(3);
      expect(result.some((m) => m.type === MediaType.IMAGE)).toBe(true);
      expect(result.some((m) => m.type === MediaType.VIDEO)).toBe(true);
      expect(result.some((m) => m.type === MediaType.DOCUMENT)).toBe(true);
    });

    it('should handle match with media from multiple players', async () => {
      const matchId = 'match-123';
      const mediaList = [
        { ...mockMedia, id: 'media-1', matchId, playerId: 'player-1' },
        { ...mockMedia, id: 'media-2', matchId, playerId: 'player-2' },
      ];

      prisma.matches.findUnique.mockResolvedValue(mockMatch as any);
      prisma.media.findMany.mockResolvedValue(mediaList as any);

      const result = await service.getMatchMedia(matchId);

      expect(result).toHaveLength(2);
    });
  });
});
