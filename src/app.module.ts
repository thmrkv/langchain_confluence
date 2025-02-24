import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LangChainModule } from './lang-chain/lang-chain.module';
import { OpenAiService } from './open-ai/open-ai.service';
import { OpenAiModule } from './open-ai/open-ai.module';

@Module({
  imports: [LangChainModule, ConfigModule.forRoot(), OpenAiModule],
  controllers: [AppController],
  providers: [AppService, OpenAiService],
})
export class AppModule {}
