import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ScoutCertificationGuard } from './scout-certification.guard';
import { PrismaService } from '../../modules/prisma/prisma.service';

describe('ScoutCertificationGuard', () => {
  const mockPrisma = {
    user_stats: {
      findUnique: jest.fn(),
    },
  } as unknown as PrismaService;

  let guard: ScoutCertificationGuard;
  const originalFlag = process.env.VOICE_CERTIFIED_GUARD_ENABLED;

  const createContext = (user?: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.VOICE_CERTIFIED_GUARD_ENABLED = 'true';
    guard = new ScoutCertificationGuard(mockPrisma);
  });

  afterAll(() => {
    if (typeof originalFlag === 'undefined') {
      delete process.env.VOICE_CERTIFIED_GUARD_ENABLED;
      return;
    }
    process.env.VOICE_CERTIFIED_GUARD_ENABLED = originalFlag;
  });

  it('allows access when guard flag is disabled', async () => {
    process.env.VOICE_CERTIFIED_GUARD_ENABLED = 'false';

    const result = await guard.canActivate(createContext({ id: 'u-1', role: 'SCOUT' }));

    expect(result).toBe(true);
    expect(mockPrisma.user_stats.findUnique).not.toHaveBeenCalled();
  });

  it('rejects unauthenticated users', async () => {
    await expect(guard.canActivate(createContext(undefined))).rejects.toThrow(
      new ForbiddenException('User not authenticated'),
    );
  });

  it('rejects non-scout roles', async () => {
    await expect(guard.canActivate(createContext({ id: 'u-1', role: 'PLAYER' }))).rejects.toThrow(
      new ForbiddenException('Voice-to-report is reserved for certified scouts'),
    );
  });

  it('rejects scouts below certification threshold', async () => {
    mockPrisma.user_stats.findUnique = jest.fn().mockResolvedValue({ currentLevel: 4 });

    await expect(guard.canActivate(createContext({ id: 'u-1', role: 'SCOUT' }))).rejects.toThrow(
      new ForbiddenException('Voice-to-report requires scout certification (currentLevel >= 5)'),
    );
  });

  it('allows certified scouts (currentLevel >= 5)', async () => {
    mockPrisma.user_stats.findUnique = jest.fn().mockResolvedValue({ currentLevel: 5 });

    const result = await guard.canActivate(createContext({ id: 'u-1', role: 'SCOUT' }));

    expect(result).toBe(true);
    expect(mockPrisma.user_stats.findUnique).toHaveBeenCalledWith({
      where: { userId: 'u-1' },
      select: { currentLevel: true },
    });
  });

  it('supports fallback user identifiers from sub/userId', async () => {
    mockPrisma.user_stats.findUnique = jest.fn().mockResolvedValue({ currentLevel: 6 });

    const fromSub = await guard.canActivate(createContext({ sub: 'u-sub', role: 'SCOUT' }));
    const fromUserId = await guard.canActivate(
      createContext({ userId: 'u-userId', role: 'SCOUT' }),
    );

    expect(fromSub).toBe(true);
    expect(fromUserId).toBe(true);
    expect(mockPrisma.user_stats.findUnique).toHaveBeenNthCalledWith(1, {
      where: { userId: 'u-sub' },
      select: { currentLevel: true },
    });
    expect(mockPrisma.user_stats.findUnique).toHaveBeenNthCalledWith(2, {
      where: { userId: 'u-userId' },
      select: { currentLevel: true },
    });
  });
});
