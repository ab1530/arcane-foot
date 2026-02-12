import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: HealthService;

  const mockHealthService = {
    getHealth: jest.fn(),
    getReadiness: jest.fn(),
    getLiveness: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get<HealthService>(HealthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('health', () => {
    it('should return health status when service is healthy', async () => {
      const mockHealthResponse = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: 123.45,
        responseTime: '5ms',
        environment: 'test',
        version: '1.0.0',
        checks: {
          database: 'up',
          memory: {
            rss: '100 MB',
            heapTotal: '50 MB',
            heapUsed: '30 MB',
            external: '5 MB',
          },
        },
      };

      mockHealthService.getHealth.mockResolvedValue(mockHealthResponse);

      const result = await controller.health();

      expect(result).toEqual(mockHealthResponse);
      expect(result.status).toBe('healthy');
      expect(result.checks.database).toBe('up');
      expect(healthService.getHealth).toHaveBeenCalledTimes(1);
    });

    it('should return unhealthy status when database is down', async () => {
      const mockHealthResponse = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: 123.45,
        responseTime: '10ms',
        environment: 'test',
        version: '1.0.0',
        checks: {
          database: 'down',
          memory: {
            rss: '100 MB',
            heapTotal: '50 MB',
            heapUsed: '30 MB',
            external: '5 MB',
          },
        },
      };

      mockHealthService.getHealth.mockResolvedValue(mockHealthResponse);

      const result = await controller.health();

      expect(result).toEqual(mockHealthResponse);
      expect(result.status).toBe('unhealthy');
      expect(result.checks.database).toBe('down');
      expect(healthService.getHealth).toHaveBeenCalledTimes(1);
    });

    it('should include memory usage in health response', async () => {
      const mockHealthResponse = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: 123.45,
        responseTime: '5ms',
        environment: 'test',
        version: '1.0.0',
        checks: {
          database: 'up',
          memory: {
            rss: '100 MB',
            heapTotal: '50 MB',
            heapUsed: '30 MB',
            external: '5 MB',
          },
        },
      };

      mockHealthService.getHealth.mockResolvedValue(mockHealthResponse);

      const result = await controller.health();

      expect(result.checks).toHaveProperty('memory');
      expect(result.checks.memory).toHaveProperty('rss');
      expect(result.checks.memory).toHaveProperty('heapTotal');
      expect(result.checks.memory).toHaveProperty('heapUsed');
      expect(result.checks.memory).toHaveProperty('external');
    });

    it('should include timestamp and uptime', async () => {
      const mockHealthResponse = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: 123.45,
        responseTime: '5ms',
        environment: 'test',
        version: '1.0.0',
        checks: {
          database: 'up',
          memory: {
            rss: '100 MB',
            heapTotal: '50 MB',
            heapUsed: '30 MB',
            external: '5 MB',
          },
        },
      };

      mockHealthService.getHealth.mockResolvedValue(mockHealthResponse);

      const result = await controller.health();

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('responseTime');
    });

    it('should propagate errors from health service', async () => {
      const error = new Error('Health check failed');
      mockHealthService.getHealth.mockRejectedValue(error);

      await expect(controller.health()).rejects.toThrow('Health check failed');
      expect(healthService.getHealth).toHaveBeenCalledTimes(1);
    });
  });

  describe('ready', () => {
    it('should return ready status when service is ready', async () => {
      const mockReadyResponse = {
        status: 'ready',
        ready: true,
        timestamp: new Date().toISOString(),
        checks: {
          database: 'up',
        },
      };

      mockHealthService.getReadiness.mockResolvedValue(mockReadyResponse);

      const result = await controller.ready();

      expect(result).toEqual(mockReadyResponse);
      expect(result.status).toBe('ready');
      expect(result.ready).toBe(true);
      expect(result.checks.database).toBe('up');
      expect(healthService.getReadiness).toHaveBeenCalledTimes(1);
    });

    it('should return not ready status when database is down', async () => {
      const mockReadyResponse = {
        status: 'not_ready',
        ready: false,
        timestamp: new Date().toISOString(),
        checks: {
          database: 'down',
        },
      };

      mockHealthService.getReadiness.mockResolvedValue(mockReadyResponse);

      const result = await controller.ready();

      expect(result).toEqual(mockReadyResponse);
      expect(result.status).toBe('not_ready');
      expect(result.ready).toBe(false);
      expect(result.checks.database).toBe('down');
      expect(healthService.getReadiness).toHaveBeenCalledTimes(1);
    });

    it('should include timestamp in readiness response', async () => {
      const mockReadyResponse = {
        status: 'ready',
        ready: true,
        timestamp: new Date().toISOString(),
        checks: {
          database: 'up',
        },
      };

      mockHealthService.getReadiness.mockResolvedValue(mockReadyResponse);

      const result = await controller.ready();

      expect(result).toHaveProperty('timestamp');
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should propagate errors from readiness service', async () => {
      const error = new Error('Readiness check failed');
      mockHealthService.getReadiness.mockRejectedValue(error);

      await expect(controller.ready()).rejects.toThrow('Readiness check failed');
      expect(healthService.getReadiness).toHaveBeenCalledTimes(1);
    });
  });

  describe('live', () => {
    it('should always return alive status', async () => {
      const mockLiveResponse = {
        status: 'alive',
        alive: true,
        timestamp: new Date().toISOString(),
        uptime: 123.45,
      };

      mockHealthService.getLiveness.mockResolvedValue(mockLiveResponse);

      const result = await controller.live();

      expect(result).toEqual(mockLiveResponse);
      expect(result.status).toBe('alive');
      expect(result.alive).toBe(true);
      expect(healthService.getLiveness).toHaveBeenCalledTimes(1);
    });

    it('should include timestamp and uptime', async () => {
      const mockLiveResponse = {
        status: 'alive',
        alive: true,
        timestamp: new Date().toISOString(),
        uptime: 123.45,
      };

      mockHealthService.getLiveness.mockResolvedValue(mockLiveResponse);

      const result = await controller.live();

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should not perform any database checks', async () => {
      const mockLiveResponse = {
        status: 'alive',
        alive: true,
        timestamp: new Date().toISOString(),
        uptime: 123.45,
      };

      mockHealthService.getLiveness.mockResolvedValue(mockLiveResponse);

      const result = await controller.live();

      expect(result).not.toHaveProperty('checks');
      expect(healthService.getLiveness).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from liveness service', async () => {
      const error = new Error('Liveness check failed');
      mockHealthService.getLiveness.mockRejectedValue(error);

      await expect(controller.live()).rejects.toThrow('Liveness check failed');
      expect(healthService.getLiveness).toHaveBeenCalledTimes(1);
    });
  });

  describe('getError', () => {
    it('should throw error for Sentry testing', () => {
      expect(() => controller.getError()).toThrow('My first Sentry error!');
    });

    it('should throw Error instance', () => {
      expect(() => controller.getError()).toThrow(Error);
    });

    it('should throw with specific error message', () => {
      try {
        controller.getError();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('My first Sentry error!');
      }
    });
  });

  describe('Integration scenarios', () => {
    it('should handle multiple health checks in sequence', async () => {
      const mockHealthResponse = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: 123.45,
        responseTime: '5ms',
        environment: 'test',
        version: '1.0.0',
        checks: {
          database: 'up',
          memory: {
            rss: '100 MB',
            heapTotal: '50 MB',
            heapUsed: '30 MB',
            external: '5 MB',
          },
        },
      };

      const mockReadyResponse = {
        status: 'ready',
        ready: true,
        timestamp: new Date().toISOString(),
        checks: {
          database: 'up',
        },
      };

      const mockLiveResponse = {
        status: 'alive',
        alive: true,
        timestamp: new Date().toISOString(),
        uptime: 123.45,
      };

      mockHealthService.getHealth.mockResolvedValue(mockHealthResponse);
      mockHealthService.getReadiness.mockResolvedValue(mockReadyResponse);
      mockHealthService.getLiveness.mockResolvedValue(mockLiveResponse);

      const health = await controller.health();
      const ready = await controller.ready();
      const live = await controller.live();

      expect(health.status).toBe('healthy');
      expect(ready.status).toBe('ready');
      expect(live.status).toBe('alive');

      expect(healthService.getHealth).toHaveBeenCalledTimes(1);
      expect(healthService.getReadiness).toHaveBeenCalledTimes(1);
      expect(healthService.getLiveness).toHaveBeenCalledTimes(1);
    });

    it('should handle degraded state where service is alive but not ready', async () => {
      const mockReadyResponse = {
        status: 'not_ready',
        ready: false,
        timestamp: new Date().toISOString(),
        checks: {
          database: 'down',
        },
      };

      const mockLiveResponse = {
        status: 'alive',
        alive: true,
        timestamp: new Date().toISOString(),
        uptime: 123.45,
      };

      mockHealthService.getReadiness.mockResolvedValue(mockReadyResponse);
      mockHealthService.getLiveness.mockResolvedValue(mockLiveResponse);

      const ready = await controller.ready();
      const live = await controller.live();

      expect(ready.ready).toBe(false);
      expect(live.alive).toBe(true);
    });
  });
});
