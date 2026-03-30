import {
  BadRequestException,
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
import { SupportMessageService } from './support-message.service';
import { CreateSupportMessageDto } from './dto/create-support-message.dto';
import { UpdateSupportMessageDto } from './dto/update-support-message.dto';

@Controller('support-message')
export class SupportMessageController {
  constructor(private readonly supportMessageService: SupportMessageService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Req() req: { user: { userId: number; roles?: string[] } },
    @Body() createSupportMessageDto: CreateSupportMessageDto,
  ) {
    const normalizedRoles = (req.user.roles ?? []).map((role) =>
      role.toUpperCase(),
    );

    if (!normalizedRoles.includes('ADMIN') && !normalizedRoles.includes('SUPPORTER')) {
      createSupportMessageDto.userId = req.user.userId;
    }

    if (normalizedRoles.includes('SUPPORTER') && !createSupportMessageDto.supporterId) {
      createSupportMessageDto.supporterId = req.user.userId;
    }

    return this.supportMessageService.create(createSupportMessageDto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  findMine(@Req() req: { user: { userId: number; roles?: string[] } }) {
    return this.supportMessageService.findMine(
      req.user.userId,
      req.user.roles ?? [],
    );
  }

  @Get('conversation/:otherUserId')
  @UseGuards(JwtAuthGuard)
  findConversation(
    @Req() req: { user: { userId: number; roles?: string[] } },
    @Param('otherUserId', ParseIntPipe) otherUserId: number,
  ) {
    return this.supportMessageService.findConversationForRequester(
      req.user.userId,
      otherUserId,
      req.user.roles ?? [],
    );
  }

  @Get('deposit-requests/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPPORTER')
  findPendingDepositRequests() {
    return this.supportMessageService.findPendingDepositRequests();
  }

  @Patch(':id/forward-to-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPPORTER')
  forwardDepositRequestToAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.supportMessageService.forwardDepositRequestToAdmin(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPPORTER')
  findAll(
    @Query('userA') userA?: string,
    @Query('userB') userB?: string,
  ) {
    if (!userA || !userB) {
      throw new BadRequestException('userA and userB are required');
    }

    return this.supportMessageService.findAll(+userA, +userB);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Req() req: { user: { userId: number; roles?: string[] } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.supportMessageService.findOneForRequester(
      id,
      req.user.userId,
      req.user.roles ?? [],
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Req() req: { user: { userId: number; roles?: string[] } },
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSupportMessageDto: UpdateSupportMessageDto,
  ) {
    return this.supportMessageService.findOneForRequester(
      id,
      req.user.userId,
      req.user.roles ?? [],
    ).then(() => this.supportMessageService.update(id, updateSupportMessageDto));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.supportMessageService.remove(id);
  }
}
