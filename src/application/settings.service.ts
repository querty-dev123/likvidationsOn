import { DataSource, Repository } from 'typeorm';
import { Settings } from '@domain/settings.entity';
import { UpdateSettingsDto } from '@domain/settings.dto';
import logger from '@shared/logger';

export class SettingsService {
  private settingsRepository: Repository<Settings>;
  private readonly defaultChatId: number = 123456789;

  constructor(dataSource: DataSource, chatId: number) {
    this.settingsRepository = dataSource.getRepository(Settings);
    this.defaultChatId = Number(chatId);
    logger.info(`SettingsService инициализирован для Chat ID: ${this.defaultChatId}`);
  }

  public async getSettings(): Promise<Settings> {
    let settings = await this.settingsRepository.findOne({ where: { chatId: this.defaultChatId } });

    if (!settings) {
      settings = new Settings();
      settings.chatId = this.defaultChatId;
      settings.minLiquidationAmountUsd = 10000;
      settings.minOrderAmountUsd = 10000;
      await this.settingsRepository.save(settings);
      logger.info('Созданы настройки по умолчанию (только min).');
    }
    return settings;
  }

  public async updateSettings(dto: Partial<UpdateSettingsDto>): Promise<Settings> {
    const settings = await this.getSettings();
    
    if (dto.minLiquidationAmountUsd !== undefined) {
        settings.minLiquidationAmountUsd = dto.minLiquidationAmountUsd;
    }
    if (dto.minOrderAmountUsd !== undefined) {
        settings.minOrderAmountUsd = dto.minOrderAmountUsd;
    }

    return this.settingsRepository.save(settings);
  }
}