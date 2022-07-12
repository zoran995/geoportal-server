import { Test, TestingModule } from '@nestjs/testing';

import { Proj4Controller } from './proj4.controller';
import { Proj4Service } from './proj4.service';

const mockGetDefinition = jest.fn();

describe('Proj4Controller', () => {
  let controller: Proj4Controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Proj4Controller],
      providers: [
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
