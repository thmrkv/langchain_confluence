import { Test, TestingModule } from '@nestjs/testing';
import { ConfluenceService } from './confluence.service';

describe('ConfluenceService', () => {
  let service: ConfluenceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfluenceService],
    }).compile();

    service = module.get<ConfluenceService>(ConfluenceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
