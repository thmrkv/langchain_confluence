import { Injectable } from '@nestjs/common';
import { LangGraphService } from '../lang-graph/lang-graph.service';

@Injectable()
export class LangChainService {
  constructor(private readonly langGraphService: LangGraphService) {}
  async loadAnswerConfluence(question) {
    const result = await this.langGraphService.workflow.invoke({ question });
    console.log('result:', result.answer);
  }
}
