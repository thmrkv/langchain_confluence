import { Module } from '@nestjs/common';
import { LangGraphService } from './lang-graph.service';
import { MongoVectorModule } from '../mongo-vector/mongo-vector.module';
import { ConfluenceService } from '../confluence/confluence.service';
import { LangGraphController } from './lang-grapth.controller';

@Module({
  controllers: [LangGraphController],
  providers: [LangGraphService, ConfluenceService],
  exports: [LangGraphService],
  imports: [MongoVectorModule],
})
export class LangGraphModule {}
