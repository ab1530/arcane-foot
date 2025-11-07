import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Admin bypass
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      return true;
    }

    // Get parameter name and resource type from decorator metadata
    const paramName = this.reflector.get<string>('ownershipParam', context.getHandler());
    const resourceType = this.reflector.get<string>('resourceType', context.getHandler());

    const resourceId = request.params[paramName] || request.body[paramName];

    if (!resourceId) {
      throw new ForbiddenException('Resource ID not found');
    }

    // Check ownership based on resource type
    if (resourceType === 'user') {
      // Direct user ID check
      if (user.id !== resourceId) {
        throw new ForbiddenException('You do not have permission to access this resource');
      }
    } else if (resourceType === 'player') {
      // Check if player belongs to user
      const player = await this.prisma.players.findUnique({
        where: { id: resourceId },
        select: { userId: true },
      });

      if (!player || player.userId !== user.id) {
        throw new ForbiddenException('You do not have permission to access this player');
      }
    } else if (resourceType === 'club') {
      // Check if user is club contact/owner
      const club = await this.prisma.clubs.findFirst({
        where: {
          id: resourceId,
          contactUserId: user.id,
        },
      });

      if (!club) {
        throw new ForbiddenException('You do not have permission to access this club');
      }
    }

    return true;
  }
}
