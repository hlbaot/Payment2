import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEvent } from './entities/order-event.entity';
import { OrderEventController } from './order-event.controller';
import { OrderEventService } from './order-event.service';

@Module({
  imports: [TypeOrmModule.forFeature([OrderEvent])],
  controllers: [OrderEventController],
  providers: [OrderEventService],
  exports: [OrderEventService],
})
export class OrderEventModule {}
