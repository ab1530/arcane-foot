import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PassportSharesService } from './passport-shares.service';
import { PrismaService } from '../prisma/prisma.service';
import { PassportService } from '../../passport/passport.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

const mockRandomUUID = jest.fn();

jest.mock('crypto', () => {
  const actual = jest.requireActual('crypto');
  return {
    ...actual,
    randomUUID: (...args: unknown[]) => mockRandomUUID(...args),
  };
});

describe('PassportSharesService', () => {
  let service: PassportSharesService;
  let prisma: DeepMockProxy<PrismaClient>;
  let passportService: { createPassport: jest.Mock };

  const mockPassport = (playerId: string, publicToken: string) =>
    ({
      playerId,
      publicToken,
      passportData: {
        firstName: 'John',
        lastName: 'Doe',
        position: 'Striker',
        nationality: 'FR',
        dateOfBirth: '2004-05-10',
        marketValue: 5200000,
        contractUntil: '2029-06-30',
        preferredFoot: 'Right',
        averageRating: 7.6,
        avatar: 'https://example.com/avatar.png',
        club: { name: 'FC Test' },
      },
      players: {
        id: playerId,
        position: 'Striker',
        nationality: 'FR',
        dateOfBirth: new Date('2004-05-10'),
        marketValue: 5200000,
        contractUntil: new Date('2029-06-30'),
        preferredFoot: 'Right',
        photoUrl: null,
        users: { firstName: 'John', lastName: 'Doe', avatar: null },
        clubs: { name: 'FC Test' },
      },
    }) as any;

  beforeEach(async () => {
    process.env.PUBLIC_WEB_URL = 'https://arcane.example';
    let seq = 1;
    mockRandomUUID.mockImplementation(() => {
      const suffix = String(seq++).padStart(12, '0');
      return `00000000-0000-4000-8000-${suffix}`;
    });
    prisma = mockDeep<PrismaClient>();
    passportService = { createPassport: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PassportSharesService,
        { provide: PrismaService, useValue: prisma },
        { provide: PassportService, useValue: passportService },
      ],
    }).compile();

    service = module.get(PassportSharesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.PUBLIC_WEB_URL;
  });

  it('rejects empty playerIds', async () => {
    await expect(
      service.createShareSet({ createdById: 'u1', playerIds: [] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a share set when passports already exist', async () => {
    prisma.player_passports.findUnique.mockResolvedValueOnce(mockPassport('p1', 'pt1'));
    prisma.passport_share_sets.create.mockResolvedValueOnce({
      id: 'set-id-1',
      token: '00000000-0000-4000-8000-000000000001',
      createdById: 'u1',
      title: null,
      clubName: null,
      items: [],
      revokedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const res = await service.createShareSet({
      createdById: 'u1',
      playerIds: ['p1'],
      title: 'Mallorca',
      clubName: 'Mallorca',
    });

    expect(passportService.createPassport).not.toHaveBeenCalled();
    expect(prisma.passport_share_sets.create).toHaveBeenCalled();
    expect(prisma.passport_share_sets.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              playerId: 'p1',
              marketValue: 5200000,
              preferredFoot: 'Right',
              averageRating: 7.6,
            }),
          ]),
        }),
      }),
    );
    expect(res.shareUrl).toBe(
      'https://arcane.example/shortlist/00000000-0000-4000-8000-000000000001',
    );
  });

  it('creates missing passports via PassportService', async () => {
    prisma.player_passports.findUnique.mockResolvedValueOnce(null);
    passportService.createPassport.mockResolvedValueOnce(mockPassport('p1', 'pt1'));
    prisma.passport_share_sets.create.mockResolvedValueOnce({
      id: 'set-id-1',
      token: '00000000-0000-4000-8000-000000000001',
      createdById: 'u1',
      items: [],
      revokedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    await service.createShareSet({ createdById: 'u1', playerIds: ['p1'] });
    expect(passportService.createPassport).toHaveBeenCalledWith('p1');
  });

  it('persists source metadata when provided', async () => {
    prisma.player_passports.findUnique.mockResolvedValueOnce(mockPassport('p1', 'pt1'));
    prisma.passport_share_sets.create.mockResolvedValueOnce({
      id: 'set-id-1',
      token: '00000000-0000-4000-8000-000000000001',
      createdById: 'u1',
      sourceFeature: 'CLUB_NEEDS',
      sourceRequestId: 'f9f3ef89-2d3f-4945-b047-ecf92df44f76',
      sourceRequestLineNumber: 3,
      items: [],
      revokedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    await service.createShareSet({
      createdById: 'u1',
      playerIds: ['p1'],
      sourceFeature: 'CLUB_NEEDS',
      sourceRequestId: 'f9f3ef89-2d3f-4945-b047-ecf92df44f76',
      sourceRequestLineNumber: 3,
    });

    expect(prisma.passport_share_sets.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sourceFeature: 'CLUB_NEEDS',
          sourceRequestId: 'f9f3ef89-2d3f-4945-b047-ecf92df44f76',
          sourceRequestLineNumber: 3,
        }),
      }),
    );
  });

  it('lists share sets with filtering and computed shareUrl', async () => {
    prisma.passport_share_sets.findMany.mockResolvedValueOnce([
      {
        id: 'set-id-1',
        token: 'token-one',
        createdById: 'u1',
        title: 'Mallorca',
        clubName: 'Mallorca',
        sourceFeature: 'CLUB_NEEDS',
        sourceRequestId: 'f9f3ef89-2d3f-4945-b047-ecf92df44f76',
        sourceRequestLineNumber: 1,
        items: [],
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
    ]);
    prisma.passport_share_sets.count.mockResolvedValueOnce(1);

    const result = await service.listShareSets({
      sourceRequestId: 'f9f3ef89-2d3f-4945-b047-ecf92df44f76',
      sourceRequestLineNumber: 1,
    });

    expect(prisma.passport_share_sets.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          sourceRequestId: 'f9f3ef89-2d3f-4945-b047-ecf92df44f76',
          sourceRequestLineNumber: 1,
          revokedAt: null,
        },
      }),
    );
    expect(result.data[0].shareUrl).toBe('https://arcane.example/shortlist/token-one');
    expect(result.meta.total).toBe(1);
  });

  it('returns 404 for revoked share sets', async () => {
    prisma.passport_share_sets.findUnique.mockResolvedValueOnce({
      token: 't1',
      title: null,
      clubName: null,
      items: [],
      revokedAt: new Date(),
      createdAt: new Date(),
    } as any);

    await expect(service.getShareSetByToken('t1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
