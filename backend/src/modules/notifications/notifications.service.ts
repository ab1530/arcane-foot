import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FirebaseService } from '../firebase/firebase.service';
import { PrismaService } from '../prisma/prisma.service';
import { SendNotificationDto } from './dto/send-notification.dto';

@Injectable()
export class NotificationsService {
  // In-memory store for FCM tokens (in production, use Redis or database)
  private deviceTokens: Map<string, string[]> = new Map();

  constructor(
    private firebaseService: FirebaseService,
    private prisma: PrismaService,
  ) {}

  /**
   * Register a device FCM token for a user
   */
  async registerDevice(userId: string, fcmToken: string) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const tokens = this.deviceTokens.get(userId) || [];
    if (!tokens.includes(fcmToken)) {
      tokens.push(fcmToken);
      this.deviceTokens.set(userId, tokens);
    }

    return { success: true, message: 'Device registered successfully' };
  }

  /**
   * Unregister a device FCM token
   */
  async unregisterDevice(userId: string, fcmToken: string) {
    const tokens = this.deviceTokens.get(userId) || [];
    const updatedTokens = tokens.filter((token) => token !== fcmToken);
    this.deviceTokens.set(userId, updatedTokens);

    return { success: true, message: 'Device unregistered successfully' };
  }

  /**
   * Send notification to a user
   */
  async sendToUser(sendNotificationDto: SendNotificationDto) {
    const { userId, title, body, type, data } = sendNotificationDto;

    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Get user's device tokens
    const tokens = this.deviceTokens.get(userId) || [];

    if (tokens.length === 0) {
      // No devices to send to, just create notification record
      const createData: Prisma.notificationsUncheckedCreateInput = {
        id: crypto.randomUUID(),
        userId,
        title,
        body,
        type,
        ...(data && { dataJson: data as Prisma.InputJsonValue }),
      };
      const notification = await this.prisma.notifications.create({
        data: createData,
      });

      return { notification, sent: false, message: 'No registered devices' };
    }

    // Send via Firebase
    const fcmData = data || {};
    const response = await this.firebaseService.sendMulticast(tokens, title, body, fcmData);

    // Create notification record
    const createData: Prisma.notificationsUncheckedCreateInput = {
      id: crypto.randomUUID(),
      userId,
      title,
      body,
      type,
      ...(data && { dataJson: data as Prisma.InputJsonValue }),
    };
    const notification = await this.prisma.notifications.create({
      data: createData,
    });

    return {
      notification,
      sent: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  }

  /**
   * Send notification to multiple users
   */
  async sendToMultipleUsers(
    userIds: string[],
    title: string,
    body: string,
    type: string,
    data?: Record<string, string>,
  ) {
    const results = await Promise.all(
      userIds.map((userId) => this.sendToUser({ userId, title, body, type, data })),
    );

    return {
      totalUsers: userIds.length,
      results,
    };
  }

  /**
   * Send notification to a topic
   */
  async sendToTopic(topic: string, title: string, body: string, data?: Record<string, string>) {
    const fcmData = data || {};
    const messageId = await this.firebaseService.sendToTopic(topic, title, body, fcmData);

    return {
      success: true,
      messageId,
      topic,
    };
  }

  /**
   * Subscribe users to a topic
   */
  async subscribeToTopic(userIds: string[], topic: string) {
    // Collect all tokens from all users
    const allTokens: string[] = [];
    for (const userId of userIds) {
      const tokens = this.deviceTokens.get(userId) || [];
      allTokens.push(...tokens);
    }

    if (allTokens.length === 0) {
      return {
        success: false,
        message: 'No registered devices found',
      };
    }

    const response = await this.firebaseService.subscribeToTopic(allTokens, topic);

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      topic,
    };
  }

  /**
   * Unsubscribe users from a topic
   */
  async unsubscribeFromTopic(userIds: string[], topic: string) {
    const allTokens: string[] = [];
    for (const userId of userIds) {
      const tokens = this.deviceTokens.get(userId) || [];
      allTokens.push(...tokens);
    }

    if (allTokens.length === 0) {
      return {
        success: false,
        message: 'No registered devices found',
      };
    }

    const response = await this.firebaseService.unsubscribeFromTopic(allTokens, topic);

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      topic,
    };
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, unreadOnly: boolean = false) {
    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    return this.prisma.notifications.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notifications.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    if (notification.userId !== userId) {
      throw new NotFoundException(`Notification not found for this user`);
    }

    return this.prisma.notifications.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    return this.prisma.notifications.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Send match reminder notifications
   */
  async sendMatchReminder(matchId: string) {
    const match = await this.prisma.matches.findUnique({
      where: { id: matchId },
      include: {
        clubs_matches_homeClubIdToclubs: true,
        clubs_matches_awayClubIdToclubs: true,
        users_matches_scoutIdTousers: true,
      },
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${matchId} not found`);
    }

    const notificationTitle = 'Match Reminder';
    const notificationBody = `${match.clubs_matches_homeClubIdToclubs.name} vs ${match.clubs_matches_awayClubIdToclubs.name} starts soon!`;
    const notificationData = {
      matchId: match.id,
      type: 'match_reminder',
    };

    // Send to scout if assigned
    if (match.scoutId) {
      await this.sendToUser({
        userId: match.scoutId,
        title: notificationTitle,
        body: notificationBody,
        type: 'match_reminder',
        data: notificationData,
      });
    }

    return { success: true, message: 'Match reminder sent' };
  }

  /**
   * Send new scouting report notification
   */
  async sendReportNotification(reportId: string) {
    const report = await this.prisma.scouting_reports.findUnique({
      where: { id: reportId },
      include: {
        players: {
          include: {
            users: true,
          },
        },
        users: true,
        matches: {
          include: {
            clubs_matches_homeClubIdToclubs: true,
            clubs_matches_awayClubIdToclubs: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    // Send to admins (you would query for admin users here)
    // For now, we'll just return success
    return { success: true, message: 'Report notification prepared' };
  }
}
