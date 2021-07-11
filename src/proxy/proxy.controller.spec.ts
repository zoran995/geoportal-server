import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from 'src/http/http.module';
import { ProxyConfigService } from './config/proxy-config.service';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';

describe('ProxyController', () => {
  let controller: ProxyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule, ConfigModule],
      controllers: [ProxyController],
      providers: [ProxyService, ProxyConfigService],
    }).compile();

    controller = module.get<ProxyController>(ProxyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
