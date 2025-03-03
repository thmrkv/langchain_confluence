import { Injectable, Logger } from '@nestjs/common';

import { Annotation, START, END, StateGraph } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { MongoVectorService } from '../mongo-vector/mongo-vector.service';
import { Document } from '@langchain/core/documents';
import { ConfluenceService } from '../confluence/confluence.service';
import { BaseLanguageModel } from '@langchain/core/language_models/base';
import { unifiedPromptTemplate } from './enhanced-prompt';

// Define input types for different task types
export enum TaskType {
  ANSWER_QUESTION = 'answer_question',
  EDIT_PROPOSAL = 'edit_proposal',
  GENERATE_PROPOSAL = 'generate_proposal',
}

// Interface for the input with task type
export interface EnhancedInput {
  taskType: TaskType;
  inputText: string;
}

// Define provider types
export enum ProviderType {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  BOTH = 'both', // Query both models simultaneously
}

@Injectable()
export class LangGraphService {
  private readonly logger = new Logger(LangGraphService.name);
  readonly workflow;
  private readonly openaiLlm: ChatOpenAI;
  private readonly anthropicLlm: ChatAnthropic;
  private readonly inputState = Annotation.Root({
    question: Annotation<string>,
    taskType: Annotation<TaskType | undefined>,
    inputText: Annotation<string | undefined>,
  });
  private readonly outputState = Annotation.Root({
    question: Annotation<string>,
    taskType: Annotation<TaskType | undefined>,
    inputText: Annotation<string | undefined>,
    context: Annotation<Document[]>,
    answer: Annotation<string>,
    openaiAnswer: Annotation<string | undefined>,
    anthropicAnswer: Annotation<string | undefined>,
    sourceUrls: Annotation<Array<{ url: string; title: string }>>,
  });
  public readonly app;
  // Default provider from environment variable or fallback to OpenAI
  private providerType: ProviderType =
    process.env.DEFAULT_PROVIDER === 'anthropic'
      ? ProviderType.ANTHROPIC
      : process.env.DEFAULT_PROVIDER === 'both'
        ? ProviderType.BOTH
        : ProviderType.OPENAI;

  constructor(
    private readonly mongoVectorService: MongoVectorService,
    private readonly confluenceService: ConfluenceService,
  ) {
    this.workflow = new StateGraph(this.outputState)
      .addNode('retrieve', this.retrieve)
      .addNode('generate', this.generate)
      .addEdge(START, 'retrieve')
      .addEdge('retrieve', 'generate')
      .addEdge('generate', END)
      .compile();

    // Initialize both models regardless of the provider type
    // This allows us to switch between them or use both simultaneously
    this.openaiLlm = new ChatOpenAI({
      model: 'gpt-4o',
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.2, // Lower temperature for more predictable, professional responses
    });

    this.anthropicLlm = new ChatAnthropic({
      model: 'claude-3-7-sonnet-20250219',
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      temperature: 0.2, // Lower temperature for more predictable, professional responses
    });
  }

  // Helper method to determine search query based on input
  private getSearchQuery(state: typeof this.inputState.State): string {
    // If it's a direct question, use it as is
    if (!state.taskType || state.taskType === TaskType.ANSWER_QUESTION) {
      return state.question;
    }

    // For proposal editing or generation, use both the question and input text
    return `${state.question} ${state.inputText || ''}`;
  }

  retrieve = async (state: typeof this.inputState.State) => {
    await this.confluenceService.loadConfluenceDocuments();

    // Get the appropriate search query
    const searchQuery = this.getSearchQuery(state);
    this.logger.debug(`Searching with query: ${searchQuery}`);

    const retrievedDocs =
      await this.mongoVectorService.similaritySearch(searchQuery);

    return { context: retrievedDocs };
  };

  generate = async (state: typeof this.outputState.State) => {
    // Use unified prompt template for all tasks
    this.logger.log(
      `Using unified prompt template for task type: ${state.taskType || 'question'}`,
    );

    // Extract unique source URLs for the response
    const sourceUrls = state.context
      .map((doc) => ({
        url: doc.metadata?.source || doc.metadata?.url || '',
        title: doc.metadata?.title || '',
      }))
      .filter((item) => item.url !== '');

    // Format the documents with explicit section markers and URLs
    const docsContent = state.context
      .map((doc, index) => {
        // Extract URL from metadata if available
        const sourceUrl = doc.metadata?.source || doc.metadata?.url || '';
        const title = doc.metadata?.title || `Document ${index + 1}`;

        // Create a formatted document with title, content and source URL
        return `--- DOCUMENT: ${title} ---\n${doc.pageContent}\nSource URL: ${sourceUrl}\n---`;
      })
      .join('\n\n');

    // Prepare the input parameters based on task type
    const promptParams: any = {
      context: docsContent,
    };

    if (state.taskType && state.inputText) {
      // For proposal tasks
      promptParams.task_type = state.taskType;
      promptParams.input_text = state.inputText;
    } else {
      // For standard question answering
      promptParams.task_type = 'Please answer this question';
      promptParams.input_text = state.question;
    }

    const messages = await unifiedPromptTemplate.invoke(promptParams);

    // If we're using both providers, query them in parallel
    if (this.providerType === ProviderType.BOTH) {
      this.logger.log('Querying both OpenAI and Anthropic models in parallel');

      const [openaiResponse, anthropicResponse] = await Promise.all([
        this.openaiLlm.invoke(messages),
        this.anthropicLlm.invoke(messages),
      ]);

      return {
        // Default to OpenAI for the answer field for backward compatibility
        answer: openaiResponse.content,
        openaiAnswer: openaiResponse.content,
        anthropicAnswer: anthropicResponse.content,
        sourceUrls: sourceUrls,
      };
    }
    // Use the selected provider
    else if (this.providerType === ProviderType.ANTHROPIC) {
      this.logger.log('Using Anthropic model');
      const response = await this.anthropicLlm.invoke(messages);

      return {
        answer: response.content,
        anthropicAnswer: response.content,
        sourceUrls: sourceUrls,
      };
    }
    // Default to OpenAI
    else {
      this.logger.log('Using OpenAI model');
      const response = await this.openaiLlm.invoke(messages);

      return {
        answer: response.content,
        openaiAnswer: response.content,
        sourceUrls: sourceUrls,
      };
    }
  };

  // Method to set the LLM provider dynamically
  setProvider(providerType: ProviderType): void {
    // Only update if the provider type is different
    if (providerType !== this.providerType) {
      this.logger.log(`Switching LLM provider to ${providerType}`);
      this.providerType = providerType;
    }
  }

  // New method to compare responses from both models
  async compareLLMResponses(input: EnhancedInput | string): Promise<any> {
    // Save current provider type
    const originalProvider = this.providerType;

    // Temporarily set to query both models
    this.setProvider(ProviderType.BOTH);

    // Process the request with both models
    const result = await this.invokeWithTaskType(input);

    // Restore original provider setting
    this.setProvider(originalProvider);

    // Return formatted comparison
    return {
      openai: result.openaiAnswer,
      anthropic: result.anthropicAnswer,
      sourceUrls: result.sourceUrls,
    };
  }

  // Get current provider type
  getProviderType(): ProviderType {
    return this.providerType;
  }

  // Method to invoke the workflow with enhanced input options
  async invokeWithTaskType(
    input: EnhancedInput | string,
    providerType?: ProviderType,
  ): Promise<any> {
    // Set the provider if specified
    if (providerType) {
      this.setProvider(providerType);
    }

    if (typeof input === 'string') {
      // Handle simple question case
      return this.workflow.invoke({
        question: input,
        taskType: TaskType.ANSWER_QUESTION,
        inputText: undefined,
      });
    } else {
      // Handle enhanced input with task type
      return this.workflow.invoke({
        question:
          input.taskType === TaskType.ANSWER_QUESTION ? input.inputText : '',
        taskType: input.taskType,
        inputText: input.inputText,
      });
    }
  }
}
