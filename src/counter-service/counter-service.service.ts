import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCounterServiceDto } from './dto/create-counter-service.dto';
import { UpdateCounterServiceDto } from './dto/update-counter-service.dto';
import { Repository } from 'typeorm';
import {
  CounterService,
} from './entities/counter-service.entity';
import { Counter } from 'src/counter/entities/counter.entity';

@Injectable()
export class CounterServiceService {
  constructor(
    @InjectRepository(CounterService)
    private readonly counterServiceRepository: Repository<CounterService>,
    @InjectRepository(Counter)
    private readonly counterRepository: Repository<Counter>,
  ) {}

  async create(
    createCounterServiceDto: CreateCounterServiceDto,
  ): Promise<CounterService> {
    await this.ensureCounterExists(createCounterServiceDto.counterId);

    const counterService = this.counterServiceRepository.create({
      counterId: createCounterServiceDto.counterId,
      serviceCode: createCounterServiceDto.serviceCode,
      name: createCounterServiceDto.name,
      category: createCounterServiceDto.category,
      commissionRate: createCounterServiceDto.commissionRate ?? '0',
      isActive: createCounterServiceDto.isActive ?? true,
    });

    return this.counterServiceRepository.save(counterService);
  }

  async findAll(): Promise<CounterService[]> {
    return this.counterServiceRepository.find({
      relations: ['counter'],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<CounterService> {
    const counterService = await this.counterServiceRepository.findOne({
      where: { id },
      relations: ['counter'],
    });

    if (!counterService) {
      throw new NotFoundException(`Counter service ${id} not found`);
    }

    return counterService;
  }

  async findByCounterId(counterId: number): Promise<CounterService[]> {
    await this.ensureCounterExists(counterId);

    return this.counterServiceRepository.find({
      where: { counterId },
      relations: ['counter'],
      order: { id: 'ASC' },
    });
  }

  async update(
    id: number,
    updateCounterServiceDto: UpdateCounterServiceDto,
  ): Promise<CounterService> {
    const counterService = await this.findOne(id);

    if (updateCounterServiceDto.counterId !== undefined) {
      await this.ensureCounterExists(updateCounterServiceDto.counterId);
      counterService.counterId = updateCounterServiceDto.counterId;
    }
    if (updateCounterServiceDto.serviceCode !== undefined) {
      counterService.serviceCode = updateCounterServiceDto.serviceCode;
    }
    if (updateCounterServiceDto.name !== undefined) {
      counterService.name = updateCounterServiceDto.name;
    }
    if (updateCounterServiceDto.category !== undefined) {
      counterService.category = updateCounterServiceDto.category;
    }
    if (updateCounterServiceDto.commissionRate !== undefined) {
      counterService.commissionRate = updateCounterServiceDto.commissionRate;
    }
    if (updateCounterServiceDto.isActive !== undefined) {
      counterService.isActive = updateCounterServiceDto.isActive;
    }

    return this.counterServiceRepository.save(counterService);
  }

  async remove(id: number) {
    const counterService = await this.findOne(id);
    await this.counterServiceRepository.remove(counterService);
    return { deleted: true, id };
  }

  private async ensureCounterExists(counterId: number): Promise<void> {
    const counter = await this.counterRepository.findOne({
      where: { id: counterId },
    });

    if (!counter) {
      throw new NotFoundException(`Counter ${counterId} not found`);
    }
  }
}
