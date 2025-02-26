import { Controller, Get, Query } from '@nestjs/common';
import { LangGraphService } from './lang-graph.service';

@Controller('lang-graph')
export class LangGraphController {
  constructor(private readonly langGraphService: LangGraphService) {}

  @Get('confluence-docs')
  async loadConfluenceDocuments(@Query('question') question: string) {
    const result = await this.langGraphService.workflow.invoke({ question });
    const documents = result.context;
    return { answer: result.answer, source: documents };
  }
}
