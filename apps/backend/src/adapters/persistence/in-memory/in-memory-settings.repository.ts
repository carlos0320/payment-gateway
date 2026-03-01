import {
  GlobalSettings,
  SettingsRepositoryPort,
} from 'src/application/ports/settings-repository.port';

export class InMemorySettingsRepository implements SettingsRepositoryPort {
  getGlobalSettings(): Promise<GlobalSettings> {
    return Promise.resolve({
      baseFeeInCents: 2500,
      deliveryFeeInCents: 5000,
      currency: 'COP',
    });
  }
}
