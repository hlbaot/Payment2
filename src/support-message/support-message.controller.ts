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
} from '@nestjs/common';
import { SupportMessageService } from './support-message.service';
import { CreateSupportMessageDto } from './dto/create-support-message.dto';
import { UpdateSupportMessageDto } from './dto/update-support-message.dto';

@Controller('support-message')
export class SupportMessageController {
  constructor(private readonly supportMessageService: SupportMessageService) {}

  @Post()
  create(@Body() createSupportMessageDto: CreateSupportMessageDto) {
    return this.supportMessageService.create(createSupportMessageDto);
  }

  @Get()
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
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.supportMessageService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSupportMessageDto: UpdateSupportMessageDto,
  ) {
    return this.supportMessageService.update(id, updateSupportMessageDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.supportMessageService.remove(id);
  }
}
