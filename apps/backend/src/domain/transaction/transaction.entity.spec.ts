import { Transaction } from './transaction.entity';
import { Status, WompiTransactionStatus } from './transaction.types';

const makeTransaction = (overrides?: { status?: Status }): Transaction => {
  const tx = Transaction.create(
    'tx-123',
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
      acceptanceToken: 'token-abc',
      acceptPersonalAuth: 'auth-abc',
      endUserPolicyUrl: 'https://wompi.com/policy',
      personalDataAuthUrl: 'https://wompi.com/data',
    },
    '127.0.0.1',
  );

  if (overrides?.status === Status.PROCESSING) tx.markAsProcessing();
  return tx;
};

describe('Transaction Entity', () => {
  describe('create', () => {
    it('should create a PENDING transaction', () => {
      const tx = makeTransaction();

      expect(tx.transactionId).toBe('tx-123');
      expect(tx.productId).toBe('prod-1');
      expect(tx.quantity).toBe(2);
      expect(tx.status).toBe(Status.PENDING);
      expect(tx.wompiTransactionId).toBeNull();
      expect(tx.wompiTransactionStatus).toBeNull();
      expect(tx.failureReason).toBeNull();
      expect(tx.amounts.totalInCents).toBe(207_500);
    });
  });

  describe('markAsProcessing', () => {
    it('should transition status to PROCESSING', () => {
      const tx = makeTransaction();
      const before = tx.updatedAt;

      tx.markAsProcessing();

      expect(tx.status).toBe(Status.PROCESSING);
      expect(tx.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  describe('attachWompiTransaction', () => {
    it('should attach wompi transaction data', () => {
      const tx = makeTransaction();

      tx.attachWompiTransaction('wompi-456', WompiTransactionStatus.PENDING);

      expect(tx.wompiTransactionId).toBe('wompi-456');
      expect(tx.wompiTransactionStatus).toBe(WompiTransactionStatus.PENDING);
    });
  });

  describe('markAsSuccess', () => {
    it('should transition status to SUCCESS', () => {
      const tx = makeTransaction({ status: Status.PROCESSING });

      tx.markAsSuccess();

      expect(tx.status).toBe(Status.SUCCESS);
    });
  });

  describe('markAsFailed', () => {
    it('should transition status to FAILED with reason', () => {
      const tx = makeTransaction({ status: Status.PROCESSING });

      tx.markAsFailed('DECLINED');

      expect(tx.status).toBe(Status.FAILED);
      expect(tx.failureReason).toBe('DECLINED');
    });
  });
});
