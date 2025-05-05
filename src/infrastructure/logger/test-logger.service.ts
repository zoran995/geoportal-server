import { vi } from 'vitest';
import { LoggerService } from './logger.service.js';

export class TestLoggerService extends LoggerService {
  override log = vi.fn();
  override error = vi.fn();
  override warn = vi.fn();
  override debug = vi.fn();
  override verbose = vi.fn();
  override info = vi.fn();
}
