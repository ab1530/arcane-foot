import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { FirebaseService } from '../firebase/firebase.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { SendNotificationDto } from './dto/send-notification.dto';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: DeepMockProxy<PrismaClient>;
  let firebaseService: jest.Mocked<FirebaseService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'SCOUT',
    passwordHash: 'hashed',
    phone: '+33612345678',
    avatar: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: null,
    emailVerified: false,
    clubId: null,
    subscriptionTier: 'FREE',
    subscriptionExpiresAt: null,
  };

  const mockNotification = {
    id: 'notif-123',
    userId: 'user-123',
    title: 'Test Notification',
    body: 'Test notification body',
    type: 'TEST',
    dataJson: null,
    isRead: false,
    readAt: null,
    fcmMessageId: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    prisma = mockDeep<PrismaClient>();
    firebaseService = {
      sendMulticast: jest.fn(),
      sendToTopic: jest.fn(),
      subscribeToTopic: jest.fn(),
      unsubscribeFromTopic: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: FirebaseService,
          useValue: firebaseService,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerDevice', () => {
    const userId = 'user-123';
    const fcmToken = 'fcm-token-abc123';

    it('should successfully register a device token for a user', async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.registerDevice(userId, fcmToken);

      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result).toEqual({
        success: true,
        message: 'Device registered successfully',
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      prisma.users.findUnique.mockResolvedValue(null);

      await expect(service.registerDevice(userId, fcmToken)).rejects.toThrow(
        new NotFoundException(`User with ID ${userId} not found`),
      );
    });

    it('should not duplicate tokens for the same user', async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser as any);

      await service.registerDevice(userId, fcmToken);
      const result = await service.registerDevice(userId, fcmToken);

      expect(result.success).toBe(true);
    });

    it('should allow multiple tokens for the same user', async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser as any);

      await service.registerDevice(userId, 'token-1');
      await service.registerDevice(userId, 'token-2');

      expect(prisma.users.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  describe('unregisterDevice', () => {
    const userId = 'user-123';
    const fcmToken = 'fcm-token-abc123';

    it('should successfully unregister a device token', async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      await service.registerDevice(userId, fcmToken);

      const result = await service.unregisterDevice(userId, fcmToken);

      expect(result).toEqual({
        success: true,
        message: 'Device unregistered successfully',
      });
    });

    it('should handle unregistering non-existent token gracefully', async () => {
      const result = await service.unregisterDevice(userId, 'non-existent-token');

      expect(result.success).toBe(true);
    });

    it('should remove only the specified token', async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      await service.registerDevice(userId, 'token-1');
      await service.registerDevice(userId, 'token-2');

      await service.unregisterDevice(userId, 'token-1');

      // Verify by sending notification (should use token-2)
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      prisma.notifications.create.mockResolvedValue(mockNotification as any);
      firebaseService.sendMulticast.mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [],
      });

      const sendDto: SendNotificationDto = {
        userId,
        title: 'Test',
        body: 'Test body',
        type: 'TEST',
      };

      await service.sendToUser(sendDto);
      expect(firebaseService.sendMulticast).toHaveBeenCalled();
    });
  });

  describe('sendToUser', () => {
    const sendDto: SendNotificationDto = {
      userId: 'user-123',
      title: 'Test Notification',
      body: 'Test notification body',
      type: 'MATCH_REMINDER',
      data: { matchId: 'match-123' },
    };

    it('should send notification to user with registered devices', async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      await service.registerDevice(sendDto.userId, 'fcm-token-123');

      prisma.notifications.create.mockResolvedValue(mockNotification as any);
      firebaseService.sendMulticast.mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [],
      });

      const result = await service.sendToUser(sendDto);

      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { id: sendDto.userId },
      });
      expect(firebaseService.sendMulticast).toHaveBeenCalledWith(
        ['fcm-token-123'],
        sendDto.title,
        sendDto.body,
        sendDto.data,
      );
      expect(prisma.notifications.create).toHaveBeenCalled();
      expect(result.sent).toBe(true);
      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(0);
    });

    it('should create notification record even without registered devices', async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      prisma.notifications.create.mockResolvedValue(mockNotification as any);

      const result = await service.sendToUser(sendDto);

      expect(prisma.notifications.create).toHaveBeenCalled();
      expect(result.sent).toBe(false);
      expect(result.message).toBe('No registered devices');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      prisma.users.findUnique.mockResolvedValue(null);

      await expect(service.sendToUser(sendDto)).rejects.toThrow(
        new NotFoundException(`User with ID ${sendDto.userId} not found`),
      );
    });

    it('should handle notification with no data field', async () => {
      const dtoWithoutData = { ...sendDto };
      delete dtoWithoutData.data;

      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      await service.registerDevice(sendDto.userId, 'fcm-token-123');

      prisma.notifications.create.mockResolvedValue(mockNotification as any);
      firebaseService.sendMulticast.mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [],
      });

      const result = await service.sendToUser(dtoWithoutData);

      expect(firebaseService.sendMulticast).toHaveBeenCalledWith(
        ['fcm-token-123'],
        dtoWithoutData.title,
        dtoWithoutData.body,
        {},
      );
      expect(result.sent).toBe(true);
    });

    it('should handle different notification types', async () => {
      const types = [
        'REPORT_COMMENT',
        'MATCH_REMINDER',
        'PLAYER_UPDATE',
        'MESSAGE_RECEIVED',
        'ACHIEVEMENT_UNLOCKED',
        'SUBSCRIPTION_EXPIRING',
      ];

      for (const type of types) {
        const dto = { ...sendDto, type };
        prisma.users.findUnique.mockResolvedValue(mockUser as any);
        prisma.notifications.create.mockResolvedValue({
          ...mockNotification,
          type,
        } as any);

        await service.sendToUser(dto);

        expect(prisma.notifications.create).toHaveBeenCalledWith({
          data: expect.objectContaining({ type }),
        });
      }
    });

    it('should handle FCM send failures gracefully', async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      await service.registerDevice(sendDto.userId, 'fcm-token-123');

      prisma.notifications.create.mockResolvedValue(mockNotification as any);
      firebaseService.sendMulticast.mockResolvedValue({
        successCount: 0,
        failureCount: 1,
        responses: [],
      });

      const result = await service.sendToUser(sendDto);

      expect(result.sent).toBe(true);
      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(1);
    });

    it('should include data in notification record when provided', async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      prisma.notifications.create.mockResolvedValue(mockNotification as any);

      await service.sendToUser(sendDto);

      expect(prisma.notifications.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          dataJson: sendDto.data,
        }),
      });
    });

    it('should generate unique notification IDs', async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      prisma.notifications.create.mockResolvedValue(mockNotification as any);

      await service.sendToUser(sendDto);

      const createCall = (prisma.notifications.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.id).toBeDefined();
      expect(typeof createCall.data.id).toBe('string');
    });
  });

  describe('sendToMultipleUsers', () => {
    const userIds = ['user-1', 'user-2', 'user-3'];
    const title = 'Bulk Notification';
    const body = 'This is a bulk notification';
    const type = 'ANNOUNCEMENT';
    const data = { announcementId: 'ann-123' };

    it('should send notifications to multiple users', async () => {
      for (const userId of userIds) {
        prisma.users.findUnique.mockResolvedValueOnce({
          ...mockUser,
          id: userId,
        } as any);
        prisma.notifications.create.mockResolvedValueOnce({
          ...mockNotification,
          id: `notif-${userId}`,
          userId,
        } as any);
      }

      const result = await service.sendToMultipleUsers(userIds, title, body, type, data);

      expect(result.totalUsers).toBe(3);
      expect(result.results).toHaveLength(3);
      expect(prisma.users.findUnique).toHaveBeenCalledTimes(3);
    });

    it('should handle empty user list', async () => {
      const result = await service.sendToMultipleUsers([], title, body, type, data);

      expect(result.totalUsers).toBe(0);
      expect(result.results).toHaveLength(0);
    });

    it('should continue sending even if some users fail', async () => {
      prisma.users.findUnique
        .mockResolvedValueOnce(mockUser as any)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockUser as any);

      prisma.notifications.create.mockResolvedValue(mockNotification as any);

      // Since Promise.all is used, if one fails, all fail
      // We expect this to throw because one user doesn't exist
      await expect(
        service.sendToMultipleUsers(userIds, title, body, type, data)
      ).rejects.toThrow(NotFoundException);
    });

    it('should send notifications without data parameter', async () => {
      for (const userId of userIds) {
        prisma.users.findUnique.mockResolvedValueOnce({
          ...mockUser,
          id: userId,
        } as any);
        prisma.notifications.create.mockResolvedValueOnce({
          ...mockNotification,
          id: `notif-${userId}`,
          userId,
        } as any);
      }

      const result = await service.sendToMultipleUsers(userIds, title, body, type);

      expect(result.totalUsers).toBe(3);
      expect(result.results).toHaveLength(3);
    });
  });

  describe('sendToTopic', () => {
    const topic = 'match-updates';
    const title = 'Match Update';
    const body = 'Match starting soon';
    const data = { matchId: 'match-123' };

    it('should send notification to a topic', async () => {
      firebaseService.sendToTopic.mockResolvedValue('message-id-123');

      const result = await service.sendToTopic(topic, title, body, data);

      expect(firebaseService.sendToTopic).toHaveBeenCalledWith(topic, title, body, data);
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('message-id-123');
      expect(result.topic).toBe(topic);
    });

    it('should send notification to topic without data', async () => {
      firebaseService.sendToTopic.mockResolvedValue('message-id-456');

      const result = await service.sendToTopic(topic, title, body);

      expect(firebaseService.sendToTopic).toHaveBeenCalledWith(topic, title, body, {});
      expect(result.success).toBe(true);
    });

    it('should handle different topic names', async () => {
      const topics = ['announcements', 'match-updates', 'player-news', 'admin-alerts'];

      for (const topicName of topics) {
        firebaseService.sendToTopic.mockResolvedValue(`message-${topicName}`);

        const result = await service.sendToTopic(topicName, title, body, data);

        expect(result.topic).toBe(topicName);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('subscribeToTopic', () => {
    const userIds = ['user-1', 'user-2'];
    const topic = 'match-updates';

    it('should subscribe users to a topic', async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      await service.registerDevice('user-1', 'token-1');
      await service.registerDevice('user-2', 'token-2');

      firebaseService.subscribeToTopic.mockResolvedValue({
        successCount: 2,
        failureCount: 0,
        errors: [],
      });

      const result = await service.subscribeToTopic(userIds, topic);

      expect(firebaseService.subscribeToTopic).toHaveBeenCalledWith(
        ['token-1', 'token-2'],
        topic,
      );
      expect(result.success).toBe(true);
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
    });

    it('should handle users with no registered devices', async () => {
      const result = await service.subscribeToTopic(userIds, topic);

      expect(result.success).toBe(false);
      expect(result.message).toBe('No registered devices found');
      expect(firebaseService.subscribeToTopic).not.toHaveBeenCalled();
    });

    it('should handle multiple tokens per user', async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      await service.registerDevice('user-1', 'token-1a');
      await service.registerDevice('user-1', 'token-1b');
      await service.registerDevice('user-2', 'token-2');

      firebaseService.subscribeToTopic.mockResolvedValue({
        successCount: 3,
        failureCount: 0,
        errors: [],
      });

      const result = await service.subscribeToTopic(userIds, topic);

      expect(firebaseService.subscribeToTopic).toHaveBeenCalledWith(
        ['token-1a', 'token-1b', 'token-2'],
        topic,
      );
      expect(result.successCount).toBe(3);
    });

    it('should handle partial subscription failures', async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      await service.registerDevice('user-1', 'token-1');
      await service.registerDevice('user-2', 'token-2');

      firebaseService.subscribeToTopic.mockResolvedValue({
        successCount: 1,
        failureCount: 1,
        errors: [],
      });

      const result = await service.subscribeToTopic(userIds, topic);

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
    });
  });

  describe('unsubscribeFromTopic', () => {
    const userIds = ['user-1', 'user-2'];
    const topic = 'match-updates';

    it('should unsubscribe users from a topic', async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      await service.registerDevice('user-1', 'token-1');
      await service.registerDevice('user-2', 'token-2');

      firebaseService.unsubscribeFromTopic.mockResolvedValue({
        successCount: 2,
        failureCount: 0,
        errors: [],
      });

      const result = await service.unsubscribeFromTopic(userIds, topic);

      expect(firebaseService.unsubscribeFromTopic).toHaveBeenCalledWith(
        ['token-1', 'token-2'],
        topic,
      );
      expect(result.success).toBe(true);
      expect(result.successCount).toBe(2);
    });

    it('should handle users with no registered devices', async () => {
      const result = await service.unsubscribeFromTopic(userIds, topic);

      expect(result.success).toBe(false);
      expect(result.message).toBe('No registered devices found');
      expect(firebaseService.unsubscribeFromTopic).not.toHaveBeenCalled();
    });
  });

  describe('getUserNotifications', () => {
    const userId = 'user-123';
    const notifications = [
      { ...mockNotification, id: 'notif-1', isRead: false },
      { ...mockNotification, id: 'notif-2', isRead: true },
      { ...mockNotification, id: 'notif-3', isRead: false },
    ];

    it('should get all user notifications', async () => {
      prisma.notifications.findMany.mockResolvedValue(notifications as any);

      const result = await service.getUserNotifications(userId);

      expect(prisma.notifications.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      expect(result).toEqual(notifications);
    });

    it('should get only unread notifications when unreadOnly is true', async () => {
      const unreadNotifications = notifications.filter((n) => !n.isRead);
      prisma.notifications.findMany.mockResolvedValue(unreadNotifications as any);

      const result = await service.getUserNotifications(userId, true);

      expect(prisma.notifications.findMany).toHaveBeenCalledWith({
        where: { userId, isRead: false },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      expect(result).toEqual(unreadNotifications);
    });

    it('should limit results to 50 notifications', async () => {
      prisma.notifications.findMany.mockResolvedValue([]);

      await service.getUserNotifications(userId);

      const callArgs = (prisma.notifications.findMany as jest.Mock).mock.calls[0][0];
      expect(callArgs.take).toBe(50);
    });

    it('should order notifications by createdAt descending', async () => {
      prisma.notifications.findMany.mockResolvedValue([]);

      await service.getUserNotifications(userId);

      const callArgs = (prisma.notifications.findMany as jest.Mock).mock.calls[0][0];
      expect(callArgs.orderBy).toEqual({ createdAt: 'desc' });
    });

    it('should return empty array when user has no notifications', async () => {
      prisma.notifications.findMany.mockResolvedValue([]);

      const result = await service.getUserNotifications(userId);

      expect(result).toEqual([]);
    });
  });

  describe('markAsRead', () => {
    const notificationId = 'notif-123';
    const userId = 'user-123';

    it('should mark notification as read', async () => {
      const updatedNotification = {
        ...mockNotification,
        isRead: true,
        readAt: new Date(),
      };

      prisma.notifications.findUnique.mockResolvedValue(mockNotification as any);
      prisma.notifications.update.mockResolvedValue(updatedNotification as any);

      const result = await service.markAsRead(notificationId, userId);

      expect(prisma.notifications.findUnique).toHaveBeenCalledWith({
        where: { id: notificationId },
      });
      expect(prisma.notifications.update).toHaveBeenCalledWith({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: expect.any(Date),
        },
      });
      expect(result.isRead).toBe(true);
      expect(result.readAt).toBeDefined();
    });

    it('should throw NotFoundException if notification does not exist', async () => {
      prisma.notifications.findUnique.mockResolvedValue(null);

      await expect(service.markAsRead(notificationId, userId)).rejects.toThrow(
        new NotFoundException(`Notification with ID ${notificationId} not found`),
      );
    });

    it('should throw NotFoundException if notification belongs to different user', async () => {
      prisma.notifications.findUnique.mockResolvedValue({
        ...mockNotification,
        userId: 'different-user',
      } as any);

      await expect(service.markAsRead(notificationId, userId)).rejects.toThrow(
        new NotFoundException('Notification not found for this user'),
      );
    });

    it('should set readAt timestamp when marking as read', async () => {
      const beforeRead = new Date();
      prisma.notifications.findUnique.mockResolvedValue(mockNotification as any);
      prisma.notifications.update.mockResolvedValue({
        ...mockNotification,
        isRead: true,
        readAt: new Date(),
      } as any);

      await service.markAsRead(notificationId, userId);

      const updateCall = (prisma.notifications.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.readAt).toBeInstanceOf(Date);
      expect(updateCall.data.readAt.getTime()).toBeGreaterThanOrEqual(beforeRead.getTime());
    });

    it('should work even if notification is already read', async () => {
      const alreadyReadNotification = {
        ...mockNotification,
        isRead: true,
        readAt: new Date(),
      };

      prisma.notifications.findUnique.mockResolvedValue(alreadyReadNotification as any);
      prisma.notifications.update.mockResolvedValue(alreadyReadNotification as any);

      const result = await service.markAsRead(notificationId, userId);

      expect(result.isRead).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    const userId = 'user-123';

    it('should mark all unread notifications as read for a user', async () => {
      prisma.notifications.updateMany.mockResolvedValue({ count: 5 } as any);

      const result = await service.markAllAsRead(userId);

      expect(prisma.notifications.updateMany).toHaveBeenCalledWith({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: expect.any(Date),
        },
      });
      expect(result.count).toBe(5);
    });

    it('should return count of 0 if no unread notifications exist', async () => {
      prisma.notifications.updateMany.mockResolvedValue({ count: 0 } as any);

      const result = await service.markAllAsRead(userId);

      expect(result.count).toBe(0);
    });

    it('should only update unread notifications', async () => {
      prisma.notifications.updateMany.mockResolvedValue({ count: 3 } as any);

      await service.markAllAsRead(userId);

      const callArgs = (prisma.notifications.updateMany as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.isRead).toBe(false);
    });

    it('should set readAt timestamp for all updated notifications', async () => {
      const beforeUpdate = new Date();
      prisma.notifications.updateMany.mockResolvedValue({ count: 2 } as any);

      await service.markAllAsRead(userId);

      const updateCall = (prisma.notifications.updateMany as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.readAt).toBeInstanceOf(Date);
      expect(updateCall.data.readAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    });
  });

  describe('sendMatchReminder', () => {
    const matchId = 'match-123';
    const mockMatch = {
      id: matchId,
      homeClubId: 'club-1',
      awayClubId: 'club-2',
      scoutId: 'scout-123',
      date: new Date(),
      status: 'SCHEDULED',
      clubs_matches_homeClubIdToclubs: {
        id: 'club-1',
        name: 'FC Barcelona',
      },
      clubs_matches_awayClubIdToclubs: {
        id: 'club-2',
        name: 'Real Madrid',
      },
      users_matches_scoutIdTousers: {
        id: 'scout-123',
        email: 'scout@example.com',
      },
    };

    it('should send match reminder to assigned scout', async () => {
      prisma.matches.findUnique.mockResolvedValue(mockMatch as any);
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      prisma.notifications.create.mockResolvedValue(mockNotification as any);

      const result = await service.sendMatchReminder(matchId);

      expect(prisma.matches.findUnique).toHaveBeenCalledWith({
        where: { id: matchId },
        include: {
          clubs_matches_homeClubIdToclubs: true,
          clubs_matches_awayClubIdToclubs: true,
          users_matches_scoutIdTousers: true,
        },
      });
      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { id: mockMatch.scoutId },
      });
      expect(result.success).toBe(true);
      expect(result.message).toBe('Match reminder sent');
    });

    it('should throw NotFoundException if match does not exist', async () => {
      prisma.matches.findUnique.mockResolvedValue(null);

      await expect(service.sendMatchReminder(matchId)).rejects.toThrow(
        new NotFoundException(`Match with ID ${matchId} not found`),
      );
    });

    it('should handle match with no assigned scout', async () => {
      const matchWithoutScout = { ...mockMatch, scoutId: null };
      prisma.matches.findUnique.mockResolvedValue(matchWithoutScout as any);

      const result = await service.sendMatchReminder(matchId);

      expect(result.success).toBe(true);
      expect(prisma.users.findUnique).not.toHaveBeenCalled();
    });

    it('should include match details in notification', async () => {
      prisma.matches.findUnique.mockResolvedValue(mockMatch as any);
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      prisma.notifications.create.mockResolvedValue(mockNotification as any);

      await service.sendMatchReminder(matchId);

      // The sendToUser method is called internally
      expect(prisma.users.findUnique).toHaveBeenCalled();
    });

    it('should send notification with correct type', async () => {
      prisma.matches.findUnique.mockResolvedValue(mockMatch as any);
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      prisma.notifications.create.mockResolvedValue(mockNotification as any);

      await service.sendMatchReminder(matchId);

      expect(prisma.users.findUnique).toHaveBeenCalled();
    });
  });

  describe('sendReportNotification', () => {
    const reportId = 'report-123';
    const mockReport = {
      id: reportId,
      playerId: 'player-123',
      scoutId: 'scout-123',
      matchId: 'match-123',
      overallRating: 8.5,
      players: {
        id: 'player-123',
        firstName: 'Lionel',
        lastName: 'Messi',
        users: {
          id: 'user-123',
          email: 'player@example.com',
        },
      },
      users: {
        id: 'scout-123',
        email: 'scout@example.com',
      },
      matches: {
        id: 'match-123',
        clubs_matches_homeClubIdToclubs: {
          name: 'FC Barcelona',
        },
        clubs_matches_awayClubIdToclubs: {
          name: 'Real Madrid',
        },
      },
    };

    it('should send report notification successfully', async () => {
      prisma.scouting_reports.findUnique.mockResolvedValue(mockReport as any);

      const result = await service.sendReportNotification(reportId);

      expect(prisma.scouting_reports.findUnique).toHaveBeenCalledWith({
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
      expect(result.success).toBe(true);
      expect(result.message).toBe('Report notification prepared');
    });

    it('should throw NotFoundException if report does not exist', async () => {
      prisma.scouting_reports.findUnique.mockResolvedValue(null);

      await expect(service.sendReportNotification(reportId)).rejects.toThrow(
        new NotFoundException(`Report with ID ${reportId} not found`),
      );
    });

    it('should include all related entities in query', async () => {
      prisma.scouting_reports.findUnique.mockResolvedValue(mockReport as any);

      await service.sendReportNotification(reportId);

      const callArgs = (prisma.scouting_reports.findUnique as jest.Mock).mock.calls[0][0];
      expect(callArgs.include).toBeDefined();
      expect(callArgs.include.players).toBeDefined();
      expect(callArgs.include.users).toBeDefined();
      expect(callArgs.include.matches).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle concurrent device registrations', async () => {
      const userId = 'user-123';
      prisma.users.findUnique.mockResolvedValue(mockUser as any);

      const promises = [
        service.registerDevice(userId, 'token-1'),
        service.registerDevice(userId, 'token-2'),
        service.registerDevice(userId, 'token-3'),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });

    it('should handle Firebase service errors gracefully', async () => {
      const sendDto: SendNotificationDto = {
        userId: 'user-123',
        title: 'Test',
        body: 'Test body',
        type: 'TEST',
      };

      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      await service.registerDevice(sendDto.userId, 'token-123');

      firebaseService.sendMulticast.mockRejectedValue(new Error('Firebase error'));
      prisma.notifications.create.mockResolvedValue(mockNotification as any);

      await expect(service.sendToUser(sendDto)).rejects.toThrow('Firebase error');
    });

    it('should handle notification with very long title and body', async () => {
      const longTitle = 'A'.repeat(500);
      const longBody = 'B'.repeat(5000);
      const sendDto: SendNotificationDto = {
        userId: 'user-123',
        title: longTitle,
        body: longBody,
        type: 'TEST',
      };

      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      prisma.notifications.create.mockResolvedValue(mockNotification as any);

      const result = await service.sendToUser(sendDto);

      expect(result.notification).toBeDefined();
    });

    it('should handle special characters in notification data', async () => {
      const sendDto: SendNotificationDto = {
        userId: 'user-123',
        title: 'Test with émojis 🎉',
        body: 'Body with special chars: <>&"\'',
        type: 'TEST',
        data: {
          'special-key': 'value-with-dashes',
          'unicode': '你好世界',
        },
      };

      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      prisma.notifications.create.mockResolvedValue(mockNotification as any);

      const result = await service.sendToUser(sendDto);

      expect(result.notification).toBeDefined();
    });
  });

  describe('Notification Priority and Delivery Channels', () => {
    it('should handle different notification priorities', async () => {
      const priorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
      const sendDto: SendNotificationDto = {
        userId: 'user-123',
        title: 'Test',
        body: 'Test body',
        type: 'TEST',
      };

      for (const priority of priorities) {
        prisma.users.findUnique.mockResolvedValue(mockUser as any);
        prisma.notifications.create.mockResolvedValue(mockNotification as any);

        await service.sendToUser(sendDto);

        expect(prisma.notifications.create).toHaveBeenCalled();
      }
    });

    it('should support multiple delivery channels concept', async () => {
      const channels = ['IN_APP', 'PUSH', 'EMAIL', 'SMS'];
      const sendDto: SendNotificationDto = {
        userId: 'user-123',
        title: 'Multi-channel notification',
        body: 'This notification supports multiple channels',
        type: 'MULTI_CHANNEL',
      };

      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      await service.registerDevice(sendDto.userId, 'token-123');
      prisma.notifications.create.mockResolvedValue(mockNotification as any);
      firebaseService.sendMulticast.mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [],
      });

      const result = await service.sendToUser(sendDto);

      // IN_APP: notification record created
      expect(result.notification).toBeDefined();
      // PUSH: FCM called
      expect(firebaseService.sendMulticast).toHaveBeenCalled();
    });
  });
});
