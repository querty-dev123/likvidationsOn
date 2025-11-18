import { SettingsService } from '@application/settings.service';
import { TelegramService } from '@infrastructure/telegram.service';
import { BinanceLiquidationEventDto } from '@domain/settings.dto';
import logger from '@shared/logger';

// Типы для упрощения работы с ликвидациями
type LiquidationType = 'LIQUIDATION' | 'ORDER'; // LIQUIDATION = обычная ликвидация (❌), ORDER = крупная (✅)
type Side = 'BUY' | 'SELL';

export class AlertProcessor {
  private settingsService: SettingsService;
  private telegramService: TelegramService;

  constructor(settingsService: SettingsService, telegramService: TelegramService) {
    this.settingsService = settingsService;
    this.telegramService = telegramService;
    logger.info('AlertProcessor инициализирован.');
  }

  /**
   * Обрабатывает входящее событие ликвидации с Binance.
   */
  public async processEvent(event: BinanceLiquidationEventDto): Promise<void> {
    const settings = await this.settingsService.getSettings();
    
    const symbol = event.o.s;
    const quantity = parseFloat(event.o.q);
    const price = parseFloat(event.o.ap);
    const side: Side = event.o.S;
    
    if (isNaN(quantity) || isNaN(price)) {
        logger.warn(`Пропуск события с неверными числовыми данными: ${JSON.stringify(event)}`);
        return;
    }

    // Сумма ликвидации в USD
    const amountUsd = quantity * price;

    let isAlert = false;
    let alertType: LiquidationType = 'LIQUIDATION'; // По умолчанию

    // === НОВАЯ ЛОГИКА: только "от и выше" ===
    // Сначала проверяем на обычную ликвидацию (❌)
    if (amountUsd >= settings.minLiquidationAmountUsd) {
        isAlert = true;
        alertType = 'LIQUIDATION';
    }
    // Если не попала в ликвидации — проверяем как крупную сделку (✅)
    else if (amountUsd >= settings.minOrderAmountUsd) {
        isAlert = true;
        alertType = 'ORDER';
    }

    if (isAlert) {
      await this.sendNotification(symbol, amountUsd, side, alertType);
    } else {
      logger.debug(`Событие пропущено. ${symbol} — $${amountUsd.toFixed(0)} (ниже порогов)`);
    }
  }

  /**
   * Отправляет отформатированное уведомление в Telegram.
   */
  private async sendNotification(symbol: string, amountUsd: number, side: Side, type: LiquidationType): Promise<void> {
    const marker = type === 'LIQUIDATION' ? '❌' : '✅';
    const typeLabel = type === 'LIQUIDATION' 
        ? (side === 'BUY' ? '🔥 Long Liquidation' : '❄️ Short Liquidation')
        : '💰 Крупная Сделка';

    // Можно поменять на TradingView или оставить Coinglass
    const coinglassLink = `https://www.coinglass.com/huobi/futures/${symbol.toLowerCase()}`;
    // Альтернатива: const tvLink = `https://ru.tradingview.com/chart/?symbol=BINANCE:${symbol}PERP`;

    const message = `
<b>${marker} ${symbol}</b> | ${typeLabel}
Сумма: <b>$${amountUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}</b>
Направление: <i>${side === 'BUY' ? 'Long' : 'Short'}</i>
Источник: <a href="${coinglassLink}">Coinglass</a>
    `.trim();

    logger.info(`[ALERT] ${marker} ${symbol} — $${amountUsd.toFixed(0)} (${side})`);
    await this.telegramService.sendMessage(message);
  }
}