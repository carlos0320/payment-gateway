import {
  AcceptanceSnapshot,
  AmountsSnapshot,
  CustomerSnapshot,
  DeliverySnapshot,
  ProductId,
  WompiTransactionStatus,
  WompiTransactionId,
  Quantity,
  Status,
  TransactionId,
  ClientIp,
} from './transaction.types';

export class Transaction {
  constructor(
    public readonly transactionId: TransactionId,
    public readonly productId: ProductId,
    public readonly quantity: Quantity,
    public status: Status,
    public wompiTransactionId: WompiTransactionId | null,
    public wompiTransactionStatus: WompiTransactionStatus | null,
    public readonly amounts: AmountsSnapshot,
    public readonly customer: CustomerSnapshot,
    public readonly delivery: DeliverySnapshot,
    public readonly acceptance: AcceptanceSnapshot,
    public failureReason: string | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public readonly clientIp: ClientIp,
  ) {}

  public static create(
    transactionId: TransactionId,
    productId: ProductId,
    quantity: Quantity,
    wompiTransactionId: WompiTransactionId,
    amounts: AmountsSnapshot,
    customer: CustomerSnapshot,
    delivery: DeliverySnapshot,
    acceptance: AcceptanceSnapshot,
    clientIp: ClientIp,
  ): Transaction {
    const now = new Date();
    return new Transaction(
      transactionId,
      productId,
      quantity,
      Status.PENDING,
      wompiTransactionId,
      null,
      amounts,
      customer,
      delivery,
      acceptance,
      null,
      now,
      now,
      clientIp,
    );
  }

  public markAsProcessing(): void {
    this.status = Status.PROCESSING;
    this.updatedAt = new Date();
  }

  public attachWompiTransaction(
    wompiTransactionId: WompiTransactionId,
    wompiTransactionStatus: WompiTransactionStatus,
  ): void {
    this.wompiTransactionId = wompiTransactionId;
    this.wompiTransactionStatus = wompiTransactionStatus;
    this.updatedAt = new Date();
  }

  public markAsSuccess(): void {
    this.status = Status.SUCCESS;
    this.updatedAt = new Date();
  }

  public markAsFailed(reason: string): void {
    this.status = Status.FAILED;
    this.failureReason = reason;
    this.updatedAt = new Date();
  }
}
