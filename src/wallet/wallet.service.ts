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

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
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

    wallet.pendingDepositAmount = requestDepositDto.amount;
    wallet.depositStatus = WalletDepositStatus.PENDING;
    wallet.depositNote = requestDepositDto.note ?? null;
    wallet.lastDepositRequestedAt = new Date();
    wallet.lastDepositProcessedAt = null;

    return this.walletRepository.save(wallet);
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

    wallet.availableBalance = (currentBalance + pendingAmount).toFixed(2);
    wallet.depositStatus = WalletDepositStatus.PROCESSED;
    wallet.depositNote = note ?? wallet.depositNote;
    wallet.lastDepositProcessedAt = new Date();
    wallet.pendingDepositAmount = null;

    return this.walletRepository.save(wallet);
  }

  async rejectDeposit(
    id: number,
    rejectDepositDto: RejectDepositDto,
  ): Promise<Wallet> {
    const wallet = await this.findOne(id);

    if (wallet.depositStatus !== WalletDepositStatus.PENDING) {
      throw new BadRequestException('Wallet does not have a pending deposit');
    }

    wallet.depositStatus = WalletDepositStatus.REJECTED;
    wallet.depositNote = rejectDepositDto.note ?? wallet.depositNote;
    wallet.lastDepositProcessedAt = new Date();
    wallet.pendingDepositAmount = null;

    return this.walletRepository.save(wallet);
  }

  async remove(id: number) {
    const wallet = await this.findOne(id);
    await this.walletRepository.remove(wallet);
    return { deleted: true, id };
  }
}
