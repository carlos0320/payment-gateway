import { InvalidQuantityError } from '../errors/invalid-quantity.error';
import { InsufficientStockError } from '../errors/insufficient-stock.error';
import {
  Currency,
  Description,
  ImageUrl,
  Name,
  PriceInCents,
  ProductId,
  Stock,
} from './product.types';

export class Product {
  constructor(
    public readonly id: ProductId,
    public readonly name: Name,
    public readonly description: Description,
    public readonly priceInCents: PriceInCents,
    public readonly currency: Currency,
    public readonly imageUrl: ImageUrl,
    public stock: Stock,
  ) {}

  // Factory method for creating a new Product
  static create(props: {
    id: ProductId;
    name: Name;
    description: Description;
    priceInCents: PriceInCents;
    currency: Currency;
    imageUrl: ImageUrl;
    stock: Stock;
  }): Product {
    return new Product(
      props.id,
      props.name,
      props.description,
      props.priceInCents,
      props.currency,
      props.imageUrl,
      props.stock,
    );
  }

  public isInStock(): boolean {
    return this.stock > 0;
  }

  public decreaseStock(quantity: number): void {
    if (quantity < 1) {
      throw new InvalidQuantityError(quantity);
    }
    if (quantity > this.stock) {
      throw new InsufficientStockError(this.id, quantity, this.stock);
    }
    this.stock -= quantity;
  }

  public canFulfillOrder(quantity: number): boolean {
    if (quantity < 1) {
      throw new InvalidQuantityError(quantity);
    }
    return this.stock >= quantity;
  }
}
