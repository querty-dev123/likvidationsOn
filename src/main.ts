import 'reflect-metadata'; // Требуется для TypeORM
import logger from '@shared/logger';
import { ConfigService } from '@shared/config.service';
import { DatabaseService } from '@infrastructure/database.service';
import { TelegramService } from '@infrastructure/telegram.service';
import { BinanceWsService } from '@infrastructure/binance.ws.service';
import { SettingsService } from '@application/settings.service';
import { AlertProcessor } from '@application/alert.processor';

async function bootstrap() {
  logger.info('Запуск бота Pump Scout...');

  // 1. Инициализация Конфигурации
  const configService = new ConfigService(logger);

  // 2. Инициализация Базы Данных
  const dbService = new DatabaseService();
  await dbService.initialize();
  const dataSource = dbService.getDataSource();

  // 3. Инициализация Сервисов
  const settingsService = new SettingsService(dataSource, configService.telegramChatId);
  const telegramService = new TelegramService(configService);
  const alertProcessor = new AlertProcessor(settingsService, telegramService);
  const binanceWsService = new BinanceWsService(configService);

  // 4. Настройка обработчиков Telegram команд
  const bot = telegramService.getBotInstance();

  // /start - Приветствие
  bot.onText(/\/start/, async (msg) => {
    const message = `
🚀 Добро пожаловать в Pump Scout Bot!
Я отслеживаю крупные ликвидации на Binance Futures в реальном времени.

Команды:
- /settings — текущие фильтры
- /set_liq_from 15000 — ликвидации (❌) от 15 000$ и выше
- /set_order_from 8000 — крупные сделки (✅) от 8 000$ и выше

Примеры:
<code>/set_liq_from 10000</code>
<code>/set_order_from 5000</code>
    `;
    await telegramService.sendMessage(message);
  });

  // /settings - Показать текущие настройки
  bot.onText(/\/settings/, async (msg) => {
    try {
      const settings = await settingsService.getSettings();
      const message = `
⚙️ <b>Текущие Настройки Фильтров</b>:

<b>Ликвидация (❌)</b>: от <b>$${settings.minLiquidationAmountUsd.toLocaleString()}</b> и выше
<b>Крупная сделка (✅)</b>: от <b>$${settings.minOrderAmountUsd.toLocaleString()}</b> и выше

<i>Максимальные лимиты отключены — приходят все события больше указанных сумм.</i>
      `;
      await telegramService.sendMessage(message);
    } catch (e) {
        logger.error('Ошибка при получении настроек:', e);
        await telegramService.sendMessage('⚠️ Произошла ошибка при загрузке настроек.');
    }
  });

  // === НОВЫЕ УДОБНЫЕ КОМАНДЫ ===
  bot.onText(/\/set_liq_from (\d+)/, async (msg, match) => {
    const min = parseInt(match![1], 10);
    await settingsService.updateSettings({ minLiquidationAmountUsd: min });
    await telegramService.sendMessage(`✅ Ликвидации (❌) теперь от <b>$${min.toLocaleString()}</b> и выше.`);
  });

  bot.onText(/\/set_order_from (\d+)/, async (msg, match) => {
    const min = parseInt(match![1], 10);
    await settingsService.updateSettings({ minOrderAmountUsd: min });
    await telegramService.sendMessage(`✅ Крупные сделки (✅) теперь от <b>$${min.toLocaleString()}</b> и выше.`);
  });

  // 5. Запуск WebSocket-клиента и подключение обработчика
  binanceWsService.onData((data) => {
    alertProcessor.processEvent(data).catch(e => logger.error('Ошибка в процессоре оповещений:', e));
  });

  // Обработчик выхода из процесса
  process.on('SIGINT', () => {
    logger.info('Получен сигнал SIGINT. Завершение работы...');
    binanceWsService.disconnect();
    if (dataSource.isInitialized) {
        dataSource.destroy();
    }
    process.exit(0);
  });
}

bootstrap().catch(e => {
  logger.error('Критическая ошибка при запуске приложения:', e);
  process.exit(1);
});