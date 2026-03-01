export class InvalidQuantityError extends Error {
  constructor(quantity: number, message?: string) {
    super(message || `Quantity must be at least 1, but received: ${quantity}`);
    this.name = 'InvalidQuantityError';
  }
}
