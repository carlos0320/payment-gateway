import { ListProductsUseCase } from './list-products.usecase';
import { Product } from 'src/domain/product/product.entity';
import { ProductRepositoryPort } from 'src/application/ports/product-repository.port';

describe('ListProductsUseCase', () => {
  it('should return all products from the repository', async () => {
    const products: Product[] = [
      Product.create({ id: 'p-1', name: 'A', description: 'd', priceInCents: 1000, currency: 'COP', imageUrl: '', stock: 5 }),
      Product.create({ id: 'p-2', name: 'B', description: 'd', priceInCents: 2000, currency: 'COP', imageUrl: '', stock: 3 }),
    ];

    const repo: jest.Mocked<ProductRepositoryPort> = {
      findById: jest.fn(),
      list: jest.fn().mockResolvedValue(products),
      decrementStockIfAvailable: jest.fn(),
    };

    const useCase = new ListProductsUseCase(repo);
    const result = await useCase.execute();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('p-1');
    expect(result[1].id).toBe('p-2');
  });

  it('should return empty array when no products exist', async () => {
    const repo: jest.Mocked<ProductRepositoryPort> = {
      findById: jest.fn(),
      list: jest.fn().mockResolvedValue([]),
      decrementStockIfAvailable: jest.fn(),
    };

    const useCase = new ListProductsUseCase(repo);
    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});
