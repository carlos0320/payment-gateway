import { Product } from 'src/domain/product/product.entity';
import { ProductRepositoryPort } from 'src/application/ports/product-repository.port';

export class GetProductUseCase {
  constructor(private readonly productRepositoryPort: ProductRepositoryPort) {}

  async execute(productId: string): Promise<Product | null> {
    return await this.productRepositoryPort.findById(productId);
  }
}
