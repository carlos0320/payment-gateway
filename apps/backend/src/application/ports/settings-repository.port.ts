export interface GlobalSettings {
  baseFeeInCents: number;
  deliveryFeeInCents: number;
}

export interface SettingsRepositoryPort {
  getGlobalSettings(): Promise<GlobalSettings>;
}
