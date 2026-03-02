import { TransactionRepositoryPort } from 'src/application/ports/transaction-repository.port';
import { Transaction } from 'src/domain/transaction/transaction.entity';

const store = new Map<string, Transaction>();

export class InMemoryTransactionRepository implements TransactionRepositoryPort {
  async save(transactionData: Transaction): Promise<void> {
    store.set(transactionData.transactionId, transactionData);
  }

  async findById(transactionId: string): Promise<Transaction | null> {
    return store.get(transactionId) ?? null;
  }

  async update(transaction: Transaction): Promise<void> {
    if (!store.has(transaction.transactionId)) {
      throw new Error('Transaction not found');
    }
    store.set(transaction.transactionId, transaction);
  }
}
