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
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryCommissionReviewDto } from './dto/query-commission-review.dto';
import { ReviewCommissionDto } from './dto/review-commission.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto.userId, createOrderDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findAll(
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('counterId') counterId?: string,
    @Query('commissionStatus') commissionStatus?: string,
  ) {
    return this.orderService.findAllForAdmin({
      status: status as never,
      userId: userId ? +userId : undefined,
      counterId: counterId ? +counterId : undefined,
      commissionStatus: commissionStatus as never,
    });
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  findMy(@Req() req: { user: { userId: number } }) {
    return this.orderService.findMyOrders(req.user.userId);
  }

  @Get('commission-reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  getCommissionReviewList(@Query() query: QueryCommissionReviewDto) {
    return this.orderService.getCommissionReviewList(query);
  }

  @Get('commission-reviews/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  getCommissionReviewDetail(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: QueryCommissionReviewDto,
  ) {
    return this.orderService.getCommissionReviewDetail(userId, query);
  }

  @Get('supporter/queue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPPORTER')
  findSupporterQueue() {
    return this.orderService.findSupporterQueue();
  }

  @Patch('commission-reviews/:userId/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  approveCommissionReview(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() reviewCommissionDto: ReviewCommissionDto,
  ) {
    return this.orderService.approveCommissionReview(userId, reviewCommissionDto);
  }

  @Patch('commission-reviews/:userId/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  rejectCommissionReview(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() reviewCommissionDto: ReviewCommissionDto,
  ) {
    return this.orderService.rejectCommissionReview(userId, reviewCommissionDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Req() req: { user: { userId: number; roles?: string[] } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.orderService.findOneForUser(
      id,
      req.user.userId,
      req.user.roles ?? [],
    );
  }

  @Get(':id/events')
  @UseGuards(JwtAuthGuard)
  findTimeline(
    @Req() req: { user: { userId: number; roles?: string[] } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.orderService.findTimelineForRequester(
      id,
      req.user.userId,
      req.user.roles ?? [],
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.orderService.update(id, updateOrderDto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPPORTER')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(id, updateOrderStatusDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.remove(id);
  }
}
