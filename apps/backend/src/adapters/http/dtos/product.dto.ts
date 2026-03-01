import { Currency } from '../../../domain/product/product.types';
import { Product } from '../../../domain/product/product.entity';

export class ProductResponseDto {
  productId!: string;
  name!: string;
  description!: string;
  priceInCents!: number;
  currency!: Currency;
  imageUrl!: string;
  stock!: number;

  static fromDomain(product: Product): ProductResponseDto {
    return {
      productId: product.id,
      name: product.name,
      description: product.description,
      priceInCents: product.priceInCents,
      currency: product.currency,
      imageUrl: product.imageUrl,
      stock: product.stock,
    };
  }
}
