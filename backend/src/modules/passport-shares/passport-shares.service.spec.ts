import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PassportSharesService } from './passport-shares.service';
import { PrismaService } from '../prisma/prisma.service';
import { PassportService } from '../../passport/passport.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

jest.mock('crypto', () => ({
  randomUUID: jest
    .fn()
    // Service generates token first, then row id
    .mockReturnValueOnce('token-1')
    .mockReturnValueOnce('set-id-1'),
}));

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
        avatar: 'https://example.com/avatar.png',
        club: { name: 'FC Test' },
      },
      players: {
        id: playerId,
        position: 'Striker',
        nationality: 'FR',
        photoUrl: null,
        users: { firstName: 'John', lastName: 'Doe', avatar: null },
        clubs: { name: 'FC Test' },
      },
    }) as any;

  beforeEach(async () => {
    process.env.PUBLIC_WEB_URL = 'https://arcane.example';
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
    prisma.player_passports.findUnique.mockResolvedValueOnce(
      mockPassport('p1', 'pt1'),
    );
    prisma.passport_share_sets.create.mockResolvedValueOnce({
      id: 'set-id-1',
      token: 'token-1',
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
    expect(res.shareUrl).toBe('https://arcane.example/shortlist/token-1');
  });

  it('creates missing passports via PassportService', async () => {
    prisma.player_passports.findUnique.mockResolvedValueOnce(null);
    passportService.createPassport.mockResolvedValueOnce(mockPassport('p1', 'pt1'));
    prisma.passport_share_sets.create.mockResolvedValueOnce({
      id: 'set-id-1',
      token: 'token-1',
      createdById: 'u1',
      items: [],
      revokedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    await service.createShareSet({ createdById: 'u1', playerIds: ['p1'] });
    expect(passportService.createPassport).toHaveBeenCalledWith('p1');
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

    await expect(service.getShareSetByToken('t1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
