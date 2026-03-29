import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    if (!createNotificationDto.message?.trim()) {
      throw new BadRequestException('message is required');
    }

    const targetUserId =
      createNotificationDto.userId ?? createNotificationDto.receiverId;

    if (!targetUserId) {
      throw new BadRequestException('userId or receiverId is required');
    }

    const receiver = await this.userRepository.findOne({
      where: { id: targetUserId },
    });
    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    let sender: User | null = null;
    if (createNotificationDto.senderId) {
      sender = await this.userRepository.findOne({
        where: { id: createNotificationDto.senderId },
      });
      if (!sender) {
        throw new NotFoundException('Sender not found');
      }
    }

    const notificationType =
      createNotificationDto.type ??
      (createNotificationDto.senderId
        ? NotificationType.SUPPORT_REPLY
        : NotificationType.SYSTEM_ANNOUNCEMENT);

    const notification = this.notificationRepo.create({
      userId: receiver.id,
      type: notificationType,
      title:
        createNotificationDto.title ??
        this.buildDefaultTitle(notificationType, sender),
      message: createNotificationDto.message,
      referenceType: createNotificationDto.referenceType ?? null,
      referenceId: createNotificationDto.referenceId ?? null,
      isRead: false,
      readAt: null,
    });

    return this.notificationRepo.save(notification);
  }

  async findAll(userId?: number): Promise<Notification[]> {
    return this.notificationRepo.find({
      ...(userId ? { where: { userId } } : {}),
      order: {
        createdAt: 'DESC',
      },
      relations: ['user'],
    });
  }

  async findOne(id: number): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    return notification;
  }

  async update(
    id: number,
    updateNotificationDto: UpdateNotificationDto,
  ): Promise<Notification> {
    const notification = await this.findOne(id);

    if (updateNotificationDto.isRead === true && !notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
    }

    if (updateNotificationDto.userId !== undefined) {
      notification.userId = updateNotificationDto.userId;
    }
    if (updateNotificationDto.type !== undefined) {
      notification.type = updateNotificationDto.type;
    }
    if (updateNotificationDto.title !== undefined) {
      notification.title = updateNotificationDto.title;
    }
    if (updateNotificationDto.message !== undefined) {
      notification.message = updateNotificationDto.message;
    }
    if (updateNotificationDto.referenceType !== undefined) {
      notification.referenceType = updateNotificationDto.referenceType;
    }
    if (updateNotificationDto.referenceId !== undefined) {
      notification.referenceId = updateNotificationDto.referenceId;
    }
    if (updateNotificationDto.readAt !== undefined) {
      notification.readAt = updateNotificationDto.readAt;
    }

    return this.notificationRepo.save(notification);
  }

  async remove(id: number) {
    const notification = await this.findOne(id);
    await this.notificationRepo.remove(notification);
    return { deleted: true, id };
  }

  private buildDefaultTitle(
    type: NotificationType,
    sender: User | null,
  ): string {
    switch (type) {
      case NotificationType.SUPPORT_REPLY:
        return sender
          ? `${sender.fullName || sender.email} sent you a message`
          : 'New support reply';
      case NotificationType.SUPPORT_OPENED:
        return 'New support conversation';
      case NotificationType.SUPPORT_RESOLVED:
        return 'Support conversation resolved';
      case NotificationType.DEPOSIT_CREATED:
        return 'New deposit request';
      case NotificationType.DEPOSIT_APPROVED:
        return 'Deposit approved';
      case NotificationType.DEPOSIT_REJECTED:
        return 'Deposit rejected';
      case NotificationType.ORDER_CREATED:
        return 'New order created';
      case NotificationType.ORDER_VERIFYING:
        return 'Order is being verified';
      case NotificationType.ORDER_PROCESSING:
        return 'Order is processing';
      case NotificationType.ORDER_COMPLETED:
        return 'Order completed';
      case NotificationType.ORDER_CANCELLED:
        return 'Order cancelled';
      case NotificationType.ORDER_REJECTED:
        return 'Order rejected';
      case NotificationType.COMMISSION_ADDED:
        return 'Commission added';
      case NotificationType.REFUND_ADDED:
        return 'Refund added';
      case NotificationType.SYSTEM_ANNOUNCEMENT:
      default:
        return 'System notification';
    }
  }
}
