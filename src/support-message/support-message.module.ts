import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationModule } from 'src/notification/notification.module';
import { WalletModule } from 'src/wallet/wallet.module';
import { SupportMessageService } from './support-message.service';
import { SupportMessageController } from './support-message.controller';
import { SupportMessage } from './entities/support-message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SupportMessage]),
    WalletModule,
    NotificationModule,
  ],
  controllers: [SupportMessageController],
  providers: [SupportMessageService],
  exports: [SupportMessageService],
})
export class SupportMessageModule {}
