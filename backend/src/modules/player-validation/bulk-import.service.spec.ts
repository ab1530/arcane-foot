import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, Logger } from '@nestjs/common';
import { BulkImportService } from './bulk-import.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient, PlayerType, VerificationStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('BulkImportService', () => {
  let service: BulkImportService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaClient>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BulkImportService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<BulkImportService>(BulkImportService);
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parseCsvFile', () => {
    it('should parse valid CSV with all required fields', () => {
      const csvContent = `firstName,lastName,email,position,dateOfBirth,nationality
John,Doe,john@example.com,Forward,1998-01-15,FR
Jane,Smith,jane@example.com,Midfielder,1999-05-20,US`;

      const result = service.parseCsvFile(csvContent);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        position: 'Forward',
        dateOfBirth: '1998-01-15',
        nationality: 'FR',
        phone: undefined,
        height: undefined,
        weight: undefined,
        preferredFoot: undefined,
        clubName: undefined,
      });
      expect(result[1]).toEqual({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        position: 'Midfielder',
        dateOfBirth: '1999-05-20',
        nationality: 'US',
        phone: undefined,
        height: undefined,
        weight: undefined,
        preferredFoot: undefined,
        clubName: undefined,
      });
    });

    it('should parse CSV with optional fields', () => {
      const csvContent = `firstName,lastName,email,position,dateOfBirth,nationality,phone,height,weight,preferredFoot,clubName
John,Doe,john@example.com,Forward,1998-01-15,FR,+33612345678,178,73,Right,Paris FC`;

      const result = service.parseCsvFile(csvContent);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        position: 'Forward',
        dateOfBirth: '1998-01-15',
        nationality: 'FR',
        phone: '+33612345678',
        height: 178,
        weight: 73,
        preferredFoot: 'Right',
        clubName: 'Paris FC',
      });
    });

    it('should handle CSV headers in different case', () => {
      const csvContent = `FirstName,LastName,Email,Position,DateOfBirth,Nationality
John,Doe,john@example.com,Forward,1998-01-15,FR`;

      const result = service.parseCsvFile(csvContent);

      expect(result).toHaveLength(1);
      expect(result[0].firstName).toBe('John');
    });

    it('should throw BadRequestException if CSV has less than 2 lines', () => {
      const csvContent = 'firstName,lastName,email,position,dateOfBirth,nationality';

      expect(() => service.parseCsvFile(csvContent)).toThrow(
        new BadRequestException('CSV file must contain at least a header and one data row'),
      );
    });

    it('should throw BadRequestException if CSV is empty', () => {
      const csvContent = '';

      expect(() => service.parseCsvFile(csvContent)).toThrow(
        new BadRequestException('CSV file must contain at least a header and one data row'),
      );
    });

    it('should throw BadRequestException if required columns are missing', () => {
      const csvContent = `firstName,lastName,email
John,Doe,john@example.com`;

      expect(() => service.parseCsvFile(csvContent)).toThrow(
        new BadRequestException(
          'CSV file is missing required columns: position, dateofbirth, nationality',
        ),
      );
    });

    it('should skip empty lines in CSV', () => {
      const csvContent = `firstName,lastName,email,position,dateOfBirth,nationality
John,Doe,john@example.com,Forward,1998-01-15,FR

Jane,Smith,jane@example.com,Midfielder,1999-05-20,US`;

      const result = service.parseCsvFile(csvContent);

      expect(result).toHaveLength(2);
    });

    it('should handle CSV with quoted values', () => {
      const csvContent = `firstName,lastName,email,position,dateOfBirth,nationality
"John","Doe","john@example.com","Forward","1998-01-15","FR"`;

      const result = service.parseCsvFile(csvContent);

      expect(result).toHaveLength(1);
      expect(result[0].firstName).toBe('John');
    });

    it('should handle CSV with values containing commas', () => {
      const csvContent = `firstName,lastName,email,position,dateOfBirth,nationality,clubName
John,Doe,john@example.com,Forward,1998-01-15,FR,"Paris FC, France"`;

      const result = service.parseCsvFile(csvContent);

      expect(result).toHaveLength(1);
      expect(result[0].clubName).toBe('Paris FC, France');
    });

    it('should skip rows with incorrect number of columns and log warning', () => {
      const csvContent = `firstName,lastName,email,position,dateOfBirth,nationality
John,Doe,john@example.com
Jane,Smith,jane@example.com,Midfielder,1999-05-20,US`;

      const result = service.parseCsvFile(csvContent);

      expect(result).toHaveLength(1);
      expect(result[0].firstName).toBe('Jane');
      expect(Logger.prototype.warn).toHaveBeenCalled();
    });

    it('should parse numeric fields correctly', () => {
      const csvContent = `firstName,lastName,email,position,dateOfBirth,nationality,height,weight
John,Doe,john@example.com,Forward,1998-01-15,FR,178.5,73.2`;

      const result = service.parseCsvFile(csvContent);

      expect(result[0].height).toBe(178.5);
      expect(result[0].weight).toBe(73.2);
    });

    it('should handle empty optional fields', () => {
      const csvContent = `firstName,lastName,email,position,dateOfBirth,nationality,phone,height,weight
John,Doe,john@example.com,Forward,1998-01-15,FR,,,`;

      const result = service.parseCsvFile(csvContent);

      expect(result[0].phone).toBeUndefined();
      expect(result[0].height).toBeUndefined();
      expect(result[0].weight).toBeUndefined();
    });
  });

  describe('validateBulkData', () => {
    it('should pass validation for valid player data', async () => {
      const players = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          position: 'Forward',
          dateOfBirth: '1998-01-15',
          nationality: 'FR',
        },
      ];

      prisma.users.findUnique.mockResolvedValue(null);

      const errors = await service.validateBulkData(players as any);

      expect(errors).toHaveLength(0);
    });

    it('should return error if firstName is missing', async () => {
      const players = [
        {
          firstName: '',
          lastName: 'Doe',
          email: 'john@example.com',
          position: 'Forward',
          dateOfBirth: '1998-01-15',
          nationality: 'FR',
        },
      ];

      const errors = await service.validateBulkData(players as any);

      expect(errors).toContainEqual({
        row: 1,
        field: 'firstName',
        message: 'First name is required',
      });
    });

    it('should return error if lastName is missing', async () => {
      const players = [
        {
          firstName: 'John',
          lastName: '',
          email: 'john@example.com',
          position: 'Forward',
          dateOfBirth: '1998-01-15',
          nationality: 'FR',
        },
      ];

      const errors = await service.validateBulkData(players as any);

      expect(errors).toContainEqual({
        row: 1,
        field: 'lastName',
        message: 'Last name is required',
      });
    });

    it('should return error if email is missing', async () => {
      const players = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: '',
          position: 'Forward',
          dateOfBirth: '1998-01-15',
          nationality: 'FR',
        },
      ];

      const errors = await service.validateBulkData(players as any);

      expect(errors).toContainEqual({
        row: 1,
        field: 'email',
        message: 'Email is required',
      });
    });

    it('should return error for invalid email format', async () => {
      const players = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'invalid-email',
          position: 'Forward',
          dateOfBirth: '1998-01-15',
          nationality: 'FR',
        },
      ];

      const errors = await service.validateBulkData(players as any);

      expect(errors).toContainEqual({
        row: 1,
        field: 'email',
        message: 'Invalid email format',
      });
    });

    it('should return error if email already exists in database', async () => {
      const players = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'existing@example.com',
          position: 'Forward',
          dateOfBirth: '1998-01-15',
          nationality: 'FR',
        },
      ];

      prisma.users.findUnique.mockResolvedValue({ id: 'user-123' } as any);

      const errors = await service.validateBulkData(players as any);

      expect(errors).toContainEqual({
        row: 1,
        field: 'email',
        message: 'Email already exists in database',
      });
    });

    it('should detect duplicate emails within the batch', async () => {
      const players = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'duplicate@example.com',
          position: 'Forward',
          dateOfBirth: '1998-01-15',
          nationality: 'FR',
        },
        {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'duplicate@example.com',
          position: 'Midfielder',
          dateOfBirth: '1999-05-20',
          nationality: 'US',
        },
      ];

      prisma.users.findUnique.mockResolvedValue(null);

      const errors = await service.validateBulkData(players as any);

      expect(errors).toContainEqual({
        row: 2,
        field: 'email',
        message: 'Duplicate email in CSV',
      });
    });

    it('should return error if position is missing', async () => {
      const players = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          position: '',
          dateOfBirth: '1998-01-15',
          nationality: 'FR',
        },
      ];

      const errors = await service.validateBulkData(players as any);

      expect(errors).toContainEqual({
        row: 1,
        field: 'position',
        message: 'Position is required',
      });
    });

    it('should return error if dateOfBirth is missing', async () => {
      const players = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          position: 'Forward',
          dateOfBirth: '',
          nationality: 'FR',
        },
      ];

      const errors = await service.validateBulkData(players as any);

      expect(errors).toContainEqual({
        row: 1,
        field: 'dateOfBirth',
        message: 'Date of birth is required',
      });
    });

    it('should return error for invalid date format', async () => {
      const players = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          position: 'Forward',
          dateOfBirth: 'invalid-date',
          nationality: 'FR',
        },
      ];

      const errors = await service.validateBulkData(players as any);

      expect(errors).toContainEqual({
        row: 1,
        field: 'dateOfBirth',
        message: 'Invalid date format',
      });
    });

    it('should return error if nationality is missing', async () => {
      const players = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          position: 'Forward',
          dateOfBirth: '1998-01-15',
          nationality: '',
        },
      ];

      const errors = await service.validateBulkData(players as any);

      expect(errors).toContainEqual({
        row: 1,
        field: 'nationality',
        message: 'Nationality is required',
      });
    });

    it('should return error if height is out of range', async () => {
      const players = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          position: 'Forward',
          dateOfBirth: '1998-01-15',
          nationality: 'FR',
          height: 140,
        },
      ];

      const errors = await service.validateBulkData(players as any);

      expect(errors).toContainEqual({
        row: 1,
        field: 'height',
        message: 'Height must be between 150 and 220 cm',
      });
    });

    it('should return error if height is too high', async () => {
      const players = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          position: 'Forward',
          dateOfBirth: '1998-01-15',
          nationality: 'FR',
          height: 230,
        },
      ];

      const errors = await service.validateBulkData(players as any);

      expect(errors).toContainEqual({
        row: 1,
        field: 'height',
        message: 'Height must be between 150 and 220 cm',
      });
    });

    it('should return error if weight is out of range', async () => {
      const players = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          position: 'Forward',
          dateOfBirth: '1998-01-15',
          nationality: 'FR',
          weight: 40,
        },
      ];

      const errors = await service.validateBulkData(players as any);

      expect(errors).toContainEqual({
        row: 1,
        field: 'weight',
        message: 'Weight must be between 50 and 120 kg',
      });
    });

    it('should return error if weight is too high', async () => {
      const players = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          position: 'Forward',
          dateOfBirth: '1998-01-15',
          nationality: 'FR',
          weight: 130,
        },
      ];

      const errors = await service.validateBulkData(players as any);

      expect(errors).toContainEqual({
        row: 1,
        field: 'weight',
        message: 'Weight must be between 50 and 120 kg',
      });
    });

    it('should accept valid height and weight values', async () => {
      const players = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          position: 'Forward',
          dateOfBirth: '1998-01-15',
          nationality: 'FR',
          height: 178,
          weight: 73,
        },
      ];

      prisma.users.findUnique.mockResolvedValue(null);

      const errors = await service.validateBulkData(players as any);

      expect(errors).toHaveLength(0);
    });

    it('should accumulate multiple errors for same player', async () => {
      const players = [
        {
          firstName: '',
          lastName: '',
          email: 'invalid-email',
          position: '',
          dateOfBirth: '',
          nationality: '',
        },
      ];

      const errors = await service.validateBulkData(players as any);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.filter(e => e.row === 1)).toHaveLength(6);
    });
  });

  describe('importPlayers', () => {
    const validDto = {
      players: [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          position: 'Forward',
          dateOfBirth: '1998-01-15',
          nationality: 'FR',
        },
      ],
      autoVerify: false,
    };

    const importedById = 'admin-123';

    it('should import players successfully', async () => {
      prisma.users.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const mockPlayer = {
        id: 'player-1',
        users: {
          id: 'user-1',
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          users: {
            create: jest.fn().mockResolvedValue({ id: 'user-1' }),
          },
          clubs: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
          players: {
            create: jest.fn().mockResolvedValue(mockPlayer),
          },
          audit_logs: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });

      const result = await service.importPlayers(validDto, importedById);

      expect(result.success).toBe(true);
      expect(result.imported).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(result.players).toHaveLength(1);
    });

    it('should fail import if validation errors exist', async () => {
      const invalidDto = {
        players: [
          {
            firstName: '',
            lastName: 'Doe',
            email: 'invalid-email',
            position: 'Forward',
            dateOfBirth: '1998-01-15',
            nationality: 'FR',
          },
        ],
        autoVerify: false,
      };

      const result = await service.importPlayers(invalidDto, importedById);

      expect(result.success).toBe(false);
      expect(result.imported).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should import with PENDING status when autoVerify is false', async () => {
      prisma.users.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const mockTx = {
        users: {
          create: jest.fn().mockResolvedValue({ id: 'user-1' }),
        },
        clubs: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
        players: {
          create: jest.fn().mockResolvedValue({
            id: 'player-1',
            users: { id: 'user-1', email: 'john@example.com' },
          }),
        },
        audit_logs: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      await service.importPlayers(validDto, importedById);

      expect(mockTx.players.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            verificationStatus: VerificationStatus.PENDING,
            verifiedAt: null,
            verifiedById: null,
          }),
        }),
      );
    });

    it('should import with VERIFIED status when autoVerify is true', async () => {
      const dtoWithAutoVerify = { ...validDto, autoVerify: true };
      prisma.users.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const mockTx = {
        users: {
          create: jest.fn().mockResolvedValue({ id: 'user-1' }),
        },
        clubs: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
        players: {
          create: jest.fn().mockResolvedValue({
            id: 'player-1',
            users: { id: 'user-1', email: 'john@example.com' },
          }),
        },
        audit_logs: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      await service.importPlayers(dtoWithAutoVerify, importedById);

      expect(mockTx.players.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            verificationStatus: VerificationStatus.VERIFIED,
            verifiedAt: expect.any(Date),
            verifiedById: importedById,
          }),
        }),
      );
    });

    it('should create user with PUBLIC role', async () => {
      prisma.users.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const mockTx = {
        users: {
          create: jest.fn().mockResolvedValue({ id: 'user-1' }),
        },
        clubs: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
        players: {
          create: jest.fn().mockResolvedValue({
            id: 'player-1',
            users: { id: 'user-1', email: 'john@example.com' },
          }),
        },
        audit_logs: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      await service.importPlayers(validDto, importedById);

      expect(mockTx.users.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: UserRole.PUBLIC,
        }),
      });
    });

    it('should hash password for created user', async () => {
      prisma.users.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password-123');

      const mockTx = {
        users: {
          create: jest.fn().mockResolvedValue({ id: 'user-1' }),
        },
        clubs: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
        players: {
          create: jest.fn().mockResolvedValue({
            id: 'player-1',
            users: { id: 'user-1', email: 'john@example.com' },
          }),
        },
        audit_logs: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      await service.importPlayers(validDto, importedById);

      expect(bcrypt.hash).toHaveBeenCalledWith(expect.any(String), 10);
      expect(mockTx.users.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          passwordHash: 'hashed-password-123',
        }),
      });
    });

    it('should find and associate club if clubName is provided', async () => {
      const dtoWithClub = {
        players: [
          {
            ...validDto.players[0],
            clubName: 'Paris FC',
          },
        ],
        autoVerify: false,
      };

      prisma.users.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const mockClub = { id: 'club-123', name: 'Paris FC' };

      const mockTx = {
        users: {
          create: jest.fn().mockResolvedValue({ id: 'user-1' }),
        },
        clubs: {
          findFirst: jest.fn().mockResolvedValue(mockClub),
        },
        players: {
          create: jest.fn().mockResolvedValue({
            id: 'player-1',
            users: { id: 'user-1', email: 'john@example.com' },
            clubs: mockClub,
          }),
        },
        audit_logs: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      await service.importPlayers(dtoWithClub, importedById);

      expect(mockTx.clubs.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { equals: 'Paris FC', mode: 'insensitive' } },
            { shortName: { equals: 'Paris FC', mode: 'insensitive' } },
          ],
        },
      });
      expect(mockTx.players.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            clubs: { connect: { id: 'club-123' } },
          }),
        }),
      );
    });

    it('should create audit log for imported player', async () => {
      prisma.users.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const mockTx = {
        users: {
          create: jest.fn().mockResolvedValue({ id: 'user-1' }),
        },
        clubs: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
        players: {
          create: jest.fn().mockResolvedValue({
            id: 'player-1',
            users: { id: 'user-1', email: 'john@example.com' },
          }),
        },
        audit_logs: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      await service.importPlayers(validDto, importedById);

      expect(mockTx.audit_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: importedById,
          action: 'PLAYER_BULK_IMPORTED',
          entityType: 'Player',
          entityId: 'player-1',
          changes: expect.objectContaining({
            source: 'bulk_import',
            autoVerified: false,
            email: 'john@example.com',
            firstName: 'John',
            lastName: 'Doe',
          }),
        }),
      });
    });

    it('should handle partial import with some failures', async () => {
      const multiPlayerDto = {
        players: [
          {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            position: 'Forward',
            dateOfBirth: '1998-01-15',
            nationality: 'FR',
          },
          {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            position: 'Midfielder',
            dateOfBirth: '1999-05-20',
            nationality: 'US',
          },
        ],
        autoVerify: false,
      };

      prisma.users.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      let callCount = 0;
      prisma.$transaction.mockImplementation(async (callback: any) => {
        callCount++;
        if (callCount === 1) {
          // First player succeeds
          const tx = {
            users: { create: jest.fn().mockResolvedValue({ id: 'user-1' }) },
            clubs: { findFirst: jest.fn().mockResolvedValue(null) },
            players: {
              create: jest.fn().mockResolvedValue({
                id: 'player-1',
                users: { id: 'user-1', email: 'john@example.com' },
              }),
            },
            audit_logs: { create: jest.fn().mockResolvedValue({}) },
          };
          return callback(tx);
        } else {
          // Second player fails
          throw new Error('Database constraint violation');
        }
      });

      const result = await service.importPlayers(multiPlayerDto, importedById);

      expect(result.success).toBe(true);
      expect(result.imported).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        row: 2,
        field: 'general',
        message: 'Database constraint violation',
      });
    });

    it('should log success for each imported player', async () => {
      prisma.users.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      prisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          users: { create: jest.fn().mockResolvedValue({ id: 'user-1' }) },
          clubs: { findFirst: jest.fn().mockResolvedValue(null) },
          players: {
            create: jest.fn().mockResolvedValue({
              id: 'player-1',
              users: { id: 'user-1', email: 'john@example.com' },
            }),
          },
          audit_logs: { create: jest.fn().mockResolvedValue({}) },
        };
        return callback(tx);
      });

      await service.importPlayers(validDto, importedById);

      expect(Logger.prototype.log).toHaveBeenCalledWith(
        'Successfully imported player john@example.com (row 1)',
      );
    });

    it('should create players with PUBLIC type', async () => {
      prisma.users.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const mockTx = {
        users: {
          create: jest.fn().mockResolvedValue({ id: 'user-1' }),
        },
        clubs: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
        players: {
          create: jest.fn().mockResolvedValue({
            id: 'player-1',
            users: { id: 'user-1', email: 'john@example.com' },
          }),
        },
        audit_logs: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      await service.importPlayers(validDto, importedById);

      expect(mockTx.players.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            playerType: PlayerType.PUBLIC,
          }),
        }),
      );
    });
  });

  describe('exportPlayersToCSV', () => {
    const mockPlayers = [
      {
        id: 'player-1',
        playerType: PlayerType.PUBLIC,
        verificationStatus: VerificationStatus.VERIFIED,
        position: 'Forward',
        dateOfBirth: new Date('1998-01-15'),
        nationality: 'FR',
        height: 178,
        weight: 73,
        preferredFoot: 'Right',
        createdAt: new Date('2025-01-10T10:00:00Z'),
        users: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+33612345678',
        },
        clubs: {
          name: 'Paris FC',
        },
      },
      {
        id: 'player-2',
        playerType: PlayerType.PUBLIC,
        verificationStatus: VerificationStatus.PENDING,
        position: 'Midfielder',
        dateOfBirth: new Date('1999-05-20'),
        nationality: 'US',
        height: null,
        weight: null,
        preferredFoot: null,
        createdAt: new Date('2025-01-11T10:00:00Z'),
        users: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: null,
        },
        clubs: null,
      },
    ];

    it('should export all PUBLIC players to CSV', async () => {
      prisma.players.findMany.mockResolvedValue(mockPlayers as any);

      const result = await service.exportPlayersToCSV();

      expect(prisma.players.findMany).toHaveBeenCalledWith({
        where: {
          playerType: PlayerType.PUBLIC,
        },
        include: {
          users: true,
          clubs: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toContain('firstName,lastName,email,phone,position');
      expect(result).toContain('"John","Doe","john@example.com"');
      expect(result).toContain('"Jane","Smith","jane@example.com"');
    });

    it('should export players filtered by VERIFIED status', async () => {
      prisma.players.findMany.mockResolvedValue([mockPlayers[0]] as any);

      const result = await service.exportPlayersToCSV(VerificationStatus.VERIFIED);

      expect(prisma.players.findMany).toHaveBeenCalledWith({
        where: {
          playerType: PlayerType.PUBLIC,
          verificationStatus: VerificationStatus.VERIFIED,
        },
        include: expect.any(Object),
        orderBy: expect.any(Object),
      });
      expect(result).toContain('"John","Doe"');
      expect(result).not.toContain('"Jane","Smith"');
    });

    it('should include CSV header row', async () => {
      prisma.players.findMany.mockResolvedValue([]);

      const result = await service.exportPlayersToCSV();

      const lines = result.split('\n');
      expect(lines[0]).toBe(
        'firstName,lastName,email,phone,position,dateOfBirth,nationality,height,weight,preferredFoot,clubName,verificationStatus,createdAt',
      );
    });

    it('should format date fields correctly', async () => {
      prisma.players.findMany.mockResolvedValue([mockPlayers[0]] as any);

      const result = await service.exportPlayersToCSV();

      expect(result).toContain('"1998-01-15"');
    });

    it('should handle null values as empty strings', async () => {
      prisma.players.findMany.mockResolvedValue([mockPlayers[1]] as any);

      const result = await service.exportPlayersToCSV();

      const lines = result.split('\n');
      const dataLine = lines[1];
      expect(dataLine).toContain('""'); // Empty phone
      expect(dataLine).toContain('""'); // Empty height
      expect(dataLine).toContain('""'); // Empty weight
      expect(dataLine).toContain('""'); // Empty preferredFoot
      expect(dataLine).toContain('""'); // Empty clubName
    });

    it('should quote all values to handle commas', async () => {
      prisma.players.findMany.mockResolvedValue(mockPlayers as any);

      const result = await service.exportPlayersToCSV();

      const lines = result.split('\n');
      lines.slice(1).forEach(line => {
        if (line) {
          expect(line).toMatch(/^".+"/); // Line starts and ends with quotes
        }
      });
    });

    it('should return empty CSV with only header if no players found', async () => {
      prisma.players.findMany.mockResolvedValue([]);

      const result = await service.exportPlayersToCSV();

      const lines = result.split('\n');
      expect(lines.length).toBe(1);
      expect(lines[0]).toContain('firstName,lastName,email');
    });

    it('should order players by createdAt descending', async () => {
      prisma.players.findMany.mockResolvedValue(mockPlayers as any);

      await service.exportPlayersToCSV();

      expect(prisma.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            createdAt: 'desc',
          },
        }),
      );
    });

    it('should include verification status in export', async () => {
      prisma.players.findMany.mockResolvedValue(mockPlayers as any);

      const result = await service.exportPlayersToCSV();

      expect(result).toContain('"VERIFIED"');
      expect(result).toContain('"PENDING"');
    });
  });
});
