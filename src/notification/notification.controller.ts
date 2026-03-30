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
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationType } from './entities/notification.entity';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationService.create(createNotificationDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findAll(
    @Query('userId') userId?: string,
    @Query('type') type?: NotificationType,
    @Query('isRead') isRead?: string,
  ) {
    return this.notificationService.findAll(
      userId ? +userId : undefined,
      type,
      isRead !== undefined ? isRead === 'true' : undefined,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  findMyNotifications(@Req() req: { user: { userId: number } }) {
    return this.notificationService.findAll(req.user.userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Req() req: { user: { userId: number; roles?: string[] } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationService.findOneForUser(
      id,
      req.user.userId,
      req.user.roles ?? [],
    );
  }

  @Patch('read-all')
  @UseGuards(JwtAuthGuard)
  markAllAsRead(@Req() req: { user: { userId: number } }) {
    return this.notificationService.markAllAsRead(req.user.userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateByAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    return this.notificationService.update(id, updateNotificationDto);
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  markAsRead(
    @Req() req: { user: { userId: number; roles?: string[] } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationService.markAsReadForUser(
      id,
      req.user.userId,
      req.user.roles ?? [],
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.notificationService.remove(id);
  }
}
