import { ProductRepositoryPort } from 'src/application/ports/product-repository.port';
import { Product } from 'src/domain/product/product.entity';

export class ListProductsUseCase {
  constructor(private readonly productRepository: ProductRepositoryPort) {}

  async execute(): Promise<Product[]> {
    return await this.productRepository.list();
  }
}
