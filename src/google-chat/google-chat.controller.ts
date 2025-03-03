import { Controller, Post, Body, Res, Logger } from '@nestjs/common';
import { GoogleChatService } from './google-chat.service';
import { Response } from 'express';

@Controller('google-chat')
export class GoogleChatController {
  private readonly logger = new Logger(GoogleChatController.name);

  constructor(private readonly googleChatService: GoogleChatService) {}

  @Post('webhook')
  async handleWebhook(@Body() body: any, @Res() res: Response) {
    this.logger.log('Received webhook from Google Chat');
    return this.googleChatService.handleIncomingMessage({ body }, res);
  }
}
