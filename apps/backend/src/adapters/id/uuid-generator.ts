import { randomUUID } from 'crypto';
import { IdGeneratorPort } from 'src/application/ports/id-generator.port';

export class UuidGenerator implements IdGeneratorPort {
  newId(): string {
    return randomUUID();
  }
}
