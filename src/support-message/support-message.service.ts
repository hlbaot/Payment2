import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSupportMessageDto } from './dto/create-support-message.dto';
import { UpdateSupportMessageDto } from './dto/update-support-message.dto';
import {
  SupportMessage,
  SupportMessageStatus,
} from './entities/support-message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SupportMessageService {
  constructor(
    @InjectRepository(SupportMessage)
    private readonly supportMessageRepository: Repository<SupportMessage>,
  ) {}

  async create(createSupportMessageDto: CreateSupportMessageDto): Promise<SupportMessage> {
    const supportMessage = this.supportMessageRepository.create({
      userId: createSupportMessageDto.userId,
      supporterId: createSupportMessageDto.supporterId,
      messageText: createSupportMessageDto.messageText,
      status: createSupportMessageDto.status ?? SupportMessageStatus.SENT,
      createdAt: new Date(),
    });
    return await this.supportMessageRepository.save(supportMessage);
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
}
