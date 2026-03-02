import { Module } from '@nestjs/common';

import { ProductsController } from './adapters/http/controllers/products.controller';
import { TransactionsController } from './adapters/http/controllers/transactions.controller';

import { InMemoryProductRepository } from './adapters/persistence/in-memory/in-memory-product.repository';
import { InMemorySettingsRepository } from './adapters/persistence/in-memory/in-memory-settings.repository';
import { InMemoryTransactionRepository } from './adapters/persistence/in-memory/in-memory-transaction.repository';

import { DynamoProductRepository } from './adapters/persistence/dynamodb/dynamo-product.repository';
import { DynamoTransactionRepository } from './adapters/persistence/dynamodb/dynamo-transaction.repository';
import { DynamoSettingsRepository } from './adapters/persistence/dynamodb/dynamo-settings.repository';
import {
  dynamoProviders,
  DYNAMO_DOC,
} from './adapters/persistence/dynamodb/dynamo.providers';

import { WompiGatewayHttp } from './adapters/wompi/wompi.gateway.http';
import { UuidGenerator } from './adapters/id/uuid-generator';

import {
  PRODUCT_REPOSITORY,
  SETTINGS_REPOSITORY,
  TRANSACTION_REPOSITORY,
  WOMPI_GATEWAY,
  ID_GENERATOR,
} from './application/tokens';

import { ListProductsUseCase } from './application/use-cases/list-products/list-products.usecase';
import { GetProductUseCase } from './application/use-cases/get-product/get-product.usecase';
import { CreateTransactionUseCase } from './application/use-cases/create-transaction/create-transaction.usecase';
import { ConfigModule } from '@nestjs/config';
import { PayTransactionUseCase } from './application/use-cases/pay-transaction/pay-transaction.usecase';
import { GetTransactionUseCase } from './application/use-cases/get-transaction/get-transaction.usecase';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' })],
  controllers: [ProductsController, TransactionsController],
  providers: [
    // Concrete classes
    ...dynamoProviders,
    InMemoryProductRepository,
    InMemorySettingsRepository,
    InMemoryTransactionRepository,
    UuidGenerator,

    // Port bindings
    {
      provide: PRODUCT_REPOSITORY,
      useFactory: (doc) => {
        const useDynamo = process.env.USE_DYNAMO === 'true';
        if (!useDynamo) return new InMemoryProductRepository();

        return new DynamoProductRepository(
          doc,
          process.env.DYNAMO_PRODUCTS_TABLE || 'Products',
        );
      },
      inject: [DYNAMO_DOC],
    },
    {
      provide: SETTINGS_REPOSITORY,
      useFactory: (doc) => {
        const useDynamo = process.env.USE_DYNAMO === 'true';
        if (!useDynamo) return new InMemorySettingsRepository();

        return new DynamoSettingsRepository(
          doc,
          process.env.DYNAMO_SETTINGS_TABLE || 'Settings',
        );
      },
      inject: [DYNAMO_DOC],
    },
    {
      provide: TRANSACTION_REPOSITORY,
      useFactory: (doc) => {
        const useDynamo = process.env.USE_DYNAMO === 'true';
        if (!useDynamo) return new InMemoryTransactionRepository();

        return new DynamoTransactionRepository(
          doc,
          process.env.DYNAMO_TRANSACTIONS_TABLE || 'Transactions',
        );
      },
      inject: [DYNAMO_DOC],
    },
    { provide: ID_GENERATOR, useExisting: UuidGenerator },

    // Wompi gateway binding (constructed)
    {
      provide: WOMPI_GATEWAY,
      useFactory: () =>
        new WompiGatewayHttp(
          process.env.WOMPI_BASE_URL!,
          process.env.WOMPI_PUBLIC_KEY!,
          process.env.WOMPI_PRIVATE_KEY!,
        ),
    },

    // Use cases
    {
      provide: ListProductsUseCase,
      useFactory: (repo) => new ListProductsUseCase(repo),
      inject: [PRODUCT_REPOSITORY],
    },
    {
      provide: GetProductUseCase,
      useFactory: (repo) => new GetProductUseCase(repo),
      inject: [PRODUCT_REPOSITORY],
    },
    {
      provide: CreateTransactionUseCase,
      useFactory: (
        productsRepo: InMemoryProductRepository,
        txRepo: InMemoryTransactionRepository,
        settingsRepo: InMemorySettingsRepository,
        idGen: UuidGenerator,
        wompi: WompiGatewayHttp,
      ) =>
        new CreateTransactionUseCase(
          productsRepo,
          txRepo,
          settingsRepo,
          idGen,
          wompi,
          process.env.WOMPI_PUBLIC_KEY!, // merchantPublicKey param for /merchants/{pubKey}
        ),
      inject: [
        PRODUCT_REPOSITORY,
        TRANSACTION_REPOSITORY,
        SETTINGS_REPOSITORY,
        ID_GENERATOR,
        WOMPI_GATEWAY,
      ],
    },
    {
      provide: PayTransactionUseCase,
      useFactory: (
        txRepo: InMemoryTransactionRepository,
        wompi: WompiGatewayHttp,
      ) =>
        new PayTransactionUseCase(
          txRepo,
          wompi,
          process.env.WOMPI_INTEGRITY_SECRET!, // integrity secret for signature generation
        ),
      inject: [TRANSACTION_REPOSITORY, WOMPI_GATEWAY],
    },
    {
      provide: GetTransactionUseCase,
      useFactory: (
        txRepo: InMemoryTransactionRepository,
        productsRepo: InMemoryProductRepository,
        wompi: WompiGatewayHttp,
      ) => new GetTransactionUseCase(txRepo, productsRepo, wompi),
      inject: [TRANSACTION_REPOSITORY, PRODUCT_REPOSITORY, WOMPI_GATEWAY],
    },
  ],
})
export class AppModule {}
