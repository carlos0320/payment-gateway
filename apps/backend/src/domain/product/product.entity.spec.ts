import { Product } from './product.entity';
import { InvalidQuantityError } from '../errors/invalid-quantity.error';
import { InsufficientStockError } from '../errors/insufficient-stock.error';

const makeProduct = (stock = 10): Product =>
  Product.create({
    id: 'prod-1',
    name: 'Test Product',
    description: 'A test product',
    priceInCents: 100_000,
    currency: 'COP',
    imageUrl: 'https://img.test/product.png',
    stock,
  });

describe('Product Entity', () => {
  describe('create', () => {
    it('should create a product with all properties', () => {
      const product = makeProduct(5);

      expect(product.id).toBe('prod-1');
      expect(product.name).toBe('Test Product');
      expect(product.priceInCents).toBe(100_000);
      expect(product.currency).toBe('COP');
      expect(product.stock).toBe(5);
    });
  });

  describe('isInStock', () => {
    it('should return true when stock > 0', () => {
      expect(makeProduct(1).isInStock()).toBe(true);
    });

    it('should return false when stock is 0', () => {
      expect(makeProduct(0).isInStock()).toBe(false);
    });
  });

  describe('decreaseStock', () => {
    it('should decrease stock by the given quantity', () => {
      const product = makeProduct(10);
      product.decreaseStock(3);
      expect(product.stock).toBe(7);
    });

    it('should allow decreasing stock to exactly 0', () => {
      const product = makeProduct(5);
      product.decreaseStock(5);
      expect(product.stock).toBe(0);
    });

    it('should throw InvalidQuantityError when quantity < 1', () => {
      const product = makeProduct(10);
      expect(() => product.decreaseStock(0)).toThrow(InvalidQuantityError);
      expect(() => product.decreaseStock(-1)).toThrow(InvalidQuantityError);
    });

    it('should throw InsufficientStockError when quantity > stock', () => {
      const product = makeProduct(2);
      expect(() => product.decreaseStock(3)).toThrow(InsufficientStockError);
    });
  });

  describe('canFulfillOrder', () => {
    it('should return true when stock is sufficient', () => {
      expect(makeProduct(5).canFulfillOrder(5)).toBe(true);
      expect(makeProduct(5).canFulfillOrder(3)).toBe(true);
    });

    it('should return false when stock is insufficient', () => {
      expect(makeProduct(2).canFulfillOrder(3)).toBe(false);
    });

    it('should throw InvalidQuantityError when quantity < 1', () => {
      expect(() => makeProduct(5).canFulfillOrder(0)).toThrow(
        InvalidQuantityError,
      );
    });
  });
});
