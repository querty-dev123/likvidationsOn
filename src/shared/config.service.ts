import * as dotenv from 'dotenv';
import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsUrl, IsString, IsNumberString, validateSync } from 'class-validator';
import { Logger } from 'winston';

dotenv.config();

// DTO для валидации переменных окружения
class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  TELEGRAM_TOKEN!: string;

  @IsNumberString()
  @IsNotEmpty()
  TELEGRAM_CHAT_ID!: string;

  @IsNotEmpty()
  BINANCE_WS_URL!: string;
}

export class ConfigService {
  private readonly env: EnvironmentVariables;
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    const validatedConfig = plainToInstance(EnvironmentVariables, process.env);
    const errors = validateSync(validatedConfig, { skipMissingProperties: false });

    if (errors.length > 0) {
      this.logger.error('Ошибка валидации конфигурации окружения:', errors);
      throw new Error(errors.toString());
    }

    this.env = validatedConfig;
    this.logger.info('Конфигурация успешно загружена.');
  }

  get telegramToken(): string {
    return this.env.TELEGRAM_TOKEN;
  }

  get telegramChatId(): number {
    return parseInt(this.env.TELEGRAM_CHAT_ID, 10);
  }

  get binanceWsUrl(): string {
    return this.env.BINANCE_WS_URL;
  }
}