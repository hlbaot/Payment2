import { WalletDepositStatus } from '../entities/wallet.entity';

export class UpdateWalletDto {
  currency?: string;
  availableBalance?: string;
  holdBalance?: string;
  pendingDepositAmount?: string | null;
  depositStatus?: WalletDepositStatus;
  depositNote?: string | null;
  lastDepositRequestedAt?: Date | null;
  lastDepositProcessedAt?: Date | null;
}
