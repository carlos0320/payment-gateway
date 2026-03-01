import { Transaction } from 'src/domain/transaction/transaction.entity';

export interface TransactionRepositoryPort {
  save(transactionData: Transaction): Promise<void>;
  findById(transactionId: string): Promise<Transaction | null>;
  update(transaction: Transaction): Promise<void>;
}
