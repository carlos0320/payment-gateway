import { Product } from 'src/domain/product/product.entity';
import { ProductRepositoryPort } from 'src/application/ports/product-repository.port';

const products: Product[] = [
  Product.create({
    id: 'product-1',
    name: 'Product 1',
    description: 'Description of Product 1',
    priceInCents: 200000,
    currency: 'COP',
    imageUrl: 'https://example.com/product-1.jpg',
    stock: 10,
  }),
  Product.create({
    id: 'product-2',
    name: 'Product 2',
    description: 'Description of Product 2',
    priceInCents: 300000,
    currency: 'COP',
    imageUrl: 'https://example.com/product-2.jpg',
    stock: 5,
  }),
];

export class InMemoryProductRepository implements ProductRepositoryPort {
  async findById(productId: string): Promise<Product | null> {
    return products.find((p) => p.id === productId) ?? null;
  }

  async list(): Promise<Product[]> {
    return products;
  }

  async decrementStockIfAvailable(
    productId: string,
    quantity: number,
  ): Promise<boolean> {
    const product = await this.findById(productId);
    if (!product) return false;

    if (!product.canFulfillOrder(quantity)) return false;

    product.decreaseStock(quantity);
    return true;
  }
}
