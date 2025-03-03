import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GoogleChatService } from './google-chat.service';
import { GoogleChatController } from './google-chat.controller';
import { LangGraphModule } from '../lang-graph/lang-graph.module';

@Module({
  imports: [ConfigModule, LangGraphModule],
  controllers: [GoogleChatController],
  providers: [GoogleChatService],
  exports: [GoogleChatService],
})
export class GoogleChatModule {}