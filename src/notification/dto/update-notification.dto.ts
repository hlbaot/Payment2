import { NotificationType } from '../entities/notification.entity';

export class UpdateNotificationDto {
  userId?: number;
  senderId?: number;
  receiverId?: number;
  type?: NotificationType;
  title?: string;
  message?: string;
  referenceType?: string;
  referenceId?: number;
  isRead?: boolean;
  readAt?: Date | null;
}
