import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PassportService } from './passport.service';
import { PrismaService } from '../modules/prisma/prisma.service';
import { PassportStatus } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import * as QRCode from 'qrcode';

jest.mock('qrcode');
jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'mock-uuid-12345'),
}));

describe('PassportService', () => {
  let service: PassportService;
  let prisma: DeepMockProxy<PrismaClient>;

  const mockPlayer = {
    id: 'player-123',
    userId: 'user-123',
    position: 'Forward',
    nationality: 'France',
    dateOfBirth: new Date('2000-01-15'),
    height: 180.0,
    weight: 75.0,
    preferredFoot: 'Right',
    statsJson: { goals: 10, assists: 5 },
    users: {
      firstName: 'John',
      lastName: 'Doe',
      avatar: 'https://example.com/avatar.jpg',
    },
    clubs: {
      name: 'FC Test',
      logo: 'https://example.com/logo.jpg',
    },
    scouting_reports: [{ overallRating: 80 }, { overallRating: 85 }, { overallRating: 90 }],
  };

  const mockPassport = {
    id: 'passport-123',
    playerId: 'player-123',
    publicToken: 'token-12345',
    status: PassportStatus.PENDING,
    passportData: {
      firstName: 'John',
      lastName: 'Doe',
      position: 'Forward',
      nationality: 'France',
      dateOfBirth: new Date('2000-01-15'),
      height: 180.0,
      weight: 75.0,
      preferredFoot: 'Right',
      club: { name: 'FC Test', logo: 'https://example.com/logo.jpg' },
      avatar: 'https://example.com/avatar.jpg',
      averageRating: 85,
      totalReports: 3,
      statsSnapshot: { goals: 10, assists: 5 },
    },
    verificationNotes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    verifiedAt: null,
    verifiedById: null,
    expiresAt: null,
    players: mockPlayer,
  };

  beforeEach(async () => {
    prisma = mockDeep<PrismaClient>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PassportService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<PassportService>(PassportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPassport', () => {
    it('should successfully create a passport for a player', async () => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.player_passports.findUnique.mockResolvedValue(null);
      prisma.player_passports.create.mockResolvedValue(mockPassport as any);

      const result = await service.createPassport('player-123');

      expect(prisma.players.findUnique).toHaveBeenCalledWith({
        where: { id: 'player-123' },
        include: {
          users: true,
          clubs: true,
          scouting_reports: {
            where: { status: 'APPROVED' },
            take: 20,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      expect(prisma.player_passports.findUnique).toHaveBeenCalledWith({
        where: { playerId: 'player-123' },
      });
      expect(prisma.player_passports.create).toHaveBeenCalledWith({
        data: {
          id: 'mock-uuid-12345',
          playerId: 'player-123',
          publicToken: 'mock-uuid-12345',
          status: PassportStatus.PENDING,
          passportData: expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
            position: 'Forward',
            nationality: 'France',
            averageRating: 85,
            totalReports: 3,
          }),
          verificationNotes: undefined,
          updatedAt: expect.any(Date),
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
      expect(result).toEqual(mockPassport);
    });

    it('should create passport with verification notes if provided', async () => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.player_passports.findUnique.mockResolvedValue(null);
      prisma.player_passports.create.mockResolvedValue({
        ...mockPassport,
        verificationNotes: 'Initial verification',
      } as any);

      await service.createPassport('player-123', 'Initial verification');

      expect(prisma.player_passports.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          verificationNotes: 'Initial verification',
        }),
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if player does not exist', async () => {
      prisma.players.findUnique.mockResolvedValue(null);

      await expect(service.createPassport('non-existent-player')).rejects.toThrow(
        new NotFoundException('Player not found'),
      );
      expect(prisma.player_passports.findUnique).not.toHaveBeenCalled();
      expect(prisma.player_passports.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if passport already exists', async () => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.player_passports.findUnique.mockResolvedValue(mockPassport as any);

      await expect(service.createPassport('player-123')).rejects.toThrow(
        new BadRequestException('Player already has a passport'),
      );
      expect(prisma.player_passports.create).not.toHaveBeenCalled();
    });

    it('should calculate average rating correctly from scouting reports', async () => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.player_passports.findUnique.mockResolvedValue(null);
      prisma.player_passports.create.mockResolvedValue(mockPassport as any);

      await service.createPassport('player-123');

      const createCall = (prisma.player_passports.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.passportData.averageRating).toBe(85); // (80 + 85 + 90) / 3 = 85
    });

    it('should set average rating to null if no scouting reports exist', async () => {
      const playerWithoutReports = {
        ...mockPlayer,
        scouting_reports: [],
      };
      prisma.players.findUnique.mockResolvedValue(playerWithoutReports as any);
      prisma.player_passports.findUnique.mockResolvedValue(null);
      prisma.player_passports.create.mockResolvedValue(mockPassport as any);

      await service.createPassport('player-123');

      const createCall = (prisma.player_passports.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.passportData.averageRating).toBeNull();
      expect(createCall.data.passportData.totalReports).toBe(0);
    });

    it('should handle player without club correctly', async () => {
      const playerWithoutClub = {
        ...mockPlayer,
        clubs: null,
      };
      prisma.players.findUnique.mockResolvedValue(playerWithoutClub as any);
      prisma.player_passports.findUnique.mockResolvedValue(null);
      prisma.player_passports.create.mockResolvedValue(mockPassport as any);

      await service.createPassport('player-123');

      const createCall = (prisma.player_passports.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.passportData.club).toBeNull();
    });

    it('should round average rating to nearest integer', async () => {
      const playerWithDecimalAvg = {
        ...mockPlayer,
        scouting_reports: [{ overallRating: 75 }, { overallRating: 82 }],
      };
      prisma.players.findUnique.mockResolvedValue(playerWithDecimalAvg as any);
      prisma.player_passports.findUnique.mockResolvedValue(null);
      prisma.player_passports.create.mockResolvedValue(mockPassport as any);

      await service.createPassport('player-123');

      const createCall = (prisma.player_passports.create as jest.Mock).mock.calls[0][0];
      // (75 + 82) / 2 = 78.5, rounded to 79
      expect(createCall.data.passportData.averageRating).toBe(79);
    });

    it('should handle scouting reports with null overall rating', async () => {
      const playerWithNullRatings = {
        ...mockPlayer,
        scouting_reports: [{ overallRating: 80 }, { overallRating: null }, { overallRating: 85 }],
      };
      prisma.players.findUnique.mockResolvedValue(playerWithNullRatings as any);
      prisma.player_passports.findUnique.mockResolvedValue(null);
      prisma.player_passports.create.mockResolvedValue(mockPassport as any);

      await service.createPassport('player-123');

      const createCall = (prisma.player_passports.create as jest.Mock).mock.calls[0][0];
      // (80 + 0 + 85) / 3 = 55
      expect(createCall.data.passportData.averageRating).toBe(55);
    });

    it('should include all required passport data fields', async () => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.player_passports.findUnique.mockResolvedValue(null);
      prisma.player_passports.create.mockResolvedValue(mockPassport as any);

      await service.createPassport('player-123');

      const createCall = (prisma.player_passports.create as jest.Mock).mock.calls[0][0];
      const passportData = createCall.data.passportData;

      expect(passportData).toHaveProperty('firstName', 'John');
      expect(passportData).toHaveProperty('lastName', 'Doe');
      expect(passportData).toHaveProperty('position', 'Forward');
      expect(passportData).toHaveProperty('nationality', 'France');
      expect(passportData).toHaveProperty('dateOfBirth');
      expect(passportData).toHaveProperty('height', 180.0);
      expect(passportData).toHaveProperty('weight', 75.0);
      expect(passportData).toHaveProperty('preferredFoot', 'Right');
      expect(passportData).toHaveProperty('club');
      expect(passportData).toHaveProperty('avatar');
      expect(passportData).toHaveProperty('averageRating');
      expect(passportData).toHaveProperty('totalReports');
      expect(passportData).toHaveProperty('statsSnapshot');
    });
  });

  describe('getPassport', () => {
    it('should successfully retrieve a passport by player ID', async () => {
      prisma.player_passports.findUnique.mockResolvedValue(mockPassport as any);

      const result = await service.getPassport('player-123');

      expect(prisma.player_passports.findUnique).toHaveBeenCalledWith({
        where: { playerId: 'player-123' },
        include: {
          players: {
            include: expect.objectContaining({
              users: true,
              clubs: true,
              scouting_reports: expect.any(Object),
              media: expect.any(Object),
            }),
          },
        },
      });
      expect(result).toEqual(
        expect.objectContaining({
          ...mockPassport,
          profileView: expect.any(Object),
        }),
      );
    });

    it('should throw NotFoundException if passport does not exist', async () => {
      prisma.player_passports.findUnique.mockResolvedValue(null);

      await expect(service.getPassport('non-existent-player')).rejects.toThrow(
        new NotFoundException('Passport not found'),
      );
    });
  });

  describe('getPassportForUser', () => {
    it('should resolve passport when player profile exists for user', async () => {
      prisma.players.findFirst.mockResolvedValue({ id: 'player-123' } as any);
      prisma.player_passports.findUnique.mockResolvedValue(mockPassport as any);

      const result = await service.getPassportForUser('user-123');

      expect(prisma.players.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-123' },
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          ...mockPassport,
          profileView: expect.any(Object),
        }),
      );
    });

    it('should throw NotFoundException when user has no player profile', async () => {
      prisma.players.findFirst.mockResolvedValue(null);

      await expect(service.getPassportForUser('user-missing')).rejects.toThrow(
        new NotFoundException('Player profile not found for user'),
      );
    });
  });

  describe('getPassportByToken', () => {
    it('should successfully retrieve a passport by public token', async () => {
      prisma.player_passports.findUnique.mockResolvedValue(mockPassport as any);

      const result = await service.getPassportByToken('token-12345');

      expect(prisma.player_passports.findUnique).toHaveBeenCalledWith({
        where: { publicToken: 'token-12345' },
        include: {
          players: {
            include: expect.objectContaining({
              users: true,
              clubs: true,
              scouting_reports: expect.any(Object),
              media: expect.any(Object),
            }),
          },
        },
      });
      expect(result).toEqual(
        expect.objectContaining({
          ...mockPassport,
          publicProfile: expect.any(Object),
        }),
      );
    });

    it('should throw NotFoundException if passport with token does not exist', async () => {
      prisma.player_passports.findUnique.mockResolvedValue(null);

      await expect(service.getPassportByToken('invalid-token')).rejects.toThrow(
        new NotFoundException('Passport not found'),
      );
    });
  });

  describe('verifyPassport', () => {
    it('should successfully verify a passport with VERIFIED status', async () => {
      const verifiedPassport = {
        ...mockPassport,
        status: PassportStatus.VERIFIED,
        verifiedAt: new Date(),
        verifiedById: 'admin-123',
      };
      prisma.player_passports.findUnique.mockResolvedValue(mockPassport as any);
      prisma.player_passports.update.mockResolvedValue(verifiedPassport as any);

      const result = await service.verifyPassport(
        'player-123',
        PassportStatus.VERIFIED,
        'admin-123',
      );

      expect(prisma.player_passports.findUnique).toHaveBeenCalledWith({
        where: { playerId: 'player-123' },
      });
      expect(prisma.player_passports.update).toHaveBeenCalledWith({
        where: { playerId: 'player-123' },
        data: {
          status: PassportStatus.VERIFIED,
          verifiedAt: expect.any(Date),
          verifiedById: 'admin-123',
          verificationNotes: undefined,
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
      expect(result.status).toBe(PassportStatus.VERIFIED);
      expect(result.verifiedAt).toBeDefined();
    });

    it('should set verifiedAt to null when status is not VERIFIED', async () => {
      const revokedPassport = {
        ...mockPassport,
        status: PassportStatus.REVOKED,
        verifiedAt: null,
        verifiedById: 'admin-123',
      };
      prisma.player_passports.findUnique.mockResolvedValue(mockPassport as any);
      prisma.player_passports.update.mockResolvedValue(revokedPassport as any);

      await service.verifyPassport('player-123', PassportStatus.REVOKED, 'admin-123');

      const updateCall = (prisma.player_passports.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.verifiedAt).toBeNull();
    });

    it('should update passport with verification notes if provided', async () => {
      prisma.player_passports.findUnique.mockResolvedValue(mockPassport as any);
      prisma.player_passports.update.mockResolvedValue(mockPassport as any);

      await service.verifyPassport(
        'player-123',
        PassportStatus.VERIFIED,
        'admin-123',
        'Verified after document check',
      );

      expect(prisma.player_passports.update).toHaveBeenCalledWith({
        where: { playerId: 'player-123' },
        data: expect.objectContaining({
          verificationNotes: 'Verified after document check',
        }),
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if passport does not exist', async () => {
      prisma.player_passports.findUnique.mockResolvedValue(null);

      await expect(
        service.verifyPassport('non-existent-player', PassportStatus.VERIFIED, 'admin-123'),
      ).rejects.toThrow(new NotFoundException('Passport not found'));
      expect(prisma.player_passports.update).not.toHaveBeenCalled();
    });

    it('should handle EXPIRED status correctly', async () => {
      const expiredPassport = {
        ...mockPassport,
        status: PassportStatus.EXPIRED,
        verifiedAt: null,
      };
      prisma.player_passports.findUnique.mockResolvedValue(mockPassport as any);
      prisma.player_passports.update.mockResolvedValue(expiredPassport as any);

      const result = await service.verifyPassport(
        'player-123',
        PassportStatus.EXPIRED,
        'admin-123',
      );

      expect(result.status).toBe(PassportStatus.EXPIRED);
      const updateCall = (prisma.player_passports.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.verifiedAt).toBeNull();
    });

    it('should handle PENDING status correctly', async () => {
      prisma.player_passports.findUnique.mockResolvedValue(mockPassport as any);
      prisma.player_passports.update.mockResolvedValue(mockPassport as any);

      await service.verifyPassport('player-123', PassportStatus.PENDING, 'admin-123');

      const updateCall = (prisma.player_passports.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.status).toBe(PassportStatus.PENDING);
      expect(updateCall.data.verifiedAt).toBeNull();
    });
  });

  describe('generateQRCode', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
      process.env.PUBLIC_WEB_URL = undefined;
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should successfully generate a QR code with default URL', async () => {
      const mockQRCodeDataUrl = 'data:image/png;base64,mockQRCode';
      (QRCode.toDataURL as jest.Mock).mockResolvedValue(mockQRCodeDataUrl);
      process.env.FRONTEND_URL = undefined;
      process.env.PUBLIC_WEB_URL = undefined;

      const result = await service.generateQRCode('token-12345');

      expect(QRCode.toDataURL).toHaveBeenCalledWith('http://localhost:3000/passport/token-12345', {
        width: 300,
        margin: 2,
        color: {
          dark: '#080C1D',
          light: '#E4FF3B',
        },
      });
      expect(result).toBe(mockQRCodeDataUrl);
    });

    it('should use FRONTEND_URL from environment when available', async () => {
      const mockQRCodeDataUrl = 'data:image/png;base64,mockQRCode';
      (QRCode.toDataURL as jest.Mock).mockResolvedValue(mockQRCodeDataUrl);
      process.env.FRONTEND_URL = 'https://appfoot.com';
      process.env.PUBLIC_WEB_URL = undefined;

      const result = await service.generateQRCode('token-12345');

      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        'https://appfoot.com/passport/token-12345',
        expect.any(Object),
      );
      expect(result).toBe(mockQRCodeDataUrl);
    });

    it('should throw BadRequestException if QR code generation fails', async () => {
      (QRCode.toDataURL as jest.Mock).mockRejectedValue(new Error('QR generation error'));

      await expect(service.generateQRCode('token-12345')).rejects.toThrow(
        new BadRequestException('Failed to generate QR code'),
      );
    });

    it('should generate QR code with correct styling options', async () => {
      const mockQRCodeDataUrl = 'data:image/png;base64,mockQRCode';
      (QRCode.toDataURL as jest.Mock).mockResolvedValue(mockQRCodeDataUrl);

      await service.generateQRCode('token-12345');

      const options = (QRCode.toDataURL as jest.Mock).mock.calls[0][1];
      expect(options.width).toBe(300);
      expect(options.margin).toBe(2);
      expect(options.color.dark).toBe('#080C1D');
      expect(options.color.light).toBe('#E4FF3B');
    });

    it('should handle different token formats', async () => {
      const mockQRCodeDataUrl = 'data:image/png;base64,mockQRCode';
      (QRCode.toDataURL as jest.Mock).mockResolvedValue(mockQRCodeDataUrl);

      const tokens = ['simple-token', 'token-with-dashes', 'uuid-format-token-123'];

      for (const token of tokens) {
        await service.generateQRCode(token);
        expect(QRCode.toDataURL).toHaveBeenCalledWith(
          expect.stringContaining(token),
          expect.any(Object),
        );
      }
    });
  });

  describe('deletePassport', () => {
    it('should successfully delete a passport', async () => {
      prisma.player_passports.findUnique.mockResolvedValue(mockPassport as any);
      prisma.player_passports.delete.mockResolvedValue(mockPassport as any);

      const result = await service.deletePassport('player-123');

      expect(prisma.player_passports.findUnique).toHaveBeenCalledWith({
        where: { playerId: 'player-123' },
      });
      expect(prisma.player_passports.delete).toHaveBeenCalledWith({
        where: { playerId: 'player-123' },
      });
      expect(result).toEqual(mockPassport);
    });

    it('should throw NotFoundException if passport does not exist', async () => {
      prisma.player_passports.findUnique.mockResolvedValue(null);

      await expect(service.deletePassport('non-existent-player')).rejects.toThrow(
        new NotFoundException('Passport not found'),
      );
      expect(prisma.player_passports.delete).not.toHaveBeenCalled();
    });

    it('should delete passport regardless of verification status', async () => {
      const verifiedPassport = {
        ...mockPassport,
        status: PassportStatus.VERIFIED,
      };
      prisma.player_passports.findUnique.mockResolvedValue(verifiedPassport as any);
      prisma.player_passports.delete.mockResolvedValue(verifiedPassport as any);

      const result = await service.deletePassport('player-123');

      expect(prisma.player_passports.delete).toHaveBeenCalledWith({
        where: { playerId: 'player-123' },
      });
      expect(result).toEqual(verifiedPassport);
    });
  });

  describe('edge cases', () => {
    it('should handle player with missing optional fields', async () => {
      const minimalPlayer = {
        id: 'player-123',
        userId: 'user-123',
        position: 'Forward',
        nationality: 'France',
        dateOfBirth: new Date('2000-01-15'),
        height: null,
        weight: null,
        preferredFoot: null,
        statsJson: null,
        users: {
          firstName: 'John',
          lastName: 'Doe',
          avatar: null,
        },
        clubs: null,
        scouting_reports: [],
      };
      prisma.players.findUnique.mockResolvedValue(minimalPlayer as any);
      prisma.player_passports.findUnique.mockResolvedValue(null);
      prisma.player_passports.create.mockResolvedValue(mockPassport as any);

      await service.createPassport('player-123');

      const createCall = (prisma.player_passports.create as jest.Mock).mock.calls[0][0];
      const passportData = createCall.data.passportData;

      expect(passportData.height).toBeNull();
      expect(passportData.weight).toBeNull();
      expect(passportData.preferredFoot).toBeNull();
      expect(passportData.club).toBeNull();
      expect(passportData.avatar).toBeNull();
      expect(passportData.statsSnapshot).toBeNull();
    });

    it('should handle empty string token in getPassportByToken', async () => {
      prisma.player_passports.findUnique.mockResolvedValue(null);

      await expect(service.getPassportByToken('')).rejects.toThrow(
        new NotFoundException('Passport not found'),
      );
    });

    it('should maintain data integrity when creating passport with special characters', async () => {
      const specialPlayer = {
        ...mockPlayer,
        users: {
          firstName: "O'Brien",
          lastName: 'Müller',
          avatar: 'https://example.com/avatar.jpg',
        },
      };
      prisma.players.findUnique.mockResolvedValue(specialPlayer as any);
      prisma.player_passports.findUnique.mockResolvedValue(null);
      prisma.player_passports.create.mockResolvedValue(mockPassport as any);

      await service.createPassport('player-123');

      const createCall = (prisma.player_passports.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.passportData.firstName).toBe("O'Brien");
      expect(createCall.data.passportData.lastName).toBe('Müller');
    });

    it('should handle very large scouting report counts', async () => {
      const reports = Array(100)
        .fill(null)
        .map(() => ({ overallRating: 80 }));
      const playerWithManyReports = {
        ...mockPlayer,
        scouting_reports: reports,
      };
      prisma.players.findUnique.mockResolvedValue(playerWithManyReports as any);
      prisma.player_passports.findUnique.mockResolvedValue(null);
      prisma.player_passports.create.mockResolvedValue(mockPassport as any);

      await service.createPassport('player-123');

      const createCall = (prisma.player_passports.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.passportData.totalReports).toBe(100);
      expect(createCall.data.passportData.averageRating).toBe(80);
    });

    it('should handle extreme rating values', async () => {
      const playerWithExtremeRatings = {
        ...mockPlayer,
        scouting_reports: [{ overallRating: 0 }, { overallRating: 100 }, { overallRating: 50 }],
      };
      prisma.players.findUnique.mockResolvedValue(playerWithExtremeRatings as any);
      prisma.player_passports.findUnique.mockResolvedValue(null);
      prisma.player_passports.create.mockResolvedValue(mockPassport as any);

      await service.createPassport('player-123');

      const createCall = (prisma.player_passports.create as jest.Mock).mock.calls[0][0];
      // (0 + 100 + 50) / 3 = 50
      expect(createCall.data.passportData.averageRating).toBe(50);
    });
  });
});
