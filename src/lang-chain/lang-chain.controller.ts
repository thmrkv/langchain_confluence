import {Controller, Get, Post, Body, Patch, Param, Delete, Query} from '@nestjs/common';
import { LangChainService } from './lang-chain.service';
import { CreateLangChainDto } from './dto/create-lang-chain.dto';
import { UpdateLangChainDto } from './dto/update-lang-chain.dto';

@Controller('lang-chain')
export class LangChainController {
  constructor(private readonly langChainService: LangChainService) {}

  @Get('confluence-docs')
  async loadConfluenceDocuments(@Query('question') question: string) {
    const result = await this.langChainService.loadAnswerConfluence(question);
    console.log(result);
  }
}
