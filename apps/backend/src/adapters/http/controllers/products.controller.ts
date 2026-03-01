import {
  Controller,
  Get,
  Param,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ListProductsUseCase } from 'src/application/use-cases/list-products/list-products.usecase';
import { ProductResponseDto } from '../dtos/product.dto';
import { GetProductUseCase } from 'src/application/use-cases/get-product/get-product.usecase';
import { InsufficientStockError } from 'src/domain/errors/insufficient-stock.error';
import { InvalidQuantityError } from 'src/domain/errors/invalid-quantity.error';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly getProductUseCase: GetProductUseCase,
  ) {}

  @Get()
  async list(): Promise<{ products: ProductResponseDto[] }> {
    try {
      const products = await this.listProductsUseCase.execute();
      return {
        products: products.map((product) =>
          ProductResponseDto.fromDomain(product),
        ),
      };
    } catch (err) {
      this.handleError(err);
    }
  }

  @Get(':id')
  async getById(
    @Param('id') id: string,
  ): Promise<{ product: ProductResponseDto }> {
    try {
      const product = await this.getProductUseCase.execute(id);
      if (!product) {
        throw new NotFoundException('Product not found');
      }
      return {
        product: ProductResponseDto.fromDomain(product),
      };
    } catch (err) {
      this.handleError(err);
    }
  }

  private handleError(err: any): never {
    if (
      err instanceof InsufficientStockError ||
      err.message === 'OutOfStock'
    ) {
      throw new ConflictException(err.message);
    }

    if (
      err instanceof InvalidQuantityError ||
      (err.message && err.message.toLowerCase().includes('quantity'))
    ) {
      throw new BadRequestException(err.message);
    }

    if (err.message === 'Product not found') {
      throw new NotFoundException(err.message);
    }

    // rethrow anything we don't specifically handle
    throw err;
  }
}
