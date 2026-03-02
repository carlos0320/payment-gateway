export type TransactionStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
export type WompiTransactionStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'DECLINED'
  | 'ERROR'
  | 'VOIDED';

export type TransactionItem = {
  transactionId: string;
  productId: string;
  quantity: number;

  status: TransactionStatus;
  wompiTransactionId: string | null;
  wompiTransactionStatus: WompiTransactionStatus | null;

  amounts: {
    productAmountInCents: number;
    baseFeeInCents: number;
    deliveryFeeInCents: number;
    totalInCents: number;
    currency: 'COP';
  };

  customer: {
    email: string;
    fullName: string;
    phoneNumber: string;
  };

  delivery: {
    address: string;
    city: string;
    region: string;
    country: 'CO';
  };

  acceptance: {
    acceptanceToken?: string;
    acceptPersonalAuth?: string;
    endUserPolicyUrl?: string;
    personalDataAuthUrl?: string;
  };

  failureReason: string | null;
  clientIp: string;

  createdAt: string;
  updatedAt: string;
};
