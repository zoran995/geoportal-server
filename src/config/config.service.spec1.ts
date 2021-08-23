/* import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as yargs from 'yargs';

describe('ConfigService', () => {
  let service: ConfigService;
  beforeEach(async () => {
    process.argv = ['--port', '3003', '--port', '3004'];
    yargs.parse(process.argv);
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
    }).compile();
    service = module.get<ConfigService>(ConfigService);
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
 */
