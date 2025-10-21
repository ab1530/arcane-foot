import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthService', () => {
  let service: HealthService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return healthy status when database is up', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const result = await service.getHealth();

      expect(result.status).toBe('healthy');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('responseTime');
      expect(result).toHaveProperty('environment');
      expect(result).toHaveProperty('version');
      expect(result.checks).toEqual({
        database: 'up',
        memory: expect.any(Object),
      });
      expect(result.checks.memory).toHaveProperty('rss');
      expect(result.checks.memory).toHaveProperty('heapTotal');
      expect(result.checks.memory).toHaveProperty('heapUsed');
      expect(result.checks.memory).toHaveProperty('external');
    });

    it('should return unhealthy status when database is down', async () => {
      mockPrismaService.$queryRaw.mockRejectedValue(new Error('DB Error'));
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation();

      const result = await service.getHealth();

      expect(result.status).toBe('unhealthy');
      expect(result.checks.database).toBe('down');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Database health check failed:',
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });

    it('should include response time in result', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const result = await service.getHealth();

      expect(result.responseTime).toMatch(/\d+ms/);
    });

    it('should include process uptime', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const result = await service.getHealth();

      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getReadiness', () => {
    it('should return ready status when database is up', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const result = await service.getReadiness();

      expect(result.status).toBe('ready');
      expect(result.ready).toBe(true);
      expect(result).toHaveProperty('timestamp');
      expect(result.checks).toEqual({
        database: 'up',
      });
    });

    it('should return not ready status when database is down', async () => {
      mockPrismaService.$queryRaw.mockRejectedValue(new Error('DB Error'));
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation();

      const result = await service.getReadiness();

      expect(result.status).toBe('not_ready');
      expect(result.ready).toBe(false);
      expect(result).toHaveProperty('timestamp');
      expect(result.checks).toEqual({
        database: 'down',
      });

      consoleErrorSpy.mockRestore();
    });

    it('should include timestamp in ISO format', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const result = await service.getReadiness();

      expect(result.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });
  });

  describe('getLiveness', () => {
    it('should always return alive status', async () => {
      const result = await service.getLiveness();

      expect(result.status).toBe('alive');
      expect(result.alive).toBe(true);
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
    });

    it('should include process uptime', async () => {
      const result = await service.getLiveness();

      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should include timestamp in ISO format', async () => {
      const result = await service.getLiveness();

      expect(result.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it('should not check database for liveness', async () => {
      await service.getLiveness();

      expect(prismaService.$queryRaw).not.toHaveBeenCalled();
    });
  });

  describe('checkDatabase', () => {
    it('should return true when database query succeeds', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const result = await (service as any).checkDatabase();

      expect(result).toBe(true);
      expect(prismaService.$queryRaw).toHaveBeenCalled();
    });

    it('should return false when database query fails', async () => {
      mockPrismaService.$queryRaw.mockRejectedValue(new Error('DB Error'));
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation();

      const result = await (service as any).checkDatabase();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Database health check failed:',
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getMemoryUsage', () => {
    it('should return memory usage statistics', () => {
      const result = (service as any).getMemoryUsage();

      expect(result).toHaveProperty('rss');
      expect(result).toHaveProperty('heapTotal');
      expect(result).toHaveProperty('heapUsed');
      expect(result).toHaveProperty('external');

      expect(result.rss).toMatch(/\d+ MB/);
      expect(result.heapTotal).toMatch(/\d+ MB/);
      expect(result.heapUsed).toMatch(/\d+ MB/);
      expect(result.external).toMatch(/\d+ MB/);
    });

    it('should return memory values in MB', () => {
      const result = (service as any).getMemoryUsage();

      Object.values(result).forEach((value) => {
        expect(typeof value).toBe('string');
        expect(value).toContain('MB');
      });
    });
  });
});
