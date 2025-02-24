import { Module } from '@nestjs/common';
import { LangChainService } from './lang-chain.service';
import { LangChainController } from './lang-chain.controller';

@Module({
  controllers: [LangChainController],
  providers: [LangChainService],
})
export class LangChainModule {}
