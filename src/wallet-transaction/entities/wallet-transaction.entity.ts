import { User } from 'src/user/entities/user.entity';
import { Wallet } from 'src/wallet/entities/wallet.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum WalletTransactionType {
  DEPOSIT_REQUESTED = 'deposit_requested',
  DEPOSIT_APPROVED = 'deposit_approved',
  DEPOSIT_REJECTED = 'deposit_rejected',
  ORDER_HOLD = 'order_hold',
  ORDER_SETTLED = 'order_settled',
  ORDER_REFUND = 'order_refund',
  COMMISSION_ADDED = 'commission_added',
}

@Entity('wallet_transactions')
export class WalletTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  walletId: number;

  @Column()
  userId: number;

  @Column({
    type: 'enum',
    enum: WalletTransactionType,
  })
  type: WalletTransactionType;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  amount: string;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  availableBalanceBefore: string;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  availableBalanceAfter: string;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  holdBalanceBefore: string;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  holdBalanceAfter: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  referenceType: string | null;

  @Column({ type: 'int', nullable: true })
  referenceId: number | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Wallet)
  @JoinColumn({ name: 'walletId' })
  wallet: Wallet;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
