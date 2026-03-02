import { createHash } from 'crypto';
import { PayTransactionUseCase } from './pay-transaction.usecase';
import { Transaction } from 'src/domain/transaction/transaction.entity';
import { Status, WompiTransactionStatus } from 'src/domain/transaction/transaction.types';
import { TransactionRepositoryPort } from 'src/application/ports/transaction-repository.port';
import { WompiGatewayPort } from 'src/application/ports/wompi-gateway.port';

const INTEGRITY_SECRET = 'test_integrity_secret';

function makePendingTransaction(): Transaction {
  return Transaction.create(
    'tx-100',
    'prod-1',
    1,
    null,
    {
      productAmountInCents: 100_000,
      baseFeeInCents: 2_500,
      deliveryFeeInCents: 5_000,
      totalInCents: 107_500,
      currency: 'COP',
    },
    { email: 'john@test.com', fullName: 'John Doe', phoneNumber: '3001234567' },
    { address: 'Calle 1', city: 'Bogota', region: 'Bogota', country: 'CO' },
    {
      acceptanceToken: 'tok-abc',
      acceptPersonalAuth: 'auth-abc',
      endUserPolicyUrl: 'https://wompi.com/policy',
      personalDataAuthUrl: 'https://wompi.com/data',
    },
    '127.0.0.1',
  );
}

const INPUT = {
  transactionId: 'tx-100',
  cardToken: 'card-tok-xyz',
  installments: 3,
  clientIp: '10.0.0.1',
};

function makeMocks(tx?: Transaction) {
  const transactions: jest.Mocked<TransactionRepositoryPort> = {
    save: jest.fn(),
    findById: jest.fn().mockResolvedValue(tx ?? makePendingTransaction()),
    update: jest.fn().mockResolvedValue(undefined),
  };

  const wompi: jest.Mocked<WompiGatewayPort> = {
    getMerchantContracts: jest.fn(),
    createCardTransaction: jest.fn().mockResolvedValue({
      wompiTransactionId: 'wompi-tx-200',
      wompiStatus: 'PENDING',
    }),
    getTransactionStatus: jest.fn(),
  };

  const useCase = new PayTransactionUseCase(transactions, wompi, INTEGRITY_SECRET);

  return { useCase, transactions, wompi };
}

describe('PayTransactionUseCase', () => {
  it('should mark transaction as PROCESSING and submit to Wompi', async () => {
    const { useCase } = makeMocks();

    const result = await useCase.execute(INPUT);

    expect(result.status).toBe(Status.PROCESSING);
    expect(result.wompi.transactionId).toBe('wompi-tx-200');
    expect(result.wompi.status).toBe('PENDING');
  });

  it('should generate correct SHA256 signature', async () => {
    const { useCase, wompi } = makeMocks();

    await useCase.execute(INPUT);

    const expectedSig = createHash('sha256')
      .update(`tx-100107500COP${INTEGRITY_SECRET}`)
      .digest('hex');

    const call = wompi.createCardTransaction.mock.calls[0][0];
    expect(call.signature).toBe(expectedSig);
  });

  it('should pass card token and installments to Wompi', async () => {
    const { useCase, wompi } = makeMocks();

    await useCase.execute(INPUT);

    const call = wompi.createCardTransaction.mock.calls[0][0];
    expect(call.cardToken).toBe('card-tok-xyz');
    expect(call.installments).toBe(3);
  });

  it('should update the transaction twice (processing + wompi data)', async () => {
    const { useCase, transactions } = makeMocks();

    await useCase.execute(INPUT);

    expect(transactions.update).toHaveBeenCalledTimes(2);
  });

  it('should throw when transaction is not found', async () => {
    const { useCase, transactions } = makeMocks();
    transactions.findById.mockResolvedValue(null);

    await expect(useCase.execute(INPUT)).rejects.toThrow('TransactionNotFound');
  });

  it('should throw when transaction is PROCESSING (not payable)', async () => {
    const tx = makePendingTransaction();
    tx.markAsProcessing();
    const { useCase } = makeMocks(tx);

    await expect(useCase.execute(INPUT)).rejects.toThrow('TransactionNotPayable');
  });

  it('should return current state for already finalized (SUCCESS) transaction', async () => {
    const tx = makePendingTransaction();
    tx.markAsProcessing();
    tx.attachWompiTransaction('wompi-old', WompiTransactionStatus.APPROVED);
    tx.markAsSuccess();
    const { useCase } = makeMocks(tx);

    const result = await useCase.execute(INPUT);

    expect(result.status).toBe(Status.SUCCESS);
    expect(result.wompi.transactionId).toBe('wompi-old');
  });

  it('should return current state for already finalized (FAILED) transaction', async () => {
    const tx = makePendingTransaction();
    tx.markAsProcessing();
    tx.markAsFailed('DECLINED');
    const { useCase } = makeMocks(tx);

    const result = await useCase.execute(INPUT);

    expect(result.status).toBe(Status.FAILED);
  });

  it('should throw when acceptance tokens are missing', async () => {
    const tx = Transaction.create(
      'tx-100', 'prod-1', 1, null,
      { productAmountInCents: 100_000, baseFeeInCents: 2_500, deliveryFeeInCents: 5_000, totalInCents: 107_500, currency: 'COP' },
      { email: 'j@t.com', fullName: 'J', phoneNumber: '300' },
      { address: 'A', city: 'B', region: 'R', country: 'CO' },
      { acceptanceToken: undefined, acceptPersonalAuth: undefined },
      '127.0.0.1',
    );
    const { useCase } = makeMocks(tx);

    await expect(useCase.execute(INPUT)).rejects.toThrow('MissingAcceptanceTokens');
  });
});
