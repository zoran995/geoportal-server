import { Test, TestingModule } from '@nestjs/testing';

import { LoggerService } from 'src/infrastructure/logger/index.js';
import { TestLoggerService } from 'src/infrastructure/logger/test-logger.service.js';

import { Proj4Controller } from '../proj4.controller.js';
import { Proj4Service } from '../proj4.service.js';

const mockGetDefinition = vi.fn();

describe('Proj4Controller', () => {
  let controller: Proj4Controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Proj4Controller],
      providers: [
        {
          provide: LoggerService,
          useClass: TestLoggerService,
        },
        {
          provide: Proj4Service,
          useValue: {
            getDefinition: mockGetDefinition,
          },
        },
      ],
    }).compile();

    controller = module.get<Proj4Controller>(Proj4Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('calls Proj4Service getDefinition', () => {
    controller.resolveCode(4326);
    expect(mockGetDefinition).toHaveBeenCalledTimes(1);
    expect(mockGetDefinition).toHaveBeenCalledWith(4326);
  });
});
