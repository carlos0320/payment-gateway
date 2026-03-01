import { Product } from 'src/domain/product/product.entity';

export interface ProductRepositoryPort {
  findById(productId: string): Promise<Product | null>;
  list(): Promise<Product[]>;
  decrementStockIfAvailable(
    productId: string,
    quantity: number,
  ): Promise<boolean>;
}
