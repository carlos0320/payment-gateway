export type TransactionId = string;
export type ProductId = string;
export type Quantity = number;
export type WompiTransactionId = string | null;

export const CURRENCY = 'COP' as const;
export type Currency = typeof CURRENCY;

export const COUNTRY = 'CO' as const;
export type Country = typeof COUNTRY;

export type ClientIp = string;

export enum Status {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum WompiTransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  ERROR = 'ERROR',
  VOIDED = 'VOIDED',
}

export interface AmountsSnapshot {
  productAmountInCents: number;
  baseFeeInCents: number;
  deliveryFeeInCents: number;
  totalInCents: number;
  currency: Currency;
}

export interface CustomerSnapshot {
  email: string;
  fullName: string;
  phoneNumber: string;
}

export interface DeliverySnapshot {
  address: string;
  city: string;
  region: string;
  country: Country;
}

export interface AcceptanceSnapshot {
  acceptanceToken?: string;
  acceptPersonalAuth?: string;
  endUserPolicyUrl?: string;
  personalDataAuthUrl?: string;
}

export interface TransactionData {
  transactionId: TransactionId;
  productId: ProductId;
  quantity: Quantity;
  status: Status;
  wompiTransactionId: WompiTransactionId | null;
  wompiTransactionStatus: WompiTransactionStatus | null;
  amounts: AmountsSnapshot;
  customer: CustomerSnapshot;
  delivery: DeliverySnapshot;
  acceptance: AcceptanceSnapshot;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  clientIp: ClientIp;
}
