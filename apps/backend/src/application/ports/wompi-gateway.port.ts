export interface WompiMerchantContracts {
  endUserPolicyUrl: string;
  personalDataAuthUrl: string;
  acceptanceToken: string;
  acceptPersonalAuth: string;
}

export interface WompiCreateCardTxInput {
  acceptance_token: string;
  accept_personal_auth: string;
  amount_in_cents: number;
  currency: 'COP';
  customer_email: string;
  reference: string;
  signature: string;
  cardToken: string;
  installments: number;
  ip: string;
}

export interface WompiCreateCardTxOutput {
  wompiTransactionId: string;
  wompiStatus: string;
  statusMessage?: string;
}

export interface WompiTxStatusOutput {
  wompiStatus: string;
  statusMessage?: string;
}

export interface WompiGatewayPort {
  getMerchantContracts(
    merchantPublicKey: string,
  ): Promise<WompiMerchantContracts>;

  createCardTransaction(
    input: WompiCreateCardTxInput,
  ): Promise<WompiCreateCardTxOutput>;

  getTransactionStatus(
    wompiTransactionId: string,
  ): Promise<WompiTxStatusOutput>;
}
