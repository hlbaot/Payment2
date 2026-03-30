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
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { RejectDepositDto } from './dto/reject-deposit.dto';
import { RequestDepositDto } from './dto/request-deposit.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() createWalletDto: CreateWalletDto) {
    return this.walletService.create(createWalletDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findAll() {
    return this.walletService.findAll();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  findMyWallet(@Req() req: { user: { userId: number } }) {
    return this.walletService.findByUserId(req.user.userId);
  }

  @Get('by-user')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findByUserId(@Query('userId', ParseIntPipe) userId: number) {
    return this.walletService.findByUserId(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.walletService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWalletDto: UpdateWalletDto,
  ) {
    return this.walletService.update(id, updateWalletDto);
  }

  @Patch(':id/deposit/request')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  requestDeposit(
    @Param('id', ParseIntPipe) id: number,
    @Body() requestDepositDto: RequestDepositDto,
  ) {
    return this.walletService.requestDeposit(id, requestDepositDto);
  }

  @Patch(':id/deposit/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  approveDeposit(
    @Param('id', ParseIntPipe) id: number,
    @Body('note') note?: string,
  ) {
    return this.walletService.approveDeposit(id, note);
  }

  @Patch(':id/deposit/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  rejectDeposit(
    @Param('id', ParseIntPipe) id: number,
    @Body() rejectDepositDto: RejectDepositDto,
  ) {
    return this.walletService.rejectDeposit(id, rejectDepositDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.walletService.remove(id);
  }
}
