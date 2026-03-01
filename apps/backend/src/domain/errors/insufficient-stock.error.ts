export class InsufficientStockError extends Error {
  constructor(
    productId: string,
    requested: number,
    available: number,
    message?: string,
  ) {
    super(
      message ||
        `Insufficient stock for product ${productId}: requested ${requested}, available ${available}`,
    );
    this.name = 'InsufficientStockError';
  }
}
