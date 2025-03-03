import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LangGraphModule } from './lang-graph/lang-graph.module';
import { ConfluenceModule } from './confluence/confluence.module';
import { MongoVectorModule } from './mongo-vector/mongo-vector.module';
import { GoogleChatModule } from './google-chat/google-chat.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    LangGraphModule,
    ConfluenceModule,
    MongoVectorModule,
    GoogleChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
