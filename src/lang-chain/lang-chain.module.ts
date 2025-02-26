import { Module } from '@nestjs/common';
import { LangChainService } from './lang-chain.service';
import { LangChainController } from './lang-chain.controller';
import { MongoVectorModule } from '../mongo-vector/mongo-vector.module';
import { ConfluenceModule } from '../confluence/confluence.module';
import { LangGraphModule } from '../lang-graph/lang-graph.module';

@Module({
  controllers: [LangChainController],
  imports: [MongoVectorModule, ConfluenceModule, LangGraphModule],
  providers: [LangChainService],
})
export class LangChainModule {}
