import { ProductRepositoryPort } from 'src/application/ports/product-repository.port';
import { TransactionRepositoryPort } from 'src/application/ports/transaction-repository.port';
import { WompiGatewayPort } from 'src/application/ports/wompi-gateway.port';
import {
  Status,
  WompiTransactionStatus,
} from 'src/domain/transaction/transaction.types';

export interface GetTransactionOutput {
  transactionId: string;
  status: Status;
  wompi: {
    transactionId: string | null;
    status: WompiTransactionStatus | null;
    statusMessage?: string;
  };
  amounts: any;
  productId: string;
  quantity: number;
}

const WOMPI_STATUS = new Set<WompiTransactionStatus>([
  WompiTransactionStatus.APPROVED,
  WompiTransactionStatus.DECLINED,
  WompiTransactionStatus.ERROR,
  WompiTransactionStatus.VOIDED,
]);

export class GetTransactionUseCase {
  constructor(
    private readonly transactions: TransactionRepositoryPort,
    private readonly products: ProductRepositoryPort,
    private readonly wompi: WompiGatewayPort,
  ) {}

  async execute(transactionId: string): Promise<GetTransactionOutput> {
    const tx = await this.transactions.findById(transactionId);
    if (!tx) throw new Error('TransactionNotFound');

    // Refresh provider status if processing
    if (tx.status === Status.PROCESSING && tx.wompiTransactionId) {
      const statusRes = await this.wompi.getTransactionStatus(
        tx.wompiTransactionId,
      );

      // map string
      const mapped = statusRes.wompiStatus as WompiTransactionStatus;
      tx.wompiTransactionStatus = mapped;
      tx.updatedAt = new Date();

      // Finalize if provider is final
      if (mapped && WOMPI_STATUS.has(mapped)) {
        if (mapped === WompiTransactionStatus.APPROVED) {
          const enoughStock = await this.products.decrementStockIfAvailable(
            tx.productId,
            tx.quantity,
          );
          if (enoughStock) {
            tx.markAsSuccess();
          } else {
            tx.markAsFailed('OUT_OF_STOCK');
          }
        } else {
          tx.markAsFailed(mapped); // DECLINED/ERROR/VOIDED
        }
      }

      // update transaction
      await this.transactions.update(tx);
    }

    return {
      transactionId: tx.transactionId,
      status: tx.status,
      wompi: {
        transactionId: tx.wompiTransactionId,
        status: tx.wompiTransactionStatus,
      },
      amounts: tx.amounts,
      productId: tx.productId,
      quantity: tx.quantity,
    };
  }
}
