import { Test, TestingModule } from '@nestjs/testing';
import { Proj4Controller } from './proj4.controller';
import { Proj4Service } from './proj4.service';

describe('Proj4Controller', () => {
  let controller: Proj4Controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Proj4Controller],
      providers: [Proj4Service],
    }).compile();

    controller = module.get<Proj4Controller>(Proj4Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
