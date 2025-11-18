import WebSocket from 'ws';
import { ConfigService } from '@shared/config.service';
import logger from '@shared/logger';
import { BinanceLiquidationEventDto } from '@domain/settings.dto';

// Тип для обработчика данных
type DataHandler = (data: BinanceLiquidationEventDto) => void;

export class BinanceWsService {
  private ws: WebSocket | null = null;
  private readonly url: string;
  private handler: DataHandler | null = null;
  private reconnectInterval: NodeJS.Timeout | null = null;

  constructor(configService: ConfigService) {
    this.url = configService.binanceWsUrl;
    this.connect();
  }

  // Установка обработчика, который будет вызываться при получении новых данных
  public onData(handler: DataHandler): void {
    this.handler = handler;
  }

  private connect(): void {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
    }

    this.ws = new WebSocket(this.url);

    this.ws.on('open', () => {
      logger.info(`Binance WS: Подключено к ${this.url}`);
    });

    this.ws.on('message', (data) => {
      try {
          const event = JSON.parse(data.toString());

          if (event.e === 'forceOrder' && this.handler) {
              this.handler(event as BinanceLiquidationEventDto);
          }
      } catch (err) {
          logger.error('Parse error:', err);
      }
    });

    this.ws.on('close', (code, reason) => {
      logger.warn(`Binance WS: Соединение закрыто. Код: ${code}, Причина: ${reason.toString()}. Переподключение через 5 секунд...`);
      this.scheduleReconnect();
    });

    this.ws.on('error', (error) => {
      logger.error('Binance WS: Ошибка сокета:', error);
      this.ws?.close();
    });
  }

  private scheduleReconnect(): void {
    this.reconnectInterval = setTimeout(() => {
      logger.info('Binance WS: Попытка переподключения...');
      this.connect();
    }, 5000);
  }

  public disconnect(): void {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
    }
    this.ws?.close();
  }
}