import { Test, TestingModule } from '@nestjs/testing';

import { PingController } from '../ping.controller.js';

describe('PingController', () => {
  let controller: PingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PingController],
    }).compile();

    controller = module.get<PingController>(PingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return "OK"', () => {
    expect(controller.ping()).toBe('OK');
  });
});
