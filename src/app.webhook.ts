import { IWebhookHandler } from './types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppWebhookHandlerService implements IWebhookHandler {
  private readonly webhookSecret = process.env.WEBHOOK_SECRET;
  async handleLightningInvoice(payload: any): Promise<void> {
    // Implement your webhook handling logic here
    console.log('Received webhook payload:', payload);
  }
}
