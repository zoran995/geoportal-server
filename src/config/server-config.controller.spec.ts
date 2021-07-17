import { Test, TestingModule } from '@nestjs/testing';
import { ProxyModule } from 'src/proxy/proxy.module';
import { ConfigModule } from './config.module';
import { ServerConfigController } from './server-config.controller';

describe('ServerConfigController', () => {
  let controller: ServerConfigController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, ProxyModule],
      controllers: [ServerConfigController],
    }).compile();

    controller = module.get<ServerConfigController>(ServerConfigController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
