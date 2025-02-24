import { Injectable } from '@nestjs/common';
import { CreateLangChainDto } from './dto/create-lang-chain.dto';
import { UpdateLangChainDto } from './dto/update-lang-chain.dto';

@Injectable()
export class LangChainService {
  create(createLangChainDto: CreateLangChainDto) {
    return 'This action adds a new langChain';
  }

  findAll() {
    return `This action returns all langChain`;
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
