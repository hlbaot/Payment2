import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { OrderEventService } from './order-event.service';

@Controller('order-event')
export class OrderEventController {
  constructor(private readonly orderEventService: OrderEventService) {}

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPPORTER')
  findByOrderId(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.orderEventService.findByOrderId(orderId);
  }
}
