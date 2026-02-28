import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class ScoutCertificationGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const flag = String(process.env.VOICE_CERTIFIED_GUARD_ENABLED ?? 'true').toLowerCase();
    if (flag === 'false' || flag === '0' || flag === 'off') {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request?.user;
    const userId = user?.id ?? user?.sub ?? user?.userId;
    const role = String(user?.role ?? '').toUpperCase();

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    if (role !== 'SCOUT') {
      throw new ForbiddenException('Voice-to-report is reserved for certified scouts');
    }

    const userStats = await this.prisma.user_stats.findUnique({
      where: { userId },
      select: { currentLevel: true },
    });

    const currentLevel = userStats?.currentLevel ?? 0;
    if (currentLevel < 5) {
      throw new ForbiddenException(
        'Voice-to-report requires scout certification (currentLevel >= 5)',
      );
    }

    return true;
  }
}
