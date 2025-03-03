import { Injectable, Logger } from '@nestjs/common';
import { google, chat_v1 } from 'googleapis';
import {
  LangGraphService,
  TaskType,
  ProviderType,
} from '../lang-graph/lang-graph.service';
import * as process from 'process';

@Injectable()
export class GoogleChatService {
  private readonly logger = new Logger(GoogleChatService.name);
  private chat: chat_v1.Chat;

  constructor(private langGraphService: LangGraphService) {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/chat.bot'],
    });

    this.chat = google.chat({
      version: 'v1',
      auth,
    });

    this.logger.log('Google Chat service initialized');
  }

  // Method to handle incoming messages from Google Chat
  async handleIncomingMessage(req, res) {
    try {
      const message = req.body;

      if (message.type === 'MESSAGE') {
        const messageText = message.message.text;
        const sender = message.message.sender.displayName;
        const senderId = message.message.sender.name; // Get sender ID for tagging
        const threadId = message.message.thread?.name;

        this.logger.log(
          `Received message from ${sender} (${senderId}): ${messageText}`,
        );
        this.logger.log(`Thread ID: ${threadId}`);

        // Extract threadKey if available
        let threadKey = null;
        if (threadId) {
          // Thread name format is spaces/{space}/threads/{threadKey}
          const parts = threadId.split('/');
          if (parts.length >= 4) {
            threadKey = parts[3];
          }
        }

        // Check for slash commands
        if (messageText.startsWith('/')) {
          this.logger.log(`Processing command: ${messageText}`);
          const response = await this.handleSlashCommand(messageText, senderId);

          // A response will always be returned now (we changed the default case)
          // Format the response to tag the sender
          const formattedResponse = this.formatResponse(response, senderId);

          // Send the response back to Google Chat, using thread if available
          await this.sendMessage(
            message.message.space.name,
            formattedResponse,
            threadKey,
          );
          res.status(200).send();
          return;
        }

        // Process regular message with LangChain
        const query = this.extractQuery(messageText);
        const response = await this.processWithLangChain(query);

        // Format the response to tag the sender and format proposal text
        const formattedResponse = this.formatResponse(response, senderId);

        // Send the response back to Google Chat, using thread if available
        await this.sendMessage(
          message.message.space.name,
          formattedResponse,
          threadKey,
        );
      }

      res.status(200).send();
    } catch (error) {
      this.logger.error('Error handling incoming message', error);
      res.status(500).send();
    }
  }

  // Extract the actual query from the message (remove mentions)
  private extractQuery(messageText: string): string {
    // Remove the @confbot mention from the message
    return messageText.replace(/@confbot/gi, '').trim();
  }

  // Helper method to remove existing references section from model response
  private cleanExistingReferences(text: string): string {
    // Remove any existing "References:" or "Reference:" section at the end
    const referencePatterns = [
      /\n+References:[\s\S]*$/i,
      /\n+Reference:[\s\S]*$/i,
      /\n+Sources:[\s\S]*$/i,
      /\n+Source:[\s\S]*$/i,
    ];

    let cleanedText = text;
    for (const pattern of referencePatterns) {
      cleanedText = cleanedText.replace(pattern, '');
    }

    return cleanedText.trim();
  }

  // Extract reference titles from the response text
  private extractReferenceTitlesFromText(text: string): string[] {
    const references = [];

    // Common patterns for references in the text
    const bulletPointRefPattern =
      /(?:References|Reference|Sources|Source):\s*(?:[\s\S]*?[•\-*]\s*([^•\-*\n]+))+/i;
    const referenceMatch = text.match(bulletPointRefPattern);

    if (referenceMatch) {
      // Extract individual references from the matched section
      const refSection = referenceMatch[0];
      const refItems = refSection.match(/[•\-*]\s*([^•\-*\n]+)/g);

      if (refItems) {
        refItems.forEach((item) => {
          const title = item.replace(/^[•\-*\s]+/, '').trim();
          if (title) {
            references.push(title);
          }
        });
      }
    } else {
      // Fallback to check for specific known reference titles mentioned
      const knownReferences = [
        'GPT for Manual Proposals',
        'GPT-API Assistant for Proposals',
        'Proposal Writing Guidelines',
        'Confluence Knowledge Base',
        'Google Ads Documentation',
      ];

      knownReferences.forEach((ref) => {
        if (text.includes(ref)) {
          references.push(ref);
        }
      });
    }

    return references;
  }

  // Get URL for a reference title
  private getUrlForReference(title: string): string {
    // Map of known reference titles to their URLs
    const referenceUrls = {
      'GPT for Manual Proposals':
        'https://confluence.example.com/pages/viewpage.action?pageId=123456',
      'GPT-API Assistant for Proposals':
        'https://confluence.example.com/pages/viewpage.action?pageId=123457',
      'Proposal Writing Guidelines':
        'https://confluence.example.com/pages/viewpage.action?pageId=123458',
      'Confluence Knowledge Base':
        'https://confluence.example.com/spaces/viewspace.action?key=KB',
      'Google Ads Documentation':
        'https://developers.google.com/google-ads/api/docs/start',
    };

    // Try exact match first
    if (referenceUrls[title]) {
      return referenceUrls[title];
    }

    // Try partial match if exact match fails
    for (const [refTitle, url] of Object.entries(referenceUrls)) {
      if (title.includes(refTitle) || refTitle.includes(title)) {
        return url;
      }
    }

    // Return a default URL if no match is found
    return (
      'https://confluence.example.com/search?text=' + encodeURIComponent(title)
    );
  }

  // Process the message using LangChain
  private async processWithLangChain(message: string): Promise<string> {
    try {
      // Parse the message to determine the task type
      const taskInfo = this.parseMessageForTaskType(message);
      let result;

      // Determine provider type based on the useBothModels flag
      const providerType = taskInfo.useBothModels
        ? ProviderType.BOTH
        : undefined;

      if (taskInfo.useBothModels) {
        this.logger.log('User requested comparison between models');
      }

      if (taskInfo.taskType) {
        // Use the enhanced workflow with task type
        this.logger.log(`Processing as task type: ${taskInfo.taskType}`);
        result = await this.langGraphService.invokeWithTaskType(
          {
            taskType: taskInfo.taskType,
            inputText: taskInfo.inputText,
          },
          providerType,
        );
      } else {
        // Use the standard workflow for simple questions
        this.logger.log('Processing as a standard question');
        result = await this.langGraphService.invokeWithTaskType(
          taskInfo.inputText,
          providerType,
        );
      }

      // Log the context for debugging
      this.logger.debug(
        `Context used for answering: ${JSON.stringify(result.context)}`,
      );

      // Continue even if no Confluence content is found - we'll use general knowledge

      // Format the response, checking if we have responses from both models
      let response = '';

      if (
        result.openaiAnswer &&
        result.anthropicAnswer &&
        result.openaiAnswer !== result.anthropicAnswer
      ) {
        // Include both responses if they're different and both available
        response = `**OpenAI Response:**\n${result.openaiAnswer}\n\n**Anthropic Response:**\n${result.anthropicAnswer}`;
      } else {
        // Otherwise use the standard answer
        response = result.answer;
      }

      // Handle references section formatting
      // First remove any existing references section added by the model
      response = this.cleanExistingReferences(response);

      // Then add our formatted references section if we have Confluence sources
      if (result.sourceUrls && result.sourceUrls.length > 0) {
        response += '\n\nReferences:';
        const addedRefs = new Set();
        const addedUrls = new Set();

        // Use the dedicated sourceUrls field which contains clean URL data
        result.sourceUrls.forEach((sourceRef) => {
          const title = sourceRef.title || '';
          const url = sourceRef.url || '';

          // Skip if we've already added this URL to prevent duplicates
          if (addedUrls.has(url)) {
            return;
          }

          if (title && url) {
            response += `\n• [${title}](${url})`;
            addedRefs.add(title);
            addedUrls.add(url);
          } else if (url) {
            response += `\n• [${url}](${url})`;
            addedUrls.add(url);
          }
        });
      } else if (result.context && result.context.length > 0) {
        // Fall back to extracting from context if sourceUrls is not available
        response += '\n\nReferences:';
        const addedRefs = new Set();
        const addedUrls = new Set();

        result.context.forEach((doc) => {
          const title = doc.metadata?.title || '';
          const url = doc.metadata?.source || '';

          // Skip if we've already added this URL to prevent duplicates
          if (url && addedUrls.has(url)) {
            return;
          }

          if (title && url) {
            response += `\n• [${title}](${url})`;
            addedRefs.add(title);
            addedUrls.add(url);
          } else if (title) {
            response += `\n• ${title}`;
            addedRefs.add(title);
          } else if (url) {
            response += `\n• [${url}](${url})`;
            addedUrls.add(url);
          }
        });
      } else {
        // Add default references section with URLs for common references
        const referencesInText = this.extractReferenceTitlesFromText(response);
        if (referencesInText.length > 0) {
          // Remove any existing plain references without URLs
          response = this.cleanExistingReferences(response);

          // Add our formatted references with URLs
          response += '\n\nReferences:';
          const addedRefs = new Set();
          const addedUrls = new Set();

          referencesInText.forEach((title) => {
            const url = this.getUrlForReference(title);

            // Skip if we've already added this URL or title to prevent duplicates
            if ((url && addedUrls.has(url)) || addedRefs.has(title)) {
              return;
            }

            if (url) {
              response += `\n• [${title}](${url})`;
              addedRefs.add(title);
              addedUrls.add(url);
            } else if (!addedRefs.has(title)) {
              response += `\n• ${title}`;
              addedRefs.add(title);
            }
          });
        }
      }

      return response;
    } catch (error) {
      this.logger.error('Error processing with LangChain', error);
      return 'Sorry, I encountered an error while processing your request.';
    }
  }

  // Handle slash commands
  private async handleSlashCommand(
    message: string,
    senderId: string,
  ): Promise<string | null> {
    const parts = message.trim().split(' ');
    const command = parts[0].toLowerCase();
    const content = parts.slice(1).join(' ').trim();

    this.logger.log(`Processing slash command: ${command}`);

    switch (command) {
      case '/help':
        this.logger.log('Returning help text');
        return this.getHelpText();

      case '/create_proposal':
        if (!content) {
          return 'Please provide job description after the /create_proposal command. Example: `/create_proposal I need a developer to build a React application`';
        }
        return this.processSlashCommand(TaskType.GENERATE_PROPOSAL, content);

      case '/revise_proposal':
        if (!content) {
          return 'Please provide the proposal to revise after the /revise_proposal command. Example: `/revise_proposal I can build your React app with...`';
        }
        return this.processSlashCommand(TaskType.EDIT_PROPOSAL, content);

      case '/review_proposal':
        if (!content) {
          return 'Please provide the proposal to review after the /review_proposal command. Example: `/review_proposal I can build your React app with...`';
        }
        // For review, we'll add special instructions
        return this.processSlashCommand(
          TaskType.EDIT_PROPOSAL,
          `Please review this proposal and provide feedback without changing it: ${content}`,
        );

      default:
        this.logger.log(`Unrecognized command: ${command}`);
        // For unrecognized commands, return a message instead of null
        return `Unrecognized command: ${command}\n\nType /help to see available commands.`;
    }
  }

  // Get help text for available commands
  private getHelpText(): string {
    return `
**Available Commands:**

*/create_proposal [job description]*
Generate a proposal based on the job description provided. Example:
\`/create_proposal I need a developer to build a React application\`

*/revise_proposal [proposal]*
Improve and edit an existing proposal. Example:
\`/revise_proposal I can build your React app with modern components\`

*/review_proposal [proposal]*
Review a proposal and provide feedback without changing it. Example:
\`/review_proposal I can build your React app with modern components\`

*/help*
Show this help message with available commands.

You can also interact naturally by asking questions or saying things like:
- "Create a proposal for a React developer job"
- "Edit this proposal: [your proposal text]"
- "Compare models: [your question]" (to see responses from both OpenAI and Anthropic)
`;
  }

  // Process a slash command with the appropriate task type
  private async processSlashCommand(
    taskType: TaskType,
    content: string,
  ): Promise<string> {
    try {
      const result = await this.langGraphService.invokeWithTaskType({
        taskType: taskType,
        inputText: content,
      });

      return result.answer;
    } catch (error) {
      this.logger.error(`Error processing slash command ${taskType}`, error);
      return `Sorry, I encountered an error while processing your ${taskType} request.`;
    }
  }

  private parseMessageForTaskType(message: string): {
    taskType?: TaskType;
    inputText: string;
    useBothModels?: boolean;
  } {
    const lowerMessage = message.toLowerCase();

    // Check if user wants to compare models
    const useBothModels =
      lowerMessage.includes('compare models') ||
      lowerMessage.includes('both models') ||
      lowerMessage.includes('openai and anthropic') ||
      lowerMessage.includes('gpt and claude');

    // Extract the actual query if it's a comparison request
    let actualQuery = message;
    if (useBothModels) {
      // Try to extract the real query after commands like "compare models: ..."
      const comparisonMatch = message.match(
        /(?:compare|use both|show both) models?[:\s]+([\s\S]+)/i,
      );
      if (comparisonMatch && comparisonMatch[1]) {
        actualQuery = comparisonMatch[1].trim();
      } else {
        // Remove comparison keywords
        actualQuery = message
          .replace(/compare models/i, '')
          .replace(/both models/i, '')
          .replace(/openai and anthropic/i, '')
          .replace(/gpt and claude/i, '')
          .trim();
      }
    }

    // Check for proposal editing request
    if (
      lowerMessage.includes('edit this proposal') ||
      lowerMessage.includes('improve this proposal') ||
      lowerMessage.includes('revise this proposal')
    ) {
      // Extract the proposal text - everything after the command
      const match = actualQuery.match(
        /(?:edit|improve|revise) this proposal[:\s]+([\s\S]+)/i,
      );
      if (match && match[1]) {
        return {
          taskType: TaskType.EDIT_PROPOSAL,
          inputText: match[1].trim(),
          useBothModels,
        };
      }
    }

    // Check for proposal generation request
    if (
      lowerMessage.includes('create a proposal') ||
      lowerMessage.includes('generate a proposal') ||
      lowerMessage.includes('write a proposal')
    ) {
      // Extract the job description - everything after the command
      const match = actualQuery.match(
        /(?:create|generate|write) a proposal[:\s]+([\s\S]+)/i,
      );
      if (match && match[1]) {
        return {
          taskType: TaskType.GENERATE_PROPOSAL,
          inputText: match[1].trim(),
          useBothModels,
        };
      }
    }

    // Default to treating it as a question
    return { inputText: actualQuery, useBothModels };
  }

  // Format the response to tag the user
  private formatResponse(text: string, userId: string): string {
    // Tag the user at the beginning of the message
    let formattedText = `<users/${userId.split('/').pop()}> `;

    // Simply add the text without any bold formatting
    formattedText += text;
    return formattedText;
  }

  async sendMessage(spaceName: string, text: string, threadKey?: string) {
    try {
      const requestParams: chat_v1.Params$Resource$Spaces$Messages$Create = {
        parent: spaceName,
        requestBody: {
          // Google Chat supports formatted text with markdown syntax
          text,
        },
      };

      // If a thread key is provided, use it to reply in the same thread
      if (threadKey) {
        requestParams.threadKey = threadKey;
      }

      const response = await this.chat.spaces.messages.create(requestParams);

      this.logger.log(
        `Message sent with ${text.includes('https://') ? 'URLs' : 'no URLs'}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error('Error sending message to Google Chat', error);
      throw error;
    }
  }
}
