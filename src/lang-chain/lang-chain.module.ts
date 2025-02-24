import { Module } from '@nestjs/common';
import { LangChainService } from './lang-chain.service';
import { LangChainController } from './lang-chain.controller';
import { OpenAiService } from '../open-ai/open-ai.service';

@Module({
  controllers: [LangChainController],
  providers: [LangChainService, OpenAiService],
})
export class LangChainModule {}
