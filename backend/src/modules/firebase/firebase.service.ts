import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    // Try environment variables first (for Railway/production)
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

    if (projectId && clientEmail && privateKey) {
      try {
        // Replace literal \n with actual newlines
        const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: formattedPrivateKey,
          }),
        });

        this.logger.log('[FIREBASE] Admin SDK initialized');
        return;
      } catch (error) {
        this.logger.error('Failed to initialize Firebase with env vars', error);
      }
    }

    // Fallback to JSON file (for local development)
    const serviceAccountPath = this.configService.get<string>('FIREBASE_ADMIN_SDK_JSON_PATH');
    const fcmProjectId = this.configService.get<string>('FCM_PROJECT_ID');

    if (!serviceAccountPath || !fcmProjectId) {
      this.logger.warn('Firebase credentials not configured');
      return;
    }

    try {
      const serviceAccountFullPath = path.resolve(process.cwd(), serviceAccountPath);

      if (!fs.existsSync(serviceAccountFullPath)) {
        this.logger.warn(`Firebase service account file not found at: ${serviceAccountFullPath}`);
        return;
      }

      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountFullPath, 'utf8'));

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: fcmProjectId,
      });

      this.logger.log('[FIREBASE] Admin SDK initialized from file');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK', error);
    }
  }

  /**
   * Send a push notification to a single device
   * @param token - FCM device token
   * @param title - Notification title
   * @param body - Notification body
   * @param data - Additional data payload
   * @returns Message ID
   */
  async sendNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<string> {
    const message: admin.messaging.Message = {
      notification: {
        title,
        body,
      },
      data,
      token,
    };

    const messageId = await admin.messaging().send(message);
    this.logger.log(`Notification sent: ${messageId}`);
    return messageId;
  }

  /**
   * Send notifications to multiple devices
   * @param tokens - Array of FCM device tokens
   * @param title - Notification title
   * @param body - Notification body
   * @param data - Additional data payload
   * @returns Batch response
   */
  async sendMulticast(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<admin.messaging.BatchResponse> {
    const message: admin.messaging.MulticastMessage = {
      notification: {
        title,
        body,
      },
      data,
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    this.logger.log(`Multicast sent: ${response.successCount}/${tokens.length} successful`);
    return response;
  }

  /**
   * Send notification to a topic
   * @param topic - Topic name
   * @param title - Notification title
   * @param body - Notification body
   * @param data - Additional data payload
   * @returns Message ID
   */
  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<string> {
    const message: admin.messaging.Message = {
      notification: {
        title,
        body,
      },
      data,
      topic,
    };

    const messageId = await admin.messaging().send(message);
    this.logger.log(`Topic notification sent: ${messageId}`);
    return messageId;
  }

  /**
   * Subscribe devices to a topic
   * @param tokens - Array of FCM device tokens
   * @param topic - Topic name
   * @returns Subscription response
   */
  async subscribeToTopic(
    tokens: string[],
    topic: string,
  ): Promise<admin.messaging.MessagingTopicManagementResponse> {
    const response = await admin.messaging().subscribeToTopic(tokens, topic);
    this.logger.log(`Subscribed ${response.successCount} devices to topic: ${topic}`);
    return response;
  }

  /**
   * Unsubscribe devices from a topic
   * @param tokens - Array of FCM device tokens
   * @param topic - Topic name
   * @returns Unsubscription response
   */
  async unsubscribeFromTopic(
    tokens: string[],
    topic: string,
  ): Promise<admin.messaging.MessagingTopicManagementResponse> {
    const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
    this.logger.log(`Unsubscribed ${response.successCount} devices from topic: ${topic}`);
    return response;
  }

  /**
   * Send data-only message (silent notification)
   * @param token - FCM device token
   * @param data - Data payload
   * @returns Message ID
   */
  async sendDataMessage(token: string, data: Record<string, string>): Promise<string> {
    const message: admin.messaging.Message = {
      data,
      token,
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
    };

    const messageId = await admin.messaging().send(message);
    this.logger.log(`Data message sent: ${messageId}`);
    return messageId;
  }
}
