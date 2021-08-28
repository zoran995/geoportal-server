import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { POST_SIZE_LIMIT } from 'src/common/interceptor/payload-limit.interceptor';
import { ProxyConfigService } from './config/proxy-config.service';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';
import { ProxyListService } from './utils/proxy-list.service';

describe('ProxyController', () => {
  let controller: ProxyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule, ConfigModule],
      controllers: [ProxyController],
      providers: [
        ProxyService,
        ProxyConfigService,
        ProxyListService,
        {
          provide: POST_SIZE_LIMIT,
          useValue: 102400,
        },
      ],
    }).compile();

    controller = module.get<ProxyController>(ProxyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
