import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { RejectDepositDto } from './dto/reject-deposit.dto';
import { RequestDepositDto } from './dto/request-deposit.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post()
  create(@Body() createWalletDto: CreateWalletDto) {
    return this.walletService.create(createWalletDto);
  }

  @Get()
  findAll() {
    return this.walletService.findAll();
  }

  @Get('by-user')
  findByUserId(@Query('userId', ParseIntPipe) userId: number) {
    return this.walletService.findByUserId(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.walletService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWalletDto: UpdateWalletDto,
  ) {
    return this.walletService.update(id, updateWalletDto);
  }

  @Patch(':id/deposit/request')
  requestDeposit(
    @Param('id', ParseIntPipe) id: number,
    @Body() requestDepositDto: RequestDepositDto,
  ) {
    return this.walletService.requestDeposit(id, requestDepositDto);
  }

  @Patch(':id/deposit/approve')
  approveDeposit(
    @Param('id', ParseIntPipe) id: number,
    @Body('note') note?: string,
  ) {
    return this.walletService.approveDeposit(id, note);
  }

  @Patch(':id/deposit/reject')
  rejectDeposit(
    @Param('id', ParseIntPipe) id: number,
    @Body() rejectDepositDto: RejectDepositDto,
  ) {
    return this.walletService.rejectDeposit(id, rejectDepositDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.walletService.remove(id);
  }
}
