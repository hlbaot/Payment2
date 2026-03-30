import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { CounterServiceService } from './counter-service.service';
import { CreateCounterServiceDto } from './dto/create-counter-service.dto';
import { UpdateCounterServiceDto } from './dto/update-counter-service.dto';

@Controller('counter-service')
export class CounterServiceController {
  constructor(private readonly counterServiceService: CounterServiceService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() createCounterServiceDto: CreateCounterServiceDto) {
    return this.counterServiceService.create(createCounterServiceDto);
  }

  @Get()
  findAll() {
    return this.counterServiceService.findAll();
  }

  @Get('by-counter/:counterId')
  findByCounterId(@Param('counterId', ParseIntPipe) counterId: number) {
    return this.counterServiceService.findByCounterId(counterId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.counterServiceService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCounterServiceDto: UpdateCounterServiceDto,
  ) {
    return this.counterServiceService.update(id, updateCounterServiceDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.counterServiceService.remove(id);
  }
}
