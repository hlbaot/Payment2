import { Counter } from 'src/counter/entities/counter.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum ServiceCategory {
  TRANSFER = 'transfer',
  PAYMENT = 'payment',
}

@Entity('counter_services')
export class CounterService {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  counterId: number;

  @Column({ length: 50 })
  serviceCode: string;

  @Column({ length: 100 })
  name: string;

  @Column({
    type: 'enum',
    enum: ServiceCategory,
  })
  category: ServiceCategory;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  commissionRate: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Counter, (counter) => counter.services)
  @JoinColumn({ name: 'counterId' })
  counter: Counter;
}