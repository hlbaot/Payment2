import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderStatus } from 'src/order/entities/order.entity';
import { OrderEvent } from './entities/order-event.entity';

@Injectable()
export class OrderEventService {
  constructor(
    @InjectRepository(OrderEvent)
    private readonly orderEventRepository: Repository<OrderEvent>,
  ) {}

  async create(
    orderId: number,
    status: OrderStatus,
    note?: string | null,
  ): Promise<OrderEvent> {
    const event = this.orderEventRepository.create({
      orderId,
      status,
      note: note ?? null,
    });

    return this.orderEventRepository.save(event);
  }

  async findByOrderId(orderId: number): Promise<OrderEvent[]> {
    return this.orderEventRepository.find({
      where: { orderId },
      order: { createdAt: 'ASC' },
    });
  }
}
