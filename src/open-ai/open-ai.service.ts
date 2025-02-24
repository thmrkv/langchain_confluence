import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import {AIMessageChunk} from "@langchain/core/messages";

@Injectable()
export class OpenAiService {
  private readonly llm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
      model: 'gpt-4o-mini',
    });
  }

  /**
   * Generate a response from the OpenAI model
   * @param content string "Hi, I'm Bob"
   */
  async generateResponse(content: string): Promise<AIMessageChunk> {
    return this.llm.invoke([{ role: 'user', content }]);
  }
}
