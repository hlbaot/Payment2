import { Test, TestingModule } from '@nestjs/testing';
import { CounterServiceController } from './counter-service.controller';
import { CounterServiceService } from './counter-service.service';

describe('CounterServiceController', () => {
  let controller: CounterServiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CounterServiceController],
      providers: [CounterServiceService],
    }).compile();

    controller = module.get<CounterServiceController>(CounterServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
