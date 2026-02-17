import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { ClubNeedsService } from './club-needs.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ClubNeedsService', () => {
  let service: ClubNeedsService;
  let prisma: DeepMockProxy<PrismaClient>;

  const makeRequestRow = (overrides?: Record<string, unknown>) => ({
    id: 'request-1',
    createdById: 'admin-1',
    rawText: 'Mallorca, striker, 18-35, right',
    parsed: [
      {
        lineNumber: 1,
        clubName: 'Mallorca',
        positions: ['Striker'],
        age: { min: 18, max: 35 },
        preferredFoot: 'Right',
        warnings: [],
        errors: [],
      },
    ],
    matchesSnapshot: [],
    lineStates: [
      {
        lineNumber: 1,
        clubName: 'Mallorca',
        isCompleted: false,
        completedAt: null,
        completedById: null,
        reopenedAt: null,
        reopenedById: null,
      },
    ],
    createdAt: new Date('2026-02-16T15:00:00.000Z'),
    updatedAt: new Date('2026-02-16T15:00:00.000Z'),
    ...(overrides ?? {}),
  });

  beforeEach(async () => {
    prisma = mockDeep<PrismaClient>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ClubNeedsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(ClubNeedsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates request with matchesSnapshot and lineStates', async () => {
    prisma.players.findMany.mockResolvedValueOnce([] as any);
    prisma.club_need_requests.create.mockResolvedValueOnce(makeRequestRow() as any);

    await service.createRequest('admin-1', 'Mallorca, striker, 18-35, right', 5);

    expect(prisma.club_need_requests.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          matchesSnapshot: expect.any(Array),
          lineStates: expect.arrayContaining([
            expect.objectContaining({
              lineNumber: 1,
              clubName: 'Mallorca',
              isCompleted: false,
            }),
          ]),
        }),
      }),
    );
  });

  it('filters list by month when provided', async () => {
    prisma.club_need_requests.findMany.mockResolvedValueOnce([makeRequestRow()] as any);
    prisma.club_need_requests.count.mockResolvedValueOnce(1);

    await service.listRequests({ page: 1, limit: 20, month: '2026-02' });

    expect(prisma.club_need_requests.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          createdAt: {
            gte: new Date('2026-02-01T00:00:00.000Z'),
            lt: new Date('2026-03-01T00:00:00.000Z'),
          },
        },
      }),
    );
  });

  it('returns snapshot matches in detail when available', async () => {
    const snapshot = [
      {
        lineNumber: 1,
        clubName: 'Mallorca',
        criteria: { positions: ['Striker'] },
        players: [],
        warnings: [],
        errors: [],
      },
    ];
    prisma.club_need_requests.findUnique.mockResolvedValueOnce(
      makeRequestRow({ matchesSnapshot: snapshot }) as any,
    );

    const computeSpy = jest.spyOn(service, 'computeMatches');
    const result = await service.getRequestWithMatches('request-1', 5);

    expect(computeSpy).not.toHaveBeenCalled();
    expect(result.matches).toEqual(snapshot);
  });

  it('completes one line status', async () => {
    prisma.club_need_requests.findUnique.mockResolvedValueOnce(makeRequestRow() as any);
    prisma.club_need_requests.update.mockResolvedValueOnce(
      makeRequestRow({
        lineStates: [
          {
            lineNumber: 1,
            clubName: 'Mallorca',
            isCompleted: true,
            completedAt: '2026-02-16T16:00:00.000Z',
            completedById: 'admin-2',
            reopenedAt: null,
            reopenedById: null,
          },
        ],
      }) as any,
    );

    const result = await service.updateLineStatus({
      id: 'request-1',
      lineNumber: 1,
      isCompleted: true,
      userId: 'admin-2',
    });

    expect(prisma.club_need_requests.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lineStates: expect.arrayContaining([
            expect.objectContaining({
              lineNumber: 1,
              isCompleted: true,
              completedById: 'admin-2',
            }),
          ]),
        }),
      }),
    );
    expect(result.lineStates[0].isCompleted).toBe(true);
  });

  it('reopens one completed line status', async () => {
    prisma.club_need_requests.findUnique.mockResolvedValueOnce(
      makeRequestRow({
        lineStates: [
          {
            lineNumber: 1,
            clubName: 'Mallorca',
            isCompleted: true,
            completedAt: '2026-02-16T16:00:00.000Z',
            completedById: 'admin-2',
            reopenedAt: null,
            reopenedById: null,
          },
        ],
      }) as any,
    );
    prisma.club_need_requests.update.mockResolvedValueOnce(
      makeRequestRow({
        lineStates: [
          {
            lineNumber: 1,
            clubName: 'Mallorca',
            isCompleted: false,
            completedAt: '2026-02-16T16:00:00.000Z',
            completedById: 'admin-2',
            reopenedAt: '2026-02-16T16:10:00.000Z',
            reopenedById: 'admin-3',
          },
        ],
      }) as any,
    );

    const result = await service.updateLineStatus({
      id: 'request-1',
      lineNumber: 1,
      isCompleted: false,
      userId: 'admin-3',
    });

    expect(prisma.club_need_requests.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lineStates: expect.arrayContaining([
            expect.objectContaining({
              lineNumber: 1,
              isCompleted: false,
              reopenedById: 'admin-3',
            }),
          ]),
        }),
      }),
    );
    expect(result.lineStates[0].isCompleted).toBe(false);
  });

  it('normalizes legacy request without lineStates', async () => {
    prisma.club_need_requests.findUnique.mockResolvedValueOnce(
      makeRequestRow({
        parsed: [
          { lineNumber: 1, clubName: 'Mallorca', positions: ['Striker'], warnings: [], errors: [] },
          { lineNumber: 2, clubName: 'Betis', positions: ['Winger'], warnings: [], errors: [] },
        ],
        lineStates: null,
      }) as any,
    );

    const request = await service.getRequest('request-1');

    expect(request.lineStates).toHaveLength(2);
    expect(request.lineStates.every((line) => line.isCompleted === false)).toBe(true);
  });
});
