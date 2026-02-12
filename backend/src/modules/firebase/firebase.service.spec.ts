import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from './firebase.service';
import * as admin from 'firebase-admin';
import * as fs from 'fs';

// Mock firebase-admin
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(),
  },
  messaging: jest.fn(),
}));

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

describe('FirebaseService', () => {
  let service: FirebaseService;
  let configService: ConfigService;
  let mockMessaging: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Mock messaging methods
    mockMessaging = {
      send: jest.fn(),
      sendEachForMulticast: jest.fn(),
      subscribeToTopic: jest.fn(),
      unsubscribeFromTopic: jest.fn(),
    };

    (admin.messaging as jest.Mock).mockReturnValue(mockMessaging);
    (admin.credential.cert as jest.Mock).mockReturnValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirebaseService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'FIREBASE_PROJECT_ID') return 'test-project';
              if (key === 'FIREBASE_CLIENT_EMAIL') return 'test@test.iam.gserviceaccount.com';
              if (key === 'FIREBASE_PRIVATE_KEY') return 'test-private-key';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<FirebaseService>(FirebaseService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('onModuleInit', () => {
    it('should initialize Firebase with environment variables', () => {
      service.onModuleInit();

      expect(admin.credential.cert).toHaveBeenCalledWith({
        projectId: 'test-project',
        clientEmail: 'test@test.iam.gserviceaccount.com',
        privateKey: 'test-private-key',
      });
      expect(admin.initializeApp).toHaveBeenCalled();
    });

    it('should handle private key with \\n characters', () => {
      const moduleWithNewlines = Test.createTestingModule({
        providers: [
          FirebaseService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'FIREBASE_PROJECT_ID') return 'test-project';
                if (key === 'FIREBASE_CLIENT_EMAIL') return 'test@test.iam.gserviceaccount.com';
                if (key === 'FIREBASE_PRIVATE_KEY') return 'line1\\nline2\\nline3';
                return null;
              }),
            },
          },
        ],
      }).compile();

      expect(moduleWithNewlines).resolves.toBeDefined();
    });

    it('should fallback to JSON file when env vars not available', async () => {
      const mockServiceAccount = {
        project_id: 'test-project-file',
        client_email: 'test-file@test.iam.gserviceaccount.com',
        private_key: 'test-key-file',
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockServiceAccount));

      const module = await Test.createTestingModule({
        providers: [
          FirebaseService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'FIREBASE_ADMIN_SDK_JSON_PATH') return './firebase-admin.json';
                if (key === 'FCM_PROJECT_ID') return 'test-project-file';
                return null; // No env vars
              }),
            },
          },
        ],
      }).compile();

      const testService = module.get<FirebaseService>(FirebaseService);
      testService.onModuleInit();

      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.readFileSync).toHaveBeenCalled();
    });

    it('should warn when Firebase credentials not configured', async () => {
      const module = await Test.createTestingModule({
        providers: [
          FirebaseService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn(() => null),
            },
          },
        ],
      }).compile();

      const testService = module.get<FirebaseService>(FirebaseService);

      // Should not throw, just warn
      expect(() => testService.onModuleInit()).not.toThrow();
    });

    it('should warn when service account file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const module = await Test.createTestingModule({
        providers: [
          FirebaseService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'FIREBASE_ADMIN_SDK_JSON_PATH') return './missing-file.json';
                if (key === 'FCM_PROJECT_ID') return 'test-project';
                return null;
              }),
            },
          },
        ],
      }).compile();

      const testService = module.get<FirebaseService>(FirebaseService);

      // Should not throw, just warn
      expect(() => testService.onModuleInit()).not.toThrow();
    });

    it('should handle initialization errors gracefully', async () => {
      (admin.initializeApp as jest.Mock).mockImplementation(() => {
        throw new Error('Initialization failed');
      });

      const module = await Test.createTestingModule({
        providers: [
          FirebaseService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'FIREBASE_PROJECT_ID') return 'test-project';
                if (key === 'FIREBASE_CLIENT_EMAIL') return 'test@test.com';
                if (key === 'FIREBASE_PRIVATE_KEY') return 'test-key';
                return null;
              }),
            },
          },
        ],
      }).compile();

      const testService = module.get<FirebaseService>(FirebaseService);

      // Should not throw, just log error
      expect(() => testService.onModuleInit()).not.toThrow();
    });
  });

  describe('sendNotification', () => {
    it('should send notification to a single device successfully', async () => {
      const mockToken = 'device-token-123';
      const mockMessageId = 'message-id-456';

      mockMessaging.send.mockResolvedValue(mockMessageId);

      const result = await service.sendNotification(mockToken, 'Test Title', 'Test Body', {
        action: 'open_app',
      });

      expect(mockMessaging.send).toHaveBeenCalledWith({
        notification: {
          title: 'Test Title',
          body: 'Test Body',
        },
        data: { action: 'open_app' },
        token: mockToken,
      });
      expect(result).toBe(mockMessageId);
    });

    it('should send notification without data payload', async () => {
      const mockToken = 'device-token-789';
      const mockMessageId = 'message-id-abc';

      mockMessaging.send.mockResolvedValue(mockMessageId);

      const result = await service.sendNotification(mockToken, 'Simple Title', 'Simple Body');

      expect(mockMessaging.send).toHaveBeenCalledWith({
        notification: {
          title: 'Simple Title',
          body: 'Simple Body',
        },
        data: undefined,
        token: mockToken,
      });
      expect(result).toBe(mockMessageId);
    });

    it('should handle invalid token error', async () => {
      const mockToken = 'invalid-token';
      const error = new Error('Invalid registration token');

      mockMessaging.send.mockRejectedValue(error);

      await expect(service.sendNotification(mockToken, 'Title', 'Body')).rejects.toThrow(
        'Invalid registration token',
      );
    });

    it('should send notification with complex data payload', async () => {
      const mockToken = 'device-token-complex';
      const mockMessageId = 'message-complex-id';
      const complexData = {
        userId: '123',
        type: 'match_update',
        matchId: '456',
        timestamp: '2024-11-10T12:00:00Z',
      };

      mockMessaging.send.mockResolvedValue(mockMessageId);

      await service.sendNotification(mockToken, 'Match Update', 'Score changed', complexData);

      expect(mockMessaging.send).toHaveBeenCalledWith(
        expect.objectContaining({
          data: complexData,
        }),
      );
    });
  });

  describe('sendMulticast', () => {
    it('should send multicast notification to multiple devices', async () => {
      const mockTokens = ['token1', 'token2', 'token3'];
      const mockResponse = {
        successCount: 3,
        failureCount: 0,
        responses: [
          { success: true, messageId: 'msg1' },
          { success: true, messageId: 'msg2' },
          { success: true, messageId: 'msg3' },
        ],
      };

      mockMessaging.sendEachForMulticast.mockResolvedValue(mockResponse);

      const result = await service.sendMulticast(mockTokens, 'Broadcast Title', 'Broadcast Body', {
        type: 'broadcast',
      });

      expect(mockMessaging.sendEachForMulticast).toHaveBeenCalledWith({
        notification: {
          title: 'Broadcast Title',
          body: 'Broadcast Body',
        },
        data: { type: 'broadcast' },
        tokens: mockTokens,
      });
      expect(result.successCount).toBe(3);
      expect(result.failureCount).toBe(0);
    });

    it('should handle partial failures in multicast', async () => {
      const mockTokens = ['valid-token', 'invalid-token', 'valid-token-2'];
      const mockResponse = {
        successCount: 2,
        failureCount: 1,
        responses: [
          { success: true, messageId: 'msg1' },
          { success: false, error: new Error('Invalid token') },
          { success: true, messageId: 'msg2' },
        ],
      };

      mockMessaging.sendEachForMulticast.mockResolvedValue(mockResponse);

      const result = await service.sendMulticast(mockTokens, 'Title', 'Body');

      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(1);
    });

    it('should send multicast without data payload', async () => {
      const mockTokens = ['token1', 'token2'];
      const mockResponse = {
        successCount: 2,
        failureCount: 0,
        responses: [],
      };

      mockMessaging.sendEachForMulticast.mockResolvedValue(mockResponse);

      await service.sendMulticast(mockTokens, 'Title', 'Body');

      expect(mockMessaging.sendEachForMulticast).toHaveBeenCalledWith({
        notification: {
          title: 'Title',
          body: 'Body',
        },
        data: undefined,
        tokens: mockTokens,
      });
    });

    it('should handle empty token array', async () => {
      const mockResponse = {
        successCount: 0,
        failureCount: 0,
        responses: [],
      };

      mockMessaging.sendEachForMulticast.mockResolvedValue(mockResponse);

      const result = await service.sendMulticast([], 'Title', 'Body');

      expect(result.successCount).toBe(0);
    });
  });

  describe('sendToTopic', () => {
    it('should send notification to a topic successfully', async () => {
      const mockTopic = 'news-updates';
      const mockMessageId = 'topic-message-123';

      mockMessaging.send.mockResolvedValue(mockMessageId);

      const result = await service.sendToTopic(mockTopic, 'Topic Title', 'Topic Body', {
        category: 'news',
      });

      expect(mockMessaging.send).toHaveBeenCalledWith({
        notification: {
          title: 'Topic Title',
          body: 'Topic Body',
        },
        data: { category: 'news' },
        topic: mockTopic,
      });
      expect(result).toBe(mockMessageId);
    });

    it('should send to topic without data payload', async () => {
      const mockTopic = 'general';
      const mockMessageId = 'topic-msg-456';

      mockMessaging.send.mockResolvedValue(mockMessageId);

      const result = await service.sendToTopic(mockTopic, 'General Title', 'General Body');

      expect(mockMessaging.send).toHaveBeenCalledWith({
        notification: {
          title: 'General Title',
          body: 'General Body',
        },
        data: undefined,
        topic: mockTopic,
      });
      expect(result).toBe(mockMessageId);
    });

    it('should handle invalid topic error', async () => {
      const mockTopic = 'invalid@topic';
      const error = new Error('Invalid topic name');

      mockMessaging.send.mockRejectedValue(error);

      await expect(service.sendToTopic(mockTopic, 'Title', 'Body')).rejects.toThrow(
        'Invalid topic name',
      );
    });
  });

  describe('subscribeToTopic', () => {
    it('should subscribe devices to topic successfully', async () => {
      const mockTokens = ['token1', 'token2', 'token3'];
      const mockTopic = 'sports-updates';
      const mockResponse = {
        successCount: 3,
        failureCount: 0,
        errors: [],
      };

      mockMessaging.subscribeToTopic.mockResolvedValue(mockResponse);

      const result = await service.subscribeToTopic(mockTokens, mockTopic);

      expect(mockMessaging.subscribeToTopic).toHaveBeenCalledWith(mockTokens, mockTopic);
      expect(result.successCount).toBe(3);
      expect(result.failureCount).toBe(0);
    });

    it('should handle partial subscription failures', async () => {
      const mockTokens = ['valid-token', 'invalid-token'];
      const mockTopic = 'updates';
      const mockResponse = {
        successCount: 1,
        failureCount: 1,
        errors: [{ index: 1, error: new Error('Invalid token') }],
      };

      mockMessaging.subscribeToTopic.mockResolvedValue(mockResponse);

      const result = await service.subscribeToTopic(mockTokens, mockTopic);

      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
    });

    it('should handle subscription API errors', async () => {
      const mockTokens = ['token1'];
      const mockTopic = 'test-topic';
      const error = new Error('Topic subscription failed');

      mockMessaging.subscribeToTopic.mockRejectedValue(error);

      await expect(service.subscribeToTopic(mockTokens, mockTopic)).rejects.toThrow(
        'Topic subscription failed',
      );
    });
  });

  describe('unsubscribeFromTopic', () => {
    it('should unsubscribe devices from topic successfully', async () => {
      const mockTokens = ['token1', 'token2'];
      const mockTopic = 'news';
      const mockResponse = {
        successCount: 2,
        failureCount: 0,
        errors: [],
      };

      mockMessaging.unsubscribeFromTopic.mockResolvedValue(mockResponse);

      const result = await service.unsubscribeFromTopic(mockTokens, mockTopic);

      expect(mockMessaging.unsubscribeFromTopic).toHaveBeenCalledWith(mockTokens, mockTopic);
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
    });

    it('should handle partial unsubscription failures', async () => {
      const mockTokens = ['valid-token', 'already-unsubscribed-token'];
      const mockTopic = 'updates';
      const mockResponse = {
        successCount: 1,
        failureCount: 1,
        errors: [{ index: 1, error: new Error('Not subscribed') }],
      };

      mockMessaging.unsubscribeFromTopic.mockResolvedValue(mockResponse);

      const result = await service.unsubscribeFromTopic(mockTokens, mockTopic);

      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
    });

    it('should handle unsubscription API errors', async () => {
      const mockTokens = ['token1'];
      const mockTopic = 'test-topic';
      const error = new Error('Topic unsubscription failed');

      mockMessaging.unsubscribeFromTopic.mockRejectedValue(error);

      await expect(service.unsubscribeFromTopic(mockTokens, mockTopic)).rejects.toThrow(
        'Topic unsubscription failed',
      );
    });
  });

  describe('sendDataMessage', () => {
    it('should send data-only message successfully', async () => {
      const mockToken = 'device-token-data';
      const mockData = {
        action: 'sync',
        timestamp: '2024-11-10T12:00:00Z',
        userId: '123',
      };
      const mockMessageId = 'data-message-id-789';

      mockMessaging.send.mockResolvedValue(mockMessageId);

      const result = await service.sendDataMessage(mockToken, mockData);

      expect(mockMessaging.send).toHaveBeenCalledWith({
        data: mockData,
        token: mockToken,
        android: {
          priority: 'high',
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
          payload: {
            aps: {
              contentAvailable: true,
            },
          },
        },
      });
      expect(result).toBe(mockMessageId);
    });

    it('should send data message with correct platform-specific settings', async () => {
      const mockToken = 'test-token';
      const mockData = { key: 'value' };

      mockMessaging.send.mockResolvedValue('msg-id');

      await service.sendDataMessage(mockToken, mockData);

      const callArg = mockMessaging.send.mock.calls[0][0];
      expect(callArg.android.priority).toBe('high');
      expect(callArg.apns.headers['apns-priority']).toBe('10');
      expect(callArg.apns.payload.aps.contentAvailable).toBe(true);
    });

    it('should handle data message errors', async () => {
      const mockToken = 'invalid-token';
      const mockData = { action: 'test' };
      const error = new Error('Failed to send data message');

      mockMessaging.send.mockRejectedValue(error);

      await expect(service.sendDataMessage(mockToken, mockData)).rejects.toThrow(
        'Failed to send data message',
      );
    });
  });

  describe('Integration scenarios', () => {
    it('should handle subscribe and send to topic workflow', async () => {
      const mockTokens = ['token1', 'token2'];
      const mockTopic = 'premium-users';

      mockMessaging.subscribeToTopic.mockResolvedValue({
        successCount: 2,
        failureCount: 0,
        errors: [],
      });

      mockMessaging.send.mockResolvedValue('topic-msg-id');

      await service.subscribeToTopic(mockTokens, mockTopic);
      await service.sendToTopic(mockTopic, 'Welcome', 'Welcome to premium!');

      expect(mockMessaging.subscribeToTopic).toHaveBeenCalledWith(mockTokens, mockTopic);
      expect(mockMessaging.send).toHaveBeenCalled();
    });

    it('should handle send notification and data message to same device', async () => {
      const mockToken = 'user-device-token';

      mockMessaging.send.mockResolvedValue('msg-id-1');

      await service.sendNotification(mockToken, 'Notification', 'You have a message');
      await service.sendDataMessage(mockToken, { sync: 'true' });

      expect(mockMessaging.send).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error handling', () => {
    it('should propagate Firebase messaging errors', async () => {
      const error = new Error('Firebase service unavailable');
      mockMessaging.send.mockRejectedValue(error);

      await expect(service.sendNotification('token', 'Title', 'Body')).rejects.toThrow(
        'Firebase service unavailable',
      );
    });

    it('should handle quota exceeded error', async () => {
      const error = new Error('Quota exceeded');
      mockMessaging.sendEachForMulticast.mockRejectedValue(error);

      await expect(service.sendMulticast(['token1', 'token2'], 'Title', 'Body')).rejects.toThrow(
        'Quota exceeded',
      );
    });

    it('should handle network errors', async () => {
      const error = new Error('Network request failed');
      mockMessaging.subscribeToTopic.mockRejectedValue(error);

      await expect(service.subscribeToTopic(['token1'], 'topic')).rejects.toThrow(
        'Network request failed',
      );
    });
  });
});
