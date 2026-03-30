import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { WalletModule } from './wallet/wallet.module';
import { CounterModule } from './counter/counter.module';
import { CounterServiceModule } from './counter-service/counter-service.module';
import { SupportMessageModule } from './support-message/support-message.module';
import { NotificationModule } from './notification/notification.module';
import { OrderModule } from './order/order.module';
import { OrderEventModule } from './order-event/order-event.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSource } from 'db/db-source';
import { ConfigModule } from '@nestjs/config';
import { WalletTransactionModule } from './wallet-transaction/wallet-transaction.module';
import { WebsocketsModule } from './websockets/websockets.module';

@Module({
  imports: [
  ConfigModule.forRoot({
    isGlobal: true, // Đảm bảo ConfigModule được sử dụng toàn cục trong ứng dụng
    envFilePath: ".env", // Đảm bảo rằng tệp .env được tải
  }),
  TypeOrmModule.forRoot(dataSource.options),
  AuthModule,
  UserModule,
  RoleModule,
  WalletModule,
  CounterModule,
  CounterServiceModule,
  SupportMessageModule,
  WebsocketsModule,
  NotificationModule,
  OrderModule,
  OrderEventModule,
  WalletTransactionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
