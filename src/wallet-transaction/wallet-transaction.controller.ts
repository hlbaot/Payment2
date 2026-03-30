import {
  Controller,
  Get,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { WalletTransactionService } from './wallet-transaction.service';

@Controller('wallet-transaction')
export class WalletTransactionController {
  constructor(
    private readonly walletTransactionService: WalletTransactionService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findAll(@Query('userId') userId?: string) {
    return this.walletTransactionService.findAll(userId ? +userId : undefined);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  findMyTransactions(@Req() req: { user: { userId: number } }) {
    return this.walletTransactionService.findAll(req.user.userId);
  }
}
