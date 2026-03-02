import {
  WompiCreateCardTxInput,
  WompiCreateCardTxOutput,
  WompiGatewayPort,
  WompiMerchantContracts,
  WompiTxStatusOutput,
} from 'src/application/ports/wompi-gateway.port';
import { MerchantsContracts, TransactionResponse } from './wompi.gateway.types';

export class WompiGatewayHttp implements WompiGatewayPort {
  constructor(
    private readonly baseUrl: string,
    private readonly publicKey: string,
    private readonly privateKey: string,
  ) {}

  async createCardTransaction(
    input: WompiCreateCardTxInput,
  ): Promise<WompiCreateCardTxOutput> {
    const url = `${this.baseUrl}/transactions`;

    const body = {
      acceptance_token: input.acceptance_token,
      accept_personal_auth: input.accept_personal_auth,
      amount_in_cents: input.amount_in_cents,
      currency: input.currency,
      customer_email: input.customer_email,
      payment_method: {
        type: 'CARD',
        token: input.cardToken,
        installments: input.installments,
      },
      payment_method_type: 'CARD',
      reference: input.reference,
      signature: input.signature,
      ip: input.ip,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.privateKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(
        `Wompi create transaction failed (${res.status}): ${await res.text()}`,
      );
    }

    const json = (await res.json()) as TransactionResponse;

    const data = json.data;

    if (!data?.id || !data?.status) {
      throw new Error(
        `Invalid Wompi transaction response: ${JSON.stringify(json)}`,
      );
    }

    return {
      wompiTransactionId: data.id,
      wompiStatus: data.status,
      statusMessage: data.status_message,
    };
  }

  async getTransactionStatus(
    wompiTransactionId: string,
  ): Promise<WompiTxStatusOutput> {
    const url = `${this.baseUrl}/transactions/${wompiTransactionId}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.publicKey}` },
    });

    if (!res.ok) {
      throw new Error(
        `Wompi get status failed (${res.status}): ${await res.text()}`,
      );
    }

    const json = (await res.json()) as TransactionResponse;

    const data = json.data;
    if (!data?.status) {
      throw new Error(
        `Invalid Wompi transaction status response: ${JSON.stringify(json)}`,
      );
    }

    return {
      wompiStatus: data?.status,
      statusMessage: data?.status_message,
    };
  }

  async getMerchantContracts(
    merchantPublicKey: string,
  ): Promise<WompiMerchantContracts> {
    const url = `${this.baseUrl}/merchants/${merchantPublicKey}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.publicKey}`,
      },
    });
    if (!res.ok) {
      const text = await res.text(); // Attempt to get error details from response body
      throw new Error(`Wompi merchant call failed (${res.status}): ${text}`);
    }

    const json = (await res.json()) as MerchantsContracts;

    const acceptance = json?.data?.presigned_acceptance;
    const personal = json?.data?.presigned_personal_data_auth;

    if (!acceptance || !personal) {
      throw new Error(
        'Wompi merchant call did not return required acceptance data',
      );
    }

    return {
      endUserPolicyUrl: acceptance?.permalink,
      personalDataAuthUrl: personal?.permalink,
      acceptanceToken: acceptance?.acceptance_token,
      acceptPersonalAuth: personal?.acceptance_token,
    };
  }
}
