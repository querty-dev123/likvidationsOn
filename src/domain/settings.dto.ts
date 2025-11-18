import { IsNumber, IsNotEmpty, IsIn, Min, Max } from 'class-validator';

/**
 * DTO для настройки диапазонов пользователем.
 */
export class UpdateSettingsDto {
  @IsNumber()
  @Min(0)
  minLiquidationAmountUsd!: number;

  @IsNumber()
  @Min(0)
  minOrderAmountUsd!: number;
}

/**
 * Внутренний DTO для данных о ликвидации (forceOrder).
 */
export class BinanceLiquidationOrderDto {
  s!: string; // Symbol
  S!: 'BUY' | 'SELL'; // Side (BUY = Long Liquidation, SELL = Short Liquidation)
  q!: string; // Quantity
  ap!: string; // Average price
}

/**
 * Внутренний DTO для всего сообщения о ликвидации.
 */
export class BinanceLiquidationEventDto {
  e!: 'forceOrder'; // Event type
  E!: number; // Event time
  o!: BinanceLiquidationOrderDto; // Order details
}