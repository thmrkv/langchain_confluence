import { Injectable } from '@nestjs/common';
import { CreateLangChainDto } from './dto/create-lang-chain.dto';
import { UpdateLangChainDto } from './dto/update-lang-chain.dto';
import {OpenAiService} from "../open-ai/open-ai.service";

@Injectable()
export class LangChainService {
  constructor(private readonly openAiService: OpenAiService) {}
  create(createLangChainDto: CreateLangChainDto) {
    return 'This action adds a new langChain';
  }

  openAI(content: string) {
    return this.openAiService.generateResponse(content);
  }

  findOne(id: number) {
    return `This action returns a #${id} langChain`;
  }

  update(id: number, updateLangChainDto: UpdateLangChainDto) {
    return `This action updates a #${id} langChain`;
  }

  remove(id: number) {
    return `This action removes a #${id} langChain`;
  }
}
