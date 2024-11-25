import { LoggerService } from './logger.service';

export class TestLoggerService extends LoggerService {
  override log = jest.fn();
  override error = jest.fn();
  override warn = jest.fn();
  override debug = jest.fn();
  override verbose = jest.fn();
  override info = jest.fn();
}
