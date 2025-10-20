import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register-device')
  @UseGuards(JwtAuthGuard)
  registerDevice(@Body() registerDeviceDto: RegisterDeviceDto) {
    return this.notificationsService.registerDevice(
      registerDeviceDto.userId,
      registerDeviceDto.fcmToken,
    );
  }

  @Post('unregister-device')
  @UseGuards(JwtAuthGuard)
  unregisterDevice(@Body() body: { userId: string; fcmToken: string }) {
    return this.notificationsService.unregisterDevice(body.userId, body.fcmToken);
  }

  @Post('send')
  @UseGuards(JwtAuthGuard)
  sendToUser(@Body() sendNotificationDto: SendNotificationDto) {
    return this.notificationsService.sendToUser(sendNotificationDto);
  }

  @Post('send-multiple')
  @UseGuards(JwtAuthGuard)
  sendToMultiple(
    @Body()
    body: {
      userIds: string[];
      title: string;
      body: string;
      type: string;
      data?: Record<string, string>;
    },
  ) {
    return this.notificationsService.sendToMultipleUsers(
      body.userIds,
      body.title,
      body.body,
      body.type,
      body.data,
    );
  }

  @Post('send-topic')
  @UseGuards(JwtAuthGuard)
  sendToTopic(
    @Body() body: { topic: string; title: string; body: string; data?: Record<string, string> },
  ) {
    return this.notificationsService.sendToTopic(body.topic, body.title, body.body, body.data);
  }

  @Post('subscribe-topic')
  @UseGuards(JwtAuthGuard)
  subscribeToTopic(@Body() body: { userIds: string[]; topic: string }) {
    return this.notificationsService.subscribeToTopic(body.userIds, body.topic);
  }

  @Post('unsubscribe-topic')
  @UseGuards(JwtAuthGuard)
  unsubscribeFromTopic(@Body() body: { userIds: string[]; topic: string }) {
    return this.notificationsService.unsubscribeFromTopic(body.userIds, body.topic);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  getUserNotifications(@Param('userId') userId: string, @Query('unreadOnly') unreadOnly?: string) {
    return this.notificationsService.getUserNotifications(userId, unreadOnly === 'true');
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  markAsRead(@Param('id') id: string, @Body('userId') userId: string) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Patch('user/:userId/read-all')
  @UseGuards(JwtAuthGuard)
  markAllAsRead(@Param('userId') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Post('match/:matchId/reminder')
  @UseGuards(JwtAuthGuard)
  sendMatchReminder(@Param('matchId') matchId: string) {
    return this.notificationsService.sendMatchReminder(matchId);
  }

  @Post('report/:reportId/notify')
  @UseGuards(JwtAuthGuard)
  sendReportNotification(@Param('reportId') reportId: string) {
    return this.notificationsService.sendReportNotification(reportId);
  }
}
