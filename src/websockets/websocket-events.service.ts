import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { Notification } from 'src/notification/entities/notification.entity';

@Injectable()
export class WebsocketEventsService {
  private readonly logger = new Logger(WebsocketEventsService.name);

  private server: Server | null = null;

  setServer(server: Server): void {
    this.server = server;
  }

  emitToUser(userId: number, event: string, payload: unknown): void {
    if (!this.server) {
      this.logger.debug(
        `Socket server is not ready yet. Skipping event "${event}" for user ${userId}.`,
      );
      return;
    }

    this.server.to(`user_${userId}`).emit(event, payload);
  }

  emitNotification(notification: Notification): void {
    this.emitToUser(notification.userId, 'notification:new', {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      referenceType: notification.referenceType,
      referenceId: notification.referenceId,
      isRead: notification.isRead,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    });
  }
}
