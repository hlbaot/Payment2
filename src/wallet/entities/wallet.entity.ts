import { User } from 'src/user/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

export enum WalletDepositStatus {
  NONE = 'none',
  PENDING = 'pending',
  PROCESSED = 'processed',
  REJECTED = 'rejected',
}

@Entity('wallets')
export class Wallet {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @Column({ type: 'char', length: 3, default: 'VND' })
    currency: string;

    @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
    availableBalance: string;

    @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
    holdBalance: string;

    @Column({ type: 'numeric', precision: 15, scale: 2, nullable: true })
    pendingDepositAmount: string | null;

    @Column({
        type: 'enum',
        enum: WalletDepositStatus,
        default: WalletDepositStatus.NONE,
    })
    depositStatus: WalletDepositStatus;

    @Column({ type: 'text', nullable: true })
    depositNote: string | null;

    @Column({ type: 'timestamp', nullable: true })
    lastDepositRequestedAt: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    lastDepositProcessedAt: Date | null;

    @CreateDateColumn()
    createdAt: Date;

    @OneToOne(() => User, (user) => user.wallet)
    @JoinColumn({ name: 'userId' })
    user: User;
}
