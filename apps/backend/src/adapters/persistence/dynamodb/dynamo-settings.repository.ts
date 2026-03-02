import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { SettingsRepositoryPort } from 'src/application/ports/settings-repository.port';
import { isGlobalSettingsItem } from './settings.mapper';

export class DynamoSettingsRepository implements SettingsRepositoryPort {
  constructor(
    private readonly doc: DynamoDBDocumentClient,
    private readonly tableName: string,
  ) {}

  async getGlobalSettings(): Promise<{
    baseFeeInCents: number;
    deliveryFeeInCents: number;
  }> {
    const res = await this.doc.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { settingsKey: 'global' },
      }),
    );
    if (!res.Item) {
      return { baseFeeInCents: 2500, deliveryFeeInCents: 5000 };
    }
    if (!isGlobalSettingsItem(res.Item))
      throw new Error('Invalid Settings item shape in DynamoDB');
    return {
      baseFeeInCents: res.Item.baseFeeInCents,
      deliveryFeeInCents: res.Item.deliveryFeeInCents,
    };
  }

  async seedGlobalSettingsIfMissing(
    baseFeeInCents: number,
    deliveryFeeInCents: number,
  ): Promise<void> {
    try {
      await this.doc.send(
        new PutCommand({
          TableName: this.tableName,
          Item: { settingsKey: 'global', baseFeeInCents, deliveryFeeInCents },
          ConditionExpression: 'attribute_not_exists(settingsKey)',
        }),
      );
    } catch {
      // already exists → ignore
    }
  }
}
