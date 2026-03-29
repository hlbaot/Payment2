import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CounterService } from './counter.service';
import { CounterController } from './counter.controller';
import { Counter } from './entities/counter.entity';
import { CounterService as CounterServiceEntity } from 'src/counter-service/entities/counter-service.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Counter, CounterServiceEntity])],
  controllers: [CounterController],
  providers: [CounterService],
  exports: [CounterService],
})
export class CounterModule {}
