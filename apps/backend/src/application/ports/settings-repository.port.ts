import { Currency } from 'src/domain/transaction/transaction.types';

export interface GlobalSettings {
  baseFeeInCents: number;
  deliveryFeeInCents: number;
  currency: Currency;
}

export interface SettingsRepositoryPort {
  getGlobalSettings(): Promise<GlobalSettings>;
}
