import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  WalletTransaction,
  WalletTransactionType,
} from './entities/wallet-transaction.entity';

type CreateWalletTransactionInput = {
  walletId: number;
  userId: number;
  type: WalletTransactionType;
  amount: string;
  availableBalanceBefore: string;
  availableBalanceAfter: string;
  holdBalanceBefore: string;
  holdBalanceAfter: string;
  referenceType?: string | null;
  referenceId?: number | null;
  note?: string | null;
};

@Injectable()
export class WalletTransactionService {
  constructor(
    @InjectRepository(WalletTransaction)
    private readonly walletTransactionRepository: Repository<WalletTransaction>,
  ) {}

  async create(
    input: CreateWalletTransactionInput,
  ): Promise<WalletTransaction> {
    const transaction = this.walletTransactionRepository.create({
      ...input,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
      note: input.note ?? null,
    });

    return this.walletTransactionRepository.save(transaction);
  }

  async findAll(userId?: number): Promise<WalletTransaction[]> {
    return this.walletTransactionRepository.find({
      ...(userId ? { where: { userId } } : {}),
      relations: ['wallet', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserIds(userIds: number[]): Promise<WalletTransaction[]> {
    if (!userIds.length) {
      return [];
    }

    return this.walletTransactionRepository.find({
      where: {
        userId: In(userIds),
      },
      order: { createdAt: 'DESC' },
    });
  }
}
