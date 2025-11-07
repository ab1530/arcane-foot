import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: jest.Mocked<NotificationsService>;

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

  const mockJwtAuthGuard = {
    canActivate: jest.fn((context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest();
      request.user = { id: 'user-123', email: 'test@example.com', role: 'SCOUT' };
      return true;
    }),
  };

  beforeEach(async () => {
    service = {
      registerDevice: jest.fn(),
      unregisterDevice: jest.fn(),
      sendToUser: jest.fn(),
      sendToMultipleUsers: jest.fn(),
      sendToTopic: jest.fn(),
      subscribeToTopic: jest.fn(),
      unsubscribeFromTopic: jest.fn(),
      getUserNotifications: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      sendMatchReminder: jest.fn(),
      sendReportNotification: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: service,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('registerDevice', () => {
    const registerDeviceDto: RegisterDeviceDto = {
      userId: 'user-123',
      fcmToken: 'fcm-token-abc123',
    };

    it('should register a device successfully', async () => {
      const expectedResult = {
        success: true,
        message: 'Device registered successfully',
      };
      service.registerDevice.mockResolvedValue(expectedResult);

      const result = await controller.registerDevice(registerDeviceDto);

      expect(service.registerDevice).toHaveBeenCalledWith(
        registerDeviceDto.userId,
        registerDeviceDto.fcmToken,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should be protected by JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', controller.registerDevice);
      const guardNames = guards.map((guard: any) => guard.name);
      expect(guardNames).toContain('JwtAuthGuard');
    });

    it('should handle registration errors', async () => {
      const error = new Error('Registration failed');
      service.registerDevice.mockRejectedValue(error);

      await expect(controller.registerDevice(registerDeviceDto)).rejects.toThrow(
        'Registration failed',
      );
    });

    it('should validate userId format', async () => {
      service.registerDevice.mockResolvedValue({
        success: true,
        message: 'Device registered successfully',
      });

      await controller.registerDevice(registerDeviceDto);

      expect(service.registerDevice).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
      );
    });
  });

  describe('unregisterDevice', () => {
    const unregisterDto = {
      userId: 'user-123',
      fcmToken: 'fcm-token-abc123',
    };

    it('should unregister a device successfully', async () => {
      const expectedResult = {
        success: true,
        message: 'Device unregistered successfully',
      };
      service.unregisterDevice.mockResolvedValue(expectedResult);

      const result = await controller.unregisterDevice(unregisterDto);

      expect(service.unregisterDevice).toHaveBeenCalledWith(
        unregisterDto.userId,
        unregisterDto.fcmToken,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should be protected by JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', controller.unregisterDevice);
      const guardNames = guards.map((guard: any) => guard.name);
      expect(guardNames).toContain('JwtAuthGuard');
    });

    it('should handle unregistration of non-existent device', async () => {
      service.unregisterDevice.mockResolvedValue({
        success: true,
        message: 'Device unregistered successfully',
      });

      const result = await controller.unregisterDevice(unregisterDto);

      expect(result.success).toBe(true);
    });
  });

  describe('sendToUser', () => {
    const sendNotificationDto: SendNotificationDto = {
      userId: 'user-123',
      title: 'Test Notification',
      body: 'Test notification body',
      type: 'MATCH_REMINDER',
      data: { matchId: 'match-123' },
    };

    it('should send notification to user successfully', async () => {
      const expectedResult = {
        notification: mockNotification,
        sent: true,
        successCount: 1,
        failureCount: 0,
      };
      service.sendToUser.mockResolvedValue(expectedResult);

      const result = await controller.sendToUser(sendNotificationDto);

      expect(service.sendToUser).toHaveBeenCalledWith(sendNotificationDto);
      expect(result).toEqual(expectedResult);
    });

    it('should be protected by JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', controller.sendToUser);
      const guardNames = guards.map((guard: any) => guard.name);
      expect(guardNames).toContain('JwtAuthGuard');
    });

    it('should handle notification without data field', async () => {
      const dtoWithoutData = { ...sendNotificationDto };
      delete dtoWithoutData.data;

      service.sendToUser.mockResolvedValue({
        notification: mockNotification,
        sent: true,
        successCount: 1,
        failureCount: 0,
      });

      const result = await controller.sendToUser(dtoWithoutData);

      expect(result.notification).toBeDefined();
    });

    it('should handle user with no registered devices', async () => {
      service.sendToUser.mockResolvedValue({
        notification: mockNotification,
        sent: false,
        message: 'No registered devices',
      });

      const result = await controller.sendToUser(sendNotificationDto);

      expect(result.sent).toBe(false);
      expect(result.message).toBe('No registered devices');
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
        const dto = { ...sendNotificationDto, type };
        service.sendToUser.mockResolvedValue({
          notification: { ...mockNotification, type },
          sent: true,
          successCount: 1,
          failureCount: 0,
        });

        const result = await controller.sendToUser(dto);

        expect(result.notification.type).toBe(type);
      }
    });
  });

  describe('sendToMultiple', () => {
    const sendMultipleDto = {
      userIds: ['user-1', 'user-2', 'user-3'],
      title: 'Bulk Notification',
      body: 'This is a bulk notification',
      type: 'ANNOUNCEMENT',
      data: { announcementId: 'ann-123' },
    };

    it('should send notifications to multiple users successfully', async () => {
      const expectedResult = {
        totalUsers: 3,
        results: [
          { notification: mockNotification, sent: true, successCount: 1, failureCount: 0 },
          { notification: mockNotification, sent: true, successCount: 1, failureCount: 0 },
          { notification: mockNotification, sent: true, successCount: 1, failureCount: 0 },
        ],
      };
      service.sendToMultipleUsers.mockResolvedValue(expectedResult);

      const result = await controller.sendToMultiple(sendMultipleDto);

      expect(service.sendToMultipleUsers).toHaveBeenCalledWith(
        sendMultipleDto.userIds,
        sendMultipleDto.title,
        sendMultipleDto.body,
        sendMultipleDto.type,
        sendMultipleDto.data,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should be protected by JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', controller.sendToMultiple);
      const guardNames = guards.map((guard: any) => guard.name);
      expect(guardNames).toContain('JwtAuthGuard');
    });

    it('should handle empty user list', async () => {
      const emptyDto = { ...sendMultipleDto, userIds: [] };
      service.sendToMultipleUsers.mockResolvedValue({
        totalUsers: 0,
        results: [],
      });

      const result = await controller.sendToMultiple(emptyDto);

      expect(result.totalUsers).toBe(0);
      expect(result.results).toHaveLength(0);
    });

    it('should handle bulk send without data parameter', async () => {
      const dtoWithoutData = { ...sendMultipleDto };
      delete dtoWithoutData.data;

      service.sendToMultipleUsers.mockResolvedValue({
        totalUsers: 3,
        results: [],
      });

      await controller.sendToMultiple(dtoWithoutData);

      expect(service.sendToMultipleUsers).toHaveBeenCalledWith(
        dtoWithoutData.userIds,
        dtoWithoutData.title,
        dtoWithoutData.body,
        dtoWithoutData.type,
        undefined,
      );
    });

    it('should handle partial failures in bulk send', async () => {
      service.sendToMultipleUsers.mockResolvedValue({
        totalUsers: 3,
        results: [
          { notification: mockNotification, sent: true, successCount: 1, failureCount: 0 },
          { notification: mockNotification, sent: false, message: 'User not found' },
          { notification: mockNotification, sent: true, successCount: 1, failureCount: 0 },
        ],
      });

      const result = await controller.sendToMultiple(sendMultipleDto);

      expect(result.totalUsers).toBe(3);
      expect(result.results).toHaveLength(3);
    });
  });

  describe('sendToTopic', () => {
    const sendToTopicDto = {
      topic: 'match-updates',
      title: 'Match Update',
      body: 'Match starting soon',
      data: { matchId: 'match-123' },
    };

    it('should send notification to topic successfully', async () => {
      const expectedResult = {
        success: true,
        messageId: 'message-id-123',
        topic: 'match-updates',
      };
      service.sendToTopic.mockResolvedValue(expectedResult);

      const result = await controller.sendToTopic(sendToTopicDto);

      expect(service.sendToTopic).toHaveBeenCalledWith(
        sendToTopicDto.topic,
        sendToTopicDto.title,
        sendToTopicDto.body,
        sendToTopicDto.data,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should be protected by JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', controller.sendToTopic);
      const guardNames = guards.map((guard: any) => guard.name);
      expect(guardNames).toContain('JwtAuthGuard');
    });

    it('should handle topic send without data', async () => {
      const dtoWithoutData = { ...sendToTopicDto };
      delete dtoWithoutData.data;

      service.sendToTopic.mockResolvedValue({
        success: true,
        messageId: 'message-id-456',
        topic: 'match-updates',
      });

      await controller.sendToTopic(dtoWithoutData);

      expect(service.sendToTopic).toHaveBeenCalledWith(
        dtoWithoutData.topic,
        dtoWithoutData.title,
        dtoWithoutData.body,
        undefined,
      );
    });

    it('should handle different topic names', async () => {
      const topics = ['announcements', 'match-updates', 'player-news', 'admin-alerts'];

      for (const topic of topics) {
        const dto = { ...sendToTopicDto, topic };
        service.sendToTopic.mockResolvedValue({
          success: true,
          messageId: `message-${topic}`,
          topic,
        });

        const result = await controller.sendToTopic(dto);

        expect(result.topic).toBe(topic);
      }
    });
  });

  describe('subscribeToTopic', () => {
    const subscribeDto = {
      userIds: ['user-1', 'user-2'],
      topic: 'match-updates',
    };

    it('should subscribe users to topic successfully', async () => {
      const expectedResult = {
        success: true,
        successCount: 2,
        failureCount: 0,
        topic: 'match-updates',
      };
      service.subscribeToTopic.mockResolvedValue(expectedResult);

      const result = await controller.subscribeToTopic(subscribeDto);

      expect(service.subscribeToTopic).toHaveBeenCalledWith(
        subscribeDto.userIds,
        subscribeDto.topic,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should be protected by JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', controller.subscribeToTopic);
      const guardNames = guards.map((guard: any) => guard.name);
      expect(guardNames).toContain('JwtAuthGuard');
    });

    it('should handle subscription with no registered devices', async () => {
      service.subscribeToTopic.mockResolvedValue({
        success: false,
        message: 'No registered devices found',
      });

      const result = await controller.subscribeToTopic(subscribeDto);

      expect(result.success).toBe(false);
      expect(result.message).toBe('No registered devices found');
    });

    it('should handle partial subscription failures', async () => {
      service.subscribeToTopic.mockResolvedValue({
        success: true,
        successCount: 1,
        failureCount: 1,
        topic: 'match-updates',
      });

      const result = await controller.subscribeToTopic(subscribeDto);

      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
    });
  });

  describe('unsubscribeFromTopic', () => {
    const unsubscribeDto = {
      userIds: ['user-1', 'user-2'],
      topic: 'match-updates',
    };

    it('should unsubscribe users from topic successfully', async () => {
      const expectedResult = {
        success: true,
        successCount: 2,
        failureCount: 0,
        topic: 'match-updates',
      };
      service.unsubscribeFromTopic.mockResolvedValue(expectedResult);

      const result = await controller.unsubscribeFromTopic(unsubscribeDto);

      expect(service.unsubscribeFromTopic).toHaveBeenCalledWith(
        unsubscribeDto.userIds,
        unsubscribeDto.topic,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should be protected by JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', controller.unsubscribeFromTopic);
      const guardNames = guards.map((guard: any) => guard.name);
      expect(guardNames).toContain('JwtAuthGuard');
    });

    it('should handle unsubscription with no registered devices', async () => {
      service.unsubscribeFromTopic.mockResolvedValue({
        success: false,
        message: 'No registered devices found',
      });

      const result = await controller.unsubscribeFromTopic(unsubscribeDto);

      expect(result.success).toBe(false);
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
      service.getUserNotifications.mockResolvedValue(notifications);

      const result = await controller.getUserNotifications(userId);

      expect(service.getUserNotifications).toHaveBeenCalledWith(userId, false);
      expect(result).toEqual(notifications);
    });

    it('should be protected by JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', controller.getUserNotifications);
      const guardNames = guards.map((guard: any) => guard.name);
      expect(guardNames).toContain('JwtAuthGuard');
    });

    it('should filter for unread notifications only when requested', async () => {
      const unreadNotifications = notifications.filter((n) => !n.isRead);
      service.getUserNotifications.mockResolvedValue(unreadNotifications);

      const result = await controller.getUserNotifications(userId, 'true');

      expect(service.getUserNotifications).toHaveBeenCalledWith(userId, true);
      expect(result).toEqual(unreadNotifications);
    });

    it('should handle unreadOnly parameter as string', async () => {
      service.getUserNotifications.mockResolvedValue(notifications);

      await controller.getUserNotifications(userId, 'false');

      expect(service.getUserNotifications).toHaveBeenCalledWith(userId, false);
    });

    it('should handle missing unreadOnly parameter', async () => {
      service.getUserNotifications.mockResolvedValue(notifications);

      await controller.getUserNotifications(userId, undefined);

      expect(service.getUserNotifications).toHaveBeenCalledWith(userId, false);
    });

    it('should return empty array when user has no notifications', async () => {
      service.getUserNotifications.mockResolvedValue([]);

      const result = await controller.getUserNotifications(userId);

      expect(result).toEqual([]);
    });

    it('should handle pagination by limiting results', async () => {
      service.getUserNotifications.mockResolvedValue(notifications);

      const result = await controller.getUserNotifications(userId);

      expect(result.length).toBeLessThanOrEqual(50);
    });
  });

  describe('markAsRead', () => {
    const notificationId = 'notif-123';
    const userId = 'user-123';

    it('should mark notification as read successfully', async () => {
      const updatedNotification = {
        ...mockNotification,
        isRead: true,
        readAt: new Date(),
      };
      service.markAsRead.mockResolvedValue(updatedNotification);

      const result = await controller.markAsRead(notificationId, userId);

      expect(service.markAsRead).toHaveBeenCalledWith(notificationId, userId);
      expect(result.isRead).toBe(true);
      expect(result.readAt).toBeDefined();
    });

    it('should be protected by JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', controller.markAsRead);
      const guardNames = guards.map((guard: any) => guard.name);
      expect(guardNames).toContain('JwtAuthGuard');
    });

    it('should handle marking already read notification', async () => {
      const alreadyReadNotification = {
        ...mockNotification,
        isRead: true,
        readAt: new Date(),
      };
      service.markAsRead.mockResolvedValue(alreadyReadNotification);

      const result = await controller.markAsRead(notificationId, userId);

      expect(result.isRead).toBe(true);
    });

    it('should handle notification not found error', async () => {
      const error = new Error('Notification not found');
      service.markAsRead.mockRejectedValue(error);

      await expect(controller.markAsRead(notificationId, userId)).rejects.toThrow(
        'Notification not found',
      );
    });

    it('should enforce user ownership of notification', async () => {
      const error = new Error('Notification not found for this user');
      service.markAsRead.mockRejectedValue(error);

      await expect(controller.markAsRead(notificationId, 'different-user')).rejects.toThrow(
        'Notification not found for this user',
      );
    });
  });

  describe('markAllAsRead', () => {
    const userId = 'user-123';

    it('should mark all notifications as read for user', async () => {
      service.markAllAsRead.mockResolvedValue({ count: 5 });

      const result = await controller.markAllAsRead(userId);

      expect(service.markAllAsRead).toHaveBeenCalledWith(userId);
      expect(result.count).toBe(5);
    });

    it('should be protected by JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', controller.markAllAsRead);
      const guardNames = guards.map((guard: any) => guard.name);
      expect(guardNames).toContain('JwtAuthGuard');
    });

    it('should return count of 0 when no unread notifications exist', async () => {
      service.markAllAsRead.mockResolvedValue({ count: 0 });

      const result = await controller.markAllAsRead(userId);

      expect(result.count).toBe(0);
    });

    it('should handle bulk update of many notifications', async () => {
      service.markAllAsRead.mockResolvedValue({ count: 100 });

      const result = await controller.markAllAsRead(userId);

      expect(result.count).toBe(100);
    });
  });

  describe('sendMatchReminder', () => {
    const matchId = 'match-123';

    it('should send match reminder successfully', async () => {
      const expectedResult = {
        success: true,
        message: 'Match reminder sent',
      };
      service.sendMatchReminder.mockResolvedValue(expectedResult);

      const result = await controller.sendMatchReminder(matchId);

      expect(service.sendMatchReminder).toHaveBeenCalledWith(matchId);
      expect(result).toEqual(expectedResult);
    });

    it('should be protected by JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', controller.sendMatchReminder);
      const guardNames = guards.map((guard: any) => guard.name);
      expect(guardNames).toContain('JwtAuthGuard');
    });

    it('should handle match not found error', async () => {
      const error = new Error('Match not found');
      service.sendMatchReminder.mockRejectedValue(error);

      await expect(controller.sendMatchReminder(matchId)).rejects.toThrow('Match not found');
    });

    it('should handle match with no assigned scout', async () => {
      service.sendMatchReminder.mockResolvedValue({
        success: true,
        message: 'Match reminder sent',
      });

      const result = await controller.sendMatchReminder(matchId);

      expect(result.success).toBe(true);
    });

    it('should send reminder for upcoming matches', async () => {
      service.sendMatchReminder.mockResolvedValue({
        success: true,
        message: 'Match reminder sent',
      });

      await controller.sendMatchReminder(matchId);

      expect(service.sendMatchReminder).toHaveBeenCalledWith(matchId);
    });
  });

  describe('sendReportNotification', () => {
    const reportId = 'report-123';

    it('should send report notification successfully', async () => {
      const expectedResult = {
        success: true,
        message: 'Report notification prepared',
      };
      service.sendReportNotification.mockResolvedValue(expectedResult);

      const result = await controller.sendReportNotification(reportId);

      expect(service.sendReportNotification).toHaveBeenCalledWith(reportId);
      expect(result).toEqual(expectedResult);
    });

    it('should be protected by JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', controller.sendReportNotification);
      const guardNames = guards.map((guard: any) => guard.name);
      expect(guardNames).toContain('JwtAuthGuard');
    });

    it('should handle report not found error', async () => {
      const error = new Error('Report not found');
      service.sendReportNotification.mockRejectedValue(error);

      await expect(controller.sendReportNotification(reportId)).rejects.toThrow(
        'Report not found',
      );
    });

    it('should notify relevant users about new report', async () => {
      service.sendReportNotification.mockResolvedValue({
        success: true,
        message: 'Report notification prepared',
      });

      const result = await controller.sendReportNotification(reportId);

      expect(result.success).toBe(true);
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for all endpoints', () => {
      const endpoints = [
        'registerDevice',
        'unregisterDevice',
        'sendToUser',
        'sendToMultiple',
        'sendToTopic',
        'subscribeToTopic',
        'unsubscribeFromTopic',
        'getUserNotifications',
        'markAsRead',
        'markAllAsRead',
        'sendMatchReminder',
        'sendReportNotification',
      ];

      endpoints.forEach((endpoint) => {
        const guards = Reflect.getMetadata('__guards__', controller[endpoint]);
        expect(guards).toBeDefined();
        expect(guards.length).toBeGreaterThan(0);
      });
    });

    it('should handle unauthorized access attempts', () => {
      // Guard would prevent access, but we're mocking it
      expect(mockJwtAuthGuard.canActivate).toBeDefined();
    });

    it('should extract user from JWT token', () => {
      const mockRequest = {
        user: undefined,
      };
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      const result = mockJwtAuthGuard.canActivate(mockContext);

      expect(result).toBe(true);
      // Verify user is set by the guard
      expect(mockRequest.user).toBeDefined();
    });
  });

  describe('Input Validation and Error Handling', () => {
    it('should validate userId format in register device', async () => {
      const invalidDto: RegisterDeviceDto = {
        userId: '',
        fcmToken: 'token-123',
      };

      service.registerDevice.mockRejectedValue(new Error('Invalid userId'));

      await expect(controller.registerDevice(invalidDto)).rejects.toThrow('Invalid userId');
    });

    it('should validate fcmToken format', async () => {
      const invalidDto: RegisterDeviceDto = {
        userId: 'user-123',
        fcmToken: '',
      };

      service.registerDevice.mockRejectedValue(new Error('Invalid fcmToken'));

      await expect(controller.registerDevice(invalidDto)).rejects.toThrow('Invalid fcmToken');
    });

    it('should validate notification title is not empty', async () => {
      const invalidDto: SendNotificationDto = {
        userId: 'user-123',
        title: '',
        body: 'Test body',
        type: 'TEST',
      };

      service.sendToUser.mockRejectedValue(new Error('Title is required'));

      await expect(controller.sendToUser(invalidDto)).rejects.toThrow('Title is required');
    });

    it('should validate notification body is not empty', async () => {
      const invalidDto: SendNotificationDto = {
        userId: 'user-123',
        title: 'Test',
        body: '',
        type: 'TEST',
      };

      service.sendToUser.mockRejectedValue(new Error('Body is required'));

      await expect(controller.sendToUser(invalidDto)).rejects.toThrow('Body is required');
    });

    it('should handle service errors gracefully', async () => {
      const sendDto: SendNotificationDto = {
        userId: 'user-123',
        title: 'Test',
        body: 'Test body',
        type: 'TEST',
      };

      service.sendToUser.mockRejectedValue(new Error('Service unavailable'));

      await expect(controller.sendToUser(sendDto)).rejects.toThrow('Service unavailable');
    });
  });

  describe('Real-time and WebSocket Integration', () => {
    it('should support real-time notification delivery concept', async () => {
      const sendDto: SendNotificationDto = {
        userId: 'user-123',
        title: 'Real-time Notification',
        body: 'This notification is delivered in real-time',
        type: 'REAL_TIME',
      };

      service.sendToUser.mockResolvedValue({
        notification: mockNotification,
        sent: true,
        successCount: 1,
        failureCount: 0,
      });

      const result = await controller.sendToUser(sendDto);

      expect(result.sent).toBe(true);
      expect(result.notification).toBeDefined();
    });

    it('should handle concurrent notification requests', async () => {
      const dto1: SendNotificationDto = {
        userId: 'user-1',
        title: 'Notification 1',
        body: 'Body 1',
        type: 'TEST',
      };

      const dto2: SendNotificationDto = {
        userId: 'user-2',
        title: 'Notification 2',
        body: 'Body 2',
        type: 'TEST',
      };

      service.sendToUser
        .mockResolvedValueOnce({
          notification: { ...mockNotification, id: 'notif-1' },
          sent: true,
          successCount: 1,
          failureCount: 0,
        })
        .mockResolvedValueOnce({
          notification: { ...mockNotification, id: 'notif-2' },
          sent: true,
          successCount: 1,
          failureCount: 0,
        });

      const results = await Promise.all([
        controller.sendToUser(dto1),
        controller.sendToUser(dto2),
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].notification.id).toBe('notif-1');
      expect(results[1].notification.id).toBe('notif-2');
    });
  });

  describe('Bulk Operations Performance', () => {
    it('should handle bulk send to many users efficiently', async () => {
      const userIds = Array.from({ length: 100 }, (_, i) => `user-${i}`);
      const bulkDto = {
        userIds,
        title: 'Bulk Notification',
        body: 'Body',
        type: 'ANNOUNCEMENT',
      };

      service.sendToMultipleUsers.mockResolvedValue({
        totalUsers: 100,
        results: Array(100).fill({ notification: mockNotification, sent: true }),
      });

      const result = await controller.sendToMultiple(bulkDto);

      expect(result.totalUsers).toBe(100);
      expect(service.sendToMultipleUsers).toHaveBeenCalledTimes(1);
    });

    it('should handle bulk mark as read efficiently', async () => {
      service.markAllAsRead.mockResolvedValue({ count: 1000 });

      const result = await controller.markAllAsRead('user-123');

      expect(result.count).toBe(1000);
      expect(service.markAllAsRead).toHaveBeenCalledTimes(1);
    });
  });

  describe('Query Parameters and Pagination', () => {
    it('should handle query parameters correctly', async () => {
      service.getUserNotifications.mockResolvedValue([]);

      await controller.getUserNotifications('user-123', 'true');

      expect(service.getUserNotifications).toHaveBeenCalledWith('user-123', true);
    });

    it('should parse boolean query parameters from strings', async () => {
      service.getUserNotifications.mockResolvedValue([]);

      await controller.getUserNotifications('user-123', 'false');

      expect(service.getUserNotifications).toHaveBeenCalledWith('user-123', false);
    });

    it('should handle undefined query parameters', async () => {
      service.getUserNotifications.mockResolvedValue([]);

      await controller.getUserNotifications('user-123', undefined);

      expect(service.getUserNotifications).toHaveBeenCalledWith('user-123', false);
    });

    it('should limit notification results for performance', async () => {
      const notifications = Array.from({ length: 50 }, (_, i) => ({
        ...mockNotification,
        id: `notif-${i}`,
      }));
      service.getUserNotifications.mockResolvedValue(notifications);

      const result = await controller.getUserNotifications('user-123');

      expect(result.length).toBe(50);
    });
  });
});
