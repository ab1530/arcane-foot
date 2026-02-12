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
      const loggerErrorSpy = jest.spyOn(service['logger'], 'error').mockImplementation();

      const result = await service.getHealth();

      expect(result.status).toBe('unhealthy');
      expect(result.checks.database).toBe('down');
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Database health check failed:',
        expect.any(Error),
      );

      loggerErrorSpy.mockRestore();
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
      const loggerErrorSpy = jest.spyOn(service['logger'], 'error').mockImplementation();

      const result = await service.getReadiness();

      expect(result.status).toBe('not_ready');
      expect(result.ready).toBe(false);
      expect(result).toHaveProperty('timestamp');
      expect(result.checks).toEqual({
        database: 'down',
      });

      loggerErrorSpy.mockRestore();
    });

    it('should include timestamp in ISO format', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const result = await service.getReadiness();

      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
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

      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
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
      const loggerErrorSpy = jest.spyOn(service['logger'], 'error').mockImplementation();

      const result = await (service as any).checkDatabase();

      expect(result).toBe(false);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Database health check failed:',
        expect.any(Error),
      );

      loggerErrorSpy.mockRestore();
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

  describe('Environment variable handling', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should use NODE_ENV when provided', async () => {
      process.env.NODE_ENV = 'production';
      mockPrismaService.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const result = await service.getHealth();

      expect(result.environment).toBe('production');
    });

    it('should default to "development" when NODE_ENV is not set', async () => {
      delete process.env.NODE_ENV;
      mockPrismaService.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const result = await service.getHealth();

      expect(result.environment).toBe('development');
    });

    it('should use npm_package_version when provided', async () => {
      process.env.npm_package_version = '2.0.0';
      mockPrismaService.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const result = await service.getHealth();

      expect(result.version).toBe('2.0.0');
    });

    it('should default to "1.0.0" when npm_package_version is not set', async () => {
      delete process.env.npm_package_version;
      mockPrismaService.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const result = await service.getHealth();

      expect(result.version).toBe('1.0.0');
    });
  });

  describe('Error handling edge cases', () => {
    it('should handle database timeout errors', async () => {
      const timeoutError = new Error('Connection timeout');
      mockPrismaService.$queryRaw.mockRejectedValue(timeoutError);
      const loggerErrorSpy = jest.spyOn(service['logger'], 'error').mockImplementation();

      const result = await service.getHealth();

      expect(result.status).toBe('unhealthy');
      expect(loggerErrorSpy).toHaveBeenCalledWith('Database health check failed:', timeoutError);

      loggerErrorSpy.mockRestore();
    });

    it('should handle database connection refused errors', async () => {
      const connectionError = new Error('Connection refused');
      mockPrismaService.$queryRaw.mockRejectedValue(connectionError);
      const loggerErrorSpy = jest.spyOn(service['logger'], 'error').mockImplementation();

      const result = await service.getHealth();

      expect(result.status).toBe('unhealthy');
      expect(result.checks.database).toBe('down');
      expect(loggerErrorSpy).toHaveBeenCalledWith('Database health check failed:', connectionError);

      loggerErrorSpy.mockRestore();
    });

    it('should handle null database response', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue(null);

      const result = await service.getHealth();

      expect(result.status).toBe('healthy');
      expect(result.checks.database).toBe('up');
    });
  });

  describe('Response time measurement', () => {
    it('should measure response time accurately', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ result: 1 }]);
      const dateNowSpy = jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1012);

      const result = await service.getHealth();

      const responseTimeMatch = result.responseTime.match(/(\d+)ms/);
      expect(responseTimeMatch).toBeTruthy();
      const responseTimeMs = parseInt(responseTimeMatch[1], 10);
      expect(responseTimeMs).toBe(12);

      dateNowSpy.mockRestore();
    });

    it('should include response time even when database is down', async () => {
      mockPrismaService.$queryRaw.mockRejectedValue(new Error('DB Error'));
      const loggerErrorSpy = jest.spyOn(service['logger'], 'error').mockImplementation();

      const result = await service.getHealth();

      expect(result.responseTime).toMatch(/\d+ms/);
      expect(result.status).toBe('unhealthy');

      loggerErrorSpy.mockRestore();
    });
  });
});
