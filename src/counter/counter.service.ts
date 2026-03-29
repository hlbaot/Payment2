import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCounterDto } from './dto/create-counter.dto';
import { UpdateCounterDto } from './dto/update-counter.dto';
import { Repository } from 'typeorm';
import { Counter, CounterStatus } from './entities/counter.entity';
import { CounterService as CounterServiceEntity } from 'src/counter-service/entities/counter-service.entity';

@Injectable()
export class CounterService {
  constructor(
    @InjectRepository(Counter)
    private readonly counterRepository: Repository<Counter>,
    @InjectRepository(CounterServiceEntity)
    private readonly counterServiceRepository: Repository<CounterServiceEntity>,
  ) {}

  async create(createCounterDto: CreateCounterDto): Promise<Counter> {
    const counter = this.counterRepository.create({
      code: createCounterDto.code,
      name: createCounterDto.name,
      status: createCounterDto.status ?? CounterStatus.OPEN,
      minAmount: createCounterDto.minAmount ?? '0',
    });

    return this.counterRepository.save(counter);
  }

  async findAll(): Promise<Counter[]> {
    return this.counterRepository.find({
      relations: ['services'],
      order: { id: 'ASC' },
    });
  }

  async findActive(): Promise<Counter[]> {
    return this.counterRepository.find({
      where: { status: CounterStatus.OPEN },
      relations: ['services'],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Counter> {
    const counter = await this.counterRepository.findOne({
      where: { id },
      relations: ['services'],
    });

    if (!counter) {
      throw new NotFoundException(`Counter ${id} not found`);
    }

    return counter;
  }

  async findServices(counterId: number): Promise<CounterServiceEntity[]> {
    await this.findOne(counterId);

    return this.counterServiceRepository.find({
      where: { counterId },
      order: { id: 'ASC' },
    });
  }

  async update(
    id: number,
    updateCounterDto: UpdateCounterDto,
  ): Promise<Counter> {
    const counter = await this.findOne(id);

    if (updateCounterDto.code !== undefined) {
      counter.code = updateCounterDto.code;
    }
    if (updateCounterDto.name !== undefined) {
      counter.name = updateCounterDto.name;
    }
    if (updateCounterDto.status !== undefined) {
      counter.status = updateCounterDto.status;
    }
    if (updateCounterDto.minAmount !== undefined) {
      counter.minAmount = updateCounterDto.minAmount;
    }

    return this.counterRepository.save(counter);
  }

  async remove(id: number) {
    const counter = await this.findOne(id);
    await this.counterRepository.remove(counter);
    return { deleted: true, id };
  }
}
