import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { AppWebhookHandlerService } from './app.webhook';

@Controller('btc')
export class AppController {
  constructor(
    private appService: AppService,
    private webhookHandler: AppWebhookHandlerService,
  ) {}

  @Post('/ibex')
  async ibexAuthentication() {
    return await this.appService.getAuthResponse();
  }

  @Post('/ibex-create')
  async ibexCreateLightningAddress(@Body() data: { username: string }) {
    return await this.appService.createLightningAddress(data.username);
  }

  @Get('/ibex-account')
  async getAccountDetails() {
    return await this.appService.getAccountDetails();
  }

  @Post('/ibex-create-invoice')
  async createLightningInvoice(): Promise<any> {
    try {
      return await this.appService.createLightingInvoice();
    } catch (err: any) {
      console.error('Invoice error:', err.message);
      return 'Invoice Error';
    }
  }

  @Post('/ibex-pay-invoice')
  async payLightningInvoice(): Promise<any> {
    try {
      return await this.appService.payLightingInvoice();
    } catch (err: any) {
      console.error('Payment handler error:', err.message);
      return 'Payment Handler Error';
    }
  }

  @Post('/ibex-webhook')
  async handleWebhook(@Body() payload: any): Promise<string> {
    try {
      await this.webhookHandler.handleLightningInvoice(payload);
    } catch (err: any) {
      console.error('Webhook handler error:', err.message);
      return 'Webhook Handler Error';
    }

    return 'Webhook received successfully';
  }
}
