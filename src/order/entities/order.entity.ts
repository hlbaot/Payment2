import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Counter } from 'src/counter/entities/counter.entity';
import { CounterService } from 'src/counter-service/entities/counter-service.entity';

export enum OrderStatus {
  PENDING = 'pending',
  VERIFYING = 'verifying',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

export enum CommissionStatus {
  NONE = 'none',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  orderNo: string;

  @Column({ unique: true, length: 50, nullable: true })
  trackingCode: string;

  @Column()
  userId: number;

  @Column()
  counterId: number;

  @Column()
  serviceId: number;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  amount: string;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  totalAmount: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  commissionRateSnapshot: string | null;

  @Column({ type: 'numeric', precision: 15, scale: 2, nullable: true })
  commissionAmount: string | null;

  @Column({
    type: 'enum',
    enum: CommissionStatus,
    default: CommissionStatus.NONE,
  })
  commissionStatus: CommissionStatus;

  @Column({ type: 'timestamp', nullable: true })
  commissionReviewedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  commissionRejectReason: string | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Counter, (counter) => counter.orders)
  @JoinColumn({ name: 'counterId' })
  counter: Counter;

  @ManyToOne(() => CounterService)
  @JoinColumn({ name: 'serviceId' })
  service: CounterService;
}
