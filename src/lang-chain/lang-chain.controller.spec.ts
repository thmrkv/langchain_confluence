import { Test, TestingModule } from '@nestjs/testing';
import { LangChainController } from './lang-chain.controller';
import { LangChainService } from './lang-chain.service';

describe('LangChainController', () => {
  let controller: LangChainController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LangChainController],
      providers: [LangChainService],
    }).compile();

    controller = module.get<LangChainController>(LangChainController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
