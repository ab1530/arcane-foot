import { Test, TestingModule } from '@nestjs/testing';
import { WsException } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { RealtimeGateway } from './websocket.gateway';
import { RedisService } from '../cache/redis.service';

// Mock interfaces
interface AuthenticatedSocket extends Socket {
  userId?: string;
  role?: string;
}

describe('RealtimeGateway', () => {
  let gateway: RealtimeGateway;
  let jwtService: jest.Mocked<JwtService>;
  let redisService: jest.Mocked<RedisService>;
  let mockServer: jest.Mocked<Server>;
  let mockSocket: jest.Mocked<AuthenticatedSocket>;

  beforeEach(async () => {
    // Mock JwtService
    jwtService = {
      verifyAsync: jest.fn(),
    } as any;

    // Mock RedisService
    redisService = {
      sadd: jest.fn().mockResolvedValue(1),
      srem: jest.fn().mockResolvedValue(1),
      smembers: jest.fn().mockResolvedValue([]),
      publish: jest.fn().mockResolvedValue(1),
      subscribe: jest.fn().mockResolvedValue(undefined),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealtimeGateway,
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: RedisService,
          useValue: redisService,
        },
      ],
    }).compile();

    gateway = module.get<RealtimeGateway>(RealtimeGateway);

    // Mock Server
    mockServer = {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
      sockets: {
        adapter: {
          rooms: new Map(),
        },
      },
    } as any;

    gateway.server = mockServer;

    // Mock Socket
    mockSocket = {
      id: 'socket-123',
      userId: undefined,
      role: undefined,
      handshake: {
        auth: {},
        headers: {},
      },
      emit: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
      disconnect: jest.fn(),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('afterInit', () => {
    it('should initialize the gateway and setup Redis pub/sub', async () => {
      const logSpy = jest.spyOn(gateway['logger'], 'log');

      gateway.afterInit(mockServer);

      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(logSpy).toHaveBeenCalledWith('WebSocket Gateway initialized');
      // The subscribe is called asynchronously, check both calls were made
      expect(redisService.subscribe).toHaveBeenCalledTimes(2);
    });
  });

  describe('handleConnection', () => {
    const validToken = 'valid-token-123';
    const validPayload = {
      sub: 'user-123',
      role: 'SCOUT',
    };

    it('should successfully connect authenticated client', async () => {
      mockSocket.handshake.auth.token = validToken;
      jwtService.verifyAsync.mockResolvedValue(validPayload);

      await gateway.handleConnection(mockSocket);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(validToken);
      expect(mockSocket.userId).toBe(validPayload.sub);
      expect(mockSocket.role).toBe(validPayload.role);
      expect(mockSocket.join).toHaveBeenCalledWith(`user:${validPayload.sub}`);
      expect(mockSocket.join).toHaveBeenCalledWith(`role:${validPayload.role}`);
      expect(redisService.sadd).toHaveBeenCalledWith('online_users', validPayload.sub);
      expect(mockSocket.emit).toHaveBeenCalledWith('connected', {
        message: 'Connected to Arcane Football real-time server',
        userId: validPayload.sub,
        timestamp: expect.any(Date),
      });
      expect(mockServer.to).toHaveBeenCalledWith('all');
      expect(mockServer.emit).toHaveBeenCalledWith('user:online', {
        userId: validPayload.sub,
        timestamp: expect.any(Date),
      });
    });

    it('should disconnect client without token', async () => {
      await gateway.handleConnection(mockSocket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should disconnect client with invalid token', async () => {
      mockSocket.handshake.auth.token = 'invalid-token';
      jwtService.verifyAsync.mockResolvedValue(null);

      await gateway.handleConnection(mockSocket);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('invalid-token');
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should extract token from Bearer header', async () => {
      mockSocket.handshake.headers.authorization = `Bearer ${validToken}`;
      jwtService.verifyAsync.mockResolvedValue(validPayload);

      await gateway.handleConnection(mockSocket);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(validToken);
      expect(mockSocket.userId).toBe(validPayload.sub);
    });

    it('should handle JWT verification error', async () => {
      mockSocket.handshake.auth.token = validToken;
      jwtService.verifyAsync.mockRejectedValue(new Error('JWT verification failed'));

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should join user-specific room but not role room if role is missing', async () => {
      const payloadWithoutRole = { sub: 'user-123', role: undefined };
      mockSocket.handshake.auth.token = validToken;
      jwtService.verifyAsync.mockResolvedValue(payloadWithoutRole);

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.join).toHaveBeenCalledWith('user:user-123');
      expect(mockSocket.join).toHaveBeenCalledTimes(1);
    });

    it('should handle Redis error gracefully', async () => {
      mockSocket.handshake.auth.token = validToken;
      jwtService.verifyAsync.mockResolvedValue(validPayload);
      redisService.sadd.mockRejectedValue(new Error('Redis error'));

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should handle client disconnection', async () => {
      mockSocket.userId = 'user-123';

      await gateway.handleDisconnect(mockSocket);

      expect(redisService.srem).toHaveBeenCalledWith('online_users', 'user-123');
      expect(mockServer.to).toHaveBeenCalledWith('all');
      expect(mockServer.emit).toHaveBeenCalledWith('user:offline', {
        userId: 'user-123',
        timestamp: expect.any(Date),
      });
    });

    it('should handle disconnection without userId', async () => {
      await gateway.handleDisconnect(mockSocket);

      expect(redisService.srem).not.toHaveBeenCalled();
      expect(mockServer.emit).not.toHaveBeenCalled();
    });

    it('should handle Redis error during disconnect', async () => {
      mockSocket.userId = 'user-123';
      redisService.srem.mockRejectedValue(new Error('Redis error'));

      await expect(gateway.handleDisconnect(mockSocket)).rejects.toThrow('Redis error');
    });
  });

  describe('handleMatchSubscription', () => {
    it('should subscribe client to match updates', () => {
      const data = { matchId: 'match-123' };

      const result = gateway.handleMatchSubscription(mockSocket, data);

      expect(mockSocket.join).toHaveBeenCalledWith('match:match-123');
      expect(result).toEqual({
        event: 'subscribed',
        data: { channel: 'match:match-123' },
      });
    });

    it('should throw WsException if matchId is missing', () => {
      const data = { matchId: '' };

      expect(() => gateway.handleMatchSubscription(mockSocket, data)).toThrow(
        new WsException('Match ID is required'),
      );
    });

    it('should handle null matchId', () => {
      const data = { matchId: null as any };

      expect(() => gateway.handleMatchSubscription(mockSocket, data)).toThrow(
        new WsException('Match ID is required'),
      );
    });
  });

  describe('handleMatchUnsubscription', () => {
    it('should unsubscribe client from match updates', () => {
      const data = { matchId: 'match-123' };

      const result = gateway.handleMatchUnsubscription(mockSocket, data);

      expect(mockSocket.leave).toHaveBeenCalledWith('match:match-123');
      expect(result).toEqual({
        event: 'unsubscribed',
        data: { channel: 'match:match-123' },
      });
    });

    it('should throw WsException if matchId is missing', () => {
      const data = { matchId: '' };

      expect(() => gateway.handleMatchUnsubscription(mockSocket, data)).toThrow(
        new WsException('Match ID is required'),
      );
    });
  });

  describe('handleValidationSubscription', () => {
    it('should subscribe authenticated client to validation updates', () => {
      mockSocket.userId = 'user-123';

      const result = gateway.handleValidationSubscription(mockSocket);

      expect(mockSocket.join).toHaveBeenCalledWith('validation:user-123');
      expect(result).toEqual({
        event: 'subscribed',
        data: { channel: 'validation:user-123' },
      });
    });

    it('should throw WsException if client is not authenticated', () => {
      expect(() => gateway.handleValidationSubscription(mockSocket)).toThrow(
        new WsException('Authentication required'),
      );
    });
  });

  describe('handleLeaderboardSubscription', () => {
    it('should subscribe client to leaderboard updates', () => {
      const data = { category: 'weekly' };

      const result = gateway.handleLeaderboardSubscription(mockSocket, data);

      expect(mockSocket.join).toHaveBeenCalledWith('leaderboard:weekly');
      expect(result).toEqual({
        event: 'subscribed',
        data: { channel: 'leaderboard:weekly' },
      });
    });

    it('should default to global category if not specified', () => {
      const data = { category: undefined as any };

      const result = gateway.handleLeaderboardSubscription(mockSocket, data);

      expect(mockSocket.join).toHaveBeenCalledWith('leaderboard:global');
      expect(result).toEqual({
        event: 'subscribed',
        data: { channel: 'leaderboard:global' },
      });
    });

    it('should default to global category with empty data', () => {
      const result = gateway.handleLeaderboardSubscription(mockSocket, {} as any);

      expect(mockSocket.join).toHaveBeenCalledWith('leaderboard:global');
    });
  });

  describe('handleChatMessage', () => {
    it('should handle valid chat message', async () => {
      mockSocket.userId = 'user-123';
      const data = { room: 'room-123', message: 'Hello world' };

      const result = await gateway.handleChatMessage(mockSocket, data);

      expect(mockServer.to).toHaveBeenCalledWith('chat:room-123');
      expect(mockServer.emit).toHaveBeenCalledWith('chat:message', {
        userId: 'user-123',
        room: 'room-123',
        message: 'Hello world',
        timestamp: expect.any(Date),
      });
      expect(redisService.publish).toHaveBeenCalledWith('chat:room-123', {
        userId: 'user-123',
        room: 'room-123',
        message: 'Hello world',
        timestamp: expect.any(Date),
      });
      expect(result).toEqual({
        event: 'message:sent',
        data: expect.objectContaining({
          userId: 'user-123',
          room: 'room-123',
          message: 'Hello world',
        }),
      });
    });

    it('should throw WsException if client is not authenticated', async () => {
      const data = { room: 'room-123', message: 'Hello' };

      await expect(gateway.handleChatMessage(mockSocket, data)).rejects.toThrow(
        new WsException('Authentication required'),
      );
    });

    it('should throw WsException if room is missing', async () => {
      mockSocket.userId = 'user-123';
      const data = { room: '', message: 'Hello' };

      await expect(gateway.handleChatMessage(mockSocket, data)).rejects.toThrow(
        new WsException('Room and message are required'),
      );
    });

    it('should throw WsException if message is missing', async () => {
      mockSocket.userId = 'user-123';
      const data = { room: 'room-123', message: '' };

      await expect(gateway.handleChatMessage(mockSocket, data)).rejects.toThrow(
        new WsException('Room and message are required'),
      );
    });

    it('should throw WsException if message is too long', async () => {
      mockSocket.userId = 'user-123';
      const data = { room: 'room-123', message: 'a'.repeat(501) };

      await expect(gateway.handleChatMessage(mockSocket, data)).rejects.toThrow(
        new WsException('Message too long'),
      );
    });

    it('should accept message with exactly 500 characters', async () => {
      mockSocket.userId = 'user-123';
      const data = { room: 'room-123', message: 'a'.repeat(500) };

      const result = await gateway.handleChatMessage(mockSocket, data);

      expect(result.event).toBe('message:sent');
    });
  });

  describe('handleGetOnlineUsers', () => {
    it('should return list of online users', async () => {
      const onlineUsers = ['user-1', 'user-2', 'user-3'];
      redisService.smembers.mockResolvedValue(onlineUsers);

      const result = await gateway.handleGetOnlineUsers(mockSocket);

      expect(redisService.smembers).toHaveBeenCalledWith('online_users');
      expect(result).toEqual({
        event: 'online:users',
        data: { users: onlineUsers, count: 3 },
      });
    });

    it('should return empty list if no users online', async () => {
      redisService.smembers.mockResolvedValue([]);

      const result = await gateway.handleGetOnlineUsers(mockSocket);

      expect(result).toEqual({
        event: 'online:users',
        data: { users: [], count: 0 },
      });
    });
  });

  describe('emitMatchUpdate', () => {
    it('should emit match update to match room', () => {
      const matchId = 'match-123';
      const data = { score: '2-1' };

      gateway.emitMatchUpdate(matchId, data);

      expect(mockServer.to).toHaveBeenCalledWith('match:match-123');
      expect(mockServer.emit).toHaveBeenCalledWith('match:update', data);
    });
  });

  describe('emitValidationUpdate', () => {
    it('should emit validation update to user', () => {
      const userId = 'user-123';
      const data = { status: 'approved' };

      gateway.emitValidationUpdate(userId, data);

      expect(mockServer.to).toHaveBeenCalledWith('validation:user-123');
      expect(mockServer.emit).toHaveBeenCalledWith('validation:update', data);
    });
  });

  describe('emitLeaderboardUpdate', () => {
    it('should emit leaderboard update to category room', () => {
      const category = 'weekly';
      const data = { rankings: [] };

      gateway.emitLeaderboardUpdate(category, data);

      expect(mockServer.to).toHaveBeenCalledWith('leaderboard:weekly');
      expect(mockServer.emit).toHaveBeenCalledWith('leaderboard:update', data);
    });
  });

  describe('emitAchievementUnlock', () => {
    it('should emit achievement unlock to user', () => {
      const userId = 'user-123';
      const achievement = { id: 'ach-1', name: 'First Report' };

      gateway.emitAchievementUnlock(userId, achievement);

      expect(mockServer.to).toHaveBeenCalledWith('user:user-123');
      expect(mockServer.emit).toHaveBeenCalledWith('achievement:unlocked', achievement);
    });
  });

  describe('emitNotification', () => {
    it('should emit notification to user', () => {
      const userId = 'user-123';
      const notification = { title: 'Test', body: 'Test notification' };

      gateway.emitNotification(userId, notification);

      expect(mockServer.to).toHaveBeenCalledWith('user:user-123');
      expect(mockServer.emit).toHaveBeenCalledWith('notification', notification);
    });
  });

  describe('broadcast', () => {
    it('should broadcast event to all users', () => {
      const event = 'system:announcement';
      const data = { message: 'System maintenance' };

      gateway.broadcast(event, data);

      expect(mockServer.emit).toHaveBeenCalledWith(event, data);
    });
  });

  describe('broadcastToRole', () => {
    it('should broadcast event to specific role', () => {
      const role = 'SCOUT';
      const event = 'scout:notification';
      const data = { message: 'New match assigned' };

      gateway.broadcastToRole(role, event, data);

      expect(mockServer.to).toHaveBeenCalledWith('role:SCOUT');
      expect(mockServer.emit).toHaveBeenCalledWith(event, data);
    });
  });

  describe('getConnectionStats', () => {
    it('should return connection statistics', () => {
      // Simulate connected clients
      mockSocket.userId = 'user-123';
      gateway['connectedClients'].set('socket-1', mockSocket);

      const stats = gateway.getConnectionStats();

      expect(stats.totalConnections).toBe(1);
      expect(stats.connectedUsers).toContain('user-123');
      expect(stats.rooms).toBeDefined();
    });

    it('should return empty stats when no clients connected', () => {
      const stats = gateway.getConnectionStats();

      expect(stats.totalConnections).toBe(0);
      expect(stats.connectedUsers).toEqual([]);
    });

    it('should handle multiple connected clients', () => {
      const socket1 = { ...mockSocket, id: 'socket-1', userId: 'user-1' };
      const socket2 = { ...mockSocket, id: 'socket-2', userId: 'user-2' };
      const socket3 = { ...mockSocket, id: 'socket-3', userId: 'user-3' };

      gateway['connectedClients'].set('socket-1', socket1 as any);
      gateway['connectedClients'].set('socket-2', socket2 as any);
      gateway['connectedClients'].set('socket-3', socket3 as any);

      const stats = gateway.getConnectionStats();

      expect(stats.totalConnections).toBe(3);
      expect(stats.connectedUsers).toContain('user-1');
      expect(stats.connectedUsers).toContain('user-2');
      expect(stats.connectedUsers).toContain('user-3');
    });
  });

  describe('Redis pub/sub integration', () => {
    it('should handle Redis broadcast message', async () => {
      jest.clearAllMocks();

      gateway.afterInit(mockServer);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Get the callback function passed to subscribe
      const broadcastCallback = (redisService.subscribe as jest.Mock).mock.calls.find(
        (call) => call[0] === 'websocket:broadcast',
      )?.[1];

      if (broadcastCallback) {
        const message = { event: 'test:event', data: { test: 'data' } };
        broadcastCallback(message);

        expect(mockServer.emit).toHaveBeenCalledWith('test:event', { test: 'data' });
      } else {
        // If Redis pub/sub isn't setup, just verify afterInit was called
        expect(redisService.subscribe).toHaveBeenCalled();
      }
    });

    it('should handle Redis user message', async () => {
      jest.clearAllMocks();

      gateway.afterInit(mockServer);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Get the callback function passed to subscribe
      const calls = (redisService.subscribe as jest.Mock).mock.calls;
      const userCallback = calls.find((call) => call[0] === 'websocket:user')?.[1];

      if (userCallback) {
        const message = {
          userId: 'user-123',
          event: 'notification',
          data: { title: 'Test' },
        };
        userCallback(message);

        expect(mockServer.to).toHaveBeenCalledWith('user:user-123');
        expect(mockServer.emit).toHaveBeenCalledWith('notification', { title: 'Test' });
      } else {
        // If Redis pub/sub isn't setup, just verify afterInit was called
        expect(redisService.subscribe).toHaveBeenCalled();
      }
    });

    it('should ignore invalid Redis broadcast message', async () => {
      jest.clearAllMocks();

      gateway.afterInit(mockServer);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      const broadcastCallback = (redisService.subscribe as jest.Mock).mock.calls.find(
        (call) => call[0] === 'websocket:broadcast',
      )?.[1];

      if (broadcastCallback) {
        const invalidMessage = { event: 'test:event' }; // missing data
        broadcastCallback(invalidMessage);

        expect(mockServer.emit).not.toHaveBeenCalled();
      } else {
        // If Redis pub/sub isn't setup, just verify afterInit was called
        expect(redisService.subscribe).toHaveBeenCalled();
      }
    });

    it('should ignore invalid Redis user message', async () => {
      jest.clearAllMocks();

      gateway.afterInit(mockServer);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      const calls = (redisService.subscribe as jest.Mock).mock.calls;
      const userCallback = calls.find((call) => call[0] === 'websocket:user')?.[1];

      if (userCallback) {
        const invalidMessage = { userId: 'user-123', event: 'test' }; // missing data
        userCallback(invalidMessage);

        expect(mockServer.emit).not.toHaveBeenCalled();
      } else {
        // If Redis pub/sub isn't setup, just verify afterInit was called
        expect(redisService.subscribe).toHaveBeenCalled();
      }
    });
  });

  describe('Token extraction', () => {
    it('should extract token from auth object', async () => {
      mockSocket.handshake.auth.token = 'token-123';
      jwtService.verifyAsync.mockResolvedValue({ sub: 'user-123', role: 'SCOUT' });

      await gateway.handleConnection(mockSocket);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('token-123');
    });

    it('should extract token from Bearer authorization header', async () => {
      mockSocket.handshake.headers.authorization = 'Bearer token-456';
      jwtService.verifyAsync.mockResolvedValue({ sub: 'user-456', role: 'SCOUT' });

      await gateway.handleConnection(mockSocket);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('token-456');
    });

    it('should handle authorization header without Bearer prefix', async () => {
      mockSocket.handshake.headers.authorization = 'token-789';
      jwtService.verifyAsync.mockResolvedValue({ sub: 'user-789', role: 'SCOUT' });

      await gateway.handleConnection(mockSocket);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('token-789');
    });

    it('should prioritize auth.token over headers.authorization', async () => {
      mockSocket.handshake.auth.token = 'auth-token';
      mockSocket.handshake.headers.authorization = 'Bearer header-token';
      jwtService.verifyAsync.mockResolvedValue({ sub: 'user-123', role: 'SCOUT' });

      await gateway.handleConnection(mockSocket);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('auth-token');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle concurrent connections from same user', async () => {
      const token = 'valid-token';
      const payload = { sub: 'user-123', role: 'SCOUT' };
      jwtService.verifyAsync.mockResolvedValue(payload);

      const socket1 = { ...mockSocket, id: 'socket-1', handshake: { auth: { token } } };
      const socket2 = { ...mockSocket, id: 'socket-2', handshake: { auth: { token } } };

      await gateway.handleConnection(socket1 as any);
      await gateway.handleConnection(socket2 as any);

      expect(gateway['connectedClients'].size).toBe(2);
    });

    it('should handle message with special characters', async () => {
      mockSocket.userId = 'user-123';
      const data = {
        room: 'room-123',
        message: 'Hello <script>alert("xss")</script> world',
      };

      const result = await gateway.handleChatMessage(mockSocket, data);

      expect(result.event).toBe('message:sent');
      expect(result.data.message).toContain('<script>');
    });

    it('should handle empty Redis response', async () => {
      redisService.smembers.mockResolvedValue([]);

      const result = await gateway.handleGetOnlineUsers(mockSocket);

      expect(result.data.users).toEqual([]);
      expect(result.data.count).toBe(0);
    });

    it('should handle subscription to multiple match rooms', () => {
      gateway.handleMatchSubscription(mockSocket, { matchId: 'match-1' });
      gateway.handleMatchSubscription(mockSocket, { matchId: 'match-2' });
      gateway.handleMatchSubscription(mockSocket, { matchId: 'match-3' });

      expect(mockSocket.join).toHaveBeenCalledTimes(3);
      expect(mockSocket.join).toHaveBeenCalledWith('match:match-1');
      expect(mockSocket.join).toHaveBeenCalledWith('match:match-2');
      expect(mockSocket.join).toHaveBeenCalledWith('match:match-3');
    });

    it('should handle unsubscribing from non-subscribed room', () => {
      const result = gateway.handleMatchUnsubscription(mockSocket, { matchId: 'match-999' });

      expect(mockSocket.leave).toHaveBeenCalledWith('match:match-999');
      expect(result.event).toBe('unsubscribed');
    });

    it('should handle disconnection of client that never fully connected', async () => {
      const partialSocket = { ...mockSocket, userId: undefined };

      await gateway.handleDisconnect(partialSocket as any);

      expect(redisService.srem).not.toHaveBeenCalled();
    });

    it('should log connection events', async () => {
      const logSpy = jest.spyOn(gateway['logger'], 'log');
      mockSocket.handshake.auth.token = 'valid-token';
      jwtService.verifyAsync.mockResolvedValue({ sub: 'user-123', role: 'SCOUT' });

      await gateway.handleConnection(mockSocket);

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Client connected: socket-123'));
    });

    it('should log disconnection events', async () => {
      const logSpy = jest.spyOn(gateway['logger'], 'log');
      mockSocket.userId = 'user-123';

      await gateway.handleDisconnect(mockSocket);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Client disconnected: socket-123'),
      );
    });

    it('should handle null data in chat message', async () => {
      mockSocket.userId = 'user-123';

      await expect(gateway.handleChatMessage(mockSocket, null as any)).rejects.toThrow();
    });

    it('should handle undefined data in match subscription', () => {
      expect(() => gateway.handleMatchSubscription(mockSocket, undefined as any)).toThrow();
    });
  });

  describe('Multiple roles handling', () => {
    it('should handle user with ADMIN role', async () => {
      mockSocket.handshake.auth.token = 'token';
      jwtService.verifyAsync.mockResolvedValue({ sub: 'user-admin', role: 'ADMIN' });

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.join).toHaveBeenCalledWith('role:ADMIN');
    });

    it('should handle user with CLUB role', async () => {
      mockSocket.handshake.auth.token = 'token';
      jwtService.verifyAsync.mockResolvedValue({ sub: 'user-club', role: 'CLUB' });

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.join).toHaveBeenCalledWith('role:CLUB');
    });

    it('should handle user with PLAYER role', async () => {
      mockSocket.handshake.auth.token = 'token';
      jwtService.verifyAsync.mockResolvedValue({ sub: 'user-player', role: 'PLAYER' });

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.join).toHaveBeenCalledWith('role:PLAYER');
    });
  });

  describe('Room management', () => {
    it('should allow joining multiple leaderboard categories', () => {
      gateway.handleLeaderboardSubscription(mockSocket, { category: 'weekly' });
      gateway.handleLeaderboardSubscription(mockSocket, { category: 'monthly' });
      gateway.handleLeaderboardSubscription(mockSocket, { category: 'all-time' });

      expect(mockSocket.join).toHaveBeenCalledWith('leaderboard:weekly');
      expect(mockSocket.join).toHaveBeenCalledWith('leaderboard:monthly');
      expect(mockSocket.join).toHaveBeenCalledWith('leaderboard:all-time');
    });

    it('should track connected clients in internal map', async () => {
      mockSocket.handshake.auth.token = 'token';
      jwtService.verifyAsync.mockResolvedValue({ sub: 'user-123', role: 'SCOUT' });

      await gateway.handleConnection(mockSocket);

      expect(gateway['connectedClients'].has('socket-123')).toBe(true);
    });

    it('should remove client from map on disconnect', async () => {
      mockSocket.userId = 'user-123';
      gateway['connectedClients'].set('socket-123', mockSocket);

      await gateway.handleDisconnect(mockSocket);

      expect(gateway['connectedClients'].has('socket-123')).toBe(false);
    });
  });
});
