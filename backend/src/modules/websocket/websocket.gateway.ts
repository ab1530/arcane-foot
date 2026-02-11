import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../cache/redis.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  role?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private readonly connectedClients = new Map<string, AuthenticatedSocket>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  afterInit(_server: Server) {
    this.logger.log('WebSocket Gateway initialized');

    // Subscribe to Redis pub/sub channels
    this.setupRedisPubSub();
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract and verify JWT token
      const token = this.extractToken(client);

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.verifyToken(token);

      if (!payload) {
        client.disconnect();
        return;
      }

      // Store user info in socket
      client.userId = payload.sub;
      client.role = payload.role;

      // Add to connected clients
      this.connectedClients.set(client.id, client);

      // Join user-specific room
      client.join(`user:${client.userId}`);

      // Join role-specific room
      if (client.role) {
        client.join(`role:${client.role}`);
      }

      this.logger.log(`Client connected: ${client.id} (User: ${client.userId})`);

      // Send welcome message
      client.emit('connected', {
        message: 'Connected to Arcane Football real-time server',
        userId: client.userId,
        timestamp: new Date(),
      });

      // Track connection in Redis
      await this.redisService.sadd('online_users', client.userId);

      // Notify others that user is online
      this.server.to('all').emit('user:online', {
        userId: client.userId,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    // Remove from connected clients
    this.connectedClients.delete(client.id);

    if (client.userId) {
      // Remove from online users
      await this.redisService.srem('online_users', client.userId);

      // Notify others that user is offline
      this.server.to('all').emit('user:offline', {
        userId: client.userId,
        timestamp: new Date(),
      });
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Subscribe to match updates
   */
  @SubscribeMessage('subscribe:match')
  handleMatchSubscription(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { matchId: string },
  ) {
    if (!data.matchId) {
      throw new WsException('Match ID is required');
    }

    client.join(`match:${data.matchId}`);
    this.logger.log(`Client ${client.id} subscribed to match ${data.matchId}`);

    return {
      event: 'subscribed',
      data: { channel: `match:${data.matchId}` },
    };
  }

  /**
   * Unsubscribe from match updates
   */
  @SubscribeMessage('unsubscribe:match')
  handleMatchUnsubscription(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { matchId: string },
  ) {
    if (!data.matchId) {
      throw new WsException('Match ID is required');
    }

    client.leave(`match:${data.matchId}`);
    this.logger.log(`Client ${client.id} unsubscribed from match ${data.matchId}`);

    return {
      event: 'unsubscribed',
      data: { channel: `match:${data.matchId}` },
    };
  }

  /**
   * Subscribe to player validation updates
   */
  @SubscribeMessage('subscribe:validation')
  handleValidationSubscription(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.userId) {
      throw new WsException('Authentication required');
    }

    client.join(`validation:${client.userId}`);
    this.logger.log(`Client ${client.id} subscribed to validation updates`);

    return {
      event: 'subscribed',
      data: { channel: `validation:${client.userId}` },
    };
  }

  /**
   * Subscribe to leaderboard updates
   */
  @SubscribeMessage('subscribe:leaderboard')
  handleLeaderboardSubscription(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { category: string },
  ) {
    const category = data.category || 'global';
    client.join(`leaderboard:${category}`);
    this.logger.log(`Client ${client.id} subscribed to leaderboard ${category}`);

    return {
      event: 'subscribed',
      data: { channel: `leaderboard:${category}` },
    };
  }

  /**
   * Handle chat messages
   */
  @SubscribeMessage('chat:message')
  async handleChatMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { room: string; message: string },
  ) {
    if (!client.userId) {
      throw new WsException('Authentication required');
    }

    if (!data.room || !data.message) {
      throw new WsException('Room and message are required');
    }

    // Validate message length
    if (data.message.length > 500) {
      throw new WsException('Message too long');
    }

    const chatMessage = {
      userId: client.userId,
      room: data.room,
      message: data.message,
      timestamp: new Date(),
    };

    // Broadcast to room
    this.server.to(`chat:${data.room}`).emit('chat:message', chatMessage);

    // Store in Redis for history
    await this.redisService.publish(`chat:${data.room}`, chatMessage);

    return { event: 'message:sent', data: chatMessage };
  }

  /**
   * Get online users
   */
  @SubscribeMessage('get:online-users')
  async handleGetOnlineUsers(@ConnectedSocket() _client: AuthenticatedSocket) {
    const onlineUsers = await this.redisService.smembers('online_users');

    return {
      event: 'online:users',
      data: { users: onlineUsers, count: onlineUsers.length },
    };
  }

  // Public methods for emitting events from services

  /**
   * Emit match update
   */
  emitMatchUpdate(matchId: string, data: any) {
    this.server.to(`match:${matchId}`).emit('match:update', data);
  }

  /**
   * Emit player validation update
   */
  emitValidationUpdate(userId: string, data: any) {
    this.server.to(`validation:${userId}`).emit('validation:update', data);
  }

  /**
   * Emit leaderboard update
   */
  emitLeaderboardUpdate(category: string, data: any) {
    this.server.to(`leaderboard:${category}`).emit('leaderboard:update', data);
  }

  /**
   * Emit achievement unlock
   */
  emitAchievementUnlock(userId: string, achievement: any) {
    this.server.to(`user:${userId}`).emit('achievement:unlocked', achievement);
  }

  /**
   * Emit notification to user
   */
  emitNotification(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  /**
   * Broadcast to all users
   */
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }

  /**
   * Broadcast to role
   */
  broadcastToRole(role: string, event: string, data: any) {
    this.server.to(`role:${role}`).emit(event, data);
  }

  // Private helper methods

  private extractToken(client: Socket): string | null {
    const auth = client.handshake.auth?.token || client.handshake.headers?.authorization;

    if (!auth) {
      return null;
    }

    if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
      return auth.substring(7);
    }

    return auth;
  }

  private async verifyToken(token: string): Promise<any> {
    try {
      return await this.jwtService.verifyAsync(token);
    } catch (error) {
      this.logger.error(`Token verification failed: ${error.message}`);
      return null;
    }
  }

  private async setupRedisPubSub() {
    // Subscribe to Redis channels for cross-server communication
    await this.redisService.subscribe('websocket:broadcast', (message) => {
      this.handleRedisBroadcast(message);
    });

    await this.redisService.subscribe('websocket:user', (message) => {
      this.handleRedisUserMessage(message);
    });
  }

  private handleRedisBroadcast(message: any) {
    if (message.event && message.data) {
      this.server.emit(message.event, message.data);
    }
  }

  private handleRedisUserMessage(message: any) {
    if (message.userId && message.event && message.data) {
      this.server.to(`user:${message.userId}`).emit(message.event, message.data);
    }
  }

  /**
   * Get connection statistics
   */
  getConnectionStats() {
    return {
      totalConnections: this.connectedClients.size,
      connectedUsers: Array.from(this.connectedClients.values()).map((c) => c.userId),
      rooms: this.server.sockets.adapter.rooms,
    };
  }
}
