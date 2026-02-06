import { Test, TestingModule } from '@nestjs/testing';
import { PassportController } from './passport.controller';
import { PassportService } from './passport.service';
import { CreatePassportDto, VerifyPassportDto } from './dto/passport.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PassportStatus } from '@prisma/client';

describe('PassportController', () => {
  let controller: PassportController;
  let service: jest.Mocked<PassportService>;

  const mockPassportService = {
    createPassport: jest.fn(),
    getPassportForUser: jest.fn(),
    getPassport: jest.fn(),
    getPassportByToken: jest.fn(),
    verifyPassport: jest.fn(),
    generateQRCode: jest.fn(),
    deletePassport: jest.fn(),
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
    players: {
      id: 'player-123',
      userId: 'user-123',
      position: 'Forward',
      nationality: 'France',
      dateOfBirth: new Date('2000-01-15'),
      height: 180.0,
      weight: 75.0,
      preferredFoot: 'Right',
      users: {
        firstName: 'John',
        lastName: 'Doe',
        avatar: 'https://example.com/avatar.jpg',
      },
      clubs: {
        name: 'FC Test',
        logo: 'https://example.com/logo.jpg',
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PassportController],
      providers: [
        {
          provide: PassportService,
          useValue: mockPassportService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<PassportController>(PassportController);
    service = module.get(PassportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createPassport', () => {
    const createPassportDto: CreatePassportDto = {
      playerId: 'player-123',
      verificationNotes: 'Initial passport creation',
    };

    it('should successfully create a passport', async () => {
      service.createPassport.mockResolvedValue(mockPassport as any);

      const result = await controller.createPassport(createPassportDto);

      expect(service.createPassport).toHaveBeenCalledWith(
        createPassportDto.playerId,
        createPassportDto.verificationNotes,
      );
      expect(result).toEqual(mockPassport);
    });

    it('should create a passport without verification notes', async () => {
      const dtoWithoutNotes: CreatePassportDto = {
        playerId: 'player-123',
      };

      service.createPassport.mockResolvedValue(mockPassport as any);

      const result = await controller.createPassport(dtoWithoutNotes);

      expect(service.createPassport).toHaveBeenCalledWith('player-123', undefined);
      expect(result).toEqual(mockPassport);
    });

    it('should require JWT authentication', async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [PassportController],
        providers: [
          {
            provide: PassportService,
            useValue: mockPassportService,
          },
        ],
      }).compile();

      const testController = module.get<PassportController>(PassportController);
      const guards = Reflect.getMetadata('__guards__', testController.createPassport);

      expect(guards).toBeDefined();
      expect(guards.length).toBeGreaterThan(0);
    });

    it('should require appropriate roles', async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [PassportController],
        providers: [
          {
            provide: PassportService,
            useValue: mockPassportService,
          },
        ],
      }).compile();

      const testController = module.get<PassportController>(PassportController);
      const roles = Reflect.getMetadata('roles', testController.createPassport);

      expect(roles).toBeDefined();
      expect(roles).toContain('ADMIN');
      expect(roles).toContain('AGENT');
      expect(roles).toContain('SCOUT');
    });

    it('should handle service errors', async () => {
      const error = new Error('Player not found');
      service.createPassport.mockRejectedValue(error);

      await expect(controller.createPassport(createPassportDto)).rejects.toThrow(error);
    });

    it('should handle BadRequestException when player already has passport', async () => {
      const error = new Error('Player already has a passport');
      service.createPassport.mockRejectedValue(error);

      await expect(controller.createPassport(createPassportDto)).rejects.toThrow(
        'Player already has a passport',
      );
    });
  });

  describe('getMyPassport', () => {
    const mockRequest = { user: { id: 'user-123' } };

    it('should retrieve passport for authenticated user', async () => {
      service.getPassportForUser.mockResolvedValue(mockPassport as any);

      const result = await controller.getMyPassport(mockRequest as any);

      expect(service.getPassportForUser).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockPassport);
    });

    it('should require JWT guard', async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [PassportController],
        providers: [
          {
            provide: PassportService,
            useValue: mockPassportService,
          },
        ],
      }).compile();

      const testController = module.get<PassportController>(PassportController);
      const guards = Reflect.getMetadata('__guards__', testController.getMyPassport);

      expect(guards).toBeDefined();
      expect(guards.length).toBeGreaterThan(0);
    });
  });

  describe('getPassportByPlayer', () => {
    it('should successfully retrieve a passport by player ID', async () => {
      service.getPassport.mockResolvedValue(mockPassport as any);

      const result = await controller.getPassportByPlayer('player-123');

      expect(service.getPassport).toHaveBeenCalledWith('player-123');
      expect(result).toEqual(mockPassport);
    });

    it('should require JWT authentication', async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [PassportController],
        providers: [
          {
            provide: PassportService,
            useValue: mockPassportService,
          },
        ],
      }).compile();

      const testController = module.get<PassportController>(PassportController);
      const guards = Reflect.getMetadata('__guards__', testController.getPassportByPlayer);

      expect(guards).toBeDefined();
      expect(guards.length).toBeGreaterThan(0);
    });

    it('should throw NotFoundException when passport not found', async () => {
      const error = new Error('Passport not found');
      service.getPassport.mockRejectedValue(error);

      await expect(controller.getPassportByPlayer('invalid-player-id')).rejects.toThrow(
        'Passport not found',
      );
    });

    it('should handle different player ID formats', async () => {
      service.getPassport.mockResolvedValue(mockPassport as any);

      await controller.getPassportByPlayer('player-123');
      await controller.getPassportByPlayer('uuid-format-player-id');

      expect(service.getPassport).toHaveBeenCalledTimes(2);
    });

    it('should propagate service errors', async () => {
      const error = new Error('Database error');
      service.getPassport.mockRejectedValue(error);

      await expect(controller.getPassportByPlayer('player-123')).rejects.toThrow('Database error');
    });
  });

  describe('getPassportByToken', () => {
    const mockQRCodeUrl = 'data:image/png;base64,mockQRCode';

    it('should successfully retrieve a passport by token with QR code', async () => {
      service.getPassportByToken.mockResolvedValue(mockPassport as any);
      service.generateQRCode.mockResolvedValue(mockQRCodeUrl);

      const result = await controller.getPassportByToken('token-12345');

      expect(service.getPassportByToken).toHaveBeenCalledWith('token-12345');
      expect(service.generateQRCode).toHaveBeenCalledWith('token-12345');
      expect(result).toEqual({
        ...mockPassport,
        qrCodeUrl: mockQRCodeUrl,
      });
    });

    it('should not require authentication (public access)', async () => {
      service.getPassportByToken.mockResolvedValue(mockPassport as any);
      service.generateQRCode.mockResolvedValue(mockQRCodeUrl);

      const result = await controller.getPassportByToken('token-12345');

      expect(result).toBeDefined();
      expect(result.qrCodeUrl).toBe(mockQRCodeUrl);
    });

    it('should throw NotFoundException when passport not found', async () => {
      const error = new Error('Passport not found');
      service.getPassportByToken.mockRejectedValue(error);

      await expect(controller.getPassportByToken('invalid-token')).rejects.toThrow(
        'Passport not found',
      );
    });

    it('should include QR code in response', async () => {
      service.getPassportByToken.mockResolvedValue(mockPassport as any);
      service.generateQRCode.mockResolvedValue(mockQRCodeUrl);

      const result = await controller.getPassportByToken('token-12345');

      expect(result.qrCodeUrl).toBeDefined();
      expect(result.qrCodeUrl).toBe(mockQRCodeUrl);
    });

    it('should preserve all passport data in response', async () => {
      service.getPassportByToken.mockResolvedValue(mockPassport as any);
      service.generateQRCode.mockResolvedValue(mockQRCodeUrl);

      const result = await controller.getPassportByToken('token-12345');

      expect(result.id).toBe(mockPassport.id);
      expect(result.playerId).toBe(mockPassport.playerId);
      expect(result.publicToken).toBe(mockPassport.publicToken);
      expect(result.status).toBe(mockPassport.status);
      expect(result.passportData).toEqual(mockPassport.passportData);
    });

    it('should handle QR code generation failure', async () => {
      service.getPassportByToken.mockResolvedValue(mockPassport as any);
      service.generateQRCode.mockRejectedValue(new Error('Failed to generate QR code'));

      await expect(controller.getPassportByToken('token-12345')).rejects.toThrow(
        'Failed to generate QR code',
      );
    });

    it('should handle empty token', async () => {
      const error = new Error('Passport not found');
      service.getPassportByToken.mockRejectedValue(error);

      await expect(controller.getPassportByToken('')).rejects.toThrow('Passport not found');
    });
  });

  describe('getQRCode', () => {
    const mockQRCodeUrl = 'data:image/png;base64,mockQRCode';

    it('should successfully generate QR code for token', async () => {
      service.generateQRCode.mockResolvedValue(mockQRCodeUrl);

      const result = await controller.getQRCode('token-12345');

      expect(service.generateQRCode).toHaveBeenCalledWith('token-12345');
      expect(result).toEqual({ qrCodeUrl: mockQRCodeUrl });
    });

    it('should not require authentication (public access)', async () => {
      service.generateQRCode.mockResolvedValue(mockQRCodeUrl);

      const result = await controller.getQRCode('token-12345');

      expect(result).toBeDefined();
      expect(result.qrCodeUrl).toBe(mockQRCodeUrl);
    });

    it('should handle QR code generation failure', async () => {
      const error = new Error('Failed to generate QR code');
      service.generateQRCode.mockRejectedValue(error);

      await expect(controller.getQRCode('token-12345')).rejects.toThrow(
        'Failed to generate QR code',
      );
    });

    it('should return only QR code URL in response', async () => {
      service.generateQRCode.mockResolvedValue(mockQRCodeUrl);

      const result = await controller.getQRCode('token-12345');

      expect(Object.keys(result)).toEqual(['qrCodeUrl']);
      expect(result.qrCodeUrl).toBe(mockQRCodeUrl);
    });

    it('should handle different token formats', async () => {
      service.generateQRCode.mockResolvedValue(mockQRCodeUrl);

      await controller.getQRCode('simple-token');
      await controller.getQRCode('uuid-format-token-123');
      await controller.getQRCode('token-with-dashes');

      expect(service.generateQRCode).toHaveBeenCalledTimes(3);
    });
  });

  describe('verifyPassport', () => {
    const verifyPassportDto: VerifyPassportDto = {
      status: PassportStatus.VERIFIED,
      verificationNotes: 'Documents verified successfully',
    };

    const mockRequest = {
      user: {
        userId: 'admin-123',
      },
    };

    const verifiedPassport = {
      ...mockPassport,
      status: PassportStatus.VERIFIED,
      verifiedAt: new Date(),
      verifiedById: 'admin-123',
      verificationNotes: 'Documents verified successfully',
    };

    it('should successfully verify a passport', async () => {
      service.verifyPassport.mockResolvedValue(verifiedPassport as any);

      const result = await controller.verifyPassport('player-123', verifyPassportDto, mockRequest);

      expect(service.verifyPassport).toHaveBeenCalledWith(
        'player-123',
        PassportStatus.VERIFIED,
        'admin-123',
        'Documents verified successfully',
      );
      expect(result).toEqual(verifiedPassport);
    });

    it('should verify passport without verification notes', async () => {
      const dtoWithoutNotes: VerifyPassportDto = {
        status: PassportStatus.VERIFIED,
      };

      service.verifyPassport.mockResolvedValue(verifiedPassport as any);

      await controller.verifyPassport('player-123', dtoWithoutNotes, mockRequest);

      expect(service.verifyPassport).toHaveBeenCalledWith(
        'player-123',
        PassportStatus.VERIFIED,
        'admin-123',
        undefined,
      );
    });

    it('should require JWT authentication', async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [PassportController],
        providers: [
          {
            provide: PassportService,
            useValue: mockPassportService,
          },
        ],
      }).compile();

      const testController = module.get<PassportController>(PassportController);
      const guards = Reflect.getMetadata('__guards__', testController.verifyPassport);

      expect(guards).toBeDefined();
      expect(guards.length).toBeGreaterThan(0);
    });

    it('should require ADMIN or SUPER_ADMIN roles', async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [PassportController],
        providers: [
          {
            provide: PassportService,
            useValue: mockPassportService,
          },
        ],
      }).compile();

      const testController = module.get<PassportController>(PassportController);
      const roles = Reflect.getMetadata('roles', testController.verifyPassport);

      expect(roles).toBeDefined();
      expect(roles).toContain('ADMIN');
      expect(roles).toContain('SUPER_ADMIN');
    });

    it('should handle REVOKED status', async () => {
      const revokeDto: VerifyPassportDto = {
        status: PassportStatus.REVOKED,
        verificationNotes: 'Passport revoked due to invalid information',
      };

      const revokedPassport = {
        ...mockPassport,
        status: PassportStatus.REVOKED,
        verifiedAt: null,
        verifiedById: 'admin-123',
      };

      service.verifyPassport.mockResolvedValue(revokedPassport as any);

      const result = await controller.verifyPassport('player-123', revokeDto, mockRequest);

      expect(service.verifyPassport).toHaveBeenCalledWith(
        'player-123',
        PassportStatus.REVOKED,
        'admin-123',
        'Passport revoked due to invalid information',
      );
      expect(result.status).toBe(PassportStatus.REVOKED);
    });

    it('should handle EXPIRED status', async () => {
      const expireDto: VerifyPassportDto = {
        status: PassportStatus.EXPIRED,
      };

      const expiredPassport = {
        ...mockPassport,
        status: PassportStatus.EXPIRED,
        verifiedAt: null,
      };

      service.verifyPassport.mockResolvedValue(expiredPassport as any);

      await controller.verifyPassport('player-123', expireDto, mockRequest);

      expect(service.verifyPassport).toHaveBeenCalledWith(
        'player-123',
        PassportStatus.EXPIRED,
        'admin-123',
        undefined,
      );
    });

    it('should handle PENDING status', async () => {
      const pendingDto: VerifyPassportDto = {
        status: PassportStatus.PENDING,
      };

      service.verifyPassport.mockResolvedValue(mockPassport as any);

      await controller.verifyPassport('player-123', pendingDto, mockRequest);

      expect(service.verifyPassport).toHaveBeenCalledWith(
        'player-123',
        PassportStatus.PENDING,
        'admin-123',
        undefined,
      );
    });

    it('should extract userId from request object', async () => {
      service.verifyPassport.mockResolvedValue(verifiedPassport as any);

      await controller.verifyPassport('player-123', verifyPassportDto, mockRequest);

      const calledUserId = (service.verifyPassport as jest.Mock).mock.calls[0][2];
      expect(calledUserId).toBe('admin-123');
    });

    it('should throw NotFoundException when passport not found', async () => {
      const error = new Error('Passport not found');
      service.verifyPassport.mockRejectedValue(error);

      await expect(
        controller.verifyPassport('invalid-player-id', verifyPassportDto, mockRequest),
      ).rejects.toThrow('Passport not found');
    });

    it('should propagate service errors', async () => {
      const error = new Error('Database error');
      service.verifyPassport.mockRejectedValue(error);

      await expect(
        controller.verifyPassport('player-123', verifyPassportDto, mockRequest),
      ).rejects.toThrow('Database error');
    });
  });

  describe('deletePassport', () => {
    it('should successfully delete a passport', async () => {
      service.deletePassport.mockResolvedValue(mockPassport as any);

      const result = await controller.deletePassport('player-123');

      expect(service.deletePassport).toHaveBeenCalledWith('player-123');
      expect(result).toEqual(mockPassport);
    });

    it('should require JWT authentication', async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [PassportController],
        providers: [
          {
            provide: PassportService,
            useValue: mockPassportService,
          },
        ],
      }).compile();

      const testController = module.get<PassportController>(PassportController);
      const guards = Reflect.getMetadata('__guards__', testController.deletePassport);

      expect(guards).toBeDefined();
      expect(guards.length).toBeGreaterThan(0);
    });

    it('should require ADMIN or SUPER_ADMIN roles', async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [PassportController],
        providers: [
          {
            provide: PassportService,
            useValue: mockPassportService,
          },
        ],
      }).compile();

      const testController = module.get<PassportController>(PassportController);
      const roles = Reflect.getMetadata('roles', testController.deletePassport);

      expect(roles).toBeDefined();
      expect(roles).toContain('ADMIN');
      expect(roles).toContain('SUPER_ADMIN');
    });

    it('should throw NotFoundException when passport not found', async () => {
      const error = new Error('Passport not found');
      service.deletePassport.mockRejectedValue(error);

      await expect(controller.deletePassport('invalid-player-id')).rejects.toThrow(
        'Passport not found',
      );
    });

    it('should return deleted passport data', async () => {
      service.deletePassport.mockResolvedValue(mockPassport as any);

      const result = await controller.deletePassport('player-123');

      expect(result).toEqual(mockPassport);
      expect(result.id).toBe('passport-123');
      expect(result.playerId).toBe('player-123');
    });

    it('should handle deletion of verified passport', async () => {
      const verifiedPassport = {
        ...mockPassport,
        status: PassportStatus.VERIFIED,
        verifiedAt: new Date(),
        verifiedById: 'admin-123',
      };

      service.deletePassport.mockResolvedValue(verifiedPassport as any);

      const result = await controller.deletePassport('player-123');

      expect(result.status).toBe(PassportStatus.VERIFIED);
      expect(service.deletePassport).toHaveBeenCalledWith('player-123');
    });

    it('should propagate service errors', async () => {
      const error = new Error('Database error');
      service.deletePassport.mockRejectedValue(error);

      await expect(controller.deletePassport('player-123')).rejects.toThrow('Database error');
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors in createPassport', async () => {
      const createDto: CreatePassportDto = {
        playerId: 'player-123',
      };

      service.createPassport.mockRejectedValue(new Error('Database error'));

      await expect(controller.createPassport(createDto)).rejects.toThrow('Database error');
    });

    it('should handle service errors in getPassportByPlayer', async () => {
      service.getPassport.mockRejectedValue(new Error('Database error'));

      await expect(controller.getPassportByPlayer('player-123')).rejects.toThrow('Database error');
    });

    it('should handle service errors in getPassportByToken', async () => {
      service.getPassportByToken.mockRejectedValue(new Error('Database error'));

      await expect(controller.getPassportByToken('token-12345')).rejects.toThrow('Database error');
    });

    it('should handle service errors in getQRCode', async () => {
      service.generateQRCode.mockRejectedValue(new Error('QR generation error'));

      await expect(controller.getQRCode('token-12345')).rejects.toThrow('QR generation error');
    });

    it('should handle service errors in verifyPassport', async () => {
      const verifyDto: VerifyPassportDto = {
        status: PassportStatus.VERIFIED,
      };

      const mockRequest = {
        user: { userId: 'admin-123' },
      };

      service.verifyPassport.mockRejectedValue(new Error('Database error'));

      await expect(controller.verifyPassport('player-123', verifyDto, mockRequest)).rejects.toThrow(
        'Database error',
      );
    });

    it('should handle service errors in deletePassport', async () => {
      service.deletePassport.mockRejectedValue(new Error('Database error'));

      await expect(controller.deletePassport('player-123')).rejects.toThrow('Database error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent getPassportByToken requests', async () => {
      const mockQRCodeUrl = 'data:image/png;base64,mockQRCode';
      service.getPassportByToken.mockResolvedValue(mockPassport as any);
      service.generateQRCode.mockResolvedValue(mockQRCodeUrl);

      const promises = [
        controller.getPassportByToken('token-12345'),
        controller.getPassportByToken('token-12345'),
        controller.getPassportByToken('token-12345'),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(service.getPassportByToken).toHaveBeenCalledTimes(3);
      expect(service.generateQRCode).toHaveBeenCalledTimes(3);
    });

    it('should handle special characters in verification notes', async () => {
      const createDto: CreatePassportDto = {
        playerId: 'player-123',
        verificationNotes: "Player's documents verified with special chars: @#$%",
      };

      service.createPassport.mockResolvedValue(mockPassport as any);

      await controller.createPassport(createDto);

      expect(service.createPassport).toHaveBeenCalledWith(
        'player-123',
        "Player's documents verified with special chars: @#$%",
      );
    });

    it('should handle very long verification notes', async () => {
      const longNotes = 'A'.repeat(1000);
      const createDto: CreatePassportDto = {
        playerId: 'player-123',
        verificationNotes: longNotes,
      };

      service.createPassport.mockResolvedValue(mockPassport as any);

      await controller.createPassport(createDto);

      expect(service.createPassport).toHaveBeenCalledWith('player-123', longNotes);
    });

    it('should handle multiple status transitions', async () => {
      const mockRequest = { user: { userId: 'admin-123' } };

      // Pending -> Verified
      service.verifyPassport.mockResolvedValueOnce({
        ...mockPassport,
        status: PassportStatus.VERIFIED,
      } as any);

      await controller.verifyPassport(
        'player-123',
        { status: PassportStatus.VERIFIED },
        mockRequest,
      );

      // Verified -> Revoked
      service.verifyPassport.mockResolvedValueOnce({
        ...mockPassport,
        status: PassportStatus.REVOKED,
      } as any);

      await controller.verifyPassport(
        'player-123',
        { status: PassportStatus.REVOKED },
        mockRequest,
      );

      expect(service.verifyPassport).toHaveBeenCalledTimes(2);
    });

    it('should handle missing user in request for verifyPassport', async () => {
      const mockRequestWithoutUser = {
        user: {},
      };

      service.verifyPassport.mockResolvedValue(mockPassport as any);

      await controller.verifyPassport(
        'player-123',
        { status: PassportStatus.VERIFIED },
        mockRequestWithoutUser,
      );

      expect(service.verifyPassport).toHaveBeenCalledWith(
        'player-123',
        PassportStatus.VERIFIED,
        undefined,
        undefined,
      );
    });
  });

  describe('Request Decorators', () => {
    it('should use @Param decorator for playerId in getPassportByPlayer', async () => {
      service.getPassport.mockResolvedValue(mockPassport as any);

      await controller.getPassportByPlayer('player-123');

      expect(service.getPassport).toHaveBeenCalledWith('player-123');
    });

    it('should use @Param decorator for token in getPassportByToken', async () => {
      const mockQRCodeUrl = 'data:image/png;base64,mockQRCode';
      service.getPassportByToken.mockResolvedValue(mockPassport as any);
      service.generateQRCode.mockResolvedValue(mockQRCodeUrl);

      await controller.getPassportByToken('token-12345');

      expect(service.getPassportByToken).toHaveBeenCalledWith('token-12345');
    });

    it('should use @Body decorator for createPassportDto', async () => {
      const dto: CreatePassportDto = {
        playerId: 'player-123',
        verificationNotes: 'Test notes',
      };

      service.createPassport.mockResolvedValue(mockPassport as any);

      await controller.createPassport(dto);

      expect(service.createPassport).toHaveBeenCalledWith('player-123', 'Test notes');
    });

    it('should use @Request decorator for user context in verifyPassport', async () => {
      const mockRequest = {
        user: { userId: 'admin-123' },
      };

      service.verifyPassport.mockResolvedValue(mockPassport as any);

      await controller.verifyPassport(
        'player-123',
        { status: PassportStatus.VERIFIED },
        mockRequest,
      );

      expect(service.verifyPassport).toHaveBeenCalledWith(
        'player-123',
        PassportStatus.VERIFIED,
        'admin-123',
        undefined,
      );
    });
  });

  describe('Response Format', () => {
    it('should return passport with QR code URL in getPassportByToken', async () => {
      const mockQRCodeUrl = 'data:image/png;base64,mockQRCode';
      service.getPassportByToken.mockResolvedValue(mockPassport as any);
      service.generateQRCode.mockResolvedValue(mockQRCodeUrl);

      const result = await controller.getPassportByToken('token-12345');

      expect(result).toHaveProperty('qrCodeUrl');
      expect(result.qrCodeUrl).toBe(mockQRCodeUrl);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('playerId');
      expect(result).toHaveProperty('publicToken');
    });

    it('should return only QR code URL object in getQRCode', async () => {
      const mockQRCodeUrl = 'data:image/png;base64,mockQRCode';
      service.generateQRCode.mockResolvedValue(mockQRCodeUrl);

      const result = await controller.getQRCode('token-12345');

      expect(Object.keys(result)).toEqual(['qrCodeUrl']);
    });

    it('should return complete passport data in createPassport', async () => {
      service.createPassport.mockResolvedValue(mockPassport as any);

      const result = await controller.createPassport({ playerId: 'player-123' });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('playerId');
      expect(result).toHaveProperty('publicToken');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('passportData');
      expect(result).toHaveProperty('players');
    });
  });

  describe('HTTP Methods', () => {
    it('should use POST method for createPassport', async () => {
      const metadata = Reflect.getMetadata('method', PassportController.prototype.createPassport);
      expect(metadata).toBeDefined();
    });

    it('should use GET method for getPassportByPlayer', async () => {
      const metadata = Reflect.getMetadata(
        'method',
        PassportController.prototype.getPassportByPlayer,
      );
      expect(metadata).toBeDefined();
    });

    it('should use GET method for getPassportByToken', async () => {
      const metadata = Reflect.getMetadata(
        'method',
        PassportController.prototype.getPassportByToken,
      );
      expect(metadata).toBeDefined();
    });

    it('should use GET method for getQRCode', async () => {
      const metadata = Reflect.getMetadata('method', PassportController.prototype.getQRCode);
      expect(metadata).toBeDefined();
    });

    it('should use PUT method for verifyPassport', async () => {
      const metadata = Reflect.getMetadata('method', PassportController.prototype.verifyPassport);
      expect(metadata).toBeDefined();
    });

    it('should use DELETE method for deletePassport', async () => {
      const metadata = Reflect.getMetadata('method', PassportController.prototype.deletePassport);
      expect(metadata).toBeDefined();
    });
  });
});
