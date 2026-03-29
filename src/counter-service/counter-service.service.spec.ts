import { Test, TestingModule } from '@nestjs/testing';
import { CounterServiceService } from './counter-service.service';

describe('CounterServiceService', () => {
  let service: CounterServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CounterServiceService],
    }).compile();

    service = module.get<CounterServiceService>(CounterServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
