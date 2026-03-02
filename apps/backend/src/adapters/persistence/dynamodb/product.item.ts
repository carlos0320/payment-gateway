import { Product } from 'src/domain/product/product.entity';

export type ProductItem = {
  productId: string;
  name: string;
  description: string;
  priceInCents: number;
  currency: 'COP';
  imageUrl: string;
  stock: number;
};

export function toDomainProduct(item: ProductItem): Product {
  return Product.create({
    // domain uses id, dynamo uses productId
    id: item.productId,
    name: item.name,
    description: item.description,
    priceInCents: item.priceInCents,
    currency: item.currency,
    imageUrl: item.imageUrl,
    stock: item.stock,
  });
}
