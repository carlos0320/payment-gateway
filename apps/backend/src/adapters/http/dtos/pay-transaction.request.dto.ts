import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class PayTransactionRequestDto {
  @IsString()
  @IsNotEmpty()
  cardToken!: string;

  @IsInt()
  @Min(1)
  installments!: number;
}
