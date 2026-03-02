import { GetTransactionUseCase } from './get-transaction.usecase';
import { Transaction } from 'src/domain/transaction/transaction.entity';
import { Status, WompiTransactionStatus } from 'src/domain/transaction/transaction.types';
import { TransactionRepositoryPort } from 'src/application/ports/transaction-repository.port';
import { ProductRepositoryPort } from 'src/application/ports/product-repository.port';
import { WompiGatewayPort } from 'src/application/ports/wompi-gateway.port';

function makeProcessingTransaction(): Transaction {
  const tx = Transaction.create(
    'tx-100',
    'prod-1',
    2,
    null,
    {
      productAmountInCents: 200_000,
      baseFeeInCents: 2_500,
      deliveryFeeInCents: 5_000,
      totalInCents: 207_500,
      currency: 'COP',
    },
    { email: 'john@test.com', fullName: 'John Doe', phoneNumber: '3001234567' },
    { address: 'Calle 1', city: 'Bogota', region: 'Bogota', country: 'CO' },
    {
      acceptanceToken: 'tok-abc',
      acceptPersonalAuth: 'auth-abc',
    },
    '127.0.0.1',
  );
  tx.markAsProcessing();
  tx.attachWompiTransaction('wompi-tx-200', WompiTransactionStatus.PENDING);
  return tx;
}

function makeMocks() {
  const transactions: jest.Mocked<TransactionRepositoryPort> = {
    save: jest.fn(),
    findById: jest.fn().mockResolvedValue(makeProcessingTransaction()),
    update: jest.fn().mockResolvedValue(undefined),
  };

  const products: jest.Mocked<ProductRepositoryPort> = {
    findById: jest.fn(),
    list: jest.fn(),
    decrementStockIfAvailable: jest.fn().mockResolvedValue(true),
  };

  const wompi: jest.Mocked<WompiGatewayPort> = {
    getMerchantContracts: jest.fn(),
    createCardTransaction: jest.fn(),
    getTransactionStatus: jest.fn().mockResolvedValue({
      wompiStatus: 'APPROVED',
    }),
  };

  const useCase = new GetTransactionUseCase(transactions, products, wompi);

  return { useCase, transactions, products, wompi };
}

describe('GetTransactionUseCase', () => {
  it('should mark as SUCCESS when Wompi approves and stock is available', async () => {
    const { useCase } = makeMocks();

    const result = await useCase.execute('tx-100');

    expect(result.status).toBe(Status.SUCCESS);
    expect(result.wompi.status).toBe(WompiTransactionStatus.APPROVED);
  });

  it('should decrement stock on approved payment', async () => {
    const { useCase, products } = makeMocks();

    await useCase.execute('tx-100');

    expect(products.decrementStockIfAvailable).toHaveBeenCalledWith('prod-1', 2);
  });

  it('should mark as FAILED with OUT_OF_STOCK when no stock left', async () => {
    const { useCase, products } = makeMocks();
    products.decrementStockIfAvailable.mockResolvedValue(false);

    const result = await useCase.execute('tx-100');

    expect(result.status).toBe(Status.FAILED);
  });

  it('should mark as FAILED when Wompi declines', async () => {
    const { useCase, wompi } = makeMocks();
    wompi.getTransactionStatus.mockResolvedValue({ wompiStatus: 'DECLINED' });

    const result = await useCase.execute('tx-100');

    expect(result.status).toBe(Status.FAILED);
  });

  it('should mark as FAILED when Wompi returns ERROR', async () => {
    const { useCase, wompi } = makeMocks();
    wompi.getTransactionStatus.mockResolvedValue({ wompiStatus: 'ERROR' });

    const result = await useCase.execute('tx-100');

    expect(result.status).toBe(Status.FAILED);
  });

  it('should mark as FAILED when Wompi returns VOIDED', async () => {
    const { useCase, wompi } = makeMocks();
    wompi.getTransactionStatus.mockResolvedValue({ wompiStatus: 'VOIDED' });

    const result = await useCase.execute('tx-100');

    expect(result.status).toBe(Status.FAILED);
  });

  it('should stay PROCESSING when Wompi status is still PENDING', async () => {
    const { useCase, wompi } = makeMocks();
    wompi.getTransactionStatus.mockResolvedValue({ wompiStatus: 'PENDING' });

    const result = await useCase.execute('tx-100');

    expect(result.status).toBe(Status.PROCESSING);
  });

  it('should NOT poll Wompi for already finalized transactions', async () => {
    const { useCase, transactions, wompi } = makeMocks();
    const tx = makeProcessingTransaction();
    tx.markAsSuccess();
    transactions.findById.mockResolvedValue(tx);

    await useCase.execute('tx-100');

    expect(wompi.getTransactionStatus).not.toHaveBeenCalled();
  });

  it('should persist updated transaction after Wompi poll', async () => {
    const { useCase, transactions } = makeMocks();

    await useCase.execute('tx-100');

    expect(transactions.update).toHaveBeenCalledTimes(1);
  });

  it('should throw when transaction is not found', async () => {
    const { useCase, transactions } = makeMocks();
    transactions.findById.mockResolvedValue(null);

    await expect(useCase.execute('tx-999')).rejects.toThrow('TransactionNotFound');
  });
});
