import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LangChainModule } from './lang-chain/lang-chain.module';

@Module({
  imports: [LangChainModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
