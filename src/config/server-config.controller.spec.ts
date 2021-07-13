import { Test, TestingModule } from '@nestjs/testing';
import { ServerConfigController } from './server-config.controller';

describe('ServerConfigController', () => {
  let controller: ServerConfigController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServerConfigController],
    }).compile();

    controller = module.get<ServerConfigController>(ServerConfigController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
