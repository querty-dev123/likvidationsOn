import { DataSource } from 'typeorm';
import { Settings } from '@domain/settings.entity';
import logger from '@shared/logger';

export class DatabaseService {
  private dataSource: DataSource;

  constructor() {
    this.dataSource = new DataSource({
      type: 'sqlite',
      database: 'pump-scout.sqlite', // Имя файла базы данных
      entities: [Settings],
      synchronize: true, // Использовать только для разработки!
      logging: ['error', 'warn'],
    });
  }

  public async initialize(): Promise<void> {
    try {
      await this.dataSource.initialize();
      logger.info('Соединение с базой данных SQLite установлено.');
    } catch (error) {
      logger.error('Ошибка при инициализации базы данных:', error);
      throw error;
    }
  }

  public getDataSource(): DataSource {
    return this.dataSource;
  }
}