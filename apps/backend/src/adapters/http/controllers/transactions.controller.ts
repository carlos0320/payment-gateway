import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CreateTransactionUseCase } from 'src/application/use-cases/create-transaction/create-transaction.usecase';
import { CreateTransactionResponseDto } from '../dtos/create-transaction.response.dto';
import { CreateTransactionRequestDto } from '../dtos/create-transaction.request.dto';
import express from 'express';
import { PayTransactionRequestDto } from '../dtos/pay-transaction.request.dto';
import { PayTransactionUseCase } from 'src/application/use-cases/pay-transaction/pay-transaction.usecase';
import { GetTransactionUseCase } from 'src/application/use-cases/get-transaction/get-transaction.usecase';
import { InsufficientStockError } from 'src/domain/errors/insufficient-stock.error';
import { InvalidQuantityError } from 'src/domain/errors/invalid-quantity.error';
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly payTransactionUseCase: PayTransactionUseCase,
    private readonly getTransactionUseCase: GetTransactionUseCase,
  ) {}
  @Post()
  async create(
    @Req() req: express.Request,
    @Body() dto: CreateTransactionRequestDto,
  ): Promise<CreateTransactionResponseDto> {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0];
    try {
      return (await this.createTransactionUseCase.execute({
        productId: dto.productId,
        quantity: dto.quantity,
        customer: dto.customer,
        delivery: dto.delivery,
        clientIp: ip,
      })) as CreateTransactionResponseDto;
    } catch (err) {
      this.handleError(err);
    }
  }
  @Post(':id/pay')
  async pay(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: PayTransactionRequestDto,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0];
    try {
      return await this.payTransactionUseCase.execute({
        transactionId: id,
        cardToken: dto.cardToken,
        installments: dto.installments,
        clientIp: ip,
      });
    } catch (err) {
      this.handleError(err);
    }
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    try {
      return await this.getTransactionUseCase.execute(id);
    } catch (err) {
      this.handleError(err);
    }
  }

  private handleError(err: any): never {
    if (err instanceof InsufficientStockError || err.message === 'OutOfStock') {
      throw new ConflictException(err.message);
    }

    if (err instanceof InvalidQuantityError) {
      throw new BadRequestException(err.message);
    }

    if (
      err.message === 'TransactionNotFound' ||
      err.message === 'Product not found'
    ) {
      throw new NotFoundException(err.message);
    }

    if (err.message === 'TransactionNotPayable') {
      throw new ConflictException(err.message);
    }

    throw err;
  }
}
