import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * Сущность для хранения пользовательских настроек фильтрации.
 * В реальном приложении User ID должен браться из Telegram, но для простоты
 * мы используем фиксированный ID, соответствующий ID чата Telegram.
 */
@Entity('settings')
export class Settings {
  // Используем ID чата Telegram как первичный ключ
  @PrimaryColumn({ type: 'integer' })
  chatId!: number;

  // Минимальная сумма ликвидации для уведомления (USD)
  @Column({ type: 'real', default: 10000 })
  minLiquidationAmountUsd!: number;

  // Минимальная сумма ордера/крупной сделки для уведомления (USD)
  @Column({ type: 'real', default: 10000 })
  minOrderAmountUsd!: number;
}