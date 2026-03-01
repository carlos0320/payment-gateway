import { createHash } from 'crypto';

import { TransactionRepositoryPort } from 'src/application/ports/transaction-repository.port';
import { WompiGatewayPort } from 'src/application/ports/wompi-gateway.port';
import {
  Status,
  WompiTransactionStatus,
} from 'src/domain/transaction/transaction.types';

export interface PayTransactionInput {
  transactionId: string;
  cardToken: string;
  installments: number;
  clientIp: string;
}

export interface PayTransactionOutput {
  transactionId: string;
  status: Status; // PROCESSING
  wompi: {
    transactionId: string;
    status: string;
  };
}

export class PayTransactionUseCase {
  constructor(
    private readonly transactions: TransactionRepositoryPort,
    private readonly wompi: WompiGatewayPort,
    private readonly integritySecret: string,
  ) {}

  async execute(input: PayTransactionInput): Promise<PayTransactionOutput> {
    const tx = await this.transactions.findById(input.transactionId);
    if (!tx) throw new Error('TransactionNotFound');

    if (tx.status === Status.SUCCESS || tx.status === Status.FAILED) {
      // already finalized transactions
      return {
        transactionId: tx.transactionId,
        status: tx.status,
        wompi: {
          transactionId: tx.wompiTransactionId ?? '',
          status: tx.wompiTransactionStatus ?? '',
        },
      };
    }

    // Only allow pay once from PENDING
    if (tx.status !== Status.PENDING) {
      throw new Error('TransactionNotPayable');
    }

    const acceptanceToken = tx.acceptance.acceptanceToken;
    const acceptPersonalAuth = tx.acceptance.acceptPersonalAuth;
    if (!acceptanceToken || !acceptPersonalAuth)
      throw new Error('MissingAcceptanceTokens');

    // mark processing immediately
    tx.markAsProcessing();
    await this.transactions.update(tx);

    const reference = tx.transactionId; // reference == transactionId
    const amountInCents = tx.amounts.totalInCents;
    const currency = tx.amounts.currency;

    // Create signature as per Wompi docs
    const signatureRaw = `${reference}${amountInCents}${currency}${this.integritySecret}`;
    const signature = createHash('sha256').update(signatureRaw).digest('hex');

    console.log('PAY DEBUG***', {
      reference,
      amountInCents,
      currency,
      totals: tx.amounts,
    });

    const wompiCreated = await this.wompi.createCardTransaction({
      acceptance_token: acceptanceToken,
      accept_personal_auth: acceptPersonalAuth,
      amount_in_cents: amountInCents,
      currency: 'COP',
      customer_email: tx.customer.email,
      reference,
      signature,
      cardToken: input.cardToken,
      installments: input.installments,
      ip: input.clientIp,
    });

    // Map provider status to domain enum safely (strings vary)
    const wompiStatus = (wompiCreated.wompiStatus ??
      'PENDING') as WompiTransactionStatus;

    // Update transaction with Wompi data and set final status if already declined/approved
    tx.attachWompiTransaction(wompiCreated.wompiTransactionId, wompiStatus);
    await this.transactions.update(tx);

    return {
      transactionId: tx.transactionId,
      status: tx.status,
      wompi: {
        transactionId: wompiCreated.wompiTransactionId,
        status: wompiCreated.wompiStatus,
      },
    };
  }
}
