import { Module } from '@nestjs/common';
import { ConfluenceService } from './confluence.service';
import { MongoVectorModule } from '../mongo-vector/mongo-vector.module';

@Module({
  exports: [ConfluenceService],
  imports: [MongoVectorModule],
  providers: [ConfluenceService],
})
export class ConfluenceModule {}
