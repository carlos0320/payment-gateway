import { GetCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { ProductRepositoryPort } from 'src/application/ports/product-repository.port';
import { Product } from 'src/domain/product/product.entity';
import { ProductItem, toDomainProduct } from './product.item';

export class DynamoProductRepository implements ProductRepositoryPort {
  constructor(
    private readonly doc: DynamoDBDocumentClient,
    private readonly tableName: string,
  ) {}

  private toDomain(item: ProductItem): Product {
    return toDomainProduct(item);
  }

  async findById(productId: string): Promise<Product | null> {
    const res = await this.doc.send(
      new GetCommand({ TableName: this.tableName, Key: { productId } }),
    );
    if (!res.Item) return null;
    return this.toDomain(res.Item as ProductItem);
  }

  async list(): Promise<Product[]> {
    const res = await this.doc.send(
      new ScanCommand({ TableName: this.tableName }),
    );
    return (res.Items ?? []).map((item) => this.toDomain(item as ProductItem));
  }

  async decrementStockIfAvailable(
    productId: string,
    quantity: number,
  ): Promise<boolean> {
    try {
      await this.doc.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: { productId },
          ConditionExpression: 'stock >= :q',
          UpdateExpression: 'SET stock = stock - :q',
          ExpressionAttributeValues: { ':q': quantity },
        }),
      );
      return true;
    } catch {
      return false;
    }
  }
}
