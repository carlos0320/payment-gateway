import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { TransactionRepositoryPort } from 'src/application/ports/transaction-repository.port';
import { Transaction } from 'src/domain/transaction/transaction.entity';
import {
  isTransactionItem,
  toDomainTransaction,
  toItemTransaction,
} from './transaction.mapper';

export class DynamoTransactionRepository implements TransactionRepositoryPort {
  constructor(
    private readonly doc: DynamoDBDocumentClient,
    private readonly tableName: string,
  ) {}

  async save(tx: Transaction): Promise<void> {
    const item = toItemTransaction(tx);
    await this.doc.send(
      new PutCommand({ TableName: this.tableName, Item: item }),
    );
  }

  async findById(transactionId: string): Promise<Transaction | null> {
    const res = await this.doc.send(
      new GetCommand({ TableName: this.tableName, Key: { transactionId } }),
    );
    if (!res.Item) return null;
    if (!isTransactionItem(res.Item))
      throw new Error('Invalid Transaction item shape in DynamoDB');
    return toDomainTransaction(res.Item);
  }

  async update(tx: Transaction): Promise<void> {
    await this.save(tx); // MVP: overwrite full item
  }
}
