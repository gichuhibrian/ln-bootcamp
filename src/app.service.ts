import {
  IGetAccountResponse,
  ILightningTransaction,
  IbexAuthResponse,
  IbexNewLightningAddressResponse,
} from './types';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER, CacheStore } from '@nestjs/cache-manager';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';

@Injectable()
export class AppService {
  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private readonly cacheService: CacheStore,
    private readonly configService: ConfigService,
  ) {}

  async ibexAuthentication(): Promise<void> {
    const body = {
      email: process.env.IBEX_EMAIL,
      password: process.env.IBEX_PASSWORD,
    };
    const url = `${process.env.IBEX_URL}/auth/signin`;

    try {
      const response = await this.httpService.post(url, body).toPromise();
      const authData = response?.data;

      if (authData && authData.accessTokenExpiresAt) {
        const ttl = authData.accessTokenExpiresAt * 1000 - Date.now();
        this.cacheService.set('ibex-auth', authData, ttl);
      } else {
        console.error('Invalid authentication response:', authData);
      }
    } catch (error) {
      console.error('ibexAuthentication error:', error);
    }
  }

  public async getAuthResponse(): Promise<IbexAuthResponse> {
    let auth: IbexAuthResponse | null | undefined =
      await this.cacheService.get<IbexAuthResponse>('ibex-auth');

    if (!auth) {
      await this.ibexAuthentication();
      auth = await this.cacheService.get<IbexAuthResponse>('ibex-auth');

      if (!auth) {
        throw new Error(
          'Failed to retrieve authentication response after authentication',
        );
      }
    }

    return auth;
  }

  public async getAccountDetails(): Promise<IGetAccountResponse> {
    try {
      const url = `${process.env.IBEX_URL}/v2/account`;
      const auth = await this.getAuthResponse();

      const headers = {
        'Content-type': 'application/json',
        Authorization: `${auth.accessToken}`,
      };

      const response = (await this.httpService
        .get(url, { headers })
        .toPromise()) as AxiosResponse<IGetAccountResponse>;
      if (!response) {
        throw new InternalServerErrorException(
          'No response data received from ibex.',
        );
      }

      this.cacheService.set('ibex-account', response.data, 3600000);

      return response.data;
    } catch (error) {
      console.error('ibexAuthentication error:', error);
    }
  }

  public async createLightningAddress(
    username: string,
  ): Promise<IbexNewLightningAddressResponse> {
    const auth = await this.getAuthResponse();

    if (!auth || !auth.accessToken) {
      throw new NotFoundException(
        'Authentication failed or access token not found.',
      );
    }

    const body = {
      accountId: this.configService.get<string>('IBEX_ACCOUNT_ID'),
      username,
    };
    const url = `${this.configService.get<string>(
      'IBEX_URL',
    )}/lightning-address`;

    const headers = {
      'Content-type': 'application/json',
      Authorization: `Bearer ${auth.accessToken}`,
    };

    try {
      const response = (await this.httpService
        .post(url, body, { headers })
        .toPromise()) as AxiosResponse<IbexNewLightningAddressResponse>;

      if (!response || !response.data) {
        throw new InternalServerErrorException(
          'No response data received from the server.',
        );
      }

      return response.data;
    } catch (error) {
      console.error('createLightningAddress error:', error);
      throw new InternalServerErrorException(
        'Failed to create Lightning address',
      );
    }
  }

  async createLightingInvoice() {
    const auth = await this.getAuthResponse();

    if (!auth || !auth.accessToken) {
      throw new NotFoundException(
        'Authentication failed or access token not found.',
      );
    }

    // const { amount, accountId, memo } = params;
    const webhookSecret =
      this.configService.get<string>('IBEX_WEBHOOK_SECRET') || 'jua-secret';
    const webhookUrl = `${this.configService.get<string>('API_URL')}btc/ibex-webhook`;
    const expiration =
      this.configService.get<string>('INVOICE_EXPIRY_TIME') || 900;

    const account =
      await this.cacheService.get<IGetAccountResponse>('ibex-account');

    const body = {
      expiration: Number(expiration),
      amount: 1000,
      accountId: account[1].id,
      webhookUrl,
      memo: 'LN Bootcamp test invoice',
      webhookSecret,
    };

    const url = `${this.configService.get<string>('IBEX_URL')}/v2/invoice/add`;

    const headers = {
      'Content-type': 'application/json',
      Authorization: `${auth.accessToken}`,
    };

    try {
      const response = (await this.httpService
        .post(url, body, { headers })
        .toPromise()) as AxiosResponse<IbexNewLightningAddressResponse>;

      if (!response || !response.data) {
        throw new InternalServerErrorException(
          'No response data received from the server.',
        );
      }

      this.cacheService.set('ibex-invoice', response.data, 3600000);

      return response.data;
    } catch (error) {
      console.error('createLightningAddress error:', error);
      throw new InternalServerErrorException(
        'Failed to create Lightning address',
      );
    }
  }

  async payLightingInvoice() {
    const auth = await this.getAuthResponse();

    if (!auth || !auth.accessToken) {
      throw new NotFoundException(
        'Authentication failed or access token not found.',
      );
    }
    const webhookSecret =
      this.configService.get<string>('IBEX_WEBHOOK_SECRET') || 'jua-secret';
    const webhookUrl = `${this.configService.get<string>('API_URL')}btc/ibex-webhook`;

    const invoiceData =
      await this.cacheService.get<ILightningTransaction>('ibex-invoice');

    const { accountId, invoice } = invoiceData;

    const body = {
      accountId,
      bolt11: invoice.bolt11,
      webhookUrl,
      webhookSecret,
    };

    const url = `${this.configService.get<string>('IBEX_URL')}/v2/invoice/pay`;

    const headers = {
      'Content-type': 'application/json',
      Authorization: `${auth.accessToken}`,
    };

    try {
      const response = (await this.httpService
        .post(url, body, { headers })
        .toPromise()) as AxiosResponse;

      if (!response || !response.data) {
        throw new InternalServerErrorException(
          'No response data received from the server.',
        );
      }

      this.cacheService.set('ibex-pay', response.data, 3600000);

      return response.data;
    } catch (error) {
      console.error('payLightningAddress error:', error);
      throw new InternalServerErrorException('Failed to pay invoice');
    }
  }
}
