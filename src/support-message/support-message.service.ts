import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSupportMessageDto } from './dto/create-support-message.dto';
import { UpdateSupportMessageDto } from './dto/update-support-message.dto';
import {
  SupportMessage,
  SupportMessageStatus,
} from './entities/support-message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletService } from 'src/wallet/wallet.service';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationType } from 'src/notification/entities/notification.entity';

@Injectable()
export class SupportMessageService {
  constructor(
    @InjectRepository(SupportMessage)
    private readonly supportMessageRepository: Repository<SupportMessage>,
    private readonly walletService: WalletService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(createSupportMessageDto: CreateSupportMessageDto): Promise<SupportMessage> {
    const supportMessage = this.supportMessageRepository.create({
      userId: createSupportMessageDto.userId,
      supporterId: createSupportMessageDto.supporterId,
      type: createSupportMessageDto.type ?? 'private',
      messageText: createSupportMessageDto.messageText,
      status: createSupportMessageDto.status ?? SupportMessageStatus.SENT,
      createdAt: new Date(),
    });
    const savedMessage = await this.supportMessageRepository.save(supportMessage);

    if (
      savedMessage.type === 'deposit_request' &&
      createSupportMessageDto.depositAmount
    ) {
      const wallet = await this.walletService.requestDepositByUserId(
        savedMessage.userId,
        {
          amount: createSupportMessageDto.depositAmount,
          note: createSupportMessageDto.messageText,
        },
      );

      await this.notificationService.create({
        userId: savedMessage.userId,
        type: NotificationType.DEPOSIT_CREATED,
        title: 'Deposit request received',
        message: `Your deposit request of ${createSupportMessageDto.depositAmount} is waiting for admin approval.`,
        referenceType: 'wallet',
        referenceId: wallet.id,
      });
    }

    return savedMessage;
  }

  async findAll(userA: number, userB: number): Promise<SupportMessage[]> {
    return this.supportMessageRepository.find({
      where: [
        { userId: userA, supporterId: userB },
        { userId: userB, supporterId: userA },
      ],
      order: { createdAt: "ASC" },
    });
  }

  async findMine(
    currentUserId: number,
    roles: string[] = [],
  ): Promise<SupportMessage[]> {
    const normalizedRoles = roles.map((role) => role.toUpperCase());

    if (normalizedRoles.includes('ADMIN')) {
      return this.supportMessageRepository.find({
        relations: ['user', 'supporter'],
        order: { createdAt: 'DESC' },
      });
    }

    if (normalizedRoles.includes('SUPPORTER')) {
      return this.supportMessageRepository.find({
        where: { supporterId: currentUserId },
        relations: ['user', 'supporter'],
        order: { createdAt: 'DESC' },
      });
    }

    return this.supportMessageRepository.find({
      where: { userId: currentUserId },
      relations: ['user', 'supporter'],
      order: { createdAt: 'DESC' },
    });
  }

  async findConversationForRequester(
    currentUserId: number,
    otherUserId: number,
    roles: string[] = [],
  ): Promise<SupportMessage[]> {
    const normalizedRoles = roles.map((role) => role.toUpperCase());

    if (normalizedRoles.includes('ADMIN')) {
      return this.findAll(currentUserId, otherUserId);
    }

    if (normalizedRoles.includes('SUPPORTER')) {
      return this.findAll(otherUserId, currentUserId);
    }

    return this.findAll(currentUserId, otherUserId);
  }

  async findOne(id: number): Promise<SupportMessage> {
    const supportMessage = await this.supportMessageRepository.findOne({
      where: { id },
      relations: ['user', 'supporter'],
    });

    if (!supportMessage) {
      throw new NotFoundException(`Support message ${id} not found`);
    }

    return supportMessage;
  }

  async findOneForRequester(
    id: number,
    currentUserId: number,
    roles: string[] = [],
  ): Promise<SupportMessage> {
    const supportMessage = await this.findOne(id);
    const normalizedRoles = roles.map((role) => role.toUpperCase());

    if (normalizedRoles.includes('ADMIN')) {
      return supportMessage;
    }

    if (
      supportMessage.userId !== currentUserId &&
      supportMessage.supporterId !== currentUserId
    ) {
      throw new ForbiddenException(
        'You can only access support messages related to your account',
      );
    }

    return supportMessage;
  }

  async update(
    id: number,
    updateSupportMessageDto: UpdateSupportMessageDto,
  ): Promise<SupportMessage> {
    const supportMessage = await this.findOne(id);

    if (updateSupportMessageDto.userId !== undefined) {
      supportMessage.userId = updateSupportMessageDto.userId;
    }
    if (updateSupportMessageDto.supporterId !== undefined) {
      supportMessage.supporterId = updateSupportMessageDto.supporterId;
    }
    if (updateSupportMessageDto.messageText !== undefined) {
      supportMessage.messageText = updateSupportMessageDto.messageText;
    }
    if (updateSupportMessageDto.type !== undefined) {
      supportMessage.type = updateSupportMessageDto.type;
    }
    if (updateSupportMessageDto.status !== undefined) {
      supportMessage.status = updateSupportMessageDto.status;
    }

    return this.supportMessageRepository.save(supportMessage);
  }

  async remove(id: number) {
    const supportMessage = await this.findOne(id);
    await this.supportMessageRepository.remove(supportMessage);
    return { deleted: true, id };
  }

  async findPendingDepositRequests(): Promise<SupportMessage[]> {
    const messages = await this.supportMessageRepository.find({
      where: [
        { type: 'deposit_request' },
        { type: 'deposit_forwarded_to_admin' },
      ],
      relations: ['user', 'supporter'],
      order: { createdAt: 'DESC' },
    });

    const pendingMessages = await Promise.all(
      messages.map(async (message) => {
        try {
          const wallet = await this.walletService.findByUserId(message.userId);
          return wallet.depositStatus === 'pending' ? message : null;
        } catch {
          return null;
        }
      }),
    );

    return pendingMessages.filter(
      (message): message is SupportMessage => message !== null,
    );
  }

  async forwardDepositRequestToAdmin(id: number): Promise<SupportMessage> {
    const supportMessage = await this.findOne(id);

    if (
      supportMessage.type !== 'deposit_request' &&
      supportMessage.type !== 'deposit_forwarded_to_admin'
    ) {
      throw new ForbiddenException(
        'Only deposit request messages can be forwarded to admin',
      );
    }

    supportMessage.type = 'deposit_forwarded_to_admin';
    supportMessage.status = SupportMessageStatus.READ;
    const savedMessage = await this.supportMessageRepository.save(supportMessage);

    await this.notificationService.create({
      userId: savedMessage.userId,
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      title: 'Deposit request forwarded',
      message:
        'Your deposit request has been forwarded to admin and is waiting for processing.',
      referenceType: 'support_message',
      referenceId: savedMessage.id,
    });

    return savedMessage;
  }
}
