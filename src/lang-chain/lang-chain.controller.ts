import {Controller, Get, Post, Body, Patch, Param, Delete, Query} from '@nestjs/common';
import { LangChainService } from './lang-chain.service';
import { CreateLangChainDto } from './dto/create-lang-chain.dto';
import { UpdateLangChainDto } from './dto/update-lang-chain.dto';

@Controller('lang-chain')
export class LangChainController {
  constructor(private readonly langChainService: LangChainService) {}

  @Post()
  create(@Body() createLangChainDto: CreateLangChainDto) {
    return this.langChainService.create(createLangChainDto);
  }

  @Get('open-ai')
  async openAI(@Query('content') content: string) {
    const response = await this.langChainService.openAI(content);
    console.log(response);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.langChainService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLangChainDto: UpdateLangChainDto) {
    return this.langChainService.update(+id, updateLangChainDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.langChainService.remove(+id);
  }
}
