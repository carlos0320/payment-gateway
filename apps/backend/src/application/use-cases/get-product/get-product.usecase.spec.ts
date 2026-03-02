import { GetProductUseCase } from './get-product.usecase';
import { Product } from 'src/domain/product/product.entity';
import { ProductRepositoryPort } from 'src/application/ports/product-repository.port';

describe('GetProductUseCase', () => {
  it('should return the product when found', async () => {
    const product = Product.create({
      id: 'p-1', name: 'Shirt', description: 'Nice', priceInCents: 50_000, currency: 'COP', imageUrl: '', stock: 10,
    });

    const repo: jest.Mocked<ProductRepositoryPort> = {
      findById: jest.fn().mockResolvedValue(product),
      list: jest.fn(),
      decrementStockIfAvailable: jest.fn(),
    };

    const useCase = new GetProductUseCase(repo);
    const result = await useCase.execute('p-1');

    expect(result).toBeDefined();
    expect(result!.id).toBe('p-1');
    expect(repo.findById).toHaveBeenCalledWith('p-1');
  });

  it('should return null when product is not found', async () => {
    const repo: jest.Mocked<ProductRepositoryPort> = {
      findById: jest.fn().mockResolvedValue(null),
      list: jest.fn(),
      decrementStockIfAvailable: jest.fn(),
    };

    const useCase = new GetProductUseCase(repo);
    const result = await useCase.execute('non-existent');

    expect(result).toBeNull();
  });
});
