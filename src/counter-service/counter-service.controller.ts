import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CounterServiceService } from './counter-service.service';
import { CreateCounterServiceDto } from './dto/create-counter-service.dto';
import { UpdateCounterServiceDto } from './dto/update-counter-service.dto';

@Controller('counter-service')
export class CounterServiceController {
  constructor(private readonly counterServiceService: CounterServiceService) {}

  @Post()
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
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCounterServiceDto: UpdateCounterServiceDto,
  ) {
    return this.counterServiceService.update(id, updateCounterServiceDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.counterServiceService.remove(id);
  }
}
