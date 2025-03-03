import { Body, Controller, Get, Post, Query, Param } from '@nestjs/common';
import {
  LangGraphService,
  TaskType,
  EnhancedInput,
  ProviderType,
} from './lang-graph.service';

@Controller('lang-graph')
export class LangGraphController {
  constructor(private readonly langGraphService: LangGraphService) {}

  @Get('provider')
  getProvider() {
    return { provider: this.langGraphService.getProviderType() };
  }

  @Post('provider/:type')
  setProvider(@Param('type') type: string) {
    const providerType =
      type === 'anthropic'
        ? ProviderType.ANTHROPIC
        : type === 'both'
          ? ProviderType.BOTH
          : ProviderType.OPENAI;

    this.langGraphService.setProvider(providerType);
    return { provider: providerType };
  }

  @Get('confluence-docs')
  async loadConfluenceDocuments(
    @Query('question') question: string,
    @Query('provider') provider?: string,
  ) {
    const providerType =
      provider === 'anthropic'
        ? ProviderType.ANTHROPIC
        : provider === 'openai'
          ? ProviderType.OPENAI
          : provider === 'both'
            ? ProviderType.BOTH
            : undefined;

    const result = await this.langGraphService.invokeWithTaskType(
      question,
      providerType,
    );
    const documents = result.context;
    return {
      answer: result.answer,
      source: documents,
      sourceUrls: result.sourceUrls || [],
      provider: providerType || this.langGraphService.getProviderType(),
      openaiAnswer: result.openaiAnswer,
      anthropicAnswer: result.anthropicAnswer,
    };
  }

  @Post('process')
  async processRequest(
    @Body() input: { taskType: TaskType; inputText: string; provider?: string },
  ) {
    const enhancedInput: EnhancedInput = {
      taskType: input.taskType,
      inputText: input.inputText,
    };

    // Set provider if specified
    const providerType =
      input.provider === 'anthropic'
        ? ProviderType.ANTHROPIC
        : input.provider === 'openai'
          ? ProviderType.OPENAI
          : input.provider === 'both'
            ? ProviderType.BOTH
            : undefined;

    const result = await this.langGraphService.invokeWithTaskType(
      enhancedInput,
      providerType,
    );
    return {
      answer: result.answer,
      taskType: input.taskType,
      provider: providerType || this.langGraphService.getProviderType(),
      source: result.context?.length
        ? `Used ${result.context.length} documents from Confluence`
        : 'No context used',
      sourceUrls: result.sourceUrls || [],
      openaiAnswer: result.openaiAnswer,
      anthropicAnswer: result.anthropicAnswer,
    };
  }

  @Post('edit-proposal')
  async editProposal(@Body() input: { proposal: string; provider?: string }) {
    const enhancedInput: EnhancedInput = {
      taskType: TaskType.EDIT_PROPOSAL,
      inputText: input.proposal,
    };

    // Set provider if specified
    const providerType =
      input.provider === 'anthropic'
        ? ProviderType.ANTHROPIC
        : input.provider === 'openai'
          ? ProviderType.OPENAI
          : input.provider === 'both'
            ? ProviderType.BOTH
            : undefined;

    const result = await this.langGraphService.invokeWithTaskType(
      enhancedInput,
      providerType,
    );
    return {
      editedProposal: result.answer,
      provider: providerType || this.langGraphService.getProviderType(),
      sources:
        result.context?.map((doc) => ({
          title: doc.metadata?.title || 'Confluence Document',
          snippet: doc.pageContent.substring(0, 200) + '...',
        })) || [],
      sourceUrls: result.sourceUrls || [],
      openaiEditedProposal: result.openaiAnswer,
      anthropicEditedProposal: result.anthropicAnswer,
    };
  }

  @Post('generate-proposal')
  async generateProposal(
    @Body() input: { jobDescription: string; provider?: string },
  ) {
    const enhancedInput: EnhancedInput = {
      taskType: TaskType.GENERATE_PROPOSAL,
      inputText: input.jobDescription,
    };

    // Set provider if specified
    const providerType =
      input.provider === 'anthropic'
        ? ProviderType.ANTHROPIC
        : input.provider === 'openai'
          ? ProviderType.OPENAI
          : input.provider === 'both'
            ? ProviderType.BOTH
            : undefined;

    const result = await this.langGraphService.invokeWithTaskType(
      enhancedInput,
      providerType,
    );
    return {
      proposal: result.answer,
      provider: providerType || this.langGraphService.getProviderType(),
      sources:
        result.context?.map((doc) => ({
          title: doc.metadata?.title || 'Confluence Document',
          snippet: doc.pageContent.substring(0, 200) + '...',
        })) || [],
      sourceUrls: result.sourceUrls || [],
      openaiAnswer: result.openaiAnswer,
      anthropicAnswer: result.anthropicAnswer,
    };
  }

  @Post('compare')
  async compareModels(@Body() input: { query: string; taskType?: TaskType }) {
    // Prepare the input based on task type
    let enhancedInput: EnhancedInput | string;

    if (input.taskType) {
      enhancedInput = {
        taskType: input.taskType,
        inputText: input.query,
      };
    } else {
      enhancedInput = input.query;
    }

    // Use the special comparison method
    const result =
      await this.langGraphService.compareLLMResponses(enhancedInput);

    return {
      openai: result.openai,
      anthropic: result.anthropic,
      sourceUrls: result.sourceUrls,
    };
  }
}
