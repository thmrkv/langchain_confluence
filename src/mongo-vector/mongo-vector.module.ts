import { Module } from '@nestjs/common';
import { MongoVectorService } from './mongo-vector.service';

@Module({
  providers: [MongoVectorService],
  exports: [MongoVectorService],
})
export class MongoVectorModule {}
