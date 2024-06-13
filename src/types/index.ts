export interface IbexAuthResponse {
  accessToken: string;
  accessTokenExpiresAt: number;
  refreshToken: string;
  refreshTokenExpiresAt: number;
  roleId: number;
}

export interface IbexNewLightningAddressResponse {
  id: string;
  accountId: string;
  username: string;
}

export interface ICreateLightningInvoice {
  expiration?: number;
  accountId: string;
  memo?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  amount: number;
}

export interface ILightningInvoiceWebhookResponse {
  hash: string;
  settledAtUtc: string;
  receivedMsat: number;
  webhookSecret: string;
  transaction: {
    id: string;
    createdAt: string;
    accountId: string;
    amount: number;
    networkFee: number;
    exchangeRateCurrencySats: number;
    currencyID: number;
    transactionTypeId: number;
    invoice: {
      hash: string;
      bolt11: string;
      preImage: string;
      memo: string;
      creationDateUtc: string;
      expiryDateUtc: string;
      settleDateUtc: string;
      amountMsat: number;
      receiveMsat: number;
      stateId: 1;
      state: {
        id: number;
        name: string;
        description: string;
      };
    };
  };
}

export interface IWebhookHandler {
  handleLightningInvoice(payload: any): Promise<void>;
}

export interface IGetAccountResponse {
  id: string;
  userId: string;
  organizationId: string;
  name: string;
  currencyId: number;
}

interface TransactionType {
  id: number;
  name: string;
  description: string | null;
}

interface InvoiceState {
  id: number;
  name: string;
  description: string | null;
}

interface Invoice {
  hash: string;
  bolt11: string;
  preImage: string | null;
  memo: string;
  creationDateUtc: string;
  expiryDateUtc: string;
  settleDateUtc: string | null;
  amountMsat: number;
  receiveMsat: number;
  stateId: number;
  state: InvoiceState;
}

export interface ILightningTransaction {
  id: string;
  createdAt: string;
  settledAt: string | null;
  accountId: string;
  amount: number;
  networkFee: number;
  onChainSendFee: number;
  exchangeRateCurrencySats: number;
  currencyId: number;
  transactionTypeId: number;
  transactionType: TransactionType;
  invoice: Invoice;
}
