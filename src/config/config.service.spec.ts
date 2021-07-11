import { Test, TestingModule } from '@nestjs/testing';
import * as yargs from 'yargs';
import { ConfigModule } from './config.module';
import { CustomConfigService } from './config.service';

describe('ConfigService', () => {
  let service: CustomConfigService;
  beforeEach(async () => {
    process.argv = ['--port', '3003'];
    yargs.parse(process.argv);
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
    }).compile();
    service = module.get<CustomConfigService>(CustomConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return undefined', () => {
    expect(service.get('test')).toBeUndefined();
  });

  it('should return port value', () => {
    expect(service.get('port')).toBe(3002);
  });

  it('should return default value', () => {
    expect(service.get('test', 'default value')).toBe('default value');
  });
});
