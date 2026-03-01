export class CreateTransactionResponseDto {
  transactionId!: string;
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
