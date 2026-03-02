import { CreateTransactionUseCase } from './create-transaction.usecase';
import { Product } from 'src/domain/product/product.entity';
import { ProductRepositoryPort } from 'src/application/ports/product-repository.port';
import { TransactionRepositoryPort } from 'src/application/ports/transaction-repository.port';
import { SettingsRepositoryPort } from 'src/application/ports/settings-repository.port';
import { IdGeneratorPort } from 'src/application/ports/id-generator.port';
import { WompiGatewayPort } from 'src/application/ports/wompi-gateway.port';

const PRODUCT = Product.create({
  id: 'prod-1',
  name: 'Shirt',
  description: 'A nice shirt',
  priceInCents: 100_000,
  currency: 'COP',
  imageUrl: 'https://img.test/shirt.png',
  stock: 10,
});

const SETTINGS = { baseFeeInCents: 2_500, deliveryFeeInCents: 5_000 };

const CONTRACTS = {
  acceptanceToken: 'tok-abc',
  acceptPersonalAuth: 'auth-abc',
  endUserPolicyUrl: 'https://wompi.com/policy',
  personalDataAuthUrl: 'https://wompi.com/data',
};

const INPUT = {
  productId: 'prod-1',
  quantity: 2,
  customer: {
    fullName: 'John Doe',
    email: 'john@test.com',
    phoneNumber: '3001234567',
    phonePrefix: '+57',
  },
  delivery: {
    address: 'Calle 1 #2-3',
    city: 'Bogota',
    country: 'CO' as const,
    region: 'Bogota',
  },
  clientIp: '127.0.0.1',
};

function makeMocks() {
  const products: jest.Mocked<ProductRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(PRODUCT),
    list: jest.fn(),
    decrementStockIfAvailable: jest.fn(),
  };

  const transactions: jest.Mocked<TransactionRepositoryPort> = {
    save: jest.fn().mockResolvedValue(undefined),
    findById: jest.fn(),
    update: jest.fn(),
  };

  const settings: jest.Mocked<SettingsRepositoryPort> = {
    getGlobalSettings: jest.fn().mockResolvedValue(SETTINGS),
  };

  const idGenerator: jest.Mocked<IdGeneratorPort> = {
    newId: jest.fn().mockReturnValue('tx-uuid-1'),
  };

  const wompiGateway: jest.Mocked<WompiGatewayPort> = {
    getMerchantContracts: jest.fn().mockResolvedValue(CONTRACTS),
    createCardTransaction: jest.fn(),
    getTransactionStatus: jest.fn(),
  };

  const useCase = new CreateTransactionUseCase(
    products,
    transactions,
    settings,
    idGenerator,
    wompiGateway,
    'pub_test_key',
  );

  return { useCase, products, transactions, settings, idGenerator, wompiGateway };
}

describe('CreateTransactionUseCase', () => {
  it('should create a PENDING transaction with correct amounts', async () => {
    const { useCase } = makeMocks();

    const result = await useCase.execute(INPUT);

    expect(result.transactionId).toBe('tx-uuid-1');
    expect(result.status).toBe('PENDING');
    expect(result.amounts).toEqual({
      productAmountInCents: 200_000, // 100_000 * 2
      baseFeeInCents: 2_500,
      deliveryFeeInCents: 5_000,
      totalInCents: 207_500,
      currency: 'COP',
    });
  });

  it('should return merchant contract URLs', async () => {
    const { useCase } = makeMocks();

    const result = await useCase.execute(INPUT);

    expect(result.contracts).toEqual({
      endUserPolicyUrl: 'https://wompi.com/policy',
      personalDataAuthUrl: 'https://wompi.com/data',
    });
  });

  it('should save the transaction to the repository', async () => {
    const { useCase, transactions } = makeMocks();

    await useCase.execute(INPUT);

    expect(transactions.save).toHaveBeenCalledTimes(1);
    const saved = transactions.save.mock.calls[0][0];
    expect(saved.transactionId).toBe('tx-uuid-1');
    expect(saved.productId).toBe('prod-1');
    expect(saved.quantity).toBe(2);
  });

  it('should fetch merchant contracts with the public key', async () => {
    const { useCase, wompiGateway } = makeMocks();

    await useCase.execute(INPUT);

    expect(wompiGateway.getMerchantContracts).toHaveBeenCalledWith('pub_test_key');
  });

  it('should throw when product is not found', async () => {
    const { useCase, products } = makeMocks();
    products.findById.mockResolvedValue(null);

    await expect(useCase.execute(INPUT)).rejects.toThrow('Product not found');
  });

  it('should concatenate phone prefix and number in customer snapshot', async () => {
    const { useCase, transactions } = makeMocks();

    await useCase.execute(INPUT);

    const saved = transactions.save.mock.calls[0][0];
    expect(saved.customer.phoneNumber).toBe('+573001234567');
  });
});
