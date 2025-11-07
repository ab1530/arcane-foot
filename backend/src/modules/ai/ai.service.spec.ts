import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { PlayersService } from '../players/players.service';
import { of } from 'rxjs';

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    const configServiceMock = {
      get: (key: string) => {
        if (key === 'AI_SERVICE_URL') {
          return 'http://127.0.0.1:65534';
        }
        return undefined;
      },
    } as unknown as ConfigService;

    const prismaServiceMock = {
      players: {},
      clubs: {},
      matches: {},
    } as unknown as PrismaService;

    const playersServiceMock = {
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
    } as unknown as PlayersService;

    const httpServiceMock = {
      post: jest.fn(() => of({ data: {} })),
      get: jest.fn(() => of({ data: {} })),
    } as unknown as HttpService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: ConfigService, useValue: configServiceMock },
        { provide: PrismaService, useValue: prismaServiceMock },
        { provide: PlayersService, useValue: playersServiceMock },
        { provide: HttpService, useValue: httpServiceMock },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fall back when AI service unavailable', async () => {
    const result = await service.generateSummary({ prompt: 'Test' });
    expect(result.summary).toContain('Test');
    expect(result.source).toBe('ai-fallback');
  });

  it('should return player index fallback when AI service unavailable', async () => {
    const result = await service.getPlayerIndex('player-1');
    expect(result.playerId).toBe('player-1');
    expect(result.source).toBe('ai-fallback');
  });

  it('should return matchmaking fallback when AI service unavailable', async () => {
    const payload = { playerIds: ['p1'], clubIds: ['c1'] };
    const result = await service.matchmaking(payload);
    expect(result.matches).toEqual([]);
    expect(result.filters).toEqual(payload);
    expect(result.source).toBe('ai-fallback');
  });
});
