import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  userId?: number;
  senderId?: number;
  receiverId?: number;
  type?: NotificationType;
  title?: string;
  message: string;
  referenceType?: string;
  referenceId?: number;
}
