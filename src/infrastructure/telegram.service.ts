import TelegramBot from 'node-telegram-bot-api';
import { ConfigService } from '@shared/config.service';
import logger from '@shared/logger';

export class TelegramService {
  private bot: TelegramBot;
  private readonly chatId: number;

  constructor(configService: ConfigService) {
    // Включение опции polling для получения сообщений
    this.bot = new TelegramBot(configService.telegramToken, { polling: true });
    this.chatId = configService.telegramChatId;
    
    // Установка команды /settings для бота
    this.bot.setMyCommands([
        { command: 'settings', description: 'Показать текущие настройки фильтров' },
        { command: 'set_liq_from', description: 'Установить стартовое значение для ликвидаций' },
        { command: 'start', description: 'Начать взаимодействие' },
    ]);

    logger.info(`Telegram Bot инициализирован. Chat ID: ${this.chatId}`);
  }

  public getBotInstance(): TelegramBot {
    return this.bot;
  }

  /**
   * Отправляет сообщение в настроенный чат.
   * @param message - Сообщение для отправки.
   */
  public async sendMessage(message: string): Promise<void> {
    try {
      await this.bot.sendMessage(this.chatId, message, { parse_mode: 'HTML', disable_web_page_preview: true });
    } catch (error) {
      logger.error('Ошибка отправки сообщения в Telegram:', error);
    }
  }
}