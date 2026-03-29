import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CounterServiceService } from './counter-service.service';
import { CounterServiceController } from './counter-service.controller';
import { CounterService } from './entities/counter-service.entity';
import { Counter } from 'src/counter/entities/counter.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CounterService, Counter])],
  controllers: [CounterServiceController],
  providers: [CounterServiceService],
  exports: [CounterServiceService],
})
export class CounterServiceModule {}
