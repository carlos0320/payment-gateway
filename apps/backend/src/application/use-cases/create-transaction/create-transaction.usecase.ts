import { IdGeneratorPort } from 'src/application/ports/id-generator.port';
import { ProductRepositoryPort } from 'src/application/ports/product-repository.port';
import { SettingsRepositoryPort } from 'src/application/ports/settings-repository.port';
import { TransactionRepositoryPort } from 'src/application/ports/transaction-repository.port';
import { WompiGatewayPort } from 'src/application/ports/wompi-gateway.port';
import { Transaction } from 'src/domain/transaction/transaction.entity';

export interface CreateTransactionInput {
  productId: string;
  quantity: number;
  customer: {
    fullName: string;
    email: string;
    phoneNumber: string;
    phonePrefix: string;
  };
  delivery: {
    address: string;
    city: string;
    country: 'CO';
    region: string;
  };
  clientIp: string;
}

export interface CreateTransactionOutput {
  transactionId: string;
  status: 'PENDING';
  amounts: {
    productAmountInCents: number;
    baseFeeInCents: number;
    deliveryFeeInCents: number;
    totalInCents: number;
    currency: string;
  };
  contracts: {
    endUserPolicyUrl: string;
    personalDataAuthUrl: string;
  };
}

export class CreateTransactionUseCase {
  constructor(
    private readonly products: ProductRepositoryPort,
    private readonly transactions: TransactionRepositoryPort,
    private readonly settings: SettingsRepositoryPort,
    private readonly idGenerator: IdGeneratorPort,
    private readonly wompiGateway: WompiGatewayPort,
    private readonly wompiPublicKey: string,
  ) {}

  async execute(
    input: CreateTransactionInput,
  ): Promise<CreateTransactionOutput> {
    const product = await this.products.findById(input.productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const global = await this.settings.getGlobalSettings();

    const transactionId = this.idGenerator.newId();

    const productAmount = product.priceInCents * input.quantity;
    const total =
      productAmount + global.baseFeeInCents + global.deliveryFeeInCents;

    const contracts = await this.wompiGateway.getMerchantContracts(
      this.wompiPublicKey,
    );

    const transaction = Transaction.create(
      transactionId,
      product.id,
      input.quantity,
      null,
      {
        productAmountInCents: productAmount,
        baseFeeInCents: global.baseFeeInCents,
        deliveryFeeInCents: global.deliveryFeeInCents,
        totalInCents: total,
        currency: 'COP',
      },
      {
        email: input.customer.email,
        fullName: input.customer.fullName,
        phoneNumber: `${input.customer.phonePrefix}${input.customer.phoneNumber}`,
      },
      {
        address: input.delivery.address,
        city: input.delivery.city,
        region: input.delivery.region,
        country: 'CO',
      },
      {
        acceptanceToken: contracts.acceptanceToken,
        acceptPersonalAuth: contracts.acceptPersonalAuth,
        endUserPolicyUrl: contracts.endUserPolicyUrl,
        personalDataAuthUrl: contracts.personalDataAuthUrl,
      },
      input.clientIp,
    );

    await this.transactions.save(transaction);

    return {
      transactionId: transaction.transactionId,
      status: 'PENDING',
      amounts: transaction.amounts,
      contracts: {
        endUserPolicyUrl: contracts.endUserPolicyUrl,
        personalDataAuthUrl: contracts.personalDataAuthUrl,
      },
    };
  }
}
