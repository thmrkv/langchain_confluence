import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LangGraphModule } from './lang-graph/lang-graph.module';
import { ConfluenceModule } from './confluence/confluence.module';
import { MongoVectorModule } from './mongo-vector/mongo-vector.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    LangGraphModule,
    ConfluenceModule,
    MongoVectorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
