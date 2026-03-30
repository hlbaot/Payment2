import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { RejectDepositDto } from './dto/reject-deposit.dto';
import { RequestDepositDto } from './dto/request-deposit.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { Repository } from 'typeorm';
import { Wallet, WalletDepositStatus } from './entities/wallet.entity';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationType } from 'src/notification/entities/notification.entity';
import {
  WalletTransactionService,
} from 'src/wallet-transaction/wallet-transaction.service';
import { WalletTransactionType } from 'src/wallet-transaction/entities/wallet-transaction.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    private readonly notificationService: NotificationService,
    private readonly walletTransactionService: WalletTransactionService,
  ) {}

  async create(createWalletDto: CreateWalletDto): Promise<Wallet> {
    const existingWallet = await this.walletRepository.findOne({
      where: { userId: createWalletDto.userId },
    });

    if (existingWallet) {
      throw new BadRequestException(
        `Wallet for user ${createWalletDto.userId} already exists`,
      );
    }

    const wallet = this.walletRepository.create({
      userId: createWalletDto.userId,
      currency: createWalletDto.currency ?? 'VND',
      availableBalance: '0',
      holdBalance: '0',
      pendingDepositAmount: null,
      depositStatus: WalletDepositStatus.NONE,
      depositNote: null,
      lastDepositRequestedAt: null,
      lastDepositProcessedAt: null,
    });

    return this.walletRepository.save(wallet);
  }

  async findAll(): Promise<Wallet[]> {
    return this.walletRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet ${id} not found`);
    }

    return wallet;
  }

  async findByUserId(userId: number): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet for user ${userId} not found`);
    }

    return wallet;
  }

  async update(id: number, updateWalletDto: UpdateWalletDto): Promise<Wallet> {
    const wallet = await this.findOne(id);

    if (updateWalletDto.currency !== undefined) {
      wallet.currency = updateWalletDto.currency;
    }
    if (updateWalletDto.availableBalance !== undefined) {
      wallet.availableBalance = updateWalletDto.availableBalance;
    }
    if (updateWalletDto.holdBalance !== undefined) {
      wallet.holdBalance = updateWalletDto.holdBalance;
    }
    if (updateWalletDto.pendingDepositAmount !== undefined) {
      wallet.pendingDepositAmount = updateWalletDto.pendingDepositAmount;
    }
    if (updateWalletDto.depositStatus !== undefined) {
      wallet.depositStatus = updateWalletDto.depositStatus;
    }
    if (updateWalletDto.depositNote !== undefined) {
      wallet.depositNote = updateWalletDto.depositNote;
    }
    if (updateWalletDto.lastDepositRequestedAt !== undefined) {
      wallet.lastDepositRequestedAt = updateWalletDto.lastDepositRequestedAt;
    }
    if (updateWalletDto.lastDepositProcessedAt !== undefined) {
      wallet.lastDepositProcessedAt = updateWalletDto.lastDepositProcessedAt;
    }

    return this.walletRepository.save(wallet);
  }

  async requestDeposit(
    id: number,
    requestDepositDto: RequestDepositDto,
  ): Promise<Wallet> {
    const wallet = await this.findOne(id);

    if (!requestDepositDto.amount || Number(requestDepositDto.amount) <= 0) {
      throw new BadRequestException('Deposit amount must be greater than 0');
    }

    if (wallet.depositStatus === WalletDepositStatus.PENDING) {
      throw new BadRequestException('Wallet already has a pending deposit');
    }

    const availableBalanceBefore = wallet.availableBalance;
    const holdBalanceBefore = wallet.holdBalance;

    wallet.pendingDepositAmount = requestDepositDto.amount;
    wallet.depositStatus = WalletDepositStatus.PENDING;
    wallet.depositNote = requestDepositDto.note ?? null;
    wallet.lastDepositRequestedAt = new Date();
    wallet.lastDepositProcessedAt = null;

    const savedWallet = await this.walletRepository.save(wallet);

    await this.walletTransactionService.create({
      walletId: savedWallet.id,
      userId: savedWallet.userId,
      type: WalletTransactionType.DEPOSIT_REQUESTED,
      amount: requestDepositDto.amount,
      availableBalanceBefore,
      availableBalanceAfter: savedWallet.availableBalance,
      holdBalanceBefore,
      holdBalanceAfter: savedWallet.holdBalance,
      referenceType: 'wallet',
      referenceId: savedWallet.id,
      note: requestDepositDto.note ?? 'Deposit request created',
    });

    return savedWallet;
  }

  async requestDepositByUserId(
    userId: number,
    requestDepositDto: RequestDepositDto,
  ): Promise<Wallet> {
    const wallet = await this.findByUserId(userId);
    return this.requestDeposit(wallet.id, requestDepositDto);
  }

  async approveDeposit(id: number, note?: string): Promise<Wallet> {
    const wallet = await this.findOne(id);

    if (
      wallet.depositStatus !== WalletDepositStatus.PENDING ||
      !wallet.pendingDepositAmount
    ) {
      throw new BadRequestException('Wallet does not have a pending deposit');
    }

    const currentBalance = Number(wallet.availableBalance);
    const pendingAmount = Number(wallet.pendingDepositAmount);
    const availableBalanceBefore = wallet.availableBalance;
    const holdBalanceBefore = wallet.holdBalance;

    wallet.availableBalance = (currentBalance + pendingAmount).toFixed(2);
    wallet.depositStatus = WalletDepositStatus.PROCESSED;
    wallet.depositNote = note ?? wallet.depositNote;
    wallet.lastDepositProcessedAt = new Date();
    wallet.pendingDepositAmount = null;

    const savedWallet = await this.walletRepository.save(wallet);

    await this.walletTransactionService.create({
      walletId: savedWallet.id,
      userId: savedWallet.userId,
      type: WalletTransactionType.DEPOSIT_APPROVED,
      amount: pendingAmount.toFixed(2),
      availableBalanceBefore,
      availableBalanceAfter: savedWallet.availableBalance,
      holdBalanceBefore,
      holdBalanceAfter: savedWallet.holdBalance,
      referenceType: 'wallet',
      referenceId: savedWallet.id,
      note: note ?? 'Deposit approved',
    });

    await this.notificationService.create({
      userId: savedWallet.userId,
      type: NotificationType.DEPOSIT_APPROVED,
      title: 'Deposit approved',
      message: `Your deposit request of ${pendingAmount.toFixed(2)} has been approved.`,
      referenceType: 'wallet',
      referenceId: savedWallet.id,
    });

    return savedWallet;
  }

  async rejectDeposit(
    id: number,
    rejectDepositDto: RejectDepositDto,
  ): Promise<Wallet> {
    const wallet = await this.findOne(id);

    if (wallet.depositStatus !== WalletDepositStatus.PENDING) {
      throw new BadRequestException('Wallet does not have a pending deposit');
    }

    const rejectedAmount = wallet.pendingDepositAmount ?? '0.00';
    const availableBalanceBefore = wallet.availableBalance;
    const holdBalanceBefore = wallet.holdBalance;

    wallet.depositStatus = WalletDepositStatus.REJECTED;
    wallet.depositNote = rejectDepositDto.note ?? wallet.depositNote;
    wallet.lastDepositProcessedAt = new Date();
    wallet.pendingDepositAmount = null;

    const savedWallet = await this.walletRepository.save(wallet);

    await this.walletTransactionService.create({
      walletId: savedWallet.id,
      userId: savedWallet.userId,
      type: WalletTransactionType.DEPOSIT_REJECTED,
      amount: rejectedAmount,
      availableBalanceBefore,
      availableBalanceAfter: savedWallet.availableBalance,
      holdBalanceBefore,
      holdBalanceAfter: savedWallet.holdBalance,
      referenceType: 'wallet',
      referenceId: savedWallet.id,
      note: rejectDepositDto.note ?? 'Deposit rejected',
    });

    await this.notificationService.create({
      userId: savedWallet.userId,
      type: NotificationType.DEPOSIT_REJECTED,
      title: 'Deposit rejected',
      message:
        rejectDepositDto.note ??
        `Your deposit request of ${rejectedAmount} has been rejected.`,
      referenceType: 'wallet',
      referenceId: savedWallet.id,
    });

    return savedWallet;
  }

  async remove(id: number) {
    const wallet = await this.findOne(id);
    await this.walletRepository.remove(wallet);
    return { deleted: true, id };
  }
}
