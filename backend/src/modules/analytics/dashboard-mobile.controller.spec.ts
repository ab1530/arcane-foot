import { Test, TestingModule } from '@nestjs/testing';
import { DashboardMobileController } from './dashboard-mobile.controller';
import { AnalyticsService } from './analytics.service';

describe('DashboardMobileController', () => {
  let controller: DashboardMobileController;

  const mockAnalyticsService = {
    getMobileHomeDashboard: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardMobileController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
      ],
    }).compile();

    controller = module.get<DashboardMobileController>(DashboardMobileController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call analytics service with user and scope', async () => {
    const payload = { scope: 'AGENT', cards: [] };
    mockAnalyticsService.getMobileHomeDashboard.mockResolvedValue(payload);

    const req = {
      user: { id: 'user-1', role: 'SUPER_ADMIN' },
    };

    const result = await controller.getMobileHome(req as any, 'AGENT');

    expect(result).toEqual(payload);
    expect(mockAnalyticsService.getMobileHomeDashboard).toHaveBeenCalledWith(
      'user-1',
      'SUPER_ADMIN',
      'AGENT',
    );
  });
});
