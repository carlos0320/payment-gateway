import { makeDynamoDocClient } from './dynamo.client'

export const DYNAMO_DOC = Symbol('DYNAMO_DOC')

export const dynamoProviders = [
  {
    provide: DYNAMO_DOC,
    useFactory: () => makeDynamoDocClient(),
  },
]