import { Test, TestingModule } from '@nestjs/testing';
import { SupportMessageController } from './support-message.controller';
import { SupportMessageService } from './support-message.service';

describe('SupportMessageController', () => {
  let controller: SupportMessageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupportMessageController],
      providers: [SupportMessageService],
    }).compile();

    controller = module.get<SupportMessageController>(SupportMessageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
