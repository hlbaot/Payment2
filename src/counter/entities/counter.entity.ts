import { CounterService } from 'src/counter-service/entities/counter-service.entity';
import { Order } from 'src/order/entities/order.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';

export enum CounterStatus {
  OPEN = 'open',
  BUSY = 'busy',
  FULL = 'full',
  OFFLINE = 'offline',
}

@Entity('counters')
export class Counter {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, length: 30 })
    code: string;

    @Column({ length: 100 })
    name: string;

    @Column({
        type: 'enum',
        enum: CounterStatus,
        default: CounterStatus.OPEN,
    })
    status: CounterStatus;

    @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
    minAmount: string;

    @CreateDateColumn()
    createdAt: Date;

    @OneToMany(() => CounterService, (service) => service.counter)
    services: CounterService[];

    @OneToMany(() => Order, (order) => order.counter)
    orders: Order[];
}