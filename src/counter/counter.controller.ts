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
import { CounterService } from './counter.service';
import { CreateCounterDto } from './dto/create-counter.dto';
import { UpdateCounterDto } from './dto/update-counter.dto';

@Controller('counter')
export class CounterController {
  constructor(private readonly counterService: CounterService) {}

  @Post()
  create(@Body() createCounterDto: CreateCounterDto) {
    return this.counterService.create(createCounterDto);
  }

  @Get()
  findAll(@Query('activeOnly') activeOnly?: string) {
    if (activeOnly === 'true') {
      return this.counterService.findActive();
    }

    return this.counterService.findAll();
  }

  @Get(':id/services')
  findServices(@Param('id', ParseIntPipe) id: number) {
    return this.counterService.findServices(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.counterService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCounterDto: UpdateCounterDto,
  ) {
    return this.counterService.update(id, updateCounterDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.counterService.remove(id);
  }
}
