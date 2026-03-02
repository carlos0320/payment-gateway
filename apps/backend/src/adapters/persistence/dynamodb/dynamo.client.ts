import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export function makeDynamoDocClient() {
  const region = process.env.DYNAMO_REGION || 'us-east-1';

  const client = new DynamoDBClient({
    region,
    // endpoint only for local dynamodb (optional)
    endpoint: process.env.DYNAMO_ENDPOINT || undefined,
  });

  return DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
  });
}
