export class CreateTransactionResponseDto {
  transactionId!: string;
  reference!: string;
  status!: 'PENDING';
  amounts!: {
    productAmountInCents: number;
    baseFeeInCents: number;
    deliveryFeeInCents: number;
    totalInCents: number;
    currency: 'COP';
  };
  contracts!: {
    endUserPolicyUrl: string;
    personalDataAuthUrl: string;
  };
}
