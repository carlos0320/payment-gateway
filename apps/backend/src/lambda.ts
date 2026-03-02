import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import serverlessExpress from '@vendia/serverless-express';
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import express from 'express';
import { AppModule } from './app.module';

let cachedHandler: any;

async function bootstrap() {
  const expressApp = express();

  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.init();

  cachedHandler = serverlessExpress({ app: expressApp });
}

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
  context,
  callback,
) => {
  if (!cachedHandler) {
    await bootstrap();
  }
  return cachedHandler(event, context, callback);
};
