import { Test, TestingModule } from '@nestjs/testing';
import { Proj4Controller } from './proj4.controller';

describe('Proj4Controller', () => {
  let controller: Proj4Controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Proj4Controller],
    }).compile();

    controller = module.get<Proj4Controller>(Proj4Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
