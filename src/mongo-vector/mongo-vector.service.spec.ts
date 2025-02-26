import { Test, TestingModule } from '@nestjs/testing';
import { MongoVectorService } from './mongo-vector.service';

describe('MongoVectorService', () => {
  let service: MongoVectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MongoVectorService],
    }).compile();

    service = module.get<MongoVectorService>(MongoVectorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
