import { Injectable } from '@nestjs/common';
import { pull } from 'langchain/hub';
import {
  Annotation,
  START,
  END,
  StateGraph,
  MemorySaver,
} from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { MongoVectorService } from '../mongo-vector/mongo-vector.service';
import { Document } from '@langchain/core/documents';
import { ConfluenceService } from '../confluence/confluence.service';

@Injectable()
export class LangGraphService {
  readonly workflow;
  private readonly llm: ChatOpenAI;
  private readonly inputState = Annotation.Root({
    question: Annotation<string>,
  });
  private readonly outputState = Annotation.Root({
    question: Annotation<string>,
    context: Annotation<Document[]>,
    answer: Annotation<string>,
  });
  public readonly app;

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

    // this.memory = new MemorySaver();

    // this.app = this.workflow.compile({ checkpointer: this.memory });

    this.llm = new ChatOpenAI({
      model: 'gpt-4o-mini',
    });
  }

  retrieve = async (state: typeof this.inputState.State) => {
    // const docs = await this.confluenceService.loadConfluenceDocuments();
    console.log('state:', state)
    const retrievedDocs = await this.mongoVectorService.similaritySearch(
      state.question,
    );
    console.log('retrievedDocs', retrievedDocs);
    return { context: retrievedDocs };
  };

  generate = async (state: typeof this.outputState.State) => {
    const promptTemplate = await pull<ChatPromptTemplate>('rlm/rag-prompt');

    const docsContent = state.context.map((doc) => doc.pageContent).join('\n');
    const messages = await promptTemplate.invoke({
      question: state.question,
      context: docsContent,
    });
    const response = await this.llm.invoke(messages);

    return { answer: response.content };
  };
}
