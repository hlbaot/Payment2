import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Counter } from 'src/counter/entities/counter.entity';
import { CounterService } from 'src/counter-service/entities/counter-service.entity';
import { NotificationModule } from 'src/notification/notification.module';
import { OrderEventModule } from 'src/order-event/order-event.module';
import { User } from 'src/user/entities/user.entity';
import { Wallet } from 'src/wallet/entities/wallet.entity';
import { WalletTransactionModule } from 'src/wallet-transaction/wallet-transaction.module';
import { Order } from './entities/order.entity';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Wallet, Counter, CounterService, User]),
    NotificationModule,
    WalletTransactionModule,
    OrderEventModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
